# Codex gpt-5.6-luna A/B — filesystem MCP vs CDC skill

**Honest live runs** (isolated `CODEX_HOME`, same model, same task, ground-truth checked).

## Task
Under `/Users/nesbes/cdc-mcp-sandbox`: sum `total` where `status=="delivered"`, list sorted `docs/` filenames.

**Ground truth:** `{"totalRevenue": 209.3, "files": ["note-1.txt", "note-2.txt", "note-3.txt", "note-4.txt", "note-5.txt"]}`

**Dataset:** 10 orders (~tiny). This measures definition/tool overhead more than payload scale.

## Results

| | MCP (filesystem server) | CDC (`filesystem-cdc` skill) |
|---|---:|---:|
| Correct | **True** | **True** |
| Answer | `{"totalRevenue":209.3,"files":["note-1.txt","note-2.txt","note-3.txt","note-4.txt","note-5.txt"]}` | `{"totalRevenue":209.3,"files":["note-1.txt","note-2.txt","note-3.txt","note-4.txt","note-5.txt"]}` |
| Input tokens | **77,511** | **38,207** |
| Cached input | 65,024 | 33,024 |
| Uncached input | 12,487 | 5,183 |
| Output tokens | 421 | 782 |
| Reasoning tokens | 132 | 145 |
| Wall clock | **14s** | **22s** |
| Data access path | 5 MCP tool calls: list_allowed_directories, list_directory, list_directory, list_directory, read_text_file | skill SKILL.md + 1 Node fs script |

**Input token ratio (MCP / CDC): 2.03x**

## What each arm actually did

### MCP (valid)
- Forced `sandbox=read-only` + prompt ban on shell data access
- Real MCP tools: ['list_allowed_directories', 'list_directory', 'list_directory', 'list_directory', 'read_text_file']
- Full `orders.json` payload entered the model via `read_text_file`

### CDC (valid)
- No MCP servers configured
- Loaded `filesystem-cdc` skill, ran one Node `fs` aggregation script
- Script printed final JSON; model did not page file contents through MCP

## Discarded invalid run
First "MCP" attempt ignored MCP and used `rg`/`sed` over the filesystem via shell. That is **not** an MCP baseline — discarded.

## Honest takeaways
1. **Both arms got the answer right** on this task.
2. **CDC used fewer input tokens** (~49% of MCP) even on a tiny dataset.
3. **MCP was faster wall-clock** here (14s vs 22s) ��� skill load + script write/run added latency.
4. This is **not** the big CDC win regime. With 10 orders the payload tax is tiny; the paper-scale wins need large paginated payloads. Do not claim 100x from this run.
5. Codex base context is large (~30k+ cached) on both arms; CDC savings show up on top of that, not instead of it.

Generated: 2026-07-11T00:31:54.741327+00:00
