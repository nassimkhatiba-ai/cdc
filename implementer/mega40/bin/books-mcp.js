#!/usr/bin/env node
'use strict';
const readline = require('readline');
const TOOLS = [
  {
    "name": "list_books",
    "description": "List books",
    "inputSchema": {
      "type": "object",
      "properties": {
        "page": {
          "type": "integer"
        }
      }
    }
  },
  {
    "name": "get_book",
    "description": "Get by id",
    "inputSchema": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        }
      },
      "required": [
        "id"
      ]
    }
  },
  {
    "name": "search",
    "description": "Search title",
    "inputSchema": {
      "type": "object",
      "properties": {
        "q": {
          "type": "string"
        }
      },
      "required": [
        "q"
      ]
    }
  },
  {
    "name": "count_by_genre",
    "description": "Count per genre",
    "inputSchema": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "name": "top_price",
    "description": "Most expensive book",
    "inputSchema": {
      "type": "object",
      "properties": {}
    }
  }
];
const BOOKS=[
  {id:'b1', title:'Dune', genre:'scifi', price:18},
  {id:'b2', title:'Neuromancer', genre:'scifi', price:14},
  {id:'b3', title:'Pride', genre:'classic', price:9},
  {id:'b4', title:'Sapiens', genre:'nonfiction', price:22},
  {id:'b5', title:'Foundation', genre:'scifi', price:16},
];
function callTool(name, a){
  if(name==='list_books') return { data: BOOKS, total: BOOKS.length };
  if(name==='get_book'){ const b=BOOKS.find(x=>x.id===a.id); if(!b) throw new Error('nf'); return b; }
  if(name==='search'){ const q=String(a.q||'').toLowerCase(); return { data: BOOKS.filter(b=>b.title.toLowerCase().includes(q)) }; }
  if(name==='count_by_genre'){ const m={}; for(const b of BOOKS) m[b.genre]=(m[b.genre]||0)+1; return m; }
  if(name==='top_price'){ return BOOKS.reduce((t,b)=> b.price>(t?.price||-1)?b:t, null); }
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
      return send({ jsonrpc:'2.0', id, result:{ protocolVersion:'2024-11-05', capabilities:{ tools:{} }, serverInfo:{ name:"books", version:'1.0.0' } } });
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
