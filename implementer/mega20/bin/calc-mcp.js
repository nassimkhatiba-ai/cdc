#!/usr/bin/env node
const readline=require('readline');
const TOOLS=[
  {name:'add',description:'Add two numbers',inputSchema:{type:'object',properties:{a:{type:'number'},b:{type:'number'}},required:['a','b']}},
  {name:'mul',description:'Multiply two numbers',inputSchema:{type:'object',properties:{a:{type:'number'},b:{type:'number'}},required:['a','b']}},
  {name:'pow',description:'a**b',inputSchema:{type:'object',properties:{a:{type:'number'},b:{type:'number'}},required:['a','b']}},
  {name:'stats',description:'mean/min/max of number array',inputSchema:{type:'object',properties:{nums:{type:'array',items:{type:'number'}}},required:['nums']}},
];
function send(m){process.stdout.write(JSON.stringify(m)+'\n');}
function call(name,args){
  if(name==='add') return {result: args.a+args.b};
  if(name==='mul') return {result: args.a*args.b};
  if(name==='pow') return {result: args.a**args.b};
  if(name==='stats'){const n=args.nums||[]; return {mean:n.reduce((a,b)=>a+b,0)/(n.length||1),min:Math.min(...n),max:Math.max(...n),count:n.length};}
  throw new Error('unknown');
}
readline.createInterface({input:process.stdin}).on('line', async line=>{
  if(!line.trim())return; let msg; try{msg=JSON.parse(line);}catch{return;}
  const {id,method,params}=msg;
  try{
    if(method==='initialize') return send({jsonrpc:'2.0',id,result:{protocolVersion:'2024-11-05',capabilities:{tools:{}},serverInfo:{name:'calc',version:'1'}}});
    if(method?.startsWith('notifications/')) return;
    if(method==='tools/list') return send({jsonrpc:'2.0',id,result:{tools:TOOLS}});
    if(method==='tools/call'){const r=call(params.name,params.arguments||{}); return send({jsonrpc:'2.0',id,result:{content:[{type:'text',text:JSON.stringify(r)}]}});}
    if(id!==undefined) send({jsonrpc:'2.0',id,error:{code:-32601,message:'nf'}});
  }catch(e){ if(id!==undefined) send({jsonrpc:'2.0',id,error:{code:-32000,message:String(e.message||e)}}); }
});
