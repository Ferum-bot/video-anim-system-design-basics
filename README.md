# System Design Animations

Анимации для YouTube-серии по system design. Каждое видео — отдельная папка,
общие зависимости в корне проекта.


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
├── Taskfile.yml          ← все команды запуска
├── package.json          ← зависимости + npm-скрипты (авто-обновляются)
├── tsconfig.base.json    ← общий TypeScript конфиг
├── node_modules/
│
├── example/              ← пример: HTTP-запросы к серверу
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── src/
│       ├── project.ts    ← регистрирует сцены видео
│       └── scenes/
│           └── httpRequests.tsx
│
└── video-02/             ← следующее видео (та же структура)
    └── ...
```

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

Создаётся папка `video-02/` со всеми боilerplate-файлами и стартовой сценой-заглушкой.
Скрипты `serve:video-02` и `build:video-02` добавляются в `package.json` автоматически.

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

**3. Анатомия сцены** — минимальный шаблон:

```tsx
import {makeScene2D, Rect} from '@motion-canvas/2d';
import {createRef, waitFor} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  view.fill('#0f1117');          // фон

  const box = createRef<Rect>(); // ссылка на элемент

  view.add(
    <Rect ref={box} width={200} height={200} fill={'#3d5afe'} radius={12} />,
  );

  yield* box().scale(0, 1);      // анимировать свойство за 1 сек
  yield* waitFor(0.5);           // пауза
});
```

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
