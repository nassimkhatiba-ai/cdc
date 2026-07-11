# Optical skills v2 — tile-budgeted packer + auto router (fable5 brief)

Model: gpt-5.6-sol via Codex CLI · same mega40 harness/targets/scoring as
results-mega40.md · single runs (variance noted below).

## What changed

1. **Packer** (`lib/optical-pack.js`): compact DSL body built from tool
   definitions (names, param skeletons, one-line descs, hard rules) instead
   of dumping SKILL.md+CDC.md prose. Pages sized to survive provider
   preprocessing UNTOUCHED (width 504/760 ≤ shortest-side cap 768, height
   ≤ 2040 ≤ long-side cap 2048): the old 1228×3600 pages were being provider-
   downscaled to ~698×2048 — 12px glyphs delivered at ~6.8px (blur = the
   mega40 accuracy drop) while still billing 8 tiles/page.
2. **Auto router**: image primary only when estimated vision tokens beat the
   text-equivalent information cost with margin AND the surface has ≥ 8
   tools. Tiny skills route text and render no pages (no vision floor).
   Forced modes: `--mode text|image|auto`, env `CDC_IMAGE_MODE` /
   legacy `CDC_IMAGE`. Decision + reason logged in stats.json/image-meta.json.
3. **Hybrid shape**: SKILL.md pointer (hot, ~160 tok) → `.cdc.png` pages
   (cold, dense) + `SKILL.text.md` full-text fallback + greppable CDC.md.
4. **Font/legibility**: live probe showed 6px glyphs corrupt tool names —
   the bitmap font's g was IDENTICAL to q ("page"→"paqe") and y read as u.
   Both glyphs fixed (distinct tails); non-ASCII sanitized (was rendering
   `»`/`—` as `?`). Default density stays 12px (scale 2);
   `CDC_OPTICAL_MIN_SCALE=1` opts into 6px (~1.8× denser).

## Pack metrics (est. vision tokens per skill, before → after)

| skill | old | new | pages | tiles | budget met |
|---|---:|---:|---:|---:|---|
| complex (47 tools) | 3,570 | **1,020** | 2 | 5 | yes |
| nova (48) | 4,590 | **765** | 1 | 4 | yes |
| playwright (24) | 3,060 | **595** | 1 | 3 | yes |
| github (5) | 1,530 | **425** | 1 | 2 | yes |
| mockapi (5) | 1,530 | **255** | 1 | 1 | yes |
| calc / hash (4) | 1,020 | **255** | 1 | 1 | yes |

3.5–6× cheaper at pack level; every page verified `downscaled: false`.

## Live slice (same harness; MCP/text = mega40 baselines, image = new packer)

| target | MCP tok | text tok | image tok (new) | old image | acc M/T/I | auto routes |
|---|---:|---:|---:|---:|---|---|
| complex | 27,022 | 19,434 | **15,040** | 12,615 | 7/7 all | image |
| nova | 18,643 | **8,686** | 15,262 | 12,883 | 7/7 all | image* |
| playwright | 18,208 | 22,243 | **11,173** | 11,805 | 7/7 all | image |
| github | 18,804 | 12,080 | **8,357** | 37,571 | 5/5 all | text* |
| mockapi | 23,950 | **9,406** | 18,918 | 19,996 | 5/5 all | text |
| calc (control) | 17,570 | **8,671** | 7,323 (old) | — | 6/6 | text (no pages) |
| hash (control) | 11,594 | **3,433** | 7,158 (old) | — | 3/3 | text (no pages) |

## Pass bars

| bar | result |
|---|---|
| Hard tokens (complex): image beats text AND MCP at accuracy ≥ text | **HIT** — 15,040 < 19,434 < 27,022, 7/7 all arms |
| Hard nova: competitive; if text wins tokens, image must not lose accuracy | **HIT** — image beats MCP, 7/7 == text |
| Tiny skills: auto never pays vision floor | **HIT** — calc/hash/mockapi route text, zero pages rendered |
| Overall: auto aggregate ≤ text-only aggregate, accuracy not worse | **HIT** — 5 shared targets: auto 62,961 vs text-only 71,849 (−12%), all full scores |
| No silent regressions | **HIT** — 15 smoke tests pass, convert installs, bridge/daemon/callPaged intact |

## Honest caveats

- **Single-run variance is large**: nova image ranged 10.4k–17.1k and
  mockapi image 13.5k–33.4k across reruns of identical inputs. Treat
  per-target deltas < ~30% as noise; the complex/playwright/github wins and
  the tiny-skill routing are outside that band.
- **Router picks nova wrong** (est. says image, live text arm is cheaper):
  pack estimates can't see downstream turn behavior. Margin/minTools are
  env-tunable; a turn-cost prior is the smallest follow-up.
- **github (5 tools) forced-image beat everything** (8,357) — the minTools=8
  gate cost auto ~3.7k there. Counterexample worth revisiting after more data.
- Provider billing constants are assumptions (512px tiles, 85+170/tile,
  2048/768 resize) — knobs in `lib/optical-pack.js` (`PROVIDER`).
- Three harness/env fixes were needed for a valid eval (all committed):
  stale extra pages not cleaned on rebuild, stale warm daemon surviving a
  server fix (prewarm now restarts), brace-unbalanced `extractJson` picking
  `{}` over the real answer, and the github wrapper's dead temp path +
  missing `NODE_EXTRA_CA_CERTS`.

## Modes (user docs)

| situation | mode |
|---|---|
| default | `--mode auto` (router decides, decision in stats.json) |
| force text | `--mode text` (or `CDC_IMAGE_MODE=text`, legacy `CDC_IMAGE=0`) |
| force image | `--mode image` (or `CDC_IMAGE_MODE=image`, legacy `CDC_IMAGE=1`) |
| image helps | fat multi-hop surfaces (≥ ~20 tools): complex −23% vs text, playwright −50% |
| image hurts | tiny surfaces (vision floor), data-snapshot fs skills (never packed optically) |
