#!/usr/bin/env node
'use strict';
const readline = require('readline');
const TOOLS = [
  {
    "name": "list_items",
    "description": "List SKUs",
    "inputSchema": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "name": "get_item",
    "description": "Get SKU",
    "inputSchema": {
      "type": "object",
      "properties": {
        "sku": {
          "type": "string"
        }
      },
      "required": [
        "sku"
      ]
    }
  },
  {
    "name": "low_stock",
    "description": "Items below threshold",
    "inputSchema": {
      "type": "object",
      "properties": {
        "threshold": {
          "type": "number"
        }
      }
    }
  },
  {
    "name": "total_value",
    "description": "Sum qty*price",
    "inputSchema": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "name": "warehouse_count",
    "description": "Distinct warehouses",
    "inputSchema": {
      "type": "object",
      "properties": {}
    }
  }
];
const ITEMS=[
  {sku:'SKU-A', name:'Bolt', qty:100, price:0.5, warehouse:'W1'},
  {sku:'SKU-B', name:'Nut', qty:5, price:0.2, warehouse:'W1'},
  {sku:'SKU-C', name:'Washer', qty:40, price:0.1, warehouse:'W2'},
  {sku:'SKU-D', name:'Screw', qty:2, price:0.15, warehouse:'W2'},
];
function callTool(name, a){
  if(name==='list_items') return { data: ITEMS };
  if(name==='get_item'){ const i=ITEMS.find(x=>x.sku===a.sku); if(!i) throw new Error('nf'); return i; }
  if(name==='low_stock'){ const t=a.threshold==null?10:Number(a.threshold); return { data: ITEMS.filter(i=>i.qty<t).map(i=>i.sku).sort() }; }
  if(name==='total_value') return { total: +ITEMS.reduce((s,i)=>s+i.qty*i.price,0).toFixed(2) };
  if(name==='warehouse_count') return { count: new Set(ITEMS.map(i=>i.warehouse)).size };
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
      return send({ jsonrpc:'2.0', id, result:{ protocolVersion:'2024-11-05', capabilities:{ tools:{} }, serverInfo:{ name:"inventory", version:'1.0.0' } } });
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
