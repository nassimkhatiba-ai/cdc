#!/usr/bin/env node
'use strict';
const readline = require('readline');
const TOOLS = [
  {
    "name": "list_cities",
    "description": "List cities",
    "inputSchema": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "name": "get_city",
    "description": "City coords",
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
    "name": "distance_km",
    "description": "Haversine km",
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
    "name": "nearest",
    "description": "Nearest city to lat/lon",
    "inputSchema": {
      "type": "object",
      "properties": {
        "lat": {
          "type": "number"
        },
        "lon": {
          "type": "number"
        }
      },
      "required": [
        "lat",
        "lon"
      ]
    }
  }
];
const CITIES={
  Paris:{lat:48.8566, lon:2.3522},
  London:{lat:51.5074, lon:-0.1278},
  Berlin:{lat:52.52, lon:13.405},
  Madrid:{lat:40.4168, lon:-3.7038},
};
function hav(a,b){
  const R=6371, toR=d=>d*Math.PI/180;
  const dLat=toR(b.lat-a.lat), dLon=toR(b.lon-a.lon);
  const x=Math.sin(dLat/2)**2 + Math.cos(toR(a.lat))*Math.cos(toR(b.lat))*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(x));
}
function callTool(name, a){
  if(name==='list_cities') return { cities: Object.keys(CITIES).sort() };
  if(name==='get_city'){ if(!CITIES[a.name]) throw new Error('nf'); return { name:a.name, ...CITIES[a.name] }; }
  if(name==='distance_km'){
    if(!CITIES[a.a]||!CITIES[a.b]) throw new Error('nf');
    return { a:a.a, b:a.b, km: +hav(CITIES[a.a], CITIES[a.b]).toFixed(2) };
  }
  if(name==='nearest'){
    let best=null, bestD=Infinity;
    for(const [n,c] of Object.entries(CITIES)){ const d=hav({lat:a.lat,lon:a.lon}, c); if(d<bestD){ bestD=d; best=n; } }
    return { nearest: best, km: +bestD.toFixed(2) };
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
      return send({ jsonrpc:'2.0', id, result:{ protocolVersion:'2024-11-05', capabilities:{ tools:{} }, serverInfo:{ name:"geo", version:'1.0.0' } } });
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
