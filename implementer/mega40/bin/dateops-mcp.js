#!/usr/bin/env node
'use strict';
const readline = require('readline');
const TOOLS = [
  {
    "name": "parse_iso",
    "description": "Parse ISO date",
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
    "name": "add_days",
    "description": "Add days to ISO",
    "inputSchema": {
      "type": "object",
      "properties": {
        "s": {
          "type": "string"
        },
        "days": {
          "type": "integer"
        }
      },
      "required": [
        "s",
        "days"
      ]
    }
  },
  {
    "name": "diff_days",
    "description": "Day difference",
    "inputSchema": {
      "type": "object",
      "properties": {
        "a": {
          "type": "string"
        },
        "b": {
          "type": "string"
        }
      },
      "required": [
        "a",
        "b"
      ]
    }
  },
  {
    "name": "weekday",
    "description": "Weekday name UTC",
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
  if(name==='parse_iso'){ const t=Date.parse(a.s); if(!Number.isFinite(t)) throw new Error('bad'); return { ms:t, iso:new Date(t).toISOString() }; }
  if(name==='add_days'){ const t=Date.parse(a.s)+Number(a.days)*86400000; return { iso: new Date(t).toISOString().slice(0,10) }; }
  if(name==='diff_days'){ const d=(Date.parse(a.b)-Date.parse(a.a))/86400000; return { days: d }; }
  if(name==='weekday'){ return { weekday: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(a.s).getUTCDay()] }; }
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
      return send({ jsonrpc:'2.0', id, result:{ protocolVersion:'2024-11-05', capabilities:{ tools:{} }, serverInfo:{ name:"dateops", version:'1.0.0' } } });
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
