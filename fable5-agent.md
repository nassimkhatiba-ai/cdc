# fable5-agent — build brief

You are the implementer. This document is **what to make**, not how. Prefer your own design over any implied approach. Do not paste large code from prior agents; rebuild cleanly if needed.

Repo: CDC toolkit (`cdc`) — MCP → Agent Skills, with optional **image skills** (`.cdc` / `.cdc.png`). Recent work: image path as default compile output, `nova-fleet` complex MCP, mega40 three-arm live bench (MCP vs text CDC vs image). **Problem:** image is not efficient enough overall (vision floor on tiny skills, tile bloat on fat skills, accuracy drop). Your job is the **efficiency + product correctness** pass so image skills are actually worth shipping.

---

## North star

Make **optical skill loading** dramatically more token-efficient and **at least as accurate as text CDC** on hard multi-hop tasks, without making tiny skills worse than plain text.

Success is measured on live Codex (or the repo’s existing harness), not vibes.

---

## Context the other work already left you

Read (do not blindly trust) existing pieces:

- Image render / pack: `lib/cdc-image.js`, `lib/schema-util.js` (`writeImageSkill`), `lib/compile-mcp.js`
- CLI: `skills/cdc-skill-creator/scripts/create-cdc-skill.js` (`--image` / `--text`, `CDC_IMAGE`)
- Concept bench: `concept/image-skill/`
- mega40: `implementer/mega40/` (targets, harness, `nova-complex-mcp.js`, results)
- Reports: `results-mega40.md`, prior complex / image concept results

Known failure modes from mega40 (`gpt-5.6-sol`, 40 targets):

- **Avg tokens:** MCP ~13.3k &gt; image ~10.2k &gt; **text ~8.4k** (image loses overall)
- **Accuracy:** MCP ~98% &gt; text ~88% &gt; **image ~82%**
- **Hard win:** `complex` image crushed MCP/text on tokens at full accuracy; `nova` preferred text on tokens but all arms 7/7
- **Tiny skills:** vision floor ~6–8k; text ~3–4k
- **Outliers:** some image runs *worse* than MCP (e.g. huge vision / thrash)

Research directions to ground design (read abstracts if useful):

- DeepSeek-OCR ��� optical long-context compression (vision tokens ≪ text tokens at high recovery)
- Critique of DeepSeek-OCR — over-compression leans on language priors; protect critical symbols
- Image Prompt Packaging (IPPg) — structured text-in-image; large savings but **model/task dependent**
- MLLM vision-token compression surveys — mostly model-side; for hosted Codex you mainly control **pixels, pages, and when to attach images**

---

## What to make (deliverables)

### 1. Efficient optical skill packer (core product)

A first-class packing path that produces image skill artifacts **optimized for billed vision cost**, not “looks like a screenshot of SKILL.md.”

Requirements:

1. **Tile-aware geometry**  
   Vision APIs bill roughly by image tiles (think ~512² regions). Packer must target an explicit **tile budget** (configurable). Width/height/scale/cols/line density chosen to minimize tiles for a given information payload. Multi-page only when a single page cannot meet budget without destroying readability.

2. **Content compression before pixels**  
   Do **not** dump full prose SKILL + CDC + SOURCE by default. Emit a **machine-dense skill body**: tool names, param skeletons, join keys, hard rules, traps. Drop redundant descriptions and markdown chrome. Preserve enough signal that an agent can call the right tools without inventing APIs.

3. **Information hierarchy**  
   Critical bits (required params, pagination, reference clock, “do not use heuristic trap tools”, bridge invocation) must remain high-contrast / unambiguous under compression. Trade verbosity for structure (tables, columns, symbols OK if the model can read them).

4. **Pack metrics**  
   Every pack writes machine-readable meta: pages, pixel size, estimated tiles, estimated vision tokens, source chars, compression ratio vs text skill tokens, whether tile budget was met. Human-readable one-liner in CLI output is fine.

5. **Compatibility**  
   Still produce installable skill folders. Keep a path for **full text** skill body (`SKILL.text.md` or equivalent). Image primary vs text primary must remain explicit and testable.

6. **API knobs**  
   If the Codex/OpenAI path supports low-detail / low-res image attach, use it when it reduces cost without breaking hard-task accuracy. Document what you assumed.

### 2. Hybrid skill product shape

Ship a clear default package layout and load story:

- **Hot path (cheap):** minimal text the agent always sees (name, when to use, how to call bridge, maybe tool count / tags).
- **Cold path (dense):** optical pages **and/or** greppable compact `CDC.md` — agent opens image or greps only when needed.
- Do not force “entire product is one giant PNG��� if hybrid is cheaper and more accurate.

Document the intended agent behavior in the generated skill pointer (short).

### 3. Adaptive routing (when image is primary)

Image-as-unconditional-main is **not** acceptable as the only mode.

Implement policy (tunable thresholds, not hard-coded magic only in comments):

| Situation | Expected mode |
|-----------|----------------|
| Small skill / few tools / low text skill tokens | **Text primary** (image optional artifact) |
| Fat tool surface / multi-hop / high definition tax | **Image (or hybrid) primary** |
| Known weak vision task classes (if still failing after packer fix) | Prefer text until fixed |

CLI and env must expose:

- force text primary  
- force image primary  
- auto (recommended default after this work)

Router decision should be logged in `stats.json` / convert output.

### 4. Accuracy and efficiency verification

Extend or reuse harnesses; do not invent a disconnected one-off if mega40/concept already fit.

Minimum evaluation set:

1. **Hard multi-system:** `complex` (acme-ops) and `nova` (nova-fleet) ��� three arms: MCP, text, image (or hybrid).  
2. **Tiny controls:** at least 2 small locals (e.g. calc + stringops/hash).  
3. **Mid/fat non-ops:** at least 2 of playwright, memory, mockapi, github.

Report (markdown + json):

- tokens, wall, exit, scored accuracy per arm  
- pack metrics (tiles / vision est)  
- before/after vs current mega40 numbers where comparable  
- which mode auto-router chose  

**Pass bars (release-oriented):**

| Bar | Criterion |
|-----|-----------|
| Hard tokens | On `complex`, image/hybrid **beats text tokens** and **beats MCP tokens**, with accuracy **≥ text** and preferably full score keys |
| Hard tokens nova | Image/hybrid competitive; if text still wins tokens, image must not lose accuracy vs text |
| Tiny skills | Auto mode must **not** make tiny skills pay vision floor; text tokens remain the cheap path |
| Overall story | With auto routing on the eval set, **aggregate tokens ��� text-only aggregate**, accuracy not worse than text-only by a large gap |
| No silent regressions | `npm test` / existing smoke still passes; convert still installs skills |

If a bar cannot be hit, document **why** with evidence and the smallest follow-up ��� do not paper over with marketing.

### 5. Docs (short, honest)

Update user-facing docs only as needed:

- Default mode after your work (auto vs text vs image)  
- How to force modes  
- When image helps vs hurts (one table)  
- Link to new results file  

Optional internal note: how packing maps to vision tiles / research (DeepSeek-OCR, IPPg) — keep it brief.

### 6. Commit / push readiness

- Keep runtime bulk out of git (homes, logs, node_modules, huge session trees) — same discipline as mega40.  
- Results markdown + summary json **are** commit-worthy.  
- Do not commit secrets or user CODEX homes.

---

## Explicitly out of scope (unless trivial)

- Training or fine-tuning a custom VLM / DeepSeek-OCR stack for production  
- Replacing Codex with a local model as the only path  
- Expanding to 40 full live runs again **unless** needed after the slice passes (prefer fast eval loop first, optional full mega40 later)  
- Unrelated refactors of the whole CDC compiler

---

## Design freedom

You choose:

- File layout, APIs, flag names  
- Exact compact DSL for the image body  
- Whether hybrid uses image-only index, text index, or both  
- Whether to rewrite `cdc-image` or replace it  
- Whether router lives in compile-time only or also runtime hints  

Constraints you must respect:

- **No demo-hardcoded task recipes** in general skill templates (existing CDC rule)  
- Skills remain **Agent Skills**, not “keep MCP connected”  
- Bridge / daemon / callPaged behavior for non-fs MCPs must keep working  
- Pathological paths with `;` in workspace path have bitten this repo ��� be careful with spawn/paths  

---

## Suggested work order

1. Instrument current packer: measure tiles/tokens for complex, nova, calc.  
2. Build compact + tile-aware packer; prove pack metrics drop hard without illegible output.  
3. Hybrid package + auto router.  
4. Wire into create-cdc-skill / compile path.  
5. Live eval slice → report ��� tighten until pass bars or honest failure report.  
6. Docs + clean commit.

---

## Definition of done

- [ ] Efficient packer + metrics shipped in main convert path  
- [ ] Auto routing: tiny → text; fat → image/hybrid  
- [ ] Hybrid skill shape documented and generated  
- [ ] Live eval report with pass-bar table  
- [ ] Hard tasks: clear token win for optical/hybrid vs MCP; competitive vs text  
- [ ] Tiny tasks: not punished by vision floor under auto  
- [ ] Tests green; no junk artifacts committed  

---

## One-line mission

**Turn “skill as image” from a clever dump of SKILL.md into a tile-budgeted, content-compressed, auto-routed optical index that wins on fat MCP surfaces and gets out of the way on small ones.**
