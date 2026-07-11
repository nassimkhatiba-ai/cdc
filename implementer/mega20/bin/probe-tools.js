#!/usr/bin/env node
const { spawn } = require('child_process');
const [,, cmd, ...args] = process.argv;
if (!cmd) { console.error('usage: probe-tools cmd [args...]'); process.exit(2); }
const proc = spawn(cmd, args, { stdio: ['pipe','pipe','pipe'], env: process.env });
let buf = '', err = '';
const pending = new Map();
const send = m => { try { proc.stdin.write(JSON.stringify(m)+'\n'); } catch {} };
const call = (method, params, ms=15000) => new Promise((res,rej)=>{
  const id = call.i = (call.i||0)+1;
  pending.set(id,{res,rej});
  send({jsonrpc:'2.0',id,method,params});
  setTimeout(()=>{ if(pending.has(id)){ pending.delete(id); rej(new Error('timeout '+method)); }}, ms);
});
proc.stdout.on('data', d => {
  buf += d.toString();
  const lines = buf.split('\n'); buf = lines.pop();
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id && pending.has(msg.id)) {
        const {res,rej} = pending.get(msg.id); pending.delete(msg.id);
        if (msg.error) rej(new Error(JSON.stringify(msg.error)));
        else res(msg.result);
      }
    } catch {}
  }
});
proc.stderr.on('data', d => { err += d.toString(); });
(async () => {
  try {
    await call('initialize', { protocolVersion:'2024-11-05', capabilities:{}, clientInfo:{name:'probe',version:'0'} }, 20000);
    send({ jsonrpc:'2.0', method:'notifications/initialized' });
    const r = await call('tools/list', {}, 20000);
    const tools = (r.tools||[]).map(t => t.name);
    console.log(JSON.stringify({ ok:true, tools, count: tools.length, sample: tools.slice(0,12) }));
    proc.kill();
    process.exit(0);
  } catch (e) {
    console.log(JSON.stringify({ ok:false, error:String(e.message||e), stderr: err.slice(0,400) }));
    proc.kill();
    process.exit(1);
  }
})();
