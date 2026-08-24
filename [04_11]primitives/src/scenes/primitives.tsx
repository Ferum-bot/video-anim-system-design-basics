import {Line, Node, Rect, Txt, makeScene2D} from '@motion-canvas/2d';
import {
  all,
  cancel,
  createRef,
  delay,
  easeInOutCubic,
  easeOutCubic,
  range,
  waitUntil,
} from '@motion-canvas/core';
import {colors, createStage, fonts, revealStage, withAlpha} from '@lib';
import {BTN, PRIMITIVES, btnX, callRail, fileHandle, primitiveRow, socketPanel} from '../prim';

// Восемь примитивов и асимметрия клиента и сервера. Кадр держат две неподвижные вещи —
// плита «ТВОЙ КОД» сверху и полоса ядра снизу; между ними ровно один ряд кнопок, и всё
// остальное происходит в двух полосах над ним и под ним.
const STAGE_HEIGHT = 860;

const PLATE = {width: 400, height: 76, radius: 12} as const;
const PLATE_Y = -332;
const BAND = {width: 838, height: 76, radius: 12} as const;
const BAND_Y = 300;

const ROW_Y = 0;
// Ряд отъезжает вниз под панель вызова и вверх под плитку дескриптора: кадр раздвигается
// под то, что сейчас объясняют, а не держит половину пустой.
const ROW_DOWN = 110;
const ROW_UP = -130;
const PANEL_Y = -155;
const HANDLE_Y = 112;

const RAIL_UP = -112;
const RAIL_DOWN = 112;
// Чипы ролей стоят **за** дугами рельс: дуга поднимается на 46, поэтому 166 её задевало.
const ROLE_UP_Y = -212;
const ROLE_DOWN_Y = 212;

// Скобка «всё, что между»: от нижней кромки плиты до верхней кромки полосы.
const BRACKET_X = 436;
const BRACKET_TOP = PLATE_Y + PLATE.height / 2;
const BRACKET_BOTTOM = BAND_Y - BAND.height / 2;
const BRACKET_CAP = 16;

const NOTE_Y = 366;

// Имена примитивов звучат неравномерно — это смещения от «socket» в секундах.
const NAME_BEATS = [0, 0.58, 1.32, 2.1, 2.78, 3.68, 4.24, 4.64];

const SERVER_VISITS = [0, 1, 2, 3, 5, 6, 7]; // всё, кроме connect
const CLIENT_VISITS = [0, 4, 5, 6, 7]; // socket, connect и методы записи

const FADE_OUT = 0.9;

export default makeScene2D(function* (view) {
  const stage = createStage(view, {height: STAGE_HEIGHT});
  stage.opacity(0);

  const row = primitiveRow({y: ROW_Y});
  const panel = socketPanel({
    y: PANEL_Y,
    anchorX: btnX(0),
    anchorY: () => row.centerY() - BTN.height / 2,
  });
  const handle = fileHandle({
    y: HANDLE_Y,
    anchorX: btnX(3),
    anchorY: () => row.centerY() + BTN.height / 2,
  });
  const serverRail = callRail({
    side: -1,
    y: RAIL_UP,
    visits: SERVER_VISITS,
    labelY: ROLE_UP_Y,
    accent: colors.orange,
  });
  const clientRail = callRail({
    side: 1,
    y: RAIL_DOWN,
    visits: CLIENT_VISITS,
    labelY: ROLE_DOWN_Y,
    accent: colors.green,
  });

  // Ряд зажигается сам, по мере того как по рельсам едут точки.
  row.follow(serverRail.stops, serverRail.progress);
  row.follow(clientRail.stops, clientRail.progress);

  const plate = createRef<Rect>();
  const plateText = createRef<Txt>();
  const band = createRef<Rect>();
  const bandText = createRef<Txt>();
  const brackets = range(2).map(() => createRef<Line>());
  const note = createRef<Txt>();

  stage.add(
    <Node>
      <Rect ref={plate} y={PLATE_Y} width={PLATE.width} height={PLATE.height}
        radius={PLATE.radius} fill={colors.track} stroke={withAlpha(colors.cyan, 0.6)}
        lineWidth={1.6} opacity={0}>
        <Txt ref={plateText} text="ТВОЙ КОД" fill={withAlpha(colors.text, 0.95)}
          fontSize={21} fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.6}/>
      </Rect>

      <Rect ref={band} y={BAND_Y} width={BAND.width} height={BAND.height} radius={BAND.radius}
        fill={colors.track} stroke={withAlpha(colors.border, 0.9)} lineWidth={1.4}
        opacity={0}>
        <Txt ref={bandText} text="ЯДРО · ТРАНСПОРТ · СЕТЬ · ЖЕЛЕЗО" fill={colors.textMuted}
          fontSize={17} fontFamily={fonts.mono} letterSpacing={1.5}/>
      </Rect>

      {[-1, 1].map((side, index) => (
        <Line ref={brackets[index]}
          points={[
            [side * (BRACKET_X - BRACKET_CAP), BRACKET_TOP],
            [side * BRACKET_X, BRACKET_TOP],
            [side * BRACKET_X, BRACKET_BOTTOM],
            [side * (BRACKET_X - BRACKET_CAP), BRACKET_BOTTOM],
          ]}
          stroke={withAlpha(colors.cyan, 0.55)} lineWidth={1.6} end={0}/>
      ))}

      <Txt ref={note} y={NOTE_Y} text="" fill={colors.textDim} fontSize={19}
        fontFamily={fonts.mono} letterSpacing={1.4} opacity={0}/>
    </Node>,
  );

  stage.add(panel.node);
  stage.add(handle.node);
  stage.add(serverRail.node);
  stage.add(clientRail.node);
  stage.add(row.node);

  /** Комментарий под кадром — живёт через несколько битов. Пустая строка гасит его. */
  function* remark(text: string) {
    if (note().opacity() > 0) yield* note().opacity(0, 0.2);
    if (!text) return;
    note().text(text);
    yield* note().opacity(1, 0.35, easeOutCubic);
  }

  // ── Ряд ────────────────────────────────────────────────────────────────────
  // «Как вообще выглядит интерфейс сокета?»
  yield* waitUntil('how');
  yield* all(
    revealStage(stage),
    plate().opacity(1, 0.7, easeOutCubic),
    delay(0.15, band().opacity(1, 0.7, easeOutCubic)),
  );

  // «Это всего лишь 8 примитивов» — сначала видно, что гнёзд ровно восемь.
  yield* waitUntil('many');
  yield* row.outline();

  // «Socket, Bind, Listen, Accept, Connect, Send, Receive и Close» — каждое имя встаёт
  // ровно на своём слове, а слова звучат неравномерно.
  yield* waitUntil('eight');
  yield* all(...NAME_BEATS.map((offset, index) => delay(offset, row.fill(index))));

  // «Всего 8 методов между твоим кодом и всем, что мы разбирали два видео подряд»
  yield* waitUntil('between');
  yield* all(
    ...brackets.map(item => item().end(1, 1.1, easeOutCubic)),
    remark('ВОСЕМЬ СЛОВ — И БОЛЬШЕ НИЧЕГО'),
  );
  yield* relabel(bandText, 'ВСЁ, ЧТО МЫ РАЗБИРАЛИ ДВА ВИДЕО ПОДРЯД');

  // ── Первый примитив ────────────────────────────────────────────────────────
  // «Посмотрим самый первый примитив — socket. Это и есть та самая оговорка»
  yield* waitUntil('first');
  yield* all(
    ...brackets.map(item => item().opacity(0.45, 0.6, easeInOutCubic)),
    row.moveTo(ROW_DOWN),
    row.light(0),
    delay(0.35, panel.appear()),
    remark('ТА САМАЯ ОГОВОРКА'),
  );

  // «Ты знаешь тип услуги: поток надёжных байтов либо отдельные сообщения без гарантий»
  yield* waitUntil('service');
  yield* panel.toggle();

  // «Абстракция скрыла механику, но выбор гарантии оставила тебе»
  yield* waitUntil('choice');
  yield* all(panel.flip(), remark('СКРЫЛА МЕХАНИКУ · ОСТАВИЛА ВЫБОР'));

  // «И это прям самые первые строчки стандарта»
  yield* waitUntil('standard');
  yield* panel.stamp('ПЕРВЫЕ СТРОЧКИ СТАНДАРТА');

  // «Accept возвращает файловый дескриптор, дальше обычные read и write, как с файлом» —
  // из кнопки выезжает та же плитка, что родилась в `[04_09]`.
  yield* waitUntil('accept');
  yield* all(
    panel.dismiss(),
    row.moveTo(ROW_UP),
    row.light(0, 0),
    row.light(3),
    remark(''),
  );
  yield* handle.appear();
  yield* handle.highlight();

  // «Сеть притворяется файлом до самого конца»
  yield* waitUntil('pretends');
  yield* remark('СЕТЬ ПРИТВОРЯЕТСЯ ФАЙЛОМ ДО САМОГО КОНЦА');

  // ── Асимметрия ─────────────────────────────────────────────────────────────
  // «Одно важное наблюдение: асимметрия клиента и сервера видна прямо в этом API»
  yield* waitUntil('observation');
  yield* all(
    handle.dismiss(),
    row.moveTo(ROW_Y),
    row.unlight(),
    remark('АСИММЕТРИЯ ВИДНА ПРЯМО В API'),
  );

  // «Серверу нужны bind, чтобы занять порт, listen, чтобы слушать, и accept»
  yield* waitUntil('server');
  yield* serverRail.appear('СЕРВЕР');
  yield* serverRail.stepTo(0, 0.5);
  yield* serverRail.stepTo(1, 0.5);
  yield* serverRail.stepTo(2, 1.3);
  yield* serverRail.stepTo(3, 1.6);
  yield* serverRail.stepTo(7, 2.2);
  yield* serverRail.settle();

  // «Клиенту по сути нужен только connect, ну и методы для записи» — та же рельса,
  // но над bind, listen и accept она проходит дугой.
  yield* waitUntil('client');
  yield* clientRail.appear('КЛИЕНТ');
  yield* clientRail.stepTo(0, 0.5);
  yield* clientRail.stepTo(4, 1.0);
  yield* clientRail.stepTo(7, 2.2);
  yield* clientRail.settle();

  // «Клиент и сервер — это не какие-то волшебные свойства машин»: обе роли уезжают
  // в одну и ту же плиту.
  yield* waitUntil('notmagic');
  yield* all(
    serverRail.liftLabel(0, PLATE_Y),
    clientRail.liftLabel(0, PLATE_Y),
    delay(0.45, relabel(plateText, 'ОДНА И ТА ЖЕ ПРОГРАММА')),
    remark('НЕ СВОЙСТВО МАШИНЫ — ПОРЯДОК ВЫЗОВОВ'),
  );

  // «Одна и та же программа может быть и тем и тем, смотря что она вызывает»
  yield* waitUntil('sameprogram');
  const asServer = yield serverRail.run(3.4);
  const asClient = yield clientRail.run(2.6);
  yield* remark('СМОТРЯ ЧТО ОНА ВЫЗЫВАЕТ');

  yield* waitUntil('end');
  cancel(asServer);
  cancel(asClient);
  yield* stage.opacity(0, FADE_OUT, easeInOutCubic);
});

/** Плита и полоса подписываются по разу за часть — обе через один и тот же кроссфейд. */
function* relabel(ref: ReturnType<typeof createRef<Txt>>, text: string) {
  yield* ref().opacity(0, 0.22);
  ref().text(text);
  yield* ref().opacity(1, 0.32, easeOutCubic);
}
