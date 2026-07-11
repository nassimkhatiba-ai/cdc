#!/usr/bin/env node
'use strict';
const readline = require('readline');
const TOOLS = [
  {
    "name": "inc",
    "description": "Increment named counter",
    "inputSchema": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "by": {
          "type": "number"
        }
      },
      "required": [
        "name"
      ]
    }
  },
  {
    "name": "dec",
    "description": "Decrement",
    "inputSchema": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "by": {
          "type": "number"
        }
      },
      "required": [
        "name"
      ]
    }
  },
  {
    "name": "get",
    "description": "Get counter",
    "inputSchema": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        }
      },
      "required": [
        "name"
      ]
    }
  },
  {
    "name": "reset",
    "description": "Reset to 0",
    "inputSchema": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        }
      },
      "required": [
        "name"
      ]
    }
  },
  {
    "name": "list",
    "description": "List counters",
    "inputSchema": {
      "type": "object",
      "properties": {}
    }
  }
];
const C = { hits: 10, misses: 3 };
function callTool(name, a){
  const by = a.by == null ? 1 : Number(a.by);
  if(name==='inc'){ C[a.name]=(C[a.name]||0)+by; return { name:a.name, value:C[a.name] }; }
  if(name==='dec'){ C[a.name]=(C[a.name]||0)-by; return { name:a.name, value:C[a.name] }; }
  if(name==='get') return { name:a.name, value: C[a.name]||0 };
  if(name==='reset'){ C[a.name]=0; return { name:a.name, value:0 }; }
  if(name==='list') return { counters: Object.keys(C).sort().map(k=>({name:k,value:C[k]})) };
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
      return send({ jsonrpc:'2.0', id, result:{ protocolVersion:'2024-11-05', capabilities:{ tools:{} }, serverInfo:{ name:"counter", version:'1.0.0' } } });
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
