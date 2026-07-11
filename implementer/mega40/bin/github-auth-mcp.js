#!/usr/bin/env node
// Minimal auth-required MCP: GitHub REST via GITHUB_TOKEN / GITHUB_PERSONAL_ACCESS_TOKEN.
// Fails tools if no token. Real network calls — not a mock.
const readline = require('readline');

const TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN || process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const API = 'https://api.github.com';

async function gh(path) {
  if (!TOKEN) {
    const err = new Error('Unauthorized: set GITHUB_TOKEN or GITHUB_PERSONAL_ACCESS_TOKEN (login required)');
    err.code = 401;
    throw err;
  }
  const res = await fetch(API + path, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'cdc-auth-bench-mcp',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  if (!res.ok) {
    const msg = typeof body === 'object' ? JSON.stringify(body) : String(body);
    throw new Error(`GitHub ${res.status}: ${msg.slice(0, 500)}`);
  }
  return body;
}

const TOOLS = [
  {
    name: 'get_authenticated_user',
    description: 'Return the authenticated GitHub user profile (requires login token).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'get_user',
    description: 'Get a public GitHub user by login.',
    inputSchema: {
      type: 'object',
      properties: { username: { type: 'string', description: 'GitHub login' } },
      required: ['username'],
    },
  },
  {
    name: 'list_user_repos',
    description: 'List public repos for a user (paginated).',
    inputSchema: {
      type: 'object',
      properties: {
        username: { type: 'string' },
        per_page: { type: 'integer', description: '1-100, default 30' },
        page: { type: 'integer', description: 'page number, default 1' },
      },
      required: ['username'],
    },
  },
  {
    name: 'get_repo',
    description: 'Get a repository by owner/name.',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string' },
        repo: { type: 'string' },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'search_repositories',
    description: 'Search GitHub repositories (query string).',
    inputSchema: {
      type: 'object',
      properties: {
        q: { type: 'string', description: 'GitHub search query' },
        per_page: { type: 'integer' },
      },
      required: ['q'],
    },
  },
];

async function callTool(name, args = {}) {
  switch (name) {
    case 'get_authenticated_user':
      return gh('/user');
    case 'get_user':
      return gh(`/users/${encodeURIComponent(args.username)}`);
    case 'list_user_repos': {
      const per = Math.min(100, Math.max(1, Number(args.per_page) || 30));
      const page = Math.max(1, Number(args.page) || 1);
      return gh(`/users/${encodeURIComponent(args.username)}/repos?per_page=${per}&page=${page}&sort=updated`);
    }
    case 'get_repo':
      return gh(`/repos/${encodeURIComponent(args.owner)}/${encodeURIComponent(args.repo)}`);
    case 'search_repositories': {
      const per = Math.min(30, Math.max(1, Number(args.per_page) || 5));
      return gh(`/search/repositories?q=${encodeURIComponent(args.q)}&per_page=${per}`);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + '\n');
}

let nextNote = 0;
const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on('line', async (line) => {
  line = line.trim();
  if (!line) return;
  let msg;
  try { msg = JSON.parse(line); } catch { return; }
  const { id, method, params } = msg;
  try {
    if (method === 'initialize') {
      send({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'github-auth-mcp', version: '1.0.0' },
        },
      });
      return;
    }
    if (method === 'notifications/initialized' || method === 'initialized') return;
    if (method === 'tools/list') {
      send({ jsonrpc: '2.0', id, result: { tools: TOOLS } });
      return;
    }
    if (method === 'tools/call') {
      const name = params?.name;
      const args = params?.arguments || {};
      try {
        const result = await callTool(name, args);
        send({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(result) }],
            isError: false,
          },
        });
      } catch (e) {
        send({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: String(e.message || e) }],
            isError: true,
          },
        });
      }
      return;
    }
    if (method === 'ping') {
      send({ jsonrpc: '2.0', id, result: {} });
      return;
    }
    // ignore unknown notifications
    if (id == null) return;
    send({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } });
  } catch (e) {
    if (id != null) send({ jsonrpc: '2.0', id, error: { code: -32000, message: String(e.message || e) } });
  }
});
