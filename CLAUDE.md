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

Part `[03_21]handshake/` — TCP, память сети и тройное рукопожатие (`src/scenes/handshake.tsx`,
components in `src/handshake/`), covers `25:16.0–26:32.0`, `audioOffset: -1516.0`. Three
movements share one frame: `netMemory` drops packet #1 into a router's buffer, lets #2 and #3
overtake it and shows it arriving last — «ВОССТАЛ ИЗ МЁРТВЫХ», the motif first named at `10:43`;
`threeWay` draws the SYN / SYN+ACK / ACK sequence diagram and then **steps up** to make room for
its own 2×2 ledger (each side must announce its count and see it acknowledged), so «двух шагов
мало» is a cell going red and «четыре избыточно» is a ghost arrow with nothing left to fill;
`isnPanel` closes with the initial number — a timer-based one the attacker predicts exactly,
then a pseudo-random one that keeps re-rolling on a forked endless loop. `runningNote` is the
scene-level commentary line, kept outside the widgets because it outlives all three. Markers:
`why`, `memory`, `stuck`, `later`, `tell`, `zombie`, `solve`, `hand`, `syn`, `synack`, `ack`,
`three`, `why3`, `two`, `four`, `isn`, `guess`, `random`, `end` (76 s).
Run `npm run serve:hand`.

Part `[03_24]head-of-line/` — TCP, блокировка головой очереди и «ACK ≠ приложение получило»
(`src/scenes/headOfLine.tsx`, components in `src/hol/`), covers `28:07.0–29:20.5`,
`audioOffset: -1687.0`. One belt does both halves: `holBelt` runs segments 1–4 straight through
`СЕТЬ → БУФЕР ОС → ПРИЛОЖЕНИЕ`, loses №5 on the way, then parks 6–10 behind its dashed red hole
— left to right the queue reads 10 9 8 7 6 [5] because the head of the queue is the end nearest
the door, which stays shut. The crates turn green («целые, уже здесь») while the door stays red,
and the app keeps pulsing on a forked endless loop. The same picture then answers the caveat:
an ACK token leaves the buffer back towards the network while the door never opens. Markers:
`wait`, `lost5`, `arrived`, `none`, `buffer`, `ready`, `order`, `blocked`, `name`, `price`,
`later`, `caveat`, `ack`, `notapp`, `depends`, `end` (73.5 s). Run `npm run serve:hol`.

Part `[03_25]sliding-window/` — TCP, скользящее окно (`src/scenes/slidingWindow.tsx`,
components in `src/win/`), covers `29:21.0–30:11.0`, `audioOffset: -1761.0`. Deliberately the
same apparatus as `[03_15]`'s `overflowPipe`, so the contrast lands: it opens as the UDP
failure (буфер до краёв, отвергнутые пакеты краснеют у самого буфера и сыплются мимо), then
`calm()` drains it and the receiver starts advertising. Everything hangs off **one** signal —
`level`, насколько буфер занят: из него считаются высота зелёной полосы «СВОБОДНО», число в
чипе «ОКНО N КБ» на обратной дорожке и период отправителя, поэтому «окно сжимается и
раскрывается» — это буквально одно `breathe()` на форкнутом бесконечном цикле, за которым сам
собой следует темп. Markers: `flow`, `udp`, `drop`, `not`, `tell`, `window`, `limit`, `drown`,
`resize`, `slowest`, `end` (49.8 s). Run `npm run serve:win`.

Part `[03_26]congestion/` — TCP, контроль перегрузки (`src/scenes/congestion.tsx`, components in
`src/cong/`), covers `30:11.0–32:12.5`, `audioOffset: -1811.0` — самая длинная часть серии
(121.5 s), три карточки подряд. `guardRows`: управление потоком бережёт получателя, контроль
перегрузки — саму сеть (+ чип «1988 · Ван Джекобсон»). `whyLoss`: два способа потерять пакет
рядом — по проводу помехи его почти не убивают, значит он умер в переполненной очереди.
`sawGraph`: график **рисует сам себя** — ломаная строится в коде (медленный старт по экспоненте,
дальше зубья «разгон до потолка → сброс вдвое»), доли длины считаются по `Math.hypot`, и по ним
же и тянется `Line.end`, и всплывают красные крестики потерь; потом та же пила уходит в сетку
24 плиток, где точки каждой ломаной пересчитываются от одного сигнала `phase` — один форкнутый
цикл двигает все чужие соединения сразу. Markers: `cong`, `shared`, `alg`, `signal`, `wire`,
`queue`, `slow`, `start`, `ramp`, `aimd`, `half`, `saw`, `cycle`, `fair`, `thousand`, `nodisp`,
`billions`, `stands`, `end`. Run `npm run serve:cong`.

Part `[03_27]two-armies/` — TCP, разрыв соединения и проблема двух армий
(`src/scenes/twoArmies.tsx`, components in `src/armies/`), covers `32:13.0–32:57.3`,
`audioOffset: -1933.0`. **Секцию FIN / 2×MSL / TIME_WAIT автор решил не анимировать** — часть
заканчивается на «доказуемо не существует протокола». `messengerLadder` — лестница
подтверждений, где каждый следующий ряд мельче и бледнее предыдущего (`rowScale`/`rowAlpha`),
так что «и так до бесконечности» именно нарисовано; два гонца по дороге получают красный крест.
Markers: `close`, `cant`, `unsolvable`, `armies`, `messenger`, `lost1`, `lost2`, `forever`,
`proven`, `end` (44.3 s). Run `npm run serve:armies`.

Part `[03_28]tcp-header/` — TCP, заголовок в 20 байт и ядро (`src/scenes/tcpHeader.tsx`,
components in `src/hdr/`), covers `33:24.5–34:31.0`, `audioOffset: -2004.5`. `headerBytes`
кладёт 8 байт UDP и 20 байт TCP на одну линейку (38 px/байт) и подсвечивает группы полей ровно
на их названиях, а под баром копится список того, что на эти байты куплено — «каждая группа
полей — это гарантии, отлитые в байты». `kernelStacks` — два одинаковых стека по краям, между
ними чужая инфраструктура: на «поменять TCP» оба ядра становятся янтарными, на «молиться»
проступают пять коробок со знаками вопроса. Markers: `how`, `twenty`, `ports`, `seq`, `flags`,
`window`, `groups`, `kernel`, `waits`, `change`, `pray`, `end` (66.5 s).
Run `npm run serve:tcph`.

Part `[03_32]udp-vs-tcp/` — сравнительная таблица (`src/scenes/udpVsTcp.tsx`, components in
`src/table/`), covers `38:12.9–38:46.9`, `audioOffset: -2292.9`. Содержимое строк задал автор
(9 строк × 2 колонки). Пустой каркас появляется сразу — он обещает форму, — а строки прилетают
по одной ровно на своих названиях и подсвечиваются; на «эту таблицу ты видишь на экране»
подсветка снимается и таблица стоит целиком; «характер» подсвечивает последнюю строку, а потом
её ячейки по очереди. Markers: `table`, `compare`, `model`, `conn`, `deliver`, `order`,
`flowcong`, `header`, `state`, `spec`, `onscreen`, `char`, `udpchar`, `tcpchar`, `end` (34 s).
Run `npm run serve:table`.

TCP part numbers continue the storyboard from `[03_18]`; the agreed set is `[03_20]`, `[03_21]`,
`[03_24]`, `[03_25]`, `[03_26]`, `[03_27]`, `[03_28]`, `[03_32]`. `runningNote` (the
scene-level commentary line) is copied per part alongside its widgets.

**Watch out:** a nested `map` inside JSX (`rows.map(r => cols.map(c => <Rect/>))`) mounts
nothing — Motion Canvas does not flatten nested child arrays. Use `flatMap`.

### Секция QUIC

Кандидаты секции пронумерованы в `docs/`-разборе 1–13; номер папки — `[03_(32+N)]`. Собраны
четыре: 3 → `[03_35]`, 8 → `[03_40]`, 10 → `[03_42]`, 13 → `[03_45]`.

Part `[03_35]quic-streams/` — потоки и закрытие head-of-line (`src/scenes/quicStreams.tsx`,
components in `src/streams/`), covers `39:34.5–40:32.6`, `audioOffset: -2374.5`. `streamLanes` —
это тройная лента из `[03_24]`: одна большая труба расходится на три полосы, каждая едет своим
форкнутым циклом, и на «потерялся пакет из потока 1» сцена просто **`cancel`-ит задачу первой
полосы** — она встаёт там, где её застала дырка, а ящики за ней аккуратно паркуются в очередь;
полосы 2 и 3 продолжают ехать. Дальше `pageGrid` показывает практику: 24 объекта страницы,
через один TCP всё встаёт на восьмом, через QUIC догружается всё, кроме одного. Markers: `how`,
`streams`, `many`, `each`, `lost`, `others`, `solves`, `page`, `oneTcp`, `mux`, `end` (58.1 s).
Run `npm run serve:qstreams`.

Part `[03_40]quic-timeline/` — путь протокола наоборот (`src/scenes/quicTimeline.tsx`,
components in `src/tl/`), covers `42:46.8–43:53.0`, `audioOffset: -2566.8`. Сверху обычный
порядок «стандарт → код» перечёркивается, снизу остаётся «код → стандарт»; дальше на оси
появляются четыре вехи, у третьей выезжает гребёнка из 35 засечек (по одной за итерацию, шесть
секунд — ровно чтобы не было провала до следующей реплики), у четвёртой — свита документов.
**Года первого эксперимента на экране нет:** в озвучке звучит «2020», но арифметика («6 лет в
IETF» + «RFC 9000 в 2021») сходится только для 2013 — карточка подписана «ЭКСПЕРИМЕНТ» без
даты. Markers: `notstd`, `exp`, `code`, `half`, `billions`, `ietf`, `draft35`, `rfc`, `editors`,
`end` (66.2 s). Run `npm run serve:qtl`.

Part `[03_42]quic-libs/` — QUIC живёт в библиотеке, а не в ядре (`src/scenes/quicLibs.tsx`,
components in `src/libs/`), covers `44:35.0–44:59.5`, `audioOffset: -2675.0`. Прямое
продолжение `[03_28]`: там, чтобы поменять TCP, надо было менять оба ядра, здесь в ядре
«QUIC» просто перечёркивается, а реализация приезжает в твой процесс. Закрывает плашка
«TCP — ОБНОВИ ЯДРА ПЛАНЕТЫ · QUIC — ОБНОВИ ДЕПЛОЙ». Markers: `where`, `notkernel`, `libs`,
`names`, `bring`, `flags`, `end` (24.5 s). Run `npm run serve:qlibs`.

Part `[03_45]quic-numbers/` — миф «просто быстрый TCP» против цифр
(`src/scenes/quicNumbers.tsx`, components in `src/num/`), covers `46:46.5–47:58.5`,
`audioOffset: -2806.5`. `speedChart` считает обе кривые формулой (`tcpAt`/`quicAt`), поэтому
точка расхождения на ~600 Мбит/с и «до −45%» на правом краю — не нарисованы на глаз, а следуют
из констант `SPLIT` / `TOP` / `RATIO`; разрыв заливается многоугольником между кривыми.
Дальше `userspaceCost` объясняет причину: слева ядро отдаёт наверх крупные пачки, справа —
лавину мелких пакетов поштучно, обе стороны на форкнутом бесконечном цикле. Цифры совпадают с
работой «QUIC is not Quick Enough over Fast Internet» (WWW 2024). Markers: `numbers`, `study`,
`fast`, `lose45`, `six00`, `gap`, `browsers`, `bitrate`, `why`, `flood`, `userspace`, `forty`,
`end` (72 s). Run `npm run serve:qnum`.

Slots `[03_02]`, `[03_05]`, `[03_08]`–`[03_11]`, `[03_14]` and the unlisted TCP/QUIC slots are
unused: part numbers follow the storyboard, not the build order, and those beats were scoped
and left unanimated.

**Watch out:**
- `blueprint`'s `track` token already carries its own alpha (`#0920348c`), so
  `withAlpha(colors.track, …)` produces an 8-digit-plus-alpha string and Motion Canvas throws
  `unknown format`. Use `colors.track` as-is.
- A widget mounted early but shown later must start with its **group** hidden, not just its
  animated parts. Static decoration (dashed lanes, rails) is easy to forget, and since
  `stage.add` stacks in call order it will draw over whatever was mounted before it.

## Video «Прикладной уровень» (video 04) — parts

Третья часть серии по сетям (HTTP / DNS / gRPC / WebSocket и что такое протокол вообще).
Keeps the `blueprint` theme. Narration is the **already-edited** mix `~/Movies/CapCut/0822.WAV`
(17:47), so scene timecodes equal final-video timecodes. Transcript + the animation plan
reconciled against the pre-production script live in `docs/`
([video-04-application.md](docs/video-04-application.md),
[video-04-animation-plan.md](docs/video-04-animation-plan.md); the raw ASR output is
`docs/video-04-application.srt`). **Нумерация:** в кадре автор называет это «третьим видео
серии» — счёт по папкам сдвинут превью `[02_00]`, так что серия 3 = video 04.

Part `[04_01]previous-parts/` — интро, превью двух предыдущих частей (`src/scenes/previousParts.tsx`,
components in `src/series/`), covers `00:00–00:28.9`, `audioOffset: 0`. `seriesCard` — превьюшка
видео в блюпринт-рамке с угловыми засечками и подписью под ней. **Заголовка у сцены нет,**
и карточки стоят **стопкой, а не в ряд**: в колонке 960 это единственный способ дать превьюшке
читаемый размер (620 против 388 бок о бок), а панель в 1010 закрывает кадр почти целиком, без
пустых полей сверху и снизу. Первая карточка приезжает одна, **геройская, во всю ширину**
(`enter: {y, scale: 1.35}`), на «во втором видео» `dock()` ужимает её до слотовой ширины и уводит
в верхний слот; вторая ждёт `SLOT_HANDOVER`, иначе они пересекаются посреди проезда. На
«обязательно посмотри их» карточки загораются по очереди, и **соседка на это время притухает**
(`dim`/`undim`) — прожектор читается там, где одиночная вспышка теряется. На «ссылка появится
здесь» выезжает `hintChip` (скопирован из `[03_01]`), и стопка на `CHIP_LIFT` поднимается ему
навстречу — без этого кадр без чипа, а он живёт 22 секунды из 29, оказывается нижнетяжёлым.
Обе карточки с чипом форкают `pulse()` на одном кадре и общем `PULSE_HALF` из
`src/series/pulse.ts`, поэтому дышат в такт; `idle()` перед этим обязательно `cancel`-ится —
оба цикла крутят `glow`. **Раскладка считается от габарита с засечками**, а не от края
картинки: уголок торчит за карточку на 13 единиц, и по краю картинки сверху выходит меньше
воздуха, чем снизу. Превьюшки лежат в
`src/assets/*.jpg` (сконвертированы из webp — `env.d.ts` знает `.jpg`, но не `.webp`).
Markers: `series1`, `series2`, `watch`, `link`, `end`.
Run `npm run serve:prev` (or `task serve:prev`).

Part `[04_02]protocols-around/` — «протоколы вокруг тебя» (`src/scenes/protocolsAround.tsx`,
components in `src/around/`), covers `00:29.6–00:57.9`, `audioOffset: -29.6`. Два виджета делят
кадр последовательно. `liveMonitor`: четыре имени встают в верхний ряд, а узел «ЭТО ВИДЕО»
появляется **вместе с ними** вполсилы — пустота между ними не дыра, а обещанное место под
провода. На «работают как минимум три из них» HTTP и DNS спускаются к узлу и расходятся, TLS
приезжает третьим, незанятые gRPC и WEBSOCKET остаются наверху и притухают, а по трём
пунктирным проводам к узлу идут пакеты на форкнутых бесконечных циклах с разными периодами —
«работают прямо сейчас» едет по экрану, а не написано словами. **TLS в озвучке не назван**
(сказано только «три из них»): это вставка редактора, зато фактически верная и заранее
сажающая мысль с `16:59` про три уровня OSI. `layerStack` — зерно лестницы, которую часть 3
развернёт целиком: пять подписанных плит (`ПРИКЛАДНОЙ · ТРАНСПОРТНЫЙ · СЕТЕВОЙ · КАНАЛЬНЫЙ ·
ФИЗИЧЕСКИЙ`), верхняя загорается и получает бейдж «ПОЛЕЗНАЯ РАБОТА». **Имена стоят сразу,
хотя в озвучке этажи здесь не перечисляются** — зритель знает их из первых двух видео, а без
подписей нижние плиты читаются как незаполненные заготовки; часть 3 на `01:55` добавит к
именам не название, а работу («физический двигает биты, канальный чинит кадры…»). Четыре
нижние берутся в одну скобку, которая получает две подписи подряд — «ДВА ПРЕДЫДУЩИХ ВИДЕО» → «ТРАНСПОРТ + ГАРАНТИИ
ДОСТАВКИ». Скобка висит слева и тянет композицию за собой, поэтому на её появлении стопка
сдвигается на `SHIFT_X` вправо и поднимается на `LIFT`. Markers: `known`, `names`, `now`,
`start`, `only`, `useful`, `before`, `delivery`, `end`.
Run `npm run serve:around` (or `task serve:around`).

Part `[04_03]delivery-only/` — «всё ниже прикладного только доставляет»
(`src/scenes/deliveryOnly.tsx`, components in `src/floors/`), covers `01:42.1–03:00.8`,
`audioOffset: -102.1`. Прямое продолжение `[04_02]`: та же пятиэтажка возвращается и наконец
получает содержание. **Правый слот каждой плиты держит три содержания подряд** — что этаж
делает → сколько от этого полезной работы → одно слово «ДОСТАВКА»; слот не меняет габарит,
поэтому композиция центрирована на всех состояниях. Четыре схемы в `jobs.tsx` (`bitsOnWire`,
`frameRepair`, `pathHops`, `toProcess`) крутятся на форкнутых бесконечных циклах, и именно
поэтому «ПОЛЕЗНОЙ РАБОТЫ 0» рядом с зелёным «НЕЗАМЕНИМ» читается как приговор работающему
механизму. `payload` роняет страницу, сообщение Kafka и платёж **сквозь всю стопку** — они не
цепляются ни за один нижний этаж и гаснут внизу, а на «полезная работа начинается именно тут»
взлетают обратно и садятся на верхнюю плиту. Финал: у нижних чип «ЧУЖОЕ · ГОТОВОЕ» встаёт на
то же место, где был «НЕЗАМЕНИМ» (строка читается как «было → стало»), у транспортного
остаётся единственный живой контрол «TCP · UDP · QUIC», а в слоте верхней плиты — пустое поле
с мигающим курсором. Markers: `claim`, `below`, `phys`, `link`, `net`, `transport`,
`guarantees`, `vital`, `none`, `justmove`, `page`, `kafka`, `payment`, `here`, `yours`,
`limits`, `three`, `otherside`, `only`, `create`, `end` (78 s).
Run `npm run serve:floors` (or `task serve:floors`).

Part `[04_04]how-many/` — служебные протоколы и масштаб (`src/scenes/howMany.tsx`,
components in `src/many/`), covers `03:00.8–04:26.0`, `audioOffset: -180.8`. `appRoom`
раскрывает прикладной этаж в комнату с двумя полками — «ДЛЯ ПРИЛОЖЕНИЙ» и «СЛУЖЕБНЫЕ». Весь
смысл в направлении стрелок: во всём видео они идут вниз по лифту, а здесь HTTP и ПОЧТА
тянутся к DNS **горизонтально, не покидая этаж**, и только получив ответ уходят вниз. На
«без него не работает ни веб, ни почта» DNS гаснет — и вместе с ним краснеют обе стрелки и
оба жильца. `protocolField` даёт масштаб: перечёркнутый «единый список», пустая бирка с
мигающим курсором (та же, что закрывала `[04_03]`), два счётчика через `counter()` и поле
из 820 безымянных точек, которое сыплется пачками с **сужающимся зазором** — «их слишком
много, чтобы считать». Из этого же поля всплывают семь имён, GraphQL и gRPC получают скобку
«ПОВЕРХ HTTP», и всё становится полкой эпизодов. Холодный переход с «что такое протокол на
самом деле» **автор решил не анимировать** — часть заканчивается на полке. Markers: `catch`,
`notonly`, `system`, `dns`, `serves`, `dead`, `howmany`, `nolist`, `own`, `rfc`, `rfcnum`,
`iana`, `iananum`, `variety`, `handful`, `http`, `graphql`, `grpc`, `dnschip`, `ws`,
`webrtc`, `each`, `end` (85.2 s). Run `npm run serve:many` (or `task serve:many`).

Part `[04_05]protocol-passport/` — что такое протокол (`src/scenes/protocolDefined.tsx`,
components in `src/passport/`), covers `04:48.9–06:35.5`, `audioOffset: -288.9`. Определение
сворачивается в три слова, и слова **не гаснут, а поднимаются наверх и становятся шапкой**
карточки — определение буквально превращается в форму. `protocolPassport` (в `@lib`, см. ниже)
раскрывается пустым и подписанным, потом ячейки объясняют, что в них вообще пишут, и только
затем получают значения HTTP. На «только что мы описали HTTP» ложится штамп, на «в рамках
этого шаблона» карточка отъезжает и за ней проступает `deck` — шесть таких же пустых. Стопка
уходит веером вправо-вверх и тянет композицию за собой, поэтому карточка со стопкой сдвигается
на `DECK_SHIFT` влево. Markers: `agreement`, `word`, `nottech`, `three`, `format`, `order`,
`actions`, `threewords`, `four`, `useful`, `types`, `syntax`, `semantics`, `rules`, `http`,
`htypes`, `hsyntax`, `hsemantics`, `hrules`, `stamp`, `template`, `everyvideo`, `recap`, `end`
(106.6 s). Run `npm run serve:passport` (or `task serve:passport`).

**Watch out:** `Counter.text` из `@lib` — это `SignalValue<string>`: у числового счётчика
функция, у статического строка. Интерполировать его в шаблон напрямую нельзя — в кадр уедет
исходник функции; резолвить через `typeof text === 'function' ? text() : text`.

**Watch out:** `Line` со скруглённым `lineCap` рисует точку даже при `end={0}` — виджет,
который «ещё не появился», надо гасить `opacity`, а не только нулевой длиной.

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
`postgresIcon()`, `podIcon()` (Kubernetes), `kafkaIcon()`; `protocolChip()` + the `CHIP`
size constant (a protocol name as a pill — fixed width whatever the name, so rows lay out
arithmetically; the season reuses it in every video), `protocolPassport()` + `PASSPORT`
(четыре ячейки — типы / синтаксис / семантика / правила, — на которые раскладывается любой
прикладной протокол; ячейка знает два состояния, «что сюда пишут» и «что здесь у этого
протокола», плюс `name()` и `stamp()`. Форма на весь сезон: её предстоит инстанцировать
ещё шесть раз). See `lib/README.md`.

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
- **Центровка — измерять, а не смотреть.** Снять кадр кнопкой-камерой в редакторе (ложится в
  `output/still/project/NNNNNN.png`) и прогнать
  `python3 tools/check-centering.py <кадр.png>`: он найдёт панель по альфе и напечатает поля
  с четырёх сторон. Гонять на каждом ключевом бите сцены — перекос обычно вылезает там, где
  часть композиции появляется только на отдельных битах (чип, подпись), и на финальном кадре
  его не видно.
- **Scene names** in the editor come from the **filename**. To rename a scene, `git mv` the
  `.tsx` and delete the orphaned `.meta` file.
