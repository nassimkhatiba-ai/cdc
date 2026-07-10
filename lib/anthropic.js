// Minimal Anthropic Messages API client (works with Anthropic-compatible
// routers). Key comes from ANTHROPIC_AUTH_TOKEN env — never hardcoded.
// Note: AgentRouter fingerprints clients; it requires a claude-cli user-agent.
const BASE = (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/$/, '');
const KEY = process.env.ANTHROPIC_AUTH_TOKEN;
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-4-6';

async function callModel({ system, tools, messages, maxTokens = 4096 }) {
  if (!KEY) throw new Error('ANTHROPIC_AUTH_TOKEN not set');
  const body = { model: MODEL, max_tokens: maxTokens, messages };
  if (system) body.system = system;
  if (tools) body.tools = tools;

  let lastErr;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(`${BASE}/v1/messages`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'anthropic-version': '2023-06-01',
          authorization: `Bearer ${KEY}`,
          'user-agent': 'claude-cli/2.1.0 (external, cli)',
          'x-app': 'cli',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(180000),
      });
      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      } else if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 400)}`);
      } else {
        return await res.json();
      }
    } catch (e) {
      if (e.message.startsWith('HTTP 4') && !e.message.startsWith('HTTP 429')) throw e;
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, attempt * 3000));
  }
  throw lastErr;
}

module.exports = { callModel, MODEL, BASE };
