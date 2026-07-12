# Notion live benchmark — MCP vs text CDC

**Model:** `gpt-5.6-sol`  
**When:** 2026-07-11T22:16:37Z  
**Protocol:** matched reasoning (MCP=`medium`, CDC=`medium`); real Notion workspace + token; product path **text only** for CDC claim  
**Tasks:** identity · search `stacksnap` · read `stacksnap_FULL_PLAN`  
**Headline:** text **46.9% under MCP** · accuracy MCP **7/7** · text **6/7**

---

## Aggregate

| arm | n | avg tokens | avg wall (s) | accuracy | % under MCP |
|-----|---|------------|--------------|----------|-------------|
| MCP | 3 | 12203 | 11.7 | 7/7 (100%) | ��� |
| text CDC | 3 | 6476 | 17.3 | 6/7 (85.7%) | **46.9%** |

## Ratios

| | |
|--|--|
| MCP / text | **1.88** |
| text under MCP % | **46.9%** |

## Per-task

| task | mcp tok | text tok | % under | mcp sc | text sc |
|------|---------|----------|---------|--------|---------|
| identity | 10104 | 5651 | 44.1% | 2/2 | 2/2 |
| search | 10923 | 6236 | 42.9% | 2/2 | 2/2 |
| plan | 15581 | 7542 | 51.6% | 3/3 | 2/3 |

## Definition tax (static convert)

| | tokens |
|--|--:|
| MCP schemas | 37977 |
| CDC skill hot | 835 |
| ratio | **45.5x** |

## Notes

- Workspace: real Notion (auth via `NOTION_TOKEN`)
- `callPaged` fixed: no forced `page=1` on first call (Notion search rejects it); cursor/`next_cursor` supported
- plan text miss: `has_how_to_use=false` (title + H1 correct)

## How to re-run

```bash
export NOTION_TOKEN="$(cat ~/.config/notion/token)"
CODEX_MODEL=gpt-5.6-sol MCP_REASONING=medium CDC_REASONING=medium \
  node implementer/notion-live/run-notion-live.js
```
