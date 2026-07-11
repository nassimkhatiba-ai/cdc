#!/usr/bin/env node
'use strict';
const readline = require('readline');
const TOOLS = [
  {
    "name": "list_jobs",
    "description": "List cron jobs",
    "inputSchema": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "name": "get_job",
    "description": "Get job by id",
    "inputSchema": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        }
      },
      "required": [
        "id"
      ]
    }
  },
  {
    "name": "enabled_jobs",
    "description": "Enabled job ids",
    "inputSchema": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "name": "next_runs",
    "description": "Synthetic next run labels",
    "inputSchema": {
      "type": "object",
      "properties": {}
    }
  }
];
const JOBS=[
  {id:'j1', expr:'0 * * * *', name:'hourly-sync', enabled:true},
  {id:'j2', expr:'0 0 * * *', name:'daily-report', enabled:true},
  {id:'j3', expr:'*/5 * * * *', name:'health', enabled:false},
  {id:'j4', expr:'0 9 * * 1', name:'monday-mail', enabled:true},
];
function callTool(name, a){
  if(name==='list_jobs') return { data: JOBS };
  if(name==='get_job'){ const j=JOBS.find(x=>x.id===a.id); if(!j) throw new Error('nf'); return j; }
  if(name==='enabled_jobs') return { ids: JOBS.filter(j=>j.enabled).map(j=>j.id).sort() };
  if(name==='next_runs') return { runs: JOBS.filter(j=>j.enabled).map(j=>({id:j.id, next:'synthetic'})) };
  throw new Error('unknown');
}
function send(m){ process.stdout.write(JSON.stringify(m)+'\n'); }
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
  if (!line.trim()) return;
  let msg; try { msg = JSON.parse(line); } catch { return; }
  const { id, method, params } = msg;
  try {
    if (method === 'initialize') {
      return send({ jsonrpc:'2.0', id, result:{ protocolVersion:'2024-11-05', capabilities:{ tools:{} }, serverInfo:{ name:"cronish", version:'1.0.0' } } });
    }
    if (method && method.startsWith('notifications/')) return;
    if (method === 'tools/list') return send({ jsonrpc:'2.0', id, result:{ tools: TOOLS } });
    if (method === 'tools/call') {
      const r = callTool(params.name, params.arguments || {});
      return send({ jsonrpc:'2.0', id, result:{ content:[{ type:'text', text: JSON.stringify(r) }] } });
    }
    if (id !== undefined) send({ jsonrpc:'2.0', id, error:{ code:-32601, message:'nf' } });
  } catch (e) {
    if (id !== undefined) send({ jsonrpc:'2.0', id, error:{ code:-32000, message:String(e.message||e) } });
  }
});
