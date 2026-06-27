# System Design Animations

Анимации для YouTube-серии по system design на [Motion Canvas](https://motioncanvas.io/).
Каждое видео — отдельный Vite-проект (папка), а общая библиотека анимаций `lib/`
(импортируется как `@lib`) задаёт **единый визуальный язык** для всех видео.

> **Формат сцен.** Контент рендерится в центрированную колонку шириной **960px**
> (полный кадр 1920×1080). Вторую половину кадра занимает рассказчик/talking-head —
> композиция собирается на монтаже. Поэтому сцены центрированы, а не на всю ширину.

---

## Зависимости

### Node.js ≥ 20

```bash
brew install node   # macOS
node -v             # проверить
```

### Task (task-runner)

```bash
brew install go-task
task --version      # проверить
```

### FFmpeg (для экспорта в MP4)

```bash
brew install ffmpeg
ffmpeg -version     # проверить
```

---

## Установка

```bash
git clone <repo-url>
cd video-anim-system-design-basics
task install
```

---

## Структура проекта

```
video-anim-system-design-basics/
├── Taskfile.yml              ← все команды запуска
├── package.json              ← зависимости + npm-скрипты (авто-обновляются)
├── tsconfig.base.json        ← общий TypeScript конфиг
├── node_modules/
│
├── lib/                      ← общая библиотека анимаций (импорт как @lib)
│   ├── theme.ts              ← colors, fonts, withAlpha()
│   ├── stage.tsx             ← createStage(view), STAGE, CARD_WIDTH
│   ├── counter.ts            ← counter() — анимированное число / статика
│   ├── format.ts             ← formatThousands()
│   ├── widget.ts             ← interface Widget { node, appear() }
│   ├── components/           ← SceneTitle, SpecCard, Banner
│   ├── index.ts              ← barrel-экспорт
│   └── README.md             ← документация API библиотеки
│
├── example/                  ← пример: HTTP-запросы к серверу
│   └── src/scenes/httpRequests.tsx
│
└── [01]you-not-need-sharding/    ← первое видео
    ├── vite.config.ts        ← root + alias @lib + esbuild JSX
    ├── tsconfig.json
    └── src/
        ├── project.ts        ← регистрирует сцены (импорт с суффиксом ?scene)
        └── scenes/[01]hardware/
            ├── compute.tsx   ← вычислительные инстансы EC2
            ├── storage.tsx   ← SSD / HDD / S3
            └── network.tsx   ← пропускная способность + топология задержек
```

> Имена папок видео содержат скобки (`[01]…`) — **в шелле такие пути нужно
> заключать в кавычки**: `vite '[01]you-not-need-sharding'`.

---

## Общая библиотека `@lib`

Чтобы все видео выглядели в одном стиле, переиспользуемые компоненты и утилиты
вынесены в `lib/` и импортируются из `@lib`. Полная документация — в
[`lib/README.md`](lib/README.md).

| Экспорт | Назначение |
|---|---|
| `colors`, `fonts`, `withAlpha` | Палитра (GitHub-dark), шрифт и помощник для прозрачности. |
| `createStage(view)`, `STAGE`, `CARD_WIDTH` | Заливает фон и возвращает центрированную панель 960px. |
| `counter(target, format?)` | Число, считающееся от 0 (или статичная строка вроде `'∞'`). |
| `formatThousands(n)` | `1234567` → `"1,234,567"`. |
| `Widget` | `{ node, appear() }` — контракт любого анимируемого блока. |
| `sceneTitle(...)` | Заголовок + подзаголовок + акцентная линия. |
| `specCard(...)` | Карточка: иконка, имя/тег, спека, опц. цена со счётчиком, бар. |
| `banner(...)` | Финальная строка-вывод во всю ширину. |

**Контракт `Widget`.** Анимируемые блоки возвращают `{ node, appear() }`: сцена
монтирует `node` через `stage.add(...)`, затем `yield* widget.appear()` запускает
появление.

Подключение к видео (alias `@lib` в `vite.config.ts` и `tsconfig.json`, плюс глобальный
esbuild JSX-runtime для файлов вне root проекта) настраивается автоматически командой
`task new`.

---

## Команды

| Команда | Что делает |
|---|---|
| `task install` | Установить зависимости |
| `task serve` | Открыть редактор для `example` |
| `task serve NAME=video-02` | Открыть редактор для `video-02` |
| `task build NAME=video-02` | Собрать продакшн-бандл |
| `task new NAME=video-02` | Создать новую анимацию с нуля |
| `task --list` | Показать все команды |

Для первого видео есть готовые ярлыки: `task serve:sharding` и `task build:sharding`
(эквивалент `task serve NAME='[01]you-not-need-sharding'`).

---

## Запуск редактора

```bash
task serve               # открывает example
task serve NAME=video-02 # открывает video-02
```

Редактор доступен по адресу **http://localhost:9000**

### Что можно делать в редакторе

- **Прокручивать** анимацию по таймлайну
- **Просматривать** каждый кадр
- **Настраивать** разрешение и FPS (иконка шестерёнки → Video Settings)
- **Рендерить** анимацию в PNG-кадры (кнопка рендера справа сверху)

---

## Создание новой анимации

Одна команда создаёт всю необходимую структуру файлов:

```bash
task new NAME=video-02
```

Создаётся папка `video-02/` со всеми boilerplate-файлами, уже подключённой `@lib`
и стартовой сценой-заглушкой. Скрипты `serve:video-02` и `build:video-02`
добавляются в `package.json` автоматически.

### Что дальше

**1. Открыть редактор и убедиться что заглушка работает:**

```bash
task serve NAME=video-02
```

**2. Отредактировать стартовую сцену** `video-02/src/scenes/intro.tsx`
или создать новые сцены рядом и зарегистрировать их в `video-02/src/project.ts`:

```ts
import {makeProject} from '@motion-canvas/core';
import intro    from './scenes/intro?scene';
import overview from './scenes/overview?scene';

export default makeProject({
  scenes: [intro, overview],  // воспроизводятся по порядку
});
```

**3. Анатомия сцены** — типичный шаблон на `@lib`:

```tsx
import {makeScene2D} from '@motion-canvas/2d';
import {waitFor} from '@motion-canvas/core';
import {banner, colors, createStage, sceneTitle, specCard} from '@lib';

export default makeScene2D(function* (view) {
  const stage = createStage(view);          // фон + центрированная панель 960px

  const title = sceneTitle({
    title: 'Заголовок', subtitle: 'Подзаголовок', accent: colors.blue,
  });
  stage.add(title.node);
  yield* title.appear();                     // Widget: mount node → appear()

  const card = specCard({
    name: 'm6i.32xlarge', tag: 'General Purpose', spec: '128 vCPU',
    accent: colors.blue, y: -200,
    meter: {label: 'Память', fill: 0.32, value: 512, format: v => `${v} GiB`},
    cost: {value: 6144, prefix: '$'},        // опционально — счётчик цены
  });
  stage.add(card.node);
  yield* card.appear();
  yield* waitFor(0.5);

  const outro = banner({text: 'Вывод сцены', accent: colors.blue, y: 320});
  stage.add(outro.node);
  yield* outro.appear();
});
```

> Низкоуровневый Motion Canvas (`Rect`, `Circle`, `Line`, `createRef`, `yield* …`)
> по-прежнему доступен — `@lib` лишь даёт готовые блоки поверх него. Пример сцены
> с нуля без библиотеки см. в `example/src/scenes/httpRequests.tsx`.

---

## Экспорт в MP4

### Шаг 1 — Настроить параметры в редакторе

Нажать иконку шестерёнки (Video Settings):

| Параметр | Рекомендация для YouTube |
|---|---|
| Resolution | 1920×1080 (FHD) или 2560×1440 (2K) |
| Frame rate | 60 fps |
| Color space | sRGB |

### Шаг 2 — Отрендерить кадры

Нажать кнопку **Render** (стрелка вправо, правый верхний угол).

Кадры сохранятся в:
```
<папка-видео>/output/<имя-проекта>/   ← 0000000.png, 0000001.png, ...
```

### Шаг 3 — Собрать MP4 через FFmpeg

```bash
# Из корня репозитория, заменить example на имя своей папки

# Высокое качество H.264 — для YouTube (рекомендуется)
ffmpeg -framerate 60 -i example/output/example/%07d.png \
  -c:v libx264 -crf 16 -preset slow \
  -pix_fmt yuv420p -movflags +faststart \
  example/output/example.mp4

# Если fps был 30
ffmpeg -framerate 30 -i example/output/example/%07d.png \
  -c:v libx264 -crf 16 -preset slow \
  -pix_fmt yuv420p -movflags +faststart \
  example/output/example.mp4
```

> **`-crf`**: качество от 0 (лучшее) до 51 (худшее). 16–18 — практически без потерь для YouTube.

### Прозрачный оверлей для CapCut (рекомендуемый пайплайн)

Анимации монтируются как **прозрачный слой поверх видео** — фон не перекрывает кадр.

1. В `lib/stage.tsx` выставь `export const TRANSPARENT = true;` перед рендером
   (после — верни `false`, чтобы в редакторе снова был тёмный фон для работы).
2. Отрендери кадры в редакторе (кнопка **Render**) — PNG с альфа-каналом.
3. Собери компактный `.mov` с прозрачностью одной командой (HEVC + альфа,
   видеотулбокс — файл в ~60-90× меньше ProRes):
   ```bash
   task mov SRC='output/project' OUT=anim.mov
   # FPS по умолчанию 60; для 30: task mov SRC=… OUT=… FPS=30
   # качество альфы: task mov SRC=… OUT=… ALPHAQ=0.7
   ```
   Под капотом:
   ```bash
   ffmpeg -framerate 60 -i '<кадры>/%06d.png' \
     -c:v hevc_videotoolbox -alpha_quality 0.9 -pix_fmt bgra -tag:v hvc1 anim.mov
   ```
4. Перетащи `.mov` в CapCut поверх своего видео — фон прозрачный, позиционируй как нужно.

> **Если CapCut не подхватит прозрачность из HEVC** — собери запасной ProRes 4444
> (lossless, но ~4-5 ГБ): `task mov:prores SRC='output/project' OUT=anim.mov`.

> **Синхронизация под озвучку.** Сцены тайминятся маркерами (time events): между битами
> стоят `waitUntil('…')`, которые на таймлайне редактора перетаскиваются под голос.
> Чтобы видеть волну озвучки, подключи аудио в `makeProject({ scenes, audio })`
> (экспортни дорожку из CapCut и вытащи `ffmpeg -i export.mp4 -vn narration.wav`).

### Альтернатива: ProRes для монтажа

Если анимация будет монтироваться в Final Cut или Premiere:

```bash
ffmpeg -framerate 60 -i example/output/example/%07d.png \
  -c:v prores_ks -profile:v 3 \
  example/output/example.mov
```

---

## Полезные ссылки

- [Motion Canvas — документация](https://motioncanvas.io/docs/)
- [Motion Canvas — API Reference](https://motioncanvas.io/api/)
- [Список всех компонентов 2D](https://motioncanvas.io/api/2d/components/)
