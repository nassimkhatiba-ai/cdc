#!/usr/bin/env node
'use strict';
const readline = require('readline');
const TOOLS = [
  {
    "name": "md5",
    "description": "MD5 hex",
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
    "name": "sha256",
    "description": "SHA256 hex",
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
    "name": "b64_encode",
    "description": "Base64 encode",
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
    "name": "b64_decode",
    "description": "Base64 decode",
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
const crypto=require('crypto');
function callTool(name, a){
  if(name==='md5') return { result: crypto.createHash('md5').update(String(a.s)).digest('hex') };
  if(name==='sha256') return { result: crypto.createHash('sha256').update(String(a.s)).digest('hex') };
  if(name==='b64_encode') return { result: Buffer.from(String(a.s),'utf8').toString('base64') };
  if(name==='b64_decode') return { result: Buffer.from(String(a.s),'base64').toString('utf8') };
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
      return send({ jsonrpc:'2.0', id, result:{ protocolVersion:'2024-11-05', capabilities:{ tools:{} }, serverInfo:{ name:"hash", version:'1.0.0' } } });
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
