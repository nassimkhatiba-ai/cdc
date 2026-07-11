#!/usr/bin/env node
'use strict';
const readline = require('readline');
const TOOLS = [
  {
    "name": "c_to_f",
    "description": "Celsius to Fahrenheit",
    "inputSchema": {
      "type": "object",
      "properties": {
        "c": {
          "type": "number"
        }
      },
      "required": [
        "c"
      ]
    }
  },
  {
    "name": "f_to_c",
    "description": "Fahrenheit to Celsius",
    "inputSchema": {
      "type": "object",
      "properties": {
        "f": {
          "type": "number"
        }
      },
      "required": [
        "f"
      ]
    }
  },
  {
    "name": "km_to_mi",
    "description": "km to miles",
    "inputSchema": {
      "type": "object",
      "properties": {
        "km": {
          "type": "number"
        }
      },
      "required": [
        "km"
      ]
    }
  },
  {
    "name": "mi_to_km",
    "description": "miles to km",
    "inputSchema": {
      "type": "object",
      "properties": {
        "mi": {
          "type": "number"
        }
      },
      "required": [
        "mi"
      ]
    }
  },
  {
    "name": "kg_to_lb",
    "description": "kg to lb",
    "inputSchema": {
      "type": "object",
      "properties": {
        "kg": {
          "type": "number"
        }
      },
      "required": [
        "kg"
      ]
    }
  }
];
function callTool(name, a){
  if(name==='c_to_f') return { result: a.c * 9/5 + 32 };
  if(name==='f_to_c') return { result: (a.f - 32) * 5/9 };
  if(name==='km_to_mi') return { result: a.km * 0.621371 };
  if(name==='mi_to_km') return { result: a.mi / 0.621371 };
  if(name==='kg_to_lb') return { result: a.kg * 2.20462 };
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
      return send({ jsonrpc:'2.0', id, result:{ protocolVersion:'2024-11-05', capabilities:{ tools:{} }, serverInfo:{ name:"unitconvert", version:'1.0.0' } } });
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
