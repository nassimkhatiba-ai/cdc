#!/usr/bin/env node
'use strict';
const readline = require('readline');
const TOOLS = [
  {
    "name": "parse",
    "description": "Parse CSV text to rows",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string"
        }
      },
      "required": [
        "text"
      ]
    }
  },
  {
    "name": "row_count",
    "description": "Count data rows (no header)",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string"
        }
      },
      "required": [
        "text"
      ]
    }
  },
  {
    "name": "column",
    "description": "Extract column by index",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string"
        },
        "index": {
          "type": "integer"
        }
      },
      "required": [
        "text",
        "index"
      ]
    }
  },
  {
    "name": "sum_column",
    "description": "Sum numeric column",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string"
        },
        "index": {
          "type": "integer"
        }
      },
      "required": [
        "text",
        "index"
      ]
    }
  }
];
function rows(text){ return String(text).trim().split(/\r?\n/).map(l=>l.split(',')); }
function callTool(name, a){
  const r = rows(a.text);
  if(name==='parse') return { rows: r };
  if(name==='row_count') return { count: Math.max(0, r.length-1) };
  if(name==='column') return { values: r.slice(1).map(row => row[a.index]) };
  if(name==='sum_column') return { sum: r.slice(1).reduce((s,row)=>s+Number(row[a.index]||0),0) };
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
      return send({ jsonrpc:'2.0', id, result:{ protocolVersion:'2024-11-05', capabilities:{ tools:{} }, serverInfo:{ name:"csvops", version:'1.0.0' } } });
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
