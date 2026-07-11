#!/usr/bin/env node
'use strict';
const readline = require('readline');
const TOOLS = [
  {
    "name": "list_flags",
    "description": "List feature flags",
    "inputSchema": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "name": "get_flag",
    "description": "Get flag",
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
    "name": "set_flag",
    "description": "Set enabled",
    "inputSchema": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "enabled": {
          "type": "boolean"
        }
      },
      "required": [
        "name",
        "enabled"
      ]
    }
  },
  {
    "name": "enabled_count",
    "description": "Count enabled",
    "inputSchema": {
      "type": "object",
      "properties": {}
    }
  }
];
const F = { dark_mode:true, beta_ui:false, search_v2:true, pay_retry:true };
function callTool(name, a){
  if(name==='list_flags') return { flags: Object.keys(F).sort().map(k=>({name:k, enabled:F[k]})) };
  if(name==='get_flag'){ if(!(a.name in F)) throw new Error('nf'); return { name:a.name, enabled:F[a.name] }; }
  if(name==='set_flag'){ F[a.name]=!!a.enabled; return { name:a.name, enabled:F[a.name] }; }
  if(name==='enabled_count') return { count: Object.values(F).filter(Boolean).length };
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
      return send({ jsonrpc:'2.0', id, result:{ protocolVersion:'2024-11-05', capabilities:{ tools:{} }, serverInfo:{ name:"flags", version:'1.0.0' } } });
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
