#!/usr/bin/env node
'use strict';
const readline = require('readline');
const TOOLS = [
  {
    "name": "v4",
    "description": "Generate UUID v4",
    "inputSchema": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "name": "is_uuid",
    "description": "Validate UUID shape",
    "inputSchema": {
      "type": "object",
      "properties": {
        "s": {
          "type": "string"
        }
      },
      "required": [
        "s"
      ]
    }
  },
  {
    "name": "nil",
    "description": "Nil UUID",
    "inputSchema": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "name": "batch",
    "description": "Generate n UUIDs",
    "inputSchema": {
      "type": "object",
      "properties": {
        "n": {
          "type": "integer"
        }
      },
      "required": [
        "n"
      ]
    }
  }
];
const crypto=require('crypto');
function callTool(name, a){
  if(name==='v4') return { uuid: crypto.randomUUID() };
  if(name==='is_uuid') return { ok: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(a.s)) };
  if(name==='nil') return { uuid: '00000000-0000-0000-0000-000000000000' };
  if(name==='batch'){ const n=Math.min(20, Math.max(1, Number(a.n)||1)); return { uuids: Array.from({length:n}, ()=>crypto.randomUUID()) }; }
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
      return send({ jsonrpc:'2.0', id, result:{ protocolVersion:'2024-11-05', capabilities:{ tools:{} }, serverInfo:{ name:"uuidgen", version:'1.0.0' } } });
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
