# `@lib` — shared animation toolkit

One visual language for every system-design video. Import everything from `@lib`:

```ts
import {createStage, sceneTitle, specCard, banner, colors, counter} from '@lib';

export default makeScene2D(function* (view) {
  const stage = createStage(view);

  const title = sceneTitle({title: '…', subtitle: '…', accent: colors.blue});
  stage.add(title.node);
  yield* title.appear();
});
```

## What's inside

| Export | Purpose |
| --- | --- |
| `colors`, `fonts`, `withAlpha` | Theme tokens (GitHub-dark palette) and an alpha helper. |
| `createStage(view)`, `STAGE`, `CARD_WIDTH` | Fill the view and get a centred, clipped panel to mount into. |
| `endScene(stage)` | The shared scene ending: `yield* waitUntil('end')` then fade the panel out. Every scene closes with `yield* endScene(stage)`. |
| `counter(target, format?)` | A number that counts up (or a fixed string like `'∞'`). |
| `formatThousands(n)` | `1234567` → `"1,234,567"`. |
| `Widget` | `{ node, appear() }` — every animated piece follows this shape. |
| `sceneTitle(...)` | Title + subtitle + accent rule. |
| `sectionLabel(text)` | The muted top caption. `appear()` fades it in; `retitle(text)` cross-fades it per beat. |
| `specCard(...)` | Headline card: icon, name/tag, spec, optional counting price, meter bar. Pass `icon` to override the default glyph (e.g. `redisIcon()`). |
| `redisIcon()`, `postgresIcon()`, `podIcon()`, `kafkaIcon()` | Tech-logo tiles for a card's icon slot (devicon SVG: Redis, PostgreSQL, Kubernetes, Kafka). Add more in `components/icons.tsx`. |
| `banner(...)` | Full-width takeaway line that closes a scene. |
| `backdrop()` | Solid dark panel that fades in behind content (export-only; readability over light footage). |
| `latencyBand(...)` | Two nodes joined by a link with an endless pulse whose travel time conveys the latency. |

## Conventions

- **Widgets** return `{ node, appear() }`. Mount `node` with `stage.add(...)`, then
  `yield* widget.appear()` when it should animate in.
- **One accent per concept** — reuse `colors.*` consistently so scenes feel related.
- Scenes render into a centred **960-wide** column; the host composites narration
  alongside in the final video.

## Wiring (already done by `task new`)

Each video project points at this folder via a `@lib` alias. The cross-root Vite
wiring (alias, JSX runtime, repo-root access) lives once in `lib/vite.ts`, so every
`vite.config.ts` is just `export default defineVideoProject(import.meta.url)`. The
`tsconfig.json` keeps the `@lib` paths and excludes `../lib/vite.ts` (build tooling).
The `task new name=…` scaffold sets all of this up automatically.
