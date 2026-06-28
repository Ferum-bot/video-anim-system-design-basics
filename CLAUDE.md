# CLAUDE.md

Guidance for working in this repo. Keep it accurate — update it when conventions change.

## What this is

A **Motion Canvas** animation series for system-design YouTube videos. Each video is
its own Vite project folder. A shared toolkit at `lib/` (imported as `@lib`) gives
every video one visual language.

## Repository layout

- `lib/` — shared `@lib` toolkit (theme, stage, animated components). Reused by all
  videos. Full API in `lib/README.md`.
- `[VV-PP]<slug>/` — one Vite project per **part** of a video (`VV` = video number, `PP`
  = part within it; e.g. `[01_01]hardware-limits`, `[01_02]cache`). Each part is edited and
  rendered independently (own editor, own `.meta` markers, own render → own overlay clip
  composited separately in CapCut). Folder names contain brackets → **quote paths in the
  shell**: `vite '[01_02]cache'`.
  - `src/project.ts` — registers scenes via the `?scene` import suffix + the project `audio`.
  - `src/scenes/**/*.tsx` — the scenes.
  - `audio/0626.m4a` — that part's copy of the narration track (git-ignored); each part
    uses its own `audioOffset` in `project.meta` to line up with its slice of the voiceover.
- `example/` — reference scene (an HTTP-request topology; good Line/Circle/packet example).
- `Taskfile.yml` — task runner. `task new name=…` scaffolds a new part already wired to `@lib`.
- `tsconfig.base.json` — shared strict TS config (`jsxImportSource: @motion-canvas/2d`).

## Video "you don't need sharding" — parts

The video is split into separate Vite projects, one per part, so each can be re-rendered
without touching the others.

Part `[01_01]hardware-limits/` — hardware (`src/scenes/[01]hardware/`):
- `compute.tsx` — EC2 instances (m6i / x1e / u-24tb) + "8 small servers = 1 big, same price".
- `storage.tsx` — SSD / HDD / S3 capacity.
- `network.tsx` — bandwidth cards + a latency topology where pulses travel at a speed ∝ latency.

Part `[01_02]cache/` — caching (`src/scenes/`):
- `numbers.tsx` — "numbers to know": memory + throughput cards, then read/write latency bands.
- `scaling.tsx` — "when to scale": three threshold cards (warning accents, near-full meters).

Run a part with `task serve:sharding` / `task serve:cache` (or `npm run serve:01` / `serve:cache`).

## Conventions

- **Centered column.** Scenes render into a centred **960-wide** panel (full canvas is
  1920×1080). The host composites narration / talking-head in the other half during video
  editing, so keep content centred — `createStage(view)` sets this up.
- **Widget pattern.** Animated pieces are `{ node, appear() }`. Mount `node` with
  `stage.add(...)`, then `yield* widget.appear()` when it should animate in.
- **Theme.** GitHub-dark palette via `colors`, monospace via `fonts.mono`, alpha via
  `withAlpha(hex, a)` (don't hand-write hex suffixes). One accent colour per concept.
- **Pacing.** Reveals are deliberately slow (cards ~1.6s slide + ~2.8s counters) so they
  read over narration. Match that feel.
- **Endless motion.** Fork a background generator with `yield gen()` (note: `yield`, not
  `yield*`) — e.g. the pulsing latency links. It auto-cancels when the scene ends, so it
  doesn't affect scene duration.

## Timing & sync (time events)

Scenes are synced to the recorded narration with **Motion Canvas time events**, not fixed
pauses. Between beats use `yield* waitUntil('marker')` (from `@motion-canvas/core`); each
marker appears on the editor timeline and is **dragged** to line up with the voiceover —
offsets are saved in the scene's `.meta`, so re-timing needs no code changes. Keep only tiny
sub-beat spacing as `waitFor(...)`. Every scene ends with a `waitUntil('end')` anchor (drag to
set where it ends) followed by a 0.8s `stage.opacity(0)` fade-out.

Existing markers (every scene also has `end`):
- `compute` — `big-server`, `comparison`, `same-price`, `memory-optimized`, `high-memory`, `takeaway`.
- `storage` — `ssd`, `hdd`, `object-storage`, `takeaway`.
- `network` — `bandwidth`, `high-perf`, `az-bandwidth`, `latency`, `lat-within-az`,
  `lat-across-az`, `lat-cross-region`, `takeaway`.
- `cache/numbers` — `memory`, `throughput`, `latency`, `lat-read`, `lat-write-az`,
  `lat-write-cross`, `takeaway`.
- `cache/scaling` — `dataset`, `throughput`, `read-latency`, `takeaway`.

The full-video narration is wired as the project `audio` in `src/project.ts`
(`audio/0626.m4a`, converted from the source WAV with `afconvert -f m4af -d aac`, git-ignored),
so the editor shows its waveform for dragging markers. New markers default to offset 0 (no
wait) until dragged. The track spans the whole ~22 min video while only the hardware scenes
exist; scenes play from `t=0`, so use `audioOffset` in `project.meta` (or add the remaining
parts' scenes) to line current scenes up with their slice of the track.

## Export (transparent overlay)

Final animations are composited over the talking-head footage in CapCut as a **transparent
overlay**. Before rendering, set `TRANSPARENT = true` in `lib/stage.tsx` (revert to `false`
for comfortable editing — the editor backdrop goes dark again). Render the PNG sequence from
the editor (it carries alpha), then `task mov SRC=<frames-dir> OUT=scene.mov` encodes ProRes
with alpha for CapCut — `task mov` defaults to **lossless qtrle** (`-c:v qtrle -pix_fmt
argb`): crisp RGB + alpha, no compression shimmer on text/lines, ~340 MB for ~3.7 min (14×
smaller than ProRes 4444, encodes in seconds). `task mov:small` is HEVC 4:4:4 (`ayuv`) at
~100 MB if a smaller file is needed and CapCut accepts it. **Avoid HEVC 4:2:0** (`bgra`) for
this graphics content — sharp text/lines shimmer regardless of bitrate (luma SSIM ~28 dB vs
~43 dB for 4:4:4); crispness needs lossless or 4:4:4. The narration track for marker-sync is
wired as the project `audio` (see "Timing & sync").

## Code patterns

Goal: every scene reads top-to-bottom like a storyboard, and the mechanics live behind
small, well-named factories. Keep new code in this shape.

- **Animated piece = factory returning a `Widget`.** A factory (`specCard`, `sceneTitle`,
  `banner`, or a local one like `latencyBand`) builds the JSX tree **once**, captures its
  refs/signals in the closure, and exposes only `{ node, appear() }` (or `{ node, reveal(),
  pulse() }` when motion has phases). Refs/signals never leak to the caller. Reference:
  `lib/components/SpecCard.tsx`.
- **Separate structure from motion.** JSX declares the *static, hidden* initial state
  (`opacity={0}`, start offset / `scale`). The generator (`appear`) describes the transition
  to the visible state. Don't build nodes imperatively or compute layout inside the animation.
- **Options objects, never positional args.** Public factories take one typed options object;
  related fields are grouped (`meter`, `cost`) and optional groups are **omitted** to switch a
  feature off — no boolean flags. E.g. a card without `cost` simply hides the price block.
- **Reactive text, not manual updates.** Bind `<Txt text={() => …}/>` to a signal; for
  counting numbers use `counter(target, format)`, which resolves number-vs-static once in one
  place instead of branching at every call site.
- **Name every magic number.** Durations, sizes, offsets, Y-positions are `const`s at the top
  of the file, grouped with a one-line comment (see the `FADE_IN / SLIDE_IN / COUNT_UP` block
  in `SpecCard.tsx`). Tweaks then happen in one obvious spot.
- **Small private sub-components** for repeated visuals (`DeviceIcon`). Leave them un-exported
  when used in a single file.
- **Scenes stay thin.** A scene only orchestrates: `const w = widget({…}); stage.add(w.node);
  yield* w.appear(); yield* waitFor(…)`. No layout math, no animation internals — push those
  into a factory.
- **Promote vs keep local.** Reused across videos/scenes → move to `@lib`. Topic-specific
  (e.g. `latencyBand` in `network.tsx`) → keep next to its scene. Don't pre-generalize a
  one-off helper.
- **Theme tokens only.** No literal hex or font strings in scenes/components — use `colors`,
  `fonts`, `withAlpha`. One accent colour per concept.
- **TypeScript.** `interface` for public option/return shapes; `type`-only imports for types;
  `as const` for token tables; model "either A or B" as `number | string` resolved by a helper
  (like `counter`) rather than overloads; no `any`.
- **Comments explain *why*, names explain *what*.** Lean on naming for intent; reserve comments
  for the non-obvious ("stays at the top for the whole scene", "fork: keeps bouncing in the
  background").

## `@lib` API (import from `@lib`)

`createStage(view)`, `STAGE`, `CARD_WIDTH`, `TRANSPARENT`; `colors`, `fonts`, `withAlpha`;
`counter(target, format?)` (number → counts up from 0; string → static like `'∞'`);
`formatThousands`; the `Widget` interface; and components `sceneTitle()`, `specCard()`
(accepts an `icon` node), `banner()`, `backdrop()` (dark scrim, export-only), `latencyBand()`
(A↔B with a pulse whose travel time = latency), and tech-logo icons `redisIcon()` (more to
come). See `lib/README.md`.

**Tech icons.** Logos live in `lib/assets/icons/*.svg` (official devicon SVGs, inlined by
Vite) and are wrapped into card-sized tiles in `lib/components/icons.tsx`. To add one
(Postgres / MySQL / pod / Kafka): download its SVG there, add a `<tech>Icon` factory, then
pass it via `specCard({ icon: <tech>Icon() })`.

## Cross-root JSX wiring (don't break this)

`lib/` lives **outside** each project's Vite `root`, so each project's `vite.config.ts`
must keep: `esbuild: { jsx: 'automatic', jsxImportSource: '@motion-canvas/2d' }`,
`resolve.alias['@lib']`, and `server.fs.allow: [repoRoot]`. Its `tsconfig.json` must keep
the `@lib` paths and `include: ["src", "../lib"]`. Without these, JSX inside `@lib` won't
transform. `task new` writes all of this for new videos.

## Working & verifying

- **Dev editor:** `task serve:sharding` (part 1) / `task serve:cache` (part 2) → http://localhost:9000
  (a second editor opens on :9001 if one is already running). **Restart it after editing
  `vite.config.ts`** (alias/esbuild changes aren't hot-reloaded).
- **Typecheck:** `npx tsc --noEmit -p '[01_01]hardware-limits/tsconfig.json'` (and
  `'[01_02]cache/tsconfig.json'`); each also covers `../lib`.
- **Build = best headless check.** `npm run build:01` / `npm run build:cache` follows imports
  across the repo root, so it catches `@lib` resolution / cross-root JSX errors without a
  browser. Use it to verify when the preview/browser tools aren't available.
- **Scene names** in the editor come from the **filename**. To rename a scene, `git mv` the
  `.tsx` and delete the orphaned `.meta` file.
