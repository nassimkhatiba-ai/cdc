#!/usr/bin/env node
// Minimal SQLite MCP without stdout pollution (better-sqlite3 verbose breaks JSON-RPC).
const Database = require('better-sqlite3');
const readline = require('readline');
const path = process.env.SQLITE_DB_PATH || process.argv[2] || './database.db';
let db;
try { db = new Database(path, { readonly: false, fileMustExist: true }); }
catch (e) { console.error('db open failed', e.message); process.exit(1); }
const TOOLS = [
  { name:'query', description:'Run read-only SQL SELECT', inputSchema:{ type:'object', properties:{ sql:{type:'string'} }, required:['sql'] } },
  { name:'execute', description:'Run write SQL', inputSchema:{ type:'object', properties:{ sql:{type:'string'} }, required:['sql'] } },
  { name:'list-tables', description:'List tables', inputSchema:{ type:'object', properties:{} } },
  { name:'describe-table', description:'Describe table columns', inputSchema:{ type:'object', properties:{ table:{type:'string'} }, required:['table'] } },
];
function send(m){ process.stdout.write(JSON.stringify(m)+'\n'); }
function call(name, args={}) {
  if (name==='list-tables') {
    const rows = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
    return rows.map(r=>r.name);
  }
  if (name==='describe-table') {
    return db.prepare(`PRAGMA table_info(${args.table})`).all();
  }
  if (name==='query') {
    const sql=String(args.sql||'');
    if (!/^\s*(select|with)\b/i.test(sql)) throw new Error('query is read-only SELECT');
    return db.prepare(sql).all();
  }
  if (name==='execute') {
    const info=db.prepare(String(args.sql||'')).run();
    return { changes: info.changes, lastInsertRowid: info.lastInsertRowid };
  }
  throw new Error('unknown tool');
}
readline.createInterface({ input: process.stdin }).on('line', line => {
  if (!line.trim()) return;
  let msg; try { msg=JSON.parse(line); } catch { return; }
  const { id, method, params } = msg;
  try {
    if (method==='initialize') return send({ jsonrpc:'2.0', id, result:{ protocolVersion:'2024-11-05', capabilities:{ tools:{} }, serverInfo:{ name:'sqlite-mini', version:'1' } } });
    if (method && method.startsWith('notifications/')) return;
    if (method==='tools/list') return send({ jsonrpc:'2.0', id, result:{ tools: TOOLS } });
    if (method==='tools/call') {
      const r = call(params.name, params.arguments||{});
      return send({ jsonrpc:'2.0', id, result:{ content:[{ type:'text', text: JSON.stringify(r) }] } });
    }
    if (id!==undefined) send({ jsonrpc:'2.0', id, error:{ code:-32601, message:'nf' } });
  } catch (e) {
    if (id!==undefined) send({ jsonrpc:'2.0', id, error:{ code:-32000, message:String(e.message||e) } });
  }
});
