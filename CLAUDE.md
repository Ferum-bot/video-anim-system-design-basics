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

## Video "Транспортный уровень" (video 03) — parts

Second part of the networking series (UDP / TCP / QUIC). Keeps video 02's `blueprint` theme.
The narration is the **already-edited** mix `~/Movies/CapCut/0807.WAV` (49:48), so scene
timecodes equal final-video timecodes and parts use `audioOffset` only when they don't start
at t=0. Transcript + the pre-production animation plan reconciled against it live in `docs/`
([video-03-transport.md](docs/video-03-transport.md),
[video-03-animation-plan.md](docs/video-03-animation-plan.md)).

Part `[03_01]part-one-preview/` — the intro callback to video 02 (`src/scenes/partOne.tsx`,
components in `src/part1/`): part 1's YouTube thumbnail (`src/assets/part-one-thumbnail.jpg`)
floats in as a blueprint card at `04:18`, breathes through the hold, gains a
«СМОТРИ ПЕРВУЮ ЧАСТЬ ↗» chip at `16:00` (where the host places the YouTube card), and drifts
out at `25:24`. Uses a **780-tall stage** (`createStage(view, {height})`) so the panel reads
as a card rather than a full-height band. From the chip onward the card and the chip share one
attention pulse — both fork endless loops on the same frame and on the same half-period
(`src/part1/pulse.ts`), so they breathe in step; the card's quieter `idle()` breath is
`cancel`ed first, since both loops drive the same properties. `audioOffset: 0`. Markers:
`card`, `hint`, `end`. Run `npm run serve:part1` (or `task serve:part1`).

Part `[03_03]mac-address/` — канальный уровень, MAC-адрес (`src/scenes/macAddress.tsx`,
components in `src/mac/`), covers `03:19.4–04:21.9`, `audioOffset: -199.4`. One object holds
the whole scene: `addressBytes` unfolds the address out of a frame-header cell, measures it
(48 бит), cuts it between byte 3 and 4 into vendor id (cyan) + serial (amber), resolves the
prefix to a real vendor (`A4:83:E7` Apple → `00:1B:21` Intel), then docks up so `segmentScope`
can show the link between two neighbours and the segment edge frames keep dying on. Markers:
`address`, `mac`, `bits`, `split`, `serial`, `vendor`, `brands`, `neighbour`, `segment`, `end`.
Run `npm run serve:mac` (or `task serve:mac`). `[03_02]` is deliberately unused — that slot was
a link-layer intro scene we scoped and dropped; part numbers follow the storyboard, not the
build order.

Part `[03_04]frame-budget/` — канальный уровень, бюджет Ethernet-кадра
(`src/scenes/frameBudget.tsx`, components in `src/frame/`), covers `05:00.5–06:28.5`,
`audioOffset: -300.5`. `frameBar` is one bar for the whole scene: abstract (полезное vs
служебное) → named fields (`8·6·6·2 … 4`, the two MAC blocks take the previous scene's cyan)
→ **redrawn to true proportion**, where 26 bytes against 1500 collapse to a hairline and prove
the "≈2%" on their own → a payload slider drags 1500 → 50 and the share climbs to 34% (the
readout tweens cyan → amber). Then `costCompare` prices it: resending the frame vs topping it
up with redundant bytes, both rows sharing a left edge. Segment widths are signals lerped
between a readable schematic and the true ratio; byte counts fade themselves out as their
segment gets too narrow. Markers: `overhead`, `define`, `numbers`, `total`, `fields`,
`addresses`, `full`, `small`, `varies`, `price`, `cheaper`, `close`, `end`.
Run `npm run serve:budget` (or `task serve:budget`).

Part `[03_06]europe-map/` — сетевой уровень, планета → Европа (`src/scenes/europeMap.tsx`,
`src/geo/`), covers `07:35.1–…`, `audioOffset: -455.1`. **A different kind of animation from
the rest of the series:** an orthographic projection (`geo/projection.ts`) turns real
lon/lat into scene coordinates every frame, so "globe" and "map of Europe" are the same
object at different camera settings and the scene flies between them in one continuous move.
Camera = three signals (`lon`, `lat`, `radius`); every coastline, graticule line, backbone
arc and city dot binds its geometry to them. Far-side points are pushed past the limb rather
than dropped, so a `clip` circle cuts each ring exactly at the horizon and every polygon
stays one `Line` with a fixed point count.

Coastlines are generated data: `tools/build-land.js` turns Natural Earth 1:50m land (public
domain) into `src/geo/coastlines.ts` — Douglas-Peucker simplified, fine inside the European
viewport and coarse elsewhere, 103 rings / ~4.5k points. Regenerate rather than hand-edit.
`src/geo/places.ts` holds the real backbone: the FLAP core plus Moscow as tier-1 exchanges,
the two diverse Frankfurt→Mediterranean corridors, the Baltic and Scandinavian rings, and the
three separate ways traffic leaves Moscow (Scandinavia / Poland / Ukraine).

The route beats sit on the same map: `geo/routes.ts` enumerates **real simple paths** over
that link graph (no faked lines), `geo/routeLayer.tsx` flares 36 of them with a shrinking
gap so it reads as "and another, and another — too many", then contrasts the geographically
short route (dashed ghost, Moscow→Minsk→Warsaw→Berlin) with the one traffic actually takes
(orange, up through Scandinavia) and runs a packet along it. `geo/hud.tsx` holds the readouts
that sit over the map's empty corners: route counter → route legend, the three reason chips,
and the p99 latency strip. Markers: `world`, `fly`, `mesh`, `hubs`, `question`, `thousands`,
`uncountable`, `journey`, `shortest`, `cheapest`, `reason1..3`, `p99`, `end` (58 s total).
It runs in a **1400×970 panel** — the one scene that breaks the 960 column, because coastlines
and readouts have to survive a phone screen; the content sits under one `scale: 1.35` wrapper
so the composition is identical, just bigger. Run `npm run serve:map` (or `task serve:map`).

Part `[03_07]ip-header/` — сетевой уровень, заголовок IP и TTL (`src/scenes/ipPacket.tsx`,
components in `src/ip/`), covers `08:33.0–09:56.2`, `audioOffset: -513.0`. `headerBar` draws
the classic RFC 791 diagram (5 rows × 4 bytes, all 20 of them) and lights the fields the
narration names; `hopChain` runs the packet across routers while the header's shared `ttl`
signal counts down in place, kills it at zero, and then replays the same chain as traceroute's
answer — one number on screen, two meanings. Markers: `intro`, `twenty`, `version`, `length`,
`protocol`, `addresses`, `ttl`, `hops`, `dies`, `warning`, `why`, `trace`, `path`, `end`.
Run `npm run serve:ip`.

Part `[03_12]udp-model/` — UDP, границы сообщений (`src/scenes/boundaries.tsx`, components in
`src/boxes/`), covers `15:25.7–15:59.9`, `audioOffset: -925.7`. `datagramLane` sends whole
boxes across a lane — one, then three, then three of which one is lost — so "датаграмма
приходит целиком или не приходит вовсе" is shown rather than said; `impossibleRow` crosses
out the two cases UDP cannot produce (полтора сообщения, половина). Markers: `tease`,
`boundary`, `single`, `three`, `lost`, `glued`, `bookmark`, `whole`, `half`, `end`.
Run `npm run serve:udp`.

Part `[03_13]udp-header/` — UDP, устройство пакета (`src/scenes/udpPacket.tsx`, components in
`src/udp/`), covers `15:59.9–16:42.9`, `audioOffset: -959.9`. `udpHeader` starts as one block
that counts up to 8 байт and splits into its four two-byte fields; it then docks to the top so
`overheadStack` can put 26 : 20 : 8 on one scale (Ethernet, IP, UDP) and crown UDP, and
`portsPoint` finishes the thought — IP addresses a machine, the port addresses a process.
Markers: `how`, `eight`, `four`, `src`, `dst`, `rest`, `all`, `recall`, `eth`, `ip`, `udp`,
`cheapest`, `ports`, `process`, `only`, `end`. Run `npm run serve:udph`.

Part `[03_15]udp-not/` — UDP, чего он не делает (`src/scenes/notDoing.tsx`, components in
`src/not/`), covers `18:29.7–20:06.9`, `audioOffset: -1109.7`. `toggleRow` lists the four
guarantees and strikes each one out as he names it, then collapses the list into a strip along
the top that keeps saying which one is being explained. Below it a single `overflowPipe` plays
the same failure twice: first as the OS receive buffer (`СЕТЕВАЯ КАРТА → БУФЕР ОС →
ПРИЛОЖЕНИЕ`), then — relabelled, without moving — as a router queue (`ТВОЙ СОКЕТ → ОЧЕРЕДЬ
РОУТЕРА → СЕТЬ`) that a second, muted «ЧУЖОЙ ТРАФИК» stream drowns alongside yours. Refused
datagrams still make the whole trip and are turned away *at* the buffer, because that's where
the loss happens. Markers: `list`, `flow`, `cong`, `retry`, `order`, `whatflow`, `none`,
`drop`, `mech`, `notnet`, `second`, `anyrate`, `queues`, `others`, `anchor`, `end` (97.2 s).
Run `npm run serve:udpn`.

Part `[03_20]byte-stream/` — TCP, поток байтов против потока сообщений
(`src/scenes/byteStream.tsx`, components in `src/stream/`), covers `24:30.0–25:12.3`,
`audioOffset: -1470.0`. One bar carries the whole argument: the writes notch it from the **top**
(4 × 512 Б, fixed), the reads notch it from the **bottom** (signals, so «одним куском 2048» →
«4 по 512» → «300 / 1150 / 598» is one continuous re-cut), and the band between the notches is
never divided — that band *is* the stream. It opens as four «СООБЩЕНИЕ» compartments whose
seams dissolve, and closes with the liquid flowing and the read cuts re-rolling on forked
endless loops, so the tail never freezes. The UDP answer is shown as a green ghost row aligned
exactly under the writes. Markers: `claim`, `nowhere`, `writes`, `four`, `pour`, `one`,
`split4`, `any`, `never`, `noinfo`, `udp`, `tcp`, `poured`, `end` (42.3 s).
Run `npm run serve:stream`.

TCP part numbers continue the storyboard from `[03_18]`; the agreed set is `[03_20]`, `[03_21]`,
`[03_24]`, `[03_25]`, `[03_26]`, `[03_27]`, `[03_28]`, `[03_32]`.

Slots `[03_02]`, `[03_05]`, `[03_08]`–`[03_11]`, `[03_14]` and the unlisted TCP slots are
unused: part numbers follow the storyboard, not the build order, and those beats were scoped
and left unanimated.

**Watch out:**
- `blueprint`'s `track` token already carries its own alpha (`#0920348c`), so
  `withAlpha(colors.track, …)` produces an 8-digit-plus-alpha string and Motion Canvas throws
  `unknown format`. Use `colors.track` as-is.
- A widget mounted early but shown later must start with its **group** hidden, not just its
  animated parts. Static decoration (dashed lanes, rails) is easy to forget, and since
  `stage.add` stacks in call order it will draw over whatever was mounted before it.

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
- `part-one-preview/partOne` — `card`, `hint` (+ `end`; the `end` anchor also drives the exit,
  which composes the card's drift with the panel fade instead of calling `endScene`).
- `mac-address/macAddress` — `address`, `mac`, `bits`, `split`, `serial`, `vendor`, `brands`,
  `neighbour`, `segment` (+ `end`, which likewise drives the composed exit).
- `frame-budget/frameBudget` — `overhead`, `define`, `numbers`, `total`, `fields`, `addresses`,
  `full`, `small`, `varies`, `price`, `cheaper`, `close` (+ `end`).

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

**Framework:** `createStage(view, {width?, height?})` (theme-driven backdrop/scrim + centred
panel; pass a `height` below the canvas's 1080 when the scene should read as a free-standing
card with air above and below, instead of a band running to the top and bottom of the frame,
and a `width` above the default 960 column for a scene that has to be read in detail — see
`[03_06]europe-map`, which pairs a 1400×970 panel with a single `scale` wrapper so every
distance, stroke and font grows together),
`revealStage(stage, dur?)` (the shared opening fade — compose it with the first content:
`all(revealStage(stage), heading.appear(), …)` — pairs with `endScene`),
`endScene(stage)` (the shared `waitUntil('end')` + fade-out every scene closes with), `STAGE`,
`CARD_WIDTH`;
`counter(target, format?)` (number → counts up from 0; string → static like `'∞'`);
`formatThousands`; the `Widget` interface; and components `sceneTitle()`, `sceneCaption()`
(the mono top heading a scene keeps — `appear()` once, then `retitle()` to cross-fade its text
per beat; **use this instead of hand-rolling a `<Txt>` heading or a local `say()` helper**),
`sectionLabel()`
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
