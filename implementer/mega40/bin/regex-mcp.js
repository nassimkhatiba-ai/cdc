#!/usr/bin/env node
'use strict';
const readline = require('readline');
const TOOLS = [
  {
    "name": "match",
    "description": "Test regex",
    "inputSchema": {
      "type": "object",
      "properties": {
        "pattern": {
          "type": "string"
        },
        "s": {
          "type": "string"
        }
      },
      "required": [
        "pattern",
        "s"
      ]
    }
  },
  {
    "name": "find_all",
    "description": "Find all matches",
    "inputSchema": {
      "type": "object",
      "properties": {
        "pattern": {
          "type": "string"
        },
        "s": {
          "type": "string"
        }
      },
      "required": [
        "pattern",
        "s"
      ]
    }
  },
  {
    "name": "replace",
    "description": "Replace all",
    "inputSchema": {
      "type": "object",
      "properties": {
        "pattern": {
          "type": "string"
        },
        "s": {
          "type": "string"
        },
        "with": {
          "type": "string"
        }
      },
      "required": [
        "pattern",
        "s",
        "with"
      ]
    }
  },
  {
    "name": "count",
    "description": "Count matches",
    "inputSchema": {
      "type": "object",
      "properties": {
        "pattern": {
          "type": "string"
        },
        "s": {
          "type": "string"
        }
      },
      "required": [
        "pattern",
        "s"
      ]
    }
  }
];
function callTool(name, a){
  const re = new RegExp(a.pattern, 'g');
  if(name==='match') return { ok: re.test(String(a.s)) };
  if(name==='find_all') return { matches: String(a.s).match(re) || [] };
  if(name==='replace') return { result: String(a.s).replace(re, String(a.with)) };
  if(name==='count') return { count: (String(a.s).match(re)||[]).length };
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
      return send({ jsonrpc:'2.0', id, result:{ protocolVersion:'2024-11-05', capabilities:{ tools:{} }, serverInfo:{ name:"regex", version:'1.0.0' } } });
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
