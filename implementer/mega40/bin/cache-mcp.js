#!/usr/bin/env node
'use strict';
const readline = require('readline');
const TOOLS = [
  {
    "name": "put",
    "description": "Put key value",
    "inputSchema": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "value": {
          "type": "string"
        }
      },
      "required": [
        "key",
        "value"
      ]
    }
  },
  {
    "name": "get",
    "description": "Get key",
    "inputSchema": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        }
      },
      "required": [
        "key"
      ]
    }
  },
  {
    "name": "stats",
    "description": "hits/misses/size",
    "inputSchema": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "name": "clear",
    "description": "Clear cache",
    "inputSchema": {
      "type": "object",
      "properties": {}
    }
  }
];
const MAP=new Map([['seed','ok']]); let hits=0, misses=0;
function callTool(name, a){
  if(name==='put'){ MAP.set(a.key, String(a.value)); return { ok:true, size:MAP.size }; }
  if(name==='get'){ if(MAP.has(a.key)){ hits++; return { hit:true, value:MAP.get(a.key) }; } misses++; return { hit:false }; }
  if(name==='stats') return { hits, misses, size: MAP.size };
  if(name==='clear'){ MAP.clear(); hits=0; misses=0; return { ok:true }; }
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
      return send({ jsonrpc:'2.0', id, result:{ protocolVersion:'2024-11-05', capabilities:{ tools:{} }, serverInfo:{ name:"cache", version:'1.0.0' } } });
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
