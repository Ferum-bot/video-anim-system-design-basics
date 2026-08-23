import {Node, Txt, makeScene2D} from '@motion-canvas/2d';
import {all, cancel, createRef, easeInOutCubic, easeOutCubic, waitUntil} from '@motion-canvas/core';
import {colors, createStage, fonts, revealStage} from '@lib';
import {appPlate, envelopeRun, seamMarks, territory, videoChips} from '../door';

// Сокет как единственный стык, который разработчик трогает руками, и граница владения,
// которая по нему проходит. Кадр держат две строки — секционная сверху и комментарий снизу;
// они стоят на месте всю часть, поэтому композиция симметрична на каждом бите, что бы ни
// происходило в середине.
const STAGE_HEIGHT = 860;

const PLATE = {width: 380, height: 84, radius: 10} as const;
const SIDE_W = 300; // разъехавшись, плиты сужаются: между ними должен пройти конверт
const TOP_Y = -208; // верхняя плита — прикладной уровень
const SEAM_Y = -156; // стык прикладного и транспортного: тут и будет дверь
const FLOOR_Y = [-104, 0, 104, 208];
const SLAB_Y = 52;
const SLAB_H = 396;
const WIRE_Y = 120; // по нему конверт едет через чужую территорию
const DOOR_Y = TOP_Y + PLATE.height / 2; // уровень проёма в нижней кромке плиты

// Зазоры между четырьмя нижними плитами: именно они оказываются пачками стыков.
const GAP_Y = [-52, 52, 156];
const MARKS_Y = -300;

const SIDE_X = 270; // куда разъезжаются отправитель и получатель
const NEAR_X = -SIDE_X;

// Третье движение: те же две плиты и та же плита-территория, только другого габарита.
const VIEW = {x: 230, y: -165, width: 320, height: 96} as const;
const BITS_Y = 0; // между подписью канала и машинерией внутри него

const CAPTION_Y = -352;
const UPPER_Y = -300;
const NOTE_Y = 352;
const CHIPS_Y = 253;
const CHIPS_CAPTION_Y = 200;

const FADE_OUT = 0.9;

export default makeScene2D(function* (view) {
  const stage = createStage(view, {height: STAGE_HEIGHT});
  stage.opacity(0);

  const floors = territory({
    floorY: FLOOR_Y,
    plateWidth: PLATE.width,
    plateHeight: PLATE.height,
    radius: PLATE.radius,
    slabY: SLAB_Y,
    slabHeight: SLAB_H,
    wireY: WIRE_Y,
  });
  const near = appPlate({x: 0, y: TOP_Y, label: 'ТВОЁ ПРИЛОЖЕНИЕ'});
  const far = appPlate({x: SIDE_X, y: TOP_Y, label: 'ЕГО ПРИЛОЖЕНИЕ', width: SIDE_W});
  const marks = seamMarks({gapY: GAP_Y, width: PLATE.width, chipY: MARKS_Y});
  // Конверт: из двери вниз, через чужую территорию и вверх в дверь получателя.
  const letter = envelopeRun({
    kind: 'letter',
    // Конверт рождается **в проёме** и там же заканчивает путь: «донесут до дверей».
    points: [[NEAR_X, DOOR_Y], [NEAR_X, WIRE_Y], [SIDE_X, WIRE_Y], [SIDE_X, DOOR_Y]],
  });
  // Биты в канале — та же ломаная, только уже между двумя дверями третьего движения.
  const bits = envelopeRun({
    kind: 'bit',
    points: [[-VIEW.x, VIEW.y + VIEW.height / 2], [-VIEW.x, BITS_Y], [VIEW.x, BITS_Y],
      [VIEW.x, VIEW.y + VIEW.height / 2]],
  });
  const videos = videoChips({y: CHIPS_Y, captionY: CHIPS_CAPTION_Y});

  const caption = createRef<Txt>();
  const upper = createRef<Txt>();
  const note = createRef<Txt>();

  stage.add(floors.node);
  stage.add(marks.node);
  stage.add(near.node);
  stage.add(far.node);
  stage.add(letter.node);
  stage.add(bits.node);
  stage.add(videos.node);
  stage.add(
    <Node>
      <Txt ref={caption} y={CAPTION_Y} text="" fill={colors.textMuted} fontSize={16}
        fontFamily={fonts.mono} letterSpacing={1.8} opacity={0}/>
      <Txt ref={upper} y={UPPER_Y} text="" fill={colors.cyan} fontSize={17}
        fontFamily={fonts.mono} fontWeight={500} letterSpacing={1.4} opacity={0}/>
      <Txt ref={note} y={NOTE_Y} text="" fill={colors.textDim} fontSize={19}
        fontFamily={fonts.mono} letterSpacing={1.4} opacity={0}/>
    </Node>,
  );

  /** Секционная строка сверху: меняется только на границах движений. */
  function* section(text: string) {
    if (caption().opacity() > 0) yield* caption().opacity(0, 0.22);
    caption().text(text);
    yield* caption().opacity(1, 0.35, easeOutCubic);
  }

  /** Комментарий под кадром. Пустая строка гасит его. */
  function* remark(text: string) {
    if (note().opacity() > 0) yield* note().opacity(0, 0.2);
    if (!text) return;
    note().text(text);
    yield* note().opacity(1, 0.35, easeOutCubic);
  }

  /** Строка над стопкой: чем ты владеешь и что за канал тебе дали. */
  function* above(text: string) {
    if (upper().opacity() > 0) yield* upper().opacity(0, 0.2);
    if (!text) return;
    upper().text(text);
    yield* upper().opacity(1, 0.35, easeOutCubic);
  }

  // ── Единственный стык, который трогаешь руками ─────────────────────────────
  // «Сокет — это тот самый интерфейс между прикладным и транспортным уровнем»
  yield* waitUntil('iface');
  yield* all(revealStage(stage), near.appear(), floors.appear(), section('ЧТО ТЫ ТРОГАЕШЬ РУКАМИ'));

  // «…ставший кодом и воплотившийся в операционном ядре»
  yield* waitUntil('code');
  yield* all(near.openDoor(), remark('ИНТЕРФЕЙС, СТАВШИЙ КОДОМ'));

  // «Во всём стеке десятки уровней, десятки интерфейсов» — стопка показывает все свои стыки.
  yield* waitUntil('dozens');
  yield* all(marks.swarm(), remark('ПЯТЬ ЭТАЖЕЙ — ЭТО СХЕМА. НА ДЕЛЕ ИХ ДЕСЯТКИ'));

  // «…но этот единственный, который ты трогаешь руками»
  yield* waitUntil('onlyone');
  yield* all(marks.lock(), near.handle(), remark('ЕДИНСТВЕННЫЙ, КОТОРЫЙ ТРОГАЕШЬ РУКАМИ'));

  // «Всё, что ниже, — территория ядра и железок на сетевом пути»: этажи перестают быть
  // этажами и становятся одной чужой землёй во весь кадр.
  yield* waitUntil('kernel');
  yield* all(marks.dismiss(), floors.fuse(), remark('ВСЁ, ЧТО НИЖЕ — ЧУЖОЕ'));
  yield* all(floors.label('ТЕРРИТОРИЯ ЯДРА И ЖЕЛЕЗОК НА СЕТЕВОМ ПУТИ'), floors.infra());

  // ── Граница владения ───────────────────────────────────────────────────────
  // «[Приложение] вытаскивает сообщение за дверь и дальше полагается на транспорт»
  yield* waitUntil('push');
  yield* all(
    near.moveTo(NEAR_X, TOP_Y, SIDE_W, PLATE.height),
    remark('ВЫТАЩИЛ ЗА ДВЕРЬ — ДАЛЬШЕ НЕ ТЫ'),
  );
  yield* letter.send(0.34, 1.5);

  // «Оно донесёт сообщение до дверей принимающего»
  yield* waitUntil('deliver');
  yield* all(far.appear(), far.light(0.55), remark('ДОНЕСУТ ДО ДВЕРЕЙ ПРИНИМАЮЩЕГО'));
  yield* all(far.openDoor(), letter.send(1, 2.4));

  // «Тут очень важно понимать границу владения»
  yield* waitUntil('ownership');
  yield* all(
    section('ГРАНИЦА ВЛАДЕНИЯ'),
    near.light(0.5),
    far.light(0.4),
    floors.boundary('НИЖЕ УЖЕ НЕ ТЫ'),
    remark(''),
  );

  // «По свою сторону двери ты контролируешь абсолютно всё. Это и есть прикладной уровень»
  yield* waitUntil('yours');
  yield* all(
    near.light(1),
    above('ФОРМАТ · ЛОГИКА · КТО КОГДА ГОВОРИТ'),
    remark('ПО СВОЮ СТОРОНУ — ВСЁ'),
  );

  // «По ту сторону почти ничего: выбор транспортного протокола и пара параметров»
  yield* waitUntil('theirs');
  yield* all(floors.control(), remark('ПО ТУ СТОРОНУ — ОДИН ВЫБОР'));

  // «Остальным полностью управляет операционная система и сетевой стек на всём пути»
  yield* waitUntil('os');
  yield* all(
    floors.label('ОПЕРАЦИОННАЯ СИСТЕМА И СЕТЕВОЙ СТЕК НА ВСЁМ ПУТИ'),
    remark('ОСТАЛЬНЫМ УПРАВЛЯЕШЬ НЕ ТЫ'),
  );

  // ── Что видишь ты ──────────────────────────────────────────────────────────
  // «Для пользователя это всё выглядит так» — чужая территория схлопывается в то
  // единственное, что от неё тебе видно.
  yield* waitUntil('looks');
  yield* all(
    section('ЧТО ВИДИШЬ ТЫ'),
    above(''),
    letter.dismiss(),
    near.moveTo(-VIEW.x, VIEW.y, VIEW.width, VIEW.height),
    far.moveTo(VIEW.x, VIEW.y, VIEW.width, VIEW.height),
    far.light(1),
    floors.collapse(),
  );

  // «Соединение — это по сути надёжный или ненадёжный байтовый канал»
  yield* waitUntil('channel');
  yield* all(above('НАДЁЖНЫЙ ИЛИ НЕНАДЁЖНЫЙ'), remark('СОЕДИНЕНИЕ — ЭТО КАНАЛ'));

  // «Биты входят с одного конца и волшебным образом появляются на другом»
  yield* waitUntil('magic');
  const stream = yield bits.run(2.2);
  yield* remark('ВОЛШЕБНЫМ ОБРАЗОМ');

  // «Таймеры, повторы, подтверждения — всё это скрыто»: канал на полторы секунды
  // становится прозрачным, и внутри видно то, что он прячет.
  yield* waitUntil('hidden');
  const gears = yield floors.machinery();
  yield* all(floors.xray(), remark('ТАЙМЕРЫ · ПОВТОРЫ · ПОДТВЕРЖДЕНИЯ'));

  // «Если ты уже смотрел видео про транспортный уровень и про основы сетей…»
  yield* waitUntil('videos');
  yield* all(videos.appear(), remark(''));

  // «…мы там подробно разбирали все особенности и проблемы нижележащих уровней»
  yield* waitUntil('problems');
  yield* all(videos.light(), remark('ТАМ ЖЕ — ВСЕ ПРОБЛЕМЫ НИЖНИХ УРОВНЕЙ'));

  yield* waitUntil('end');
  cancel(stream);
  cancel(gears);
  yield* stage.opacity(0, FADE_OUT, easeInOutCubic);
});
