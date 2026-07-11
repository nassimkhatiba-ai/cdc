#!/usr/bin/env node
const readline=require('readline');
let todos=[]; let seq=1;
const TOOLS=[
  {name:'add_todo',description:'Add todo',inputSchema:{type:'object',properties:{title:{type:'string'},priority:{type:'string'}},required:['title']}},
  {name:'list_todos',description:'List todos',inputSchema:{type:'object',properties:{status:{type:'string'}}}},
  {name:'complete_todo',description:'Mark done by id',inputSchema:{type:'object',properties:{id:{type:'integer'}},required:['id']}},
  {name:'stats',description:'Counts by status',inputSchema:{type:'object',properties:{}}},
];
function send(m){process.stdout.write(JSON.stringify(m)+'\n');}
function call(name,args){
  if(name==='add_todo'){const t={id:seq++,title:args.title,priority:args.priority||'med',status:'open'}; todos.push(t); return t;}
  if(name==='list_todos'){let r=todos; if(args.status) r=r.filter(t=>t.status===args.status); return {todos:r};}
  if(name==='complete_todo'){const t=todos.find(x=>x.id===args.id); if(!t) throw new Error('nf'); t.status='done'; return t;}
  if(name==='stats') return {open:todos.filter(t=>t.status==='open').length, done:todos.filter(t=>t.status==='done').length, total:todos.length};
  throw new Error('unknown');
}
readline.createInterface({input:process.stdin}).on('line', line=>{
  if(!line.trim())return; let msg; try{msg=JSON.parse(line);}catch{return;}
  const {id,method,params}=msg;
  try{
    if(method==='initialize') return send({jsonrpc:'2.0',id,result:{protocolVersion:'2024-11-05',capabilities:{tools:{}},serverInfo:{name:'todo',version:'1'}}});
    if(method?.startsWith('notifications/')) return;
    if(method==='tools/list') return send({jsonrpc:'2.0',id,result:{tools:TOOLS}});
    if(method==='tools/call'){const r=call(params.name,params.arguments||{}); return send({jsonrpc:'2.0',id,result:{content:[{type:'text',text:JSON.stringify(r)}]}});}
  }catch(e){ if(id!==undefined) send({jsonrpc:'2.0',id,error:{code:-32000,message:String(e.message||e)}}); }
});
