#!/usr/bin/env node
'use strict';
const readline = require('readline');
const TOOLS = [
  {
    "name": "sum",
    "description": "Sum array",
    "inputSchema": {
      "type": "object",
      "properties": {
        "nums": {
          "type": "array",
          "items": {
            "type": "number"
          }
        }
      },
      "required": [
        "nums"
      ]
    }
  },
  {
    "name": "mean",
    "description": "Mean",
    "inputSchema": {
      "type": "object",
      "properties": {
        "nums": {
          "type": "array",
          "items": {
            "type": "number"
          }
        }
      },
      "required": [
        "nums"
      ]
    }
  },
  {
    "name": "median",
    "description": "Median",
    "inputSchema": {
      "type": "object",
      "properties": {
        "nums": {
          "type": "array",
          "items": {
            "type": "number"
          }
        }
      },
      "required": [
        "nums"
      ]
    }
  },
  {
    "name": "stdev",
    "description": "Population stdev",
    "inputSchema": {
      "type": "object",
      "properties": {
        "nums": {
          "type": "array",
          "items": {
            "type": "number"
          }
        }
      },
      "required": [
        "nums"
      ]
    }
  },
  {
    "name": "percentile",
    "description": "Percentile p in 0..100",
    "inputSchema": {
      "type": "object",
      "properties": {
        "nums": {
          "type": "array",
          "items": {
            "type": "number"
          }
        },
        "p": {
          "type": "number"
        }
      },
      "required": [
        "nums",
        "p"
      ]
    }
  }
];
function callTool(name, a){
  const n = (a.nums||[]).map(Number).filter(Number.isFinite).sort((x,y)=>x-y);
  if(name==='sum') return { result: n.reduce((s,x)=>s+x,0) };
  if(name==='mean') return { result: n.length ? n.reduce((s,x)=>s+x,0)/n.length : 0 };
  if(name==='median'){
    if(!n.length) return { result:0 };
    const m=Math.floor(n.length/2);
    return { result: n.length%2 ? n[m] : (n[m-1]+n[m])/2 };
  }
  if(name==='stdev'){
    if(!n.length) return { result:0 };
    const m=n.reduce((s,x)=>s+x,0)/n.length;
    const v=n.reduce((s,x)=>s+(x-m)**2,0)/n.length;
    return { result: Math.sqrt(v) };
  }
  if(name==='percentile'){
    if(!n.length) return { result:0 };
    const p=Math.min(100, Math.max(0, Number(a.p)));
    const idx=(p/100)*(n.length-1);
    const lo=Math.floor(idx), hi=Math.ceil(idx);
    if(lo===hi) return { result: n[lo] };
    return { result: n[lo] + (n[hi]-n[lo])*(idx-lo) };
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
      return send({ jsonrpc:'2.0', id, result:{ protocolVersion:'2024-11-05', capabilities:{ tools:{} }, serverInfo:{ name:"mathstat", version:'1.0.0' } } });
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
