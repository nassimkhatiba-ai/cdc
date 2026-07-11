#!/usr/bin/env node
'use strict';
const readline = require('readline');
const TOOLS = [
  {
    "name": "upper",
    "description": "Uppercase",
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
    "name": "lower",
    "description": "Lowercase",
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
    "name": "reverse",
    "description": "Reverse string",
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
    "name": "len",
    "description": "Length",
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
    "name": "words",
    "description": "Word count",
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
  }
];
function callTool(name, a){
  const s = String(a.s||'');
  if(name==='upper') return { result: s.toUpperCase() };
  if(name==='lower') return { result: s.toLowerCase() };
  if(name==='reverse') return { result: [...s].reverse().join('') };
  if(name==='len') return { result: s.length };
  if(name==='words') return { result: s.trim()? s.trim().split(/\s+/).length : 0 };
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
      return send({ jsonrpc:'2.0', id, result:{ protocolVersion:'2024-11-05', capabilities:{ tools:{} }, serverInfo:{ name:"stringops", version:'1.0.0' } } });
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
