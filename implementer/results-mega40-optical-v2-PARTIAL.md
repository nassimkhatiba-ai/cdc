# mega40 optical v2 — PARTIAL (usage limit)

**Status:** incomplete live run  
**When:** suite started ~19:40 local, died mid text/image arms  
**Root cause:** Codex **usage limit**  
```
ERROR: You've hit your usage limit. ... try again at 9:09 PM.
```

## What completed cleanly

| arm | usable runs (tokens present) | notes |
|-----|------------------------------|--------|
| MCP | **40/40** | full pass, ~98% accuracy band from harness score |
| text | **~21/40** | early targets OK; later batch hit limit (~2–3s, null tokens) |
| image optical v2 | **~3/40** | only a few finished before limit (e.g. mockapi, todo, chromedevtools partial) |

MCP alone is a valid baseline refresh. Text/image **cannot** be used for optical-v2 efficiency claims from this run.

## Do not conclude from this run

- Image optical v2 is not ���worse” ��� most image arms never ran the model.
- Auto aggregate in `score-optical-v2-report.js` is **invalid** here (null tokens).

## Resume plan (after credits / 9:09 PM)

```bash
# only re-run missing text + image arms (MCP already good)
CODEX_MODEL=gpt-5.6-sol PARALLEL=2 PHASE=text \
  SKIP_PREBUILD=1 node implementer/mega40/run-mega40.js

CODEX_MODEL=gpt-5.6-sol PARALLEL=2 PHASE=image \
  SKIP_PREBUILD=1 node implementer/mega40/run-mega40.js

# or full remaining:
CODEX_MODEL=gpt-5.6-sol PARALLEL=2 PHASE=all SKIP_PREBUILD=1 SKIP_MCP=1 \
  ARMS=text,image node implementer/mega40/run-mega40.js

node implementer/mega40/score-optical-v2-report.js
```

Prebuild already has optical v2 packs (width 504, complex ~1020 vision est). No need to re-prebuild unless skills deleted.

## MCP snapshot (this run, usable)

From harness score lines: MCP accuracy **152/155 (98.1%)**, avg tokens ~**13.2k**, avg wall ~**18s**.

Hard:
- complex MCP: completed (full score path in log)
- nova MCP: completed

## Files

- log: `implementer/mega40/logs/run-optical-v2-full.log`
- raw: `implementer/mega40/homes/*/out/*.run.json`
- invalid full report: `results-mega40-optical-v2.md` (ignore until resume)
