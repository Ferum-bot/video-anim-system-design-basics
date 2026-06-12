# CLAUDE.md

Guidance for working in this repo. Keep it accurate — update it when conventions change.

## What this is

A **Motion Canvas** animation series for system-design YouTube videos. Each video is
its own Vite project folder. A shared toolkit at `lib/` (imported as `@lib`) gives
every video one visual language.

## Repository layout

- `lib/` — shared `@lib` toolkit (theme, stage, animated components). Reused by all
  videos. Full API in `lib/README.md`.
- `[NN]<slug>/` — one Vite project per video (e.g. `[01]you-not-need-sharding/`).
  Folder names contain brackets → **quote paths in the shell**: `vite '[01]…'`.
  - `src/project.ts` — registers scenes via the `?scene` import suffix.
  - `src/scenes/[NN]<topic>/*.tsx` — the scenes.
- `example/` — reference scene (an HTTP-request topology; good Line/Circle/packet example).
- `Taskfile.yml` — task runner. `task new name=…` scaffolds a new video already wired to `@lib`.
- `tsconfig.base.json` — shared strict TS config (`jsxImportSource: @motion-canvas/2d`).

## Video `[01]you-not-need-sharding`

Argues a single modern machine is usually enough. Scenes (play in order) under
`src/scenes/[01]hardware/`:
- `compute.tsx` — EC2 instances (m6i / x1e / u-24tb) + "8 small servers = 1 big, same price".
- `storage.tsx` — SSD / HDD / S3 capacity.
- `network.tsx` — bandwidth cards + a latency topology where pulses travel at a speed ∝ latency.

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

`createStage(view)`, `STAGE`, `CARD_WIDTH`; `colors`, `fonts`, `withAlpha`;
`counter(target, format?)` (number → counts up from 0; string → static like `'∞'`);
`formatThousands`; the `Widget` interface; and components `sceneTitle()`, `specCard()`,
`banner()`. See `lib/README.md`.

## Cross-root JSX wiring (don't break this)

`lib/` lives **outside** each project's Vite `root`, so each project's `vite.config.ts`
must keep: `esbuild: { jsx: 'automatic', jsxImportSource: '@motion-canvas/2d' }`,
`resolve.alias['@lib']`, and `server.fs.allow: [repoRoot]`. Its `tsconfig.json` must keep
the `@lib` paths and `include: ["src", "../lib"]`. Without these, JSX inside `@lib` won't
transform. `task new` writes all of this for new videos.

## Working & verifying

- **Dev editor:** `task serve:sharding` (or `task serve NAME='[01]you-not-need-sharding'`)
  → http://localhost:9000. **Restart it after editing `vite.config.ts`** (alias/esbuild
  changes aren't hot-reloaded).
- **Typecheck:** `npx tsc --noEmit -p '[01]you-not-need-sharding/tsconfig.json'` (also
  covers `../lib`).
- **Build = best headless check.** `npm run build:01` follows imports across the repo root,
  so it catches `@lib` resolution / cross-root JSX errors without a browser. Use it to
  verify when the preview/browser tools aren't available.
- **Scene names** in the editor come from the **filename**. To rename a scene, `git mv` the
  `.tsx` and delete the orphaned `.meta` file.
