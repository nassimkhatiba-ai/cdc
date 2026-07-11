#!/usr/bin/env node
'use strict';
const readline = require('readline');
const TOOLS = [
  {
    "name": "set",
    "description": "Set key",
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
    "name": "list_keys",
    "description": "List keys",
    "inputSchema": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "name": "delete",
    "description": "Delete key",
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
    "name": "count",
    "description": "Key count",
    "inputSchema": {
      "type": "object",
      "properties": {}
    }
  }
];
const STORE = { alpha:'1', beta:'2', gamma:'3' };
function callTool(name, a){
  if(name==='set'){ STORE[a.key]=String(a.value); return { ok:true, key:a.key }; }
  if(name==='get'){ if(!(a.key in STORE)) throw new Error('missing'); return { key:a.key, value:STORE[a.key] }; }
  if(name==='list_keys') return { keys: Object.keys(STORE).sort() };
  if(name==='delete'){ delete STORE[a.key]; return { ok:true }; }
  if(name==='count') return { count: Object.keys(STORE).length };
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
      return send({ jsonrpc:'2.0', id, result:{ protocolVersion:'2024-11-05', capabilities:{ tools:{} }, serverInfo:{ name:"kv", version:'1.0.0' } } });
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
