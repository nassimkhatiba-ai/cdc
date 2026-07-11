#!/usr/bin/env node
'use strict';
const readline = require('readline');
const TOOLS = [
  {
    "name": "list_nodes",
    "description": "List graph nodes",
    "inputSchema": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "name": "list_edges",
    "description": "List edges",
    "inputSchema": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "name": "neighbors",
    "description": "Neighbors of node",
    "inputSchema": {
      "type": "object",
      "properties": {
        "node": {
          "type": "string"
        }
      },
      "required": [
        "node"
      ]
    }
  },
  {
    "name": "degree",
    "description": "Degree of node",
    "inputSchema": {
      "type": "object",
      "properties": {
        "node": {
          "type": "string"
        }
      },
      "required": [
        "node"
      ]
    }
  },
  {
    "name": "has_path",
    "description": "BFS path exists",
    "inputSchema": {
      "type": "object",
      "properties": {
        "from": {
          "type": "string"
        },
        "to": {
          "type": "string"
        }
      },
      "required": [
        "from",
        "to"
      ]
    }
  }
];
const NODES=['A','B','C','D','E'];
const EDGES=[['A','B'],['B','C'],['C','D'],['A','E'],['E','D']];
function adj(){ const m={}; for(const n of NODES) m[n]=[]; for(const [u,v] of EDGES){ m[u].push(v); m[v].push(u);} return m; }
function callTool(name, a){
  const g=adj();
  if(name==='list_nodes') return { nodes: NODES.slice() };
  if(name==='list_edges') return { edges: EDGES.map(([u,v])=>({u,v})) };
  if(name==='neighbors') return { node:a.node, neighbors:(g[a.node]||[]).slice().sort() };
  if(name==='degree') return { node:a.node, degree:(g[a.node]||[]).length };
  if(name==='has_path'){
    const q=[a.from], seen=new Set([a.from]);
    while(q.length){ const x=q.shift(); if(x===a.to) return { has_path:true }; for(const y of g[x]||[]) if(!seen.has(y)){ seen.add(y); q.push(y);} }
    return { has_path:false };
  }
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
      return send({ jsonrpc:'2.0', id, result:{ protocolVersion:'2024-11-05', capabilities:{ tools:{} }, serverInfo:{ name:"graph", version:'1.0.0' } } });
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
