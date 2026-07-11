#!/usr/bin/env node
const readline=require('readline');
const DATA={
  Seattle:{temp_c:12, cond:'rain', humidity:88},
  Austin:{temp_c:31, cond:'sunny', humidity:40},
  Tokyo:{temp_c:22, cond:'cloudy', humidity:65},
  Paris:{temp_c:18, cond:'overcast', humidity:70},
};
const TOOLS=[
  {name:'list_cities',description:'List known cities',inputSchema:{type:'object',properties:{}}},
  {name:'get_weather',description:'Weather for city',inputSchema:{type:'object',properties:{city:{type:'string'}},required:['city']}},
  {name:'compare',description:'Compare two cities temp',inputSchema:{type:'object',properties:{a:{type:'string'},b:{type:'string'}},required:['a','b']}},
];
function send(m){process.stdout.write(JSON.stringify(m)+'\n');}
function call(name,args){
  if(name==='list_cities') return {cities:Object.keys(DATA).sort()};
  if(name==='get_weather'){const w=DATA[args.city]; if(!w) throw new Error('unknown city'); return {city:args.city,...w};}
  if(name==='compare'){const A=DATA[args.a],B=DATA[args.b]; return {a:args.a,b:args.b,temp_diff_c:A.temp_c-B.temp_c,warmer:A.temp_c>=B.temp_c?args.a:args.b};}
  throw new Error('unknown');
}
readline.createInterface({input:process.stdin}).on('line', line=>{
  if(!line.trim())return; let msg; try{msg=JSON.parse(line);}catch{return;}
  const {id,method,params}=msg;
  try{
    if(method==='initialize') return send({jsonrpc:'2.0',id,result:{protocolVersion:'2024-11-05',capabilities:{tools:{}},serverInfo:{name:'weather',version:'1'}}});
    if(method?.startsWith('notifications/')) return;
    if(method==='tools/list') return send({jsonrpc:'2.0',id,result:{tools:TOOLS}});
    if(method==='tools/call'){const r=call(params.name,params.arguments||{}); return send({jsonrpc:'2.0',id,result:{content:[{type:'text',text:JSON.stringify(r)}]}});}
  }catch(e){ if(id!==undefined) send({jsonrpc:'2.0',id,error:{code:-32000,message:String(e.message||e)}}); }
});
