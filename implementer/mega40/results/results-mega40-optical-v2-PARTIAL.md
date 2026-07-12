# SUPERSEDED by results-mega40-optical-v2.md (complete 40/40/40 at 21:22)

# mega40 optical v2 — PARTIAL (usage limit)

**Status:** incomplete live run  
**When:** suite started ~19:40 local, died mid text/image arms  
**Root cause:** Codex **usage limit** until **9:09 PM** local  
```
ERROR: You've hit your usage limit. ... try again at 9:09 PM.
```

**Resume attempt ~19:56:** Codex still limited for harness-style exec; aborted after ~20 null-token fails.  
**Scheduled:** `implementer/mega40/logs/resume-after-limit.sh` → ~**21:12** local (PID in `run-optical-v2-resume.pid`). Log: `run-optical-v2-resume.log`.

## What completed cleanly

| arm | usable runs (tokens present) | notes |
|-----|------------------------------|--------|
| MCP | **40/40** | full pass, ~98% accuracy band from harness score |
| text | **21/40** | early targets OK; later batch hit limit (~2–3s, null tokens) |
| image optical v2 | **3/40** | mockapi, todo, chromedevtools only |

MCP alone is a valid baseline refresh. Text/image **cannot** be used for optical-v2 efficiency claims from this run.

### Usable text (21)
calc, chromedevtools, context7, everything, fetch, filesystem, filesystem_large, git, github, jsonstore, memory, mockapi, playwright, puppeteer, sequential, sqlite, time, todo, tradingview, uuidgen, weather

### Usable image (3)
chromedevtools (10077), mockapi (21475), todo (7067)

### Still need text (19)
books, cache, complex, counter, cronish, csvops, dateops, flags, geo, graph, hash, inventory, kv, mathstat, nova, queue, regex, stringops, unitconvert

### Still need image (37)
books, cache, calc, complex, context7, counter, cronish, csvops, dateops, everything, fetch, filesystem, filesystem_large, flags, geo, git, github, graph, hash, inventory, jsonstore, kv, mathstat, memory, nova, playwright, puppeteer, queue, regex, sequential, sqlite, stringops, time, tradingview, unitconvert, uuidgen, weather

## Do not conclude from this run

- Image optical v2 is not “worse” — most image arms never ran the model.
- Auto aggregate in `score-optical-v2-report.js` is **invalid** here (null tokens).
- `results-mega40-optical-v2.md` from the partial score is **invalid** until resume finishes.

## Resume plan (after credits / 9:09 PM)

Auto-scheduled ~21:12. Manual equivalent:

```bash
# only re-run missing text + image arms (MCP already good; good text/image preserved)
CODEX_MODEL=gpt-5.6-sol PARALLEL=2 PHASE=text SKIP_PREBUILD=1 \
  ONLY=books,cache,complex,counter,cronish,csvops,dateops,flags,geo,graph,hash,inventory,kv,mathstat,nova,queue,regex,stringops,unitconvert \
  node implementer/mega40/run-mega40.js

CODEX_MODEL=gpt-5.6-sol PARALLEL=2 PHASE=image SKIP_PREBUILD=1 \
  ONLY=books,cache,calc,complex,context7,counter,cronish,csvops,dateops,everything,fetch,filesystem,filesystem_large,flags,geo,git,github,graph,hash,inventory,jsonstore,kv,mathstat,memory,nova,playwright,puppeteer,queue,regex,sequential,sqlite,stringops,time,tradingview,unitconvert,uuidgen,weather \
  node implementer/mega40/run-mega40.js

CODEX_MODEL=gpt-5.6-sol PHASE=score node implementer/mega40/run-mega40.js
node implementer/mega40/score-optical-v2-report.js
```

Prebuild already has optical v2 packs (width 504, complex ~1020 vision est). No need to re-prebuild unless skills deleted.

## MCP snapshot (this run, usable)

From harness score lines: MCP accuracy **152/155 (98.1%)**, avg tokens ~**13.2k**, avg wall ~**18s**.

Hard:
- complex MCP: completed (22254 tok / ~37s)
- nova MCP: completed (23578 tok / ~24s)

## Files

- log (first run): `implementer/mega40/logs/run-optical-v2-full.log` (if present)
- resume log: `implementer/mega40/logs/run-optical-v2-resume.log`
- resume script: `implementer/mega40/logs/resume-after-limit.sh`
- raw: `implementer/mega40/homes/*/out/*.run.json`
- invalid full report: `results-mega40-optical-v2.md` / `results/results-mega40-optical-v2.md` (ignore until resume)
- slice that *is* valid for pack claims: `results-optical-v2.md` (7-target live slice, pass bars HIT)
