import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  easeInCubic,
  easeInOutCubic,
  easeOutCubic,
  range,
  waitFor,
} from '@motion-canvas/core';
import type {Reference, ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// Тот же приёмный буфер, что в UDP-части, только теперь получатель говорит, сколько ещё
// готов принять. Всё держится на одном сигнале: `level` — насколько буфер занят. Из него
// считаются и высота свободной полосы, и число в окне, и темп отправителя.
const SENDER = {x: -352, width: 168, height: 128, radius: 12} as const;
const TANK = {x: 66, width: 186, height: 200, radius: 12} as const;
const APP = {x: 348, width: 156, height: 128, radius: 12} as const;
const TANK_PAD = 12;
const LANE_Y = 0;
const TANK_LABEL_Y = -132;
const MODE_Y = -176;
const SIDE_LABEL_Y = 96;
const BACK_Y = 152;
const PACKET = {size: 30, radius: 7} as const;
const POOL = 5;

const CAP = 8; // ёмкость буфера в «килобайтах» — цена деления для окна
const FULL = 0.92;

const IN = 0.7;
const HOP = 1.15;
const SPILL = 0.75;
const LIGHT = 0.45;
const BREATHE = 2.6;

const tankInner = TANK.height - TANK_PAD * 2;

export interface WindowPipe extends Widget {
  /** Endless: отправитель шлёт — **fork** it. Темп сам следует за окном. */
  feed(): ThreadGenerator;
  /** «Как было в UDP» — буфер набивается до краёв. */
  flood(): ThreadGenerator;
  /** «TCP так не делает» — буфер сливается, красное уходит. */
  calm(): ThreadGenerator;
  /** Обратная дорожка: получатель сообщает, сколько ещё готов принять. */
  advertise(): ThreadGenerator;
  /** У этого есть имя. */
  nameWindow(): ThreadGenerator;
  /** Отправитель не имеет права слать больше — темп падает до окна. */
  throttle(): ThreadGenerator;
  /** «Быстрый сервер» и «медленный телефон». */
  labelSides(): ThreadGenerator;
  /** Endless: окно то сжимается, то раскрывается — **fork** it. */
  breathe(): ThreadGenerator;
}

/** Скользящее окно: получатель диктует темп, и ничего не выпадает. */
export function windowPipe({y}: {y: number}): WindowPipe {
  const group = createRef<Node>();
  const packets = range(POOL).map(() => createRef<Rect>());
  const freeBand = createRef<Rect>();
  const freeLabel = createRef<Txt>();
  const mode = createRef<Rect>();
  const backLane = createRef<Node>();
  const winChip = createRef<Rect>();
  const winTitle = createRef<Txt>();
  const senderLabel = createRef<Txt>();
  const appLabel = createRef<Txt>();

  const accent = colors.cyan;

  const level = createSignal(0.5); // 0 = пусто, 1 = под завязку
  const spills = createSignal(0); // 1 — прибывшие сыплются мимо, как в UDP
  const window = () => CAP * (1 - level());
  const period = () => 0.3 + level() * 0.95;

  const box = (x: number, width: number, title: string) => (
    <Rect x={x} y={LANE_Y} width={width} height={SENDER.height} radius={SENDER.radius}
      fill={withAlpha(colors.surface, 0.92)} stroke={withAlpha(accent, 0.55)} lineWidth={1.6}>
      <Txt text={title} fill={colors.textDim} fontSize={19} fontFamily={fonts.mono}
        letterSpacing={1.1}/>
    </Rect>
  );

  const node = (
    <Node ref={group} y={y} opacity={0}>
      <Line points={[[SENDER.x + SENDER.width / 2, LANE_Y], [TANK.x - TANK.width / 2, LANE_Y]]}
        stroke={withAlpha(accent, 0.25)} lineWidth={2} lineDash={[9, 8]}/>
      <Line points={[[TANK.x + TANK.width / 2, LANE_Y], [APP.x - APP.width / 2, LANE_Y]]}
        stroke={withAlpha(accent, 0.25)} lineWidth={2} lineDash={[9, 8]}/>

      {box(SENDER.x, SENDER.width, 'ОТПРАВИТЕЛЬ')}
      {box(APP.x, APP.width, 'ПРИЛОЖЕНИЕ')}

      <Txt x={TANK.x} y={TANK_LABEL_Y} text="БУФЕР ПОЛУЧАТЕЛЯ" fill={colors.textMuted}
        fontSize={17} fontFamily={fonts.mono} letterSpacing={1.3}/>
      <Rect x={TANK.x} y={LANE_Y} width={TANK.width} height={TANK.height} radius={TANK.radius}
        fill={withAlpha(colors.surface, 0.9)} stroke={withAlpha(accent, 0.7)} lineWidth={1.7}
        clip>
        <Rect offset={[0, 1]} y={TANK.height / 2 - TANK_PAD} width={TANK.width - TANK_PAD * 2}
          height={() => level() * tankInner} radius={6}
          fill={() => withAlpha(level() > FULL ? colors.red : accent, 0.3)}/>
        {/* Свободное место — это и есть окно; отсюда берётся число в чипе. */}
        <Rect ref={freeBand} offset={[0, -1]} y={-TANK.height / 2 + TANK_PAD}
          width={TANK.width - TANK_PAD * 2} height={() => (1 - level()) * tankInner} radius={6}
          fill={withAlpha(colors.green, 0.14)} stroke={withAlpha(colors.green, 0.55)}
          lineWidth={1.4} opacity={0}>
          <Txt ref={freeLabel} text="СВОБОДНО" fill={colors.green} fontSize={15}
            fontFamily={fonts.mono} letterSpacing={1.2}
            opacity={() => Math.min(1, Math.max(0, ((1 - level()) * tankInner - 34) / 24))}/>
        </Rect>
      </Rect>

      <Rect ref={mode} x={TANK.x} y={MODE_Y} width={176} height={42} radius={9}
        fill={withAlpha(colors.red, 0.14)} stroke={withAlpha(colors.red, 0.8)} lineWidth={1.5}
        opacity={0}>
        <Txt text="КАК БЫЛО В UDP" fill={colors.red} fontSize={17} fontFamily={fonts.mono}
          fontWeight={600} letterSpacing={1.2}/>
      </Rect>

      {packets.map(ref => (
        <Rect ref={ref} width={PACKET.size} height={PACKET.size} radius={PACKET.radius}
          fill={withAlpha(accent, 0.3)} stroke={accent} lineWidth={1.6}
          shadowColor={withAlpha(accent, 0.5)} shadowBlur={10} opacity={0}/>
      ))}

      <Node ref={backLane} opacity={0}>
        <Line points={[[TANK.x - TANK.width / 2, BACK_Y], [SENDER.x, BACK_Y]]}
          stroke={withAlpha(colors.green, 0.35)} lineWidth={2} lineDash={[9, 8]} endArrow
          arrowSize={10}/>
        <Rect ref={winChip} x={-140} y={BACK_Y} width={252} height={46} radius={10}
          fill={withAlpha(colors.green, 0.14)} stroke={withAlpha(colors.green, 0.85)}
          lineWidth={1.6}>
          <Txt ref={winTitle} text={() => `ГОТОВ ПРИНЯТЬ ${Math.round(window())} КБ`}
            fill={colors.green} fontSize={18} fontFamily={fonts.mono} fontWeight={600}
            letterSpacing={1.2}/>
        </Rect>
      </Node>

      <Txt ref={senderLabel} x={SENDER.x} y={SIDE_LABEL_Y} text="БЫСТРЫЙ СЕРВЕР"
        fill={colors.orange} fontSize={17} fontFamily={fonts.mono} letterSpacing={1.2}
        opacity={0}/>
      <Txt ref={appLabel} x={APP.x} y={SIDE_LABEL_Y} text="МЕДЛЕННЫЙ ТЕЛЕФОН"
        fill={colors.orange} fontSize={17} fontFamily={fonts.mono} letterSpacing={1.2}
        opacity={0}/>
    </Node>
  );

  const laneStart = SENDER.x + SENDER.width / 2 + 26;
  const laneEnd = TANK.x - TANK.width / 2 - 20;

  function* appear(): ThreadGenerator {
    yield* group().opacity(1, IN, easeOutCubic);
  }

  /** Один пакет доезжает до буфера — и либо входит, либо сыплется мимо. */
  function* one(ref: Reference<Rect>): ThreadGenerator {
    ref().position([laneStart, LANE_Y]).opacity(0).scale(1)
      .fill(withAlpha(accent, 0.3)).stroke(accent);
    yield* ref().opacity(1, 0.15, easeOutCubic);
    yield* ref().position([laneEnd, LANE_Y], HOP, easeInOutCubic);
    if (spills() > 0.5 && level() > FULL) {
      // Отвергнутый пакет краснеет прямо у буфера — там, где его и выбрасывают.
      ref().fill(withAlpha(colors.red, 0.3)).stroke(colors.red);
      yield* all(
        ref().position([laneEnd - 26, LANE_Y + 168], SPILL, easeInCubic),
        ref().opacity(0, SPILL, easeInCubic),
        ref().scale(0.7, SPILL),
      );
    } else {
      yield* ref().opacity(0, 0.2);
    }
    yield* waitFor(period());
  }

  function* feed(): ThreadGenerator {
    yield* all(
      ...packets.map(function* (ref, index): ThreadGenerator {
        yield* waitFor((index / POOL) * (HOP + 0.6));
        while (true) yield* one(ref);
      }),
    );
  }

  function* flood(): ThreadGenerator {
    spills(1);
    yield* all(
      mode().opacity(1, LIGHT, easeOutCubic),
      level(1, 2.8, easeInOutCubic),
    );
  }

  function* calm(): ThreadGenerator {
    spills(0);
    yield* all(
      mode().opacity(0, LIGHT, easeInOutCubic),
      level(0.5, 1.0, easeInOutCubic),
    );
  }

  function* advertise(): ThreadGenerator {
    yield* all(
      freeBand().opacity(1, LIGHT, easeOutCubic),
      backLane().opacity(1, LIGHT, easeOutCubic),
    );
  }

  function* nameWindow(): ThreadGenerator {
    yield* winTitle().opacity(0, 0.2, easeInOutCubic);
    winTitle().text(() => `ОКНО ${Math.round(window())} КБ`);
    yield* all(
      winChip().width(190, 0.45, easeInOutCubic),
      winTitle().opacity(1, 0.35, easeOutCubic),
    );
  }

  function* throttle(): ThreadGenerator {
    // Больше окна слать нельзя — темп отправителя падает вместе с ним.
    yield* level(0.7, 1.2, easeInOutCubic);
  }

  function* labelSides(): ThreadGenerator {
    yield* all(
      senderLabel().opacity(1, LIGHT, easeOutCubic),
      appLabel().opacity(1, LIGHT, easeOutCubic),
    );
  }

  function* breathe(): ThreadGenerator {
    while (true) {
      yield* level(0.86, BREATHE, easeInOutCubic);
      yield* level(0.22, BREATHE, easeInOutCubic);
    }
  }

  return {node, appear, feed, flood, calm, advertise, nameWindow, throttle, labelSides, breathe};
}
