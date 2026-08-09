import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  delay,
  easeInOutCubic,
  easeOutCubic,
  range,
  waitFor,
} from '@motion-canvas/core';
import type {Reference, SimpleSignal, ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// Сеть → буфер ОС → приложение, одной лентой. Сегмент №5 теряется по дороге, шестой—десятый
// приезжают целыми и встают за его пустым местом: дверь в приложение не откроется, пока дырка
// не закроется. Та же картинка потом отвечает на «ACK — это не „приложение получило“».
const NET = {x: -382, width: 140, height: 104, radius: 12} as const;
const APP = {x: 376, width: 148, height: 104, radius: 12} as const;
const FRAME = {x: -10, width: 520, height: 150, radius: 14} as const;
const SLOT = {width: 74, height: 74, radius: 10, step: 82} as const;
const DOOR_X = 272;
const BELT_Y = 0;
const FRAME_LABEL_Y = -100;
const CHIP_Y = -142;
const STATUS_Y = 104;
const ACK_Y = 140;
const NOTE_ROW_Y = 206;

const IN = 0.7;
const RIDE = 2.1; // сеть → приложение
const LIGHT = 0.5;
const PULSE_HALF = 0.9;

const QUEUED = [10, 9, 8, 7, 6]; // слева направо: последний приехавший дальше всех от двери
const DEPENDS = ['ОС', 'ЯЗЫК', 'БИБЛИОТЕКА'];

/** Slot centres inside the buffer frame; the last one is the hole left by segment 5. */
const slotX = (index: number) => FRAME.x + (index - 2.5) * SLOT.step;
const HOLE = slotX(5);

export interface HolBelt extends Widget {
  /** Сегменты 1–4 спокойно проезжают в приложение. */
  send(): ThreadGenerator;
  /** Пятый теряется по дороге. */
  lose(): ThreadGenerator;
  /** Шестой—десятый приезжают и встают в очередь. */
  fill(): ThreadGenerator;
  /** Дверь закрыта: приложение не получит ни одного. */
  block(): ThreadGenerator;
  /** Подсветить рамку буфера. */
  spotBuffer(): ThreadGenerator;
  /** «Они все лежат готовые, целые» — ящики зеленеют. */
  intact(): ThreadGenerator;
  /** «Но порядок есть порядок» — дырка пульсирует. */
  orderRules(): ThreadGenerator;
  /** Endless: приложение ждёт — **fork** it. */
  waiting(): ThreadGenerator;
  /** У происходящего есть имя. */
  name(): ThreadGenerator;
  /** ACK уходит обратно в сеть — байты доехали до машины. */
  ackBack(): ThreadGenerator;
  /** …но приложение их ещё не прочитало. */
  notRead(): ThreadGenerator;
  /** ОС · язык · библиотека. */
  depends(): ThreadGenerator;
}

/** Одна лента, на которой блокировка головой очереди видна целиком. */
export function holBelt({y}: {y: number}): HolBelt {
  const group = createRef<Node>();
  const flow = range(4).map(() => createRef<Rect>());
  const lost = createRef<Rect>();
  const queue = QUEUED.map(() => createRef<Rect>());
  const hole = createRef<Rect>();
  const door = createRef<Rect>();
  const frame = createRef<Rect>();
  const chip = createRef<Rect>();
  const chipLabel = createRef<Txt>();
  const status = createRef<Txt>();
  const appBox = createRef<Rect>();
  const ackLane = createRef<Node>();
  const ackToken = createRef<Rect>();
  const dependsRow = createRef<Node>();

  const accent = colors.cyan;
  const good: SimpleSignal<number> = createSignal(0); // 0 = cyan, 1 = green «целые»
  const shut = createSignal(0);
  const glow = createSignal(0);

  /** Only the receiving end pulses — it is the one left waiting. */
  const endpoint = (
    ref: Reference<Rect> | undefined,
    x: number,
    width: number,
    title: string,
    pulses = false,
  ) => (
    <Rect ref={ref} x={x} y={BELT_Y} width={width} height={NET.height} radius={NET.radius}
      fill={withAlpha(colors.surface, 0.92)} stroke={withAlpha(accent, 0.55)} lineWidth={1.6}
      shadowColor={() => withAlpha(colors.orange, pulses ? 0.5 * glow() : 0)}
      shadowBlur={() => (pulses ? 22 * glow() : 0)}>
      <Txt text={title} fill={colors.textDim} fontSize={18} fontFamily={fonts.mono}
        letterSpacing={1.1}/>
    </Rect>
  );

  const crate = (ref: Reference<Rect>, label: string) => (
    <Rect ref={ref} width={SLOT.width} height={SLOT.height} radius={SLOT.radius}
      fill={() => withAlpha(good() > 0.5 ? colors.green : accent, 0.18)}
      stroke={() => withAlpha(good() > 0.5 ? colors.green : accent, 0.85)} lineWidth={1.6}
      opacity={0}>
      <Txt text={label} fill={colors.text} fontSize={22} fontFamily={fonts.mono}
        fontWeight={500}/>
    </Rect>
  );

  const node = (
    <Node ref={group} y={y} opacity={0}>
      <Line points={[[NET.x + NET.width / 2, BELT_Y], [APP.x - APP.width / 2, BELT_Y]]}
        stroke={withAlpha(accent, 0.22)} lineWidth={2} lineDash={[9, 8]}/>

      <Rect ref={frame} x={FRAME.x} y={BELT_Y} width={FRAME.width} height={FRAME.height}
        radius={FRAME.radius} fill={withAlpha(colors.surface, 0.55)}
        stroke={withAlpha(accent, 0.35)} lineWidth={1.5} lineDash={[10, 8]}/>
      <Txt x={FRAME.x} y={FRAME_LABEL_Y} text="БУФЕР ОС" fill={colors.textMuted} fontSize={17}
        fontFamily={fonts.mono} letterSpacing={1.3}/>

      {endpoint(undefined, NET.x, NET.width, 'СЕТЬ')}
      {endpoint(appBox, APP.x, APP.width, 'ПРИЛОЖЕНИЕ', true)}

      {/* Дверь в приложение: пока она закрыта, наверх не уходит ничего. */}
      <Rect ref={door} x={DOOR_X} y={BELT_Y} width={10} height={FRAME.height} radius={5}
        fill={() => withAlpha(shut() > 0.5 ? colors.red : accent, 0.25 + shut() * 0.5)}
        stroke={() => withAlpha(shut() > 0.5 ? colors.red : accent, 0.5 + shut() * 0.45)}
        lineWidth={1.4} opacity={0}/>

      <Rect ref={hole} x={HOLE} y={BELT_Y} width={SLOT.width} height={SLOT.height}
        radius={SLOT.radius} fill={withAlpha(colors.red, 0.08)}
        stroke={withAlpha(colors.red, 0.75)} lineWidth={1.8} lineDash={[8, 7]} opacity={0}>
        <Txt text="5" fill={withAlpha(colors.red, 0.75)} fontSize={22} fontFamily={fonts.mono}/>
      </Rect>

      {flow.map((ref, index) => crate(ref, `${index + 1}`))}
      {crate(lost, '5')}
      {queue.map((ref, index) => crate(ref, `${QUEUED[index]}`))}

      <Rect ref={chip} x={HOLE} y={CHIP_Y} width={196} height={46} radius={10}
        fill={withAlpha(colors.red, 0.14)} stroke={withAlpha(colors.red, 0.8)} lineWidth={1.6}
        opacity={0}>
        <Txt ref={chipLabel} text="ЖДЁМ ПЯТЫЙ" fill={colors.red} fontSize={19}
          fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.3}/>
      </Rect>

      {/* Прижата к правому краю колонки: под приложением текст шире самого блока. */}
      <Txt ref={status} offset={[1, 0]} x={440} y={STATUS_Y} text=""
        fill={colors.orange} fontSize={17} fontFamily={fonts.mono} letterSpacing={1.2}
        opacity={0}/>

      <Node ref={ackLane} opacity={0}>
        <Line points={[[FRAME.x + FRAME.width / 2, ACK_Y], [NET.x, ACK_Y]]}
          stroke={withAlpha(colors.green, 0.35)} lineWidth={2} lineDash={[9, 8]} endArrow
          arrowSize={10}/>
        <Rect ref={ackToken} x={FRAME.x + FRAME.width / 2 - 40} y={ACK_Y} width={104} height={42}
          radius={9} fill={withAlpha(colors.green, 0.18)} stroke={colors.green} lineWidth={1.6}>
          <Txt text="ACK" fill={colors.green} fontSize={19} fontFamily={fonts.mono}
            fontWeight={600} letterSpacing={1.3}/>
        </Rect>
      </Node>

      <Node ref={dependsRow} opacity={0}>
        {DEPENDS.map((title, index) => (
          <Rect x={(index - 1) * 196} y={NOTE_ROW_Y} width={182} height={44} radius={9}
            fill={withAlpha(colors.textMuted, 0.1)} stroke={withAlpha(colors.textMuted, 0.6)}
            lineWidth={1.4}>
            <Txt text={title} fill={colors.textDim} fontSize={17} fontFamily={fonts.mono}
              letterSpacing={1.2}/>
          </Rect>
        ))}
      </Node>
    </Node>
  );

  const inX = NET.x + NET.width / 2 + 44;
  const outX = APP.x - APP.width / 2 - 44;

  function* appear(): ThreadGenerator {
    yield* all(group().opacity(1, IN, easeOutCubic), door().opacity(1, IN, easeOutCubic));
  }

  /** One crate rides the whole belt and disappears into the application. */
  function* ride(ref: Reference<Rect>): ThreadGenerator {
    ref().position([inX, BELT_Y]).opacity(0);
    yield* ref().opacity(1, 0.2, easeOutCubic);
    yield* ref().position([outX, BELT_Y], RIDE, easeInOutCubic);
    yield* ref().opacity(0, 0.25);
  }

  function* send(): ThreadGenerator {
    yield* all(...flow.map((ref, index) => delay(index * 0.85, ride(ref))));
  }

  function* lose(): ThreadGenerator {
    lost().position([inX, BELT_Y]).opacity(0);
    yield* lost().opacity(1, 0.2, easeOutCubic);
    yield* lost().position([FRAME.x - FRAME.width / 2 - 30, BELT_Y], 1.0, easeInOutCubic);
    yield* all(
      lost().opacity(0, 0.45, easeInOutCubic),
      lost().scale(0.7, 0.45, easeInOutCubic),
      hole().opacity(1, 0.45, easeOutCubic),
    );
  }

  /** Each queued segment rides in and parks in its slot, right to left. */
  function* park(ref: Reference<Rect>, index: number): ThreadGenerator {
    ref().position([inX, BELT_Y]).opacity(0);
    yield* ref().opacity(1, 0.18, easeOutCubic);
    yield* ref().position([slotX(index), BELT_Y], 1.5, easeInOutCubic);
  }

  function* fill(): ThreadGenerator {
    // Приезжают по порядку — шестой встаёт вплотную к дырке, десятый дальше всех.
    yield* all(
      ...queue.map((ref, index) =>
        delay((queue.length - 1 - index) * 0.45, park(ref, index)),
      ),
    );
  }

  function* block(): ThreadGenerator {
    yield* all(
      shut(1, LIGHT, easeOutCubic),
      chip().opacity(1, LIGHT, easeOutCubic),
      status().text('НЕ ПОЛУЧИЛО НИ ОДНОГО').opacity(1, LIGHT, easeOutCubic),
    );
  }

  function* spotBuffer(): ThreadGenerator {
    yield* all(
      frame().stroke(withAlpha(accent, 0.85), LIGHT),
      frame().lineWidth(2.2, LIGHT),
    );
  }

  function* intact(): ThreadGenerator {
    yield* good(1, 0.6, easeOutCubic);
  }

  function* orderRules(): ThreadGenerator {
    yield* all(
      hole().scale(1.08, 0.35, easeOutCubic),
      hole().stroke(colors.red, 0.35),
    );
    yield* hole().scale(1, 0.35, easeInOutCubic);
  }

  function* waiting(): ThreadGenerator {
    while (true) {
      yield* glow(1, PULSE_HALF, easeInOutCubic);
      yield* glow(0.25, PULSE_HALF, easeInOutCubic);
    }
  }

  function* name(): ThreadGenerator {
    yield* chipLabel().opacity(0, 0.2, easeInOutCubic);
    chipLabel().text('HEAD-OF-LINE BLOCKING');
    yield* all(
      chip().width(292, 0.45, easeInOutCubic),
      chipLabel().opacity(1, 0.35, easeOutCubic),
    );
  }

  function* ackBack(): ThreadGenerator {
    ackToken().x(FRAME.x + FRAME.width / 2 - 40);
    yield* ackLane().opacity(1, 0.45, easeOutCubic);
    yield* ackToken().x(NET.x, 1.6, easeInOutCubic);
  }

  function* notRead(): ThreadGenerator {
    yield* all(
      status().text('ЕЩЁ НЕ ПРОЧИТАЛО').opacity(1, LIGHT, easeOutCubic),
      door().opacity(1, LIGHT),
    );
  }

  function* depends(): ThreadGenerator {
    yield* dependsRow().opacity(1, LIGHT, easeOutCubic);
  }

  return {
    node, appear, send, lose, fill, block, spotBuffer, intact, orderRules, waiting, name,
    ackBack, notRead, depends,
  };
}
