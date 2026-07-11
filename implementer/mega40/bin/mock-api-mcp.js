#!/usr/bin/env node
const BASE = process.env.MOCK_API_BASE || "http://127.0.0.1:8791";
const readline = require("readline");
async function api(path) {
  const res = await fetch(BASE + path);
  const text = await res.text();
  let body; try { body = JSON.parse(text); } catch { body = text; }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${String(text).slice(0,300)}`);
  return body;
}
const TOOLS = [
  { name: "list_products", description: "List products (paginated).",
    inputSchema: { type:"object", properties:{ page:{type:"integer"}, per_page:{type:"integer"} } } },
  { name: "list_orders", description: "List orders (paginated). Optional status filter.",
    inputSchema: { type:"object", properties:{ page:{type:"integer"}, per_page:{type:"integer"}, status:{type:"string"} } } },
  { name: "list_users", description: "List users (paginated).",
    inputSchema: { type:"object", properties:{ page:{type:"integer"}, per_page:{type:"integer"} } } },
  { name: "get_product", description: "Get product by id.",
    inputSchema: { type:"object", properties:{ id:{type:"integer"} }, required:["id"] } },
  { name: "get_spec", description: "API route index / help.",
    inputSchema: { type:"object", properties:{} } },
];
async function callTool(name, args={}) {
  const q = new URLSearchParams();
  if (args.page) q.set("page", String(args.page));
  if (args.per_page) q.set("per_page", String(args.per_page));
  if (args.status) q.set("status", String(args.status));
  const qs = q.toString() ? `?${q}` : "";
  if (name==="list_products") return api("/products"+qs);
  if (name==="list_orders") return api("/orders"+qs);
  if (name==="list_users") return api("/users"+qs);
  if (name==="get_product") return api("/products/"+args.id);
  if (name==="get_spec") return api("/");
  throw new Error("unknown tool "+name);
}
function send(msg){ process.stdout.write(JSON.stringify(msg)+"\n"); }
const rl = readline.createInterface({ input: process.stdin });
rl.on("line", async (line) => {
  if (!line.trim()) return;
  let msg; try { msg = JSON.parse(line); } catch { return; }
  const { id, method, params } = msg;
  try {
    if (method === "initialize") {
      return send({ jsonrpc:"2.0", id, result:{ protocolVersion:"2024-11-05", capabilities:{ tools:{} }, serverInfo:{ name:"mock-api", version:"1.0.0" } } });
    }
    if (method === "notifications/initialized" || (method && method.startsWith("notifications/"))) return;
    if (method === "tools/list") return send({ jsonrpc:"2.0", id, result:{ tools: TOOLS } });
    if (method === "tools/call") {
      const result = await callTool(params.name, params.arguments || {});
      return send({ jsonrpc:"2.0", id, result:{ content:[{ type:"text", text: JSON.stringify(result) }] } });
    }
    if (id !== undefined) send({ jsonrpc:"2.0", id, error:{ code:-32601, message:"Method not found" } });
  } catch (e) {
    if (id !== undefined) send({ jsonrpc:"2.0", id, error:{ code:-32000, message: String(e.message||e) } });
  }
});
