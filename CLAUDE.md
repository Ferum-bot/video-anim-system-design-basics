# video-anim-system-design-basics

Motion-canvas animations for a YouTube system design series.
Each video gets its own subfolder. Shared `node_modules` and `package.json` at the root.

## Environment

Node.js is installed via Homebrew but **not in the default shell PATH**.
Always prefix npm/npx commands with:
```bash
export PATH="/opt/homebrew/bin:$PATH"
```

## Project structure

```
video-anim-system-design-basics/
  package.json          ← shared deps + per-video scripts
  tsconfig.base.json    ← shared TS config, extended by each video
  node_modules/
  example/              ← video folder (HTTP connections demo)
    vite.config.ts
    tsconfig.json       ← extends ../tsconfig.base.json
    src/
      project.ts        ← registers scenes for this video
      env.d.ts          ← type decl for ?scene virtual imports
      project.meta      ← must have "name" field (used as chunk name)
      scenes/
        httpRequests.tsx
  video-02/             ← future video (same structure as example/)
    ...
```

## Dev workflow

```bash
task serve                  # редактор для example
task serve NAME=video-02    # редактор для video-02
task build NAME=video-02    # продакшн сборка
task new NAME=video-02      # создать новую анимацию
task install                # npm install
```

Adding a new video:
```bash
task new NAME=video-02
```
Автоматически создаёт все файлы и добавляет скрипты в `package.json`.

## vite.config.ts template (copy into each new video folder)

```ts
import {defineConfig} from 'vite';
import {createRequire} from 'module';
import {dirname} from 'path';
import {fileURLToPath} from 'url';

const require = createRequire(import.meta.url);
const motionCanvas = require('@motion-canvas/vite-plugin').default as any;

const dir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: dir,
  plugins: [
    motionCanvas({project: `${dir}/src/project.ts`}),
  ],
});
```

## tsconfig.json template (copy into each new video folder)

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "paths": {
      "@motion-canvas/2d/jsx-runtime": [
        "../node_modules/@motion-canvas/2d/lib/jsx-runtime"
      ]
    }
  },
  "include": ["src"]
}
```

## Known quirks & workarounds

### `vite.config.ts` — три обязательных хака
1. **CJS plugin** — `@motion-canvas/vite-plugin` — CommonJS-only, импортировать через `createRequire`.
2. **root: dir** — без явного `root` vite берёт `process.cwd()` (корень проекта), и rollup не находит `./src/project.ts` внутри подпапки.
3. **Абсолютный путь в `project:`** — плагин по умолчанию передаёт `'./src/project.ts'` rollup'у как относительный путь; нужно передать абсолютный через `import.meta.url`.

### `project.meta` — обязательное поле `"name"`
Без `"name"` плагин использует абсолютный путь файла как имя rollup-чанка → ошибка сборки.
Всегда ставить `"name": "<папка-видео>"`.

### `tsconfig.json` — paths для JSX runtime
`@motion-canvas/2d` не экспортирует `jsx-runtime` из корня пакета.
Путь указан в `tsconfig.base.json`, в подпапках переопределяется с `../node_modules/...`.

### `env.d.ts` — тип для `?scene`
Vite virtual imports (`?scene`) требуют ручного объявления типа.
Использовать `FullSceneDescription` (не `Scene`) из `@motion-canvas/core`.

### `@motion-canvas/ui` — обязательный peer dep
Нужен даже без прямого импорта — vite-plugin подгружает его при инициализации.

## Installed packages (devDependencies)

| Package | Version |
|---|---|
| `@motion-canvas/core` | ^3.17.2 |
| `@motion-canvas/2d` | ^3.17.2 |
| `@motion-canvas/vite-plugin` | ^3.17.2 |
| `@motion-canvas/ui` | ^3.17.2 |
| `vite` | ^5.4.21 |
| `typescript` | ^5.5.3 |

## Taskfile quirks

- Переменные в task — **uppercase**: `task new NAME=video-02`, не `name=video-02`
- Любая строка в `cmds:` содержащая `": "` (двоеточие + пробел) — YAML парсит как mapping.
  Такие команды **всегда** оборачивать в блок `|`.
- Аналогично для строк с `{` в начале значения — тоже `|`-блок.

## Animation conventions

- Background: `#0f1117`
- Font: `JetBrains Mono, monospace`
- Цветовая палитра — константа `const C = {...}` в начале каждого файла сцены
- Вход элементов: `easeOutElastic`, движение: `easeInOutCubic`
- Packet-dots: `Circle` size 18, `shadowColor` + `shadowBlur: 12`
- Временные объекты (пакеты) добавляются как дочерние `Node`, удаляются после анимации
- Параллелизм: `all()`, последовательность: `chain()`, stagger: `sequence()`
