import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  easeInOutCubic,
  easeOutCubic,
  range,
  waitFor,
} from '@motion-canvas/core';
import type {Reference, SimpleSignal, ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// Три ленты вместо одной — та же картинка, что в части про head-of-line, только теперь их
// три. Поток 1 встаёт на дырке, а потоки 2 и 3 продолжают ехать: у каждого свой замок.
const FRAME = {left: -388, right: 254, height: 246, radius: 14} as const;
const APP = {x: 358, width: 152, height: 246, radius: 12} as const;
const LANES = 3;
const LANE_STEP = 76;
const RAIL = {from: -244, to: 246} as const;
const LABEL_X = -370;
const CRATE = {width: 46, height: 38, radius: 8} as const;
const POOL = 4;
const FRAME_LABEL_Y = -158;
const HOLE_X = 196;

const IN = 0.7;
const TRAVEL = 2.3;
const PERIOD = 0.5;
const LIGHT = 0.45;

const laneY = (index: number) => (index - (LANES - 1) / 2) * LANE_STEP;

export interface StreamLanes extends Widget {
  /** Одна большая труба расходится на три независимых потока. */
  split(): ThreadGenerator;
  /** Endless: поток едет — **fork** it по одному на полосу и `cancel` тот, что встал. */
  feed(lane: number): ThreadGenerator;
  /** В потоке дырка: он ждёт, соседние — нет. */
  block(lane: number): ThreadGenerator;
  /** Чип с выводом над рамкой. */
  say(text: string): ThreadGenerator;
  dismiss(): ThreadGenerator;
}

/** «Вместо одной большой трубы внутри одного QUIC-соединения живёт много потоков». */
export function streamLanes({y}: {y: number}): StreamLanes {
  const group = createRef<Node>();
  const single = createRef<Rect>();
  const lanes = range(LANES).map(() => createRef<Node>());
  const crates = range(LANES).map(() => range(POOL).map(() => createRef<Rect>()));
  const holes = range(LANES).map(() => createRef<Rect>());
  const chip = createRef<Rect>();
  const chipLabel = createRef<Txt>();

  const accent = colors.cyan;
  const stuck: SimpleSignal<number>[] = range(LANES).map(() => createSignal(0));

  const node = (
    <Node ref={group} y={y} opacity={0}>
      <Rect x={(FRAME.left + FRAME.right) / 2} width={FRAME.right - FRAME.left}
        height={FRAME.height} radius={FRAME.radius} fill={withAlpha(colors.surface, 0.5)}
        stroke={withAlpha(accent, 0.4)} lineWidth={1.5} lineDash={[10, 8]}/>
      <Txt x={(FRAME.left + FRAME.right) / 2} y={FRAME_LABEL_Y} text="ОДНО QUIC-СОЕДИНЕНИЕ"
        fill={colors.textMuted} fontSize={17} fontFamily={fonts.mono} letterSpacing={1.3}/>

      {/* Одна большая труба — то, чем это было до потоков. */}
      <Rect ref={single} x={(RAIL.from + RAIL.to) / 2} width={RAIL.to - RAIL.from} height={122}
        radius={12} fill={withAlpha(accent, 0.14)} stroke={withAlpha(accent, 0.7)}
        lineWidth={1.6}>
        <Txt text="ОДНА БОЛЬШАЯ ТРУБА" fill={accent} fontSize={19} fontFamily={fonts.mono}
          letterSpacing={1.2}/>
      </Rect>

      {range(LANES).map(index => (
        <Node ref={lanes[index]} y={laneY(index)} opacity={0}>
          <Txt offset={[-1, 0]} x={LABEL_X} text={`ПОТОК ${index + 1}`}
            fill={() => withAlpha(stuck[index]() > 0.5 ? colors.red : colors.textDim, 0.9)}
            fontSize={16} fontFamily={fonts.mono} letterSpacing={1.2}/>
          <Line points={[[RAIL.from, 0], [RAIL.to, 0]]}
            stroke={() => withAlpha(stuck[index]() > 0.5 ? colors.red : accent, 0.28)}
            lineWidth={2} lineDash={[9, 8]}/>
          <Rect ref={holes[index]} x={HOLE_X} width={CRATE.width} height={CRATE.height}
            radius={CRATE.radius} fill={withAlpha(colors.red, 0.08)}
            stroke={withAlpha(colors.red, 0.8)} lineWidth={1.8} lineDash={[7, 6]} opacity={0}/>
          {range(POOL).map(slot => (
            <Rect ref={crates[index][slot]} width={CRATE.width} height={CRATE.height}
              radius={CRATE.radius} fill={withAlpha(accent, 0.2)} stroke={accent} lineWidth={1.6}
              opacity={0}/>
          ))}
        </Node>
      ))}

      <Rect x={APP.x} width={APP.width} height={APP.height} radius={APP.radius}
        fill={withAlpha(colors.surface, 0.92)} stroke={withAlpha(accent, 0.55)} lineWidth={1.6}>
        <Txt text="ПРИЛОЖЕНИЕ" fill={colors.textDim} fontSize={19} fontFamily={fonts.mono}
          letterSpacing={1.1}/>
      </Rect>

      <Rect ref={chip} y={FRAME_LABEL_Y - 52} width={636} height={50} radius={11}
        fill={withAlpha(accent, 0.12)} stroke={withAlpha(accent, 0.8)} lineWidth={1.6}
        opacity={0}>
        <Txt ref={chipLabel} text="" fill={accent} fontSize={19} fontFamily={fonts.mono}
          fontWeight={600} letterSpacing={1.2}/>
      </Rect>
    </Node>
  );

  const start = RAIL.from + 26;
  const finish = RAIL.to - 8;

  function* appear(): ThreadGenerator {
    yield* group().opacity(1, IN, easeOutCubic);
  }

  function* split(): ThreadGenerator {
    yield* all(
      single().opacity(0, 0.5, easeInOutCubic),
      single().scale.y(0.4, 0.5, easeInOutCubic),
      ...lanes.map(lane => lane().opacity(1, 0.6, easeOutCubic)),
    );
  }

  /** Один ящик проезжает свою полосу и уходит в приложение. */
  function* ride(ref: Reference<Rect>): ThreadGenerator {
    ref().position([start, 0]).opacity(0);
    yield* ref().opacity(1, 0.16, easeOutCubic);
    yield* ref().position([finish, 0], TRAVEL, easeInOutCubic);
    yield* ref().opacity(0, 0.22);
    yield* waitFor(PERIOD);
  }

  function* feed(lane: number): ThreadGenerator {
    yield* all(
      ...crates[lane].map(function* (ref, slot): ThreadGenerator {
        yield* waitFor((slot / POOL) * (TRAVEL + PERIOD));
        while (true) yield* ride(ref);
      }),
    );
  }

  /**
   * Поток встал: те, кто ещё не доехал, выстраиваются в очередь за дыркой, а те, кто её уже
   * прошёл, уходят в приложение. Слоты назначаются по порядку, чтобы ящики не наложились.
   */
  function* block(lane: number): ThreadGenerator {
    const waiting = crates[lane]
      .filter(ref => ref().opacity() > 0.05 && ref().x() < HOLE_X)
      .sort((a, b) => b().x() - a().x());
    const passed = crates[lane].filter(ref => ref().opacity() > 0.05 && ref().x() >= HOLE_X);
    yield* all(
      stuck[lane](1, LIGHT, easeOutCubic),
      holes[lane]().opacity(1, LIGHT, easeOutCubic),
      ...waiting.map((ref, slot) => ref().x(HOLE_X - (slot + 1) * 58, 0.5, easeInOutCubic)),
      ...waiting.map(ref => ref().stroke(colors.red, LIGHT)),
      ...waiting.map(ref => ref().fill(withAlpha(colors.red, 0.18), LIGHT)),
      ...passed.map(ref => ref().opacity(0, 0.3, easeInOutCubic)),
    );
  }

  function* say(text: string): ThreadGenerator {
    if (chip().opacity() > 0) yield* chipLabel().opacity(0, 0.2, easeInOutCubic);
    chipLabel().text(text);
    yield* all(chip().opacity(1, LIGHT, easeOutCubic), chipLabel().opacity(1, 0.35, easeOutCubic));
  }

  function* dismiss(): ThreadGenerator {
    yield* all(
      group().opacity(0, 0.55, easeInOutCubic),
      group().y(group().y() - 26, 0.55, easeInOutCubic),
    );
  }

  return {node, appear, split, feed, block, say, dismiss};
}
