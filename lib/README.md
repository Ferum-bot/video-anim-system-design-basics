# `@lib` — shared animation framework

The common components and scaffolding for every system-design video. `@lib` carries **no
palette of its own** — each video applies a **theme preset** (from `lib/themes/`) and the
components render in that style. Import the framework from `@lib`:

```ts
import {createStage, sceneTitle, specCard, banner, colors, counter} from '@lib';

export default makeScene2D(function* (view) {
  const stage = createStage(view);

  const title = sceneTitle({title: '…', subtitle: '…', accent: colors.blue});
  stage.add(title.node);
  yield* title.appear();
});
```

`colors.blue` above resolves to **whatever theme is active** (see Theming).

## Theming

`@lib` is a framework; the style is a `Theme` you apply.

- **`Theme` = `{ palette, fonts, stage }`** (`theme.ts`): a `ThemePalette` (surfaces, text, a
  `primary`, and the accent vocabulary `blue/cyan/green/red/purple/orange`), `ThemeFonts`
  (`display` for prose, `mono` for technical tokens), and a `StageStyle` (`fill`, `scrimAlpha`,
  `transparent`, optional `grid` + `footageSim`).
- **Presets** live in `lib/themes/` — `githubDark` (video 01), `blueprint` (video 02) —
  imported via `@lib/themes/<name>`.
- **Apply once per project.** Each video's `src/theme.ts` calls `applyTheme(preset)`, and
  `project.ts` imports `./theme` **first** (scenes read palette tokens at module top level, so
  the theme must be active before they evaluate).
- **`colors` / `fonts` are live proxies** over the active theme. Components use them freely;
  don't read them at *library* module top level (no theme applied yet).
- **Add a style:** write `lib/themes/<name>.ts` filling the three token groups, then
  `applyTheme(<name>)` from a video's `src/theme.ts`.

## What's inside

| Export | Purpose |
| --- | --- |
| `applyTheme(t)`, `activeTheme()`, `defineTheme(t)` | Register / read the active theme; `defineTheme` types a preset. |
| `Theme`, `ThemePalette`, `ThemeFonts`, `StageStyle` | The theme token contract presets fill. |
| `colors`, `fonts`, `withAlpha` | Live theme proxies (`colors.blue`, `fonts.mono`) + an alpha helper. |
| `createStage(view)`, `STAGE`, `CARD_WIDTH` | Theme-driven backdrop/scrim + a centred, clipped panel to mount into. |
| `endScene(stage)` | The shared scene ending: `yield* waitUntil('end')` then fade the panel out. Every scene closes with `yield* endScene(stage)`. |
| `counter(target, format?)` | A number that counts up (or a fixed string like `'∞'`). |
| `formatThousands(n)` | `1234567` → `"1,234,567"`. |
| `Widget` | `{ node, appear() }` — every animated piece follows this shape. |
| `sceneTitle(...)` | Title + subtitle + accent rule. |
| `sectionLabel(text)` | The muted top caption. `appear()` fades it in; `retitle(text)` cross-fades it per beat. |
| `specCard(...)` | Headline card: icon, name/tag, spec, optional counting price, meter bar. Pass `icon` to override the default glyph (e.g. `redisIcon()`). |
| `redisIcon()`, `postgresIcon()`, `podIcon()`, `kafkaIcon()` | Tech-logo tiles for a card's icon slot (devicon SVG: Redis, PostgreSQL, Kubernetes, Kafka). Add more in `components/icons.tsx`. |
| `banner(...)` | Full-width takeaway line that closes a scene. |
| `backdrop()` | Solid dark plate that fades in behind content (export-only; readability over footage). Uses `theme.stage`. |
| `latencyBand(...)` | Two nodes joined by a link with an endless pulse whose travel time conveys the latency. |

## Conventions

- **Widgets** return `{ node, appear() }`. Mount `node` with `stage.add(...)`, then
  `yield* widget.appear()` when it should animate in.
- **One accent per concept** — reuse `colors.*` consistently so scenes feel related.
- **Theme tokens only** — no literal hex or font strings; use `colors`, `fonts`, `withAlpha`.
- Scenes render into a centred **960-wide** column; the host composites narration
  alongside in the final video.

## Wiring (already done by `task new`)

Each video project points at this folder via a `@lib` alias. The cross-root Vite
wiring (alias, JSX runtime, repo-root access) lives once in `lib/vite.ts`, so every
`vite.config.ts` is just `export default defineVideoProject(import.meta.url)`. The
`tsconfig.json` keeps the `@lib` paths and excludes `../lib/vite.ts` (build tooling).
Theme presets import as `@lib/themes/<name>` through the same `@lib/*` alias — no extra wiring.
The `task new name=…` scaffold sets all of this up automatically.
