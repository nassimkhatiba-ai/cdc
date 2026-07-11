#!/usr/bin/env node
'use strict';
const readline = require('readline');
const TOOLS = [
  {
    "name": "enqueue",
    "description": "Push job",
    "inputSchema": {
      "type": "object",
      "properties": {
        "job": {
          "type": "string"
        }
      },
      "required": [
        "job"
      ]
    }
  },
  {
    "name": "dequeue",
    "description": "Pop job",
    "inputSchema": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "name": "peek",
    "description": "Peek front",
    "inputSchema": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "name": "size",
    "description": "Queue size",
    "inputSchema": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "name": "list",
    "description": "List jobs",
    "inputSchema": {
      "type": "object",
      "properties": {}
    }
  }
];
const Q = ['job-alpha', 'job-beta', 'job-gamma'];
function callTool(name, a){
  if(name==='enqueue'){ Q.push(String(a.job)); return { size:Q.length }; }
  if(name==='dequeue'){ if(!Q.length) throw new Error('empty'); return { job: Q.shift() }; }
  if(name==='peek') return { job: Q[0]||null };
  if(name==='size') return { size: Q.length };
  if(name==='list') return { jobs: Q.slice() };
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
      return send({ jsonrpc:'2.0', id, result:{ protocolVersion:'2024-11-05', capabilities:{ tools:{} }, serverInfo:{ name:"queue", version:'1.0.0' } } });
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
