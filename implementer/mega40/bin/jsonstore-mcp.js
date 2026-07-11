#!/usr/bin/env node
const fs=require('fs'); const path=require('path'); const readline=require('readline');
const DB=process.env.JSONSTORE_PATH || '/tmp/jsonstore.json';
function load(){ try{return JSON.parse(fs.readFileSync(DB,'utf8'));}catch{return {};} }
function save(o){ fs.writeFileSync(DB, JSON.stringify(o,null,2)); }
const TOOLS=[
  {name:'set',description:'Set key to JSON value',inputSchema:{type:'object',properties:{key:{type:'string'},value:{}},required:['key','value']}},
  {name:'get',description:'Get key',inputSchema:{type:'object',properties:{key:{type:'string'}},required:['key']}},
  {name:'keys',description:'List keys',inputSchema:{type:'object',properties:{}}},
  {name:'delete',description:'Delete key',inputSchema:{type:'object',properties:{key:{type:'string'}},required:['key']}},
  {name:'count',description:'Number of keys',inputSchema:{type:'object',properties:{}}},
];
function send(m){process.stdout.write(JSON.stringify(m)+'\n');}
function call(name,args){
  const db=load();
  if(name==='set'){db[args.key]=args.value; save(db); return {ok:true,key:args.key};}
  if(name==='get') return {key:args.key, value: db[args.key]??null, found: args.key in db};
  if(name==='keys') return {keys:Object.keys(db).sort()};
  if(name==='delete'){const f=args.key in db; delete db[args.key]; save(db); return {deleted:f};}
  if(name==='count') return {count:Object.keys(db).length};
  throw new Error('unknown');
}
readline.createInterface({input:process.stdin}).on('line', line=>{
  if(!line.trim())return; let msg; try{msg=JSON.parse(line);}catch{return;}
  const {id,method,params}=msg;
  try{
    if(method==='initialize') return send({jsonrpc:'2.0',id,result:{protocolVersion:'2024-11-05',capabilities:{tools:{}},serverInfo:{name:'jsonstore',version:'1'}}});
    if(method?.startsWith('notifications/')) return;
    if(method==='tools/list') return send({jsonrpc:'2.0',id,result:{tools:TOOLS}});
    if(method==='tools/call'){const r=call(params.name,params.arguments||{}); return send({jsonrpc:'2.0',id,result:{content:[{type:'text',text:JSON.stringify(r)}]}});}
  }catch(e){ if(id!==undefined) send({jsonrpc:'2.0',id,error:{code:-32000,message:String(e.message||e)}}); }
});
