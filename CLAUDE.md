# CLAUDE.md

Guidance for working in this repo. Keep it accurate — update it when conventions change.

## What this is

A **Motion Canvas** animation series for system-design YouTube videos. Each video is
its own Vite project folder. A shared **framework** at `lib/` (imported as `@lib`) gives
every video the same components and scaffolding; each video applies its own **theme preset**
from `lib/themes/`, so the visual *style* can differ per video while the mechanics stay
shared. See "Theming" below.

## Repository layout

- `lib/` — shared `@lib` **framework**: the theme *system* (`Theme`, `applyTheme`,
  `activeTheme`, the live `colors`/`fonts` proxies), the theme-driven stage, utilities,
  and the animated components. Carries **no palette of its own**. Full API in `lib/README.md`.
- `lib/themes/` — concrete **theme presets**, imported via `@lib/themes/<name>`: this is
  where the actual colours, fonts, and background treatment live. `githubDark.ts` (video 01),
  `blueprint.ts` (video 02).
- `[VV-PP]<slug>/` — one Vite project per **part** of a video (`VV` = video number, `PP`
  = part within it; e.g. `[01_01]hardware-limits`, `[01_02]cache`). Each part is edited and
  rendered independently (own editor, own `.meta` markers, own render → own overlay clip
  composited separately in CapCut). Folder names contain brackets → **quote paths in the
  shell**: `vite '[01_02]cache'`.
  - `src/theme.ts` — applies this video's theme preset (`applyTheme(...)`). **Imported first**
    in `project.ts` so the theme is active before scenes read palette tokens (see "Theming").
  - `src/project.ts` — `import './theme'` first, then registers scenes via the `?scene` import
    suffix + the project `audio`.
  - `src/scenes/**/*.tsx` — the scenes.
  - `audio/0626.m4a` — that part's copy of the narration track (git-ignored); each part
    uses its own `audioOffset` in `project.meta` to line up with its slice of the voiceover.
- `common/` — reusable call-to-action / base overlays shared across **all** videos
  (not part-specific), rendered standalone and dropped in wherever needed. No narration
  track — each scene is self-timed with `waitFor`. Currently `subscribe.tsx` ("Подпишитесь
  на канал": a cursor glides in and clicks a YouTube subscribe button that morphs to the
  subscribed state). Its building blocks live in `common/src/components/`
  (`subscribeButton.tsx`, `cursor.tsx` — promote to `@lib` if a video needs them directly).
  Run with `task serve:common` / `task build:common`.
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

Part `[01_02]cache/` — caching (`src/scenes/`, Redis icons):
- `numbers.tsx` — "numbers to know": memory card → latency bands → throughput card.
- `scaling.tsx` — "when to scale": three threshold cards (warning accents, near-full meters).

Part `[01_03]database/` — databases (`src/scenes/`, PostgreSQL icons):
- `numbers.tsx` — storage card → latency bands (read mem/disk, write) → throughput & connections (3 cards).
- `sharding.tsx` — "when to shard": 3 threshold cards, then a geo-distribution card.

Part `[01_04]app-servers/` — application servers (`src/scenes/`, Kubernetes/pod icons):
- `numbers.tsx` — CPU + memory cards, then network + connections cards.
- `scaling.tsx` — CPU-utilization signal card, then a "scale out" row of pods appearing.

Part `[01_05]message-queue/` — message queues (`src/scenes/`, Kafka icons):
- `numbers.tsx` — five sequential beats: throughput → latency band → message-size → storage → retention.
- `scaling.tsx` — two threshold cards (throughput, partition count).

Part `[01_06]takeaways/` — closing summary (`src/scenes/takeaways.tsx` orchestrates;
the beats live in `src/scenes/takeaways/`):
- Same `backdrop()` scrim as every part. Four bespoke metaphor animations, each inside a
  compact transparent-fill accent-bordered frame (DB table+SQL, cache ignites + instant ping,
  client→server→Kafka→consumer round-trip, pod local memory), play one at a time; then they
  collapse into a 2×2 recap grid.
- The scene is a thin orchestrator; each beat is its own factory file (`dbBeat.tsx`,
  `cacheBeat.tsx`, `queueBeat.tsx`, `appBeat.tsx`, `recap.tsx`) returning a `Beat`
  (`{node, play(), loop?()}`). The shared block shell + constants live in `takeaways/beat.tsx`
  (`beatBlock()`, `showBlock()`). Helper files sit next to the scene but are **not** registered
  in `project.ts`, so they aren't loaded as scenes.

Run a part with `task serve:sharding` / `task serve:cache` (or `npm run serve:01` / `serve:cache`).

## Video "Всё про сети" (video 02) — style preview

`[02_00]preview/` — a **design preview** for the networking video (OSI / TCP-IP /
application protocols), in the `blueprint` theme (deep-navy schematic, translucent scrim +
grid, SF Pro + SF Mono). It's a style demo, not the final part layout. Its topic components
live in `[02_00]preview/src/net/` (`sceneHeading`, `osiStack`, `handshake`, `protocolCard`) —
they build on the `@lib` framework and read the active theme, so all colour/font/background
comes from the applied `blueprint` preset. Scenes: `osi`, `handshake`, `protocols`. Run with
`npm run serve:net`.

## Theming

`@lib` is a **framework with no palette**; the style comes from a **theme preset**.

- **A theme** (`Theme` in `lib/theme.ts`) is `{ palette, fonts, stage }`: a `ThemePalette`
  (surfaces, text, a `primary`, and a shared accent vocabulary `blue/cyan/green/red/purple/
  orange`), `ThemeFonts` (`display` for prose, `mono` for technical tokens), and a `StageStyle`
  (backdrop `fill`, `scrimAlpha`, `transparent`, optional `grid` + `footageSim`).
- **Presets** live in `lib/themes/` and are applied per project: each video's `src/theme.ts`
  calls `applyTheme(preset)`, and `project.ts` imports `./theme` **first** — the ordering
  matters because scenes read palette tokens at module top level (in `const` arrays).
- **Components read the active theme through proxies.** `colors` and `fonts` (from `@lib`)
  are live proxies over the applied theme, so the same component renders in whatever style is
  active. Never read them at module top level in *library* code (no theme applied yet); scenes
  can, because their video's `./theme` runs first.
- **The stage is theme-driven.** `createStage(view)` paints per `theme.stage`: a solid backdrop
  (`scrimAlpha: 1`, video 01) or a translucent scrim + grid (`scrimAlpha < 1`, video 02).
- **To add a video's style:** write `lib/themes/<name>.ts` (fill the `ThemePalette` /
  `ThemeFonts` / `StageStyle`), then `applyTheme(<name>)` from the video's `src/theme.ts`.

## Conventions

- **Centered column.** Scenes render into a centred **960-wide** panel (full canvas is
  1920×1080). The host composites narration / talking-head in the other half during video
  editing, so keep content centred — `createStage(view)` sets this up.
- **Widget pattern.** Animated pieces are `{ node, appear() }`. Mount `node` with
  `stage.add(...)`, then `yield* widget.appear()` when it should animate in.
- **Theme.** Colours via the `colors` proxy, fonts via `fonts` (`fonts.mono` / `fonts.display`),
  alpha via `withAlpha(hex, a)` (don't hand-write hex suffixes) — all resolve to the video's
  applied theme preset. One accent colour per concept. See "Theming".
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
- `cache/numbers` — `memory`, `latency`, `lat-read`, `lat-write-az`, `lat-write-cross`,
  `throughput`, `takeaway`.
- `cache/scaling` — `dataset`, `throughput`, `read-latency`, `takeaway`.
- `database/numbers` — `storage`, `latency`, `lat-read-cache`, `lat-read-disk`, `lat-write`,
  `tput-reads`, `tput-writes`, `connections`, `takeaway`.
- `database/sharding` — `dataset`, `write-throughput`, `read-latency`, `geo`, `takeaway`.
- `app-servers/numbers` — `cpu`, `memory`, `network`, `connections`, `takeaway`.
- `app-servers/scaling` — `cpu`, `scale-out`, `takeaway`.
- `queue/numbers` — `throughput`, `latency`, `msg-size`, `storage`, `retention`, `takeaway`.
- `queue/scaling` — `throughput`, `partitions`, `takeaway`.
- `takeaways` — `db`, `cache`, `queue`, `app`, `recap` (+ `end`; no `takeaway`).

The full-video narration is wired as the project `audio` in `src/project.ts`
(`audio/0626.m4a`, converted from the source WAV with `afconvert -f m4af -d aac`, git-ignored),
so the editor shows its waveform for dragging markers. New markers default to offset 0 (no
wait) until dragged. The track spans the whole ~22 min video while only the hardware scenes
exist; scenes play from `t=0`, so use `audioOffset` in `project.meta` (or add the remaining
parts' scenes) to line current scenes up with their slice of the track.

## Export (transparent overlay)

Final animations are composited over the talking-head footage in CapCut as a **transparent
overlay**. Before rendering, set `stage.transparent = true` in the video's theme preset
(`lib/themes/<name>.ts`) — revert to `false` for comfortable editing (the editor shows the
theme's backdrop / footage stand-in again). Render the PNG sequence from
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

**Theme system:** `applyTheme(preset)`, `activeTheme()`, `defineTheme()`, the `Theme` /
`ThemePalette` / `ThemeFonts` / `StageStyle` types, and the live `colors` / `fonts` proxies +
`withAlpha` (see "Theming"). Presets: `@lib/themes/githubDark`, `@lib/themes/blueprint`.

**Framework:** `createStage(view)` (theme-driven backdrop/scrim + centred panel),
`endScene(stage)` (the shared `waitUntil('end')` + fade-out every scene closes with), `STAGE`,
`CARD_WIDTH`;
`counter(target, format?)` (number → counts up from 0; string → static like `'∞'`);
`formatThousands`; the `Widget` interface; and components `sceneTitle()`, `sectionLabel()`
(the top muted caption — `appear()` once, then `retitle()` per beat), `specCard()`
(accepts an `icon` node), `banner()`, `backdrop()` (dark scrim, export-only), `latencyBand()`
(A↔B with a pulse whose travel time = latency), and tech-logo icons `redisIcon()`,
`postgresIcon()`, `podIcon()` (Kubernetes), `kafkaIcon()`. See `lib/README.md`.

**Tech icons.** Logos live in `lib/assets/icons/*.svg` (official devicon SVGs, inlined by
Vite) and are wrapped into card-sized tiles in `lib/components/icons.tsx`. To add one
(Postgres / MySQL / pod / Kafka): download its SVG there, add a `<tech>Icon` factory, then
pass it via `specCard({ icon: <tech>Icon() })`.

## Cross-root JSX wiring (don't break this)

`lib/` lives **outside** each project's Vite `root`, so the config must set
`esbuild: { jsx: 'automatic', jsxImportSource: '@motion-canvas/2d' }`,
`resolve.alias['@lib']`, and `server.fs.allow: [repoRoot]`. This shared wiring lives **once**
in `lib/vite.ts` (`defineVideoProject(import.meta.url)`); every `vite.config.ts` is just two
lines that call it. Each `tsconfig.json` must keep the `@lib` paths, `include: ["src",
"../lib"]`, and `exclude: ["../lib/vite.ts"]` (that file is build tooling — it uses node
builtins, so it stays out of the scene typecheck). Without the JSX wiring, JSX inside `@lib`
won't transform. `task new` writes all of this for new videos. Theme presets are imported as
`@lib/themes/<name>`, which resolves through the existing `@lib/*` path/alias — no extra wiring.

## Working & verifying

- **Dev editor:** `task serve:sharding` (part 1) / `task serve:cache` (part 2) → http://localhost:9000
  (a second editor opens on :9001 if one is already running). **Restart it after editing
  `vite.config.ts`** (alias/esbuild changes aren't hot-reloaded).
- **Typecheck:** `npx tsc --noEmit -p '[01_01]hardware-limits/tsconfig.json'` (and
  `'[01_02]cache/tsconfig.json'`); each also covers `../lib`.
- **Build = best headless check.** `npm run build:01` / `npm run build:cache` / `build:net`
  follows imports across the repo root, so it catches `@lib` resolution / cross-root JSX errors
  without a browser. Use it to verify when the preview/browser tools aren't available. Note the
  build does **not** run scene code, so it won't catch a missing `applyTheme` — the editor will
  (a clear "No theme applied" throw); load a part in the editor after theme changes.
- **Scene names** in the editor come from the **filename**. To rename a scene, `git mv` the
  `.tsx` and delete the orphaned `.meta` file.
