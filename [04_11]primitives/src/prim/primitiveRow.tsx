import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  delay,
  easeInOutCubic,
  easeOutBack,
  easeOutCubic,
  range,
} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';

// Восемь слов между твоим кодом и всем, что разбирали два видео. Ряд появляется дважды:
// сначала восемь **пустых** гнёзд — видно, что их ровно восемь, — и только потом каждое
// заполняется именем ровно на своём слове.
export const PRIMITIVES = [
  'socket', 'bind', 'listen', 'accept', 'connect', 'send', 'receive', 'close',
] as const;

export const BTN = {width: 96, height: 56, radius: 10, pitch: 106} as const;

/** Центр кнопки по индексу — раскладка ряда считается арифметически. */
export const btnX = (index: number) =>
  (index - (PRIMITIVES.length - 1) / 2) * BTN.pitch;

const OUT = 0.5;
const STAGGER = 0.07;
const FILL = 0.42;
const TONE = 0.35;
/** Насколько «мягко» кнопка загорается, когда по рельсе доезжает точка. */
const RAMP = 0.05;
const MOVE = 0.8;

export interface RailStop {
  index: number;
  /** Доля пути рельсы, на которой она доходит до этой кнопки. */
  at: number;
}

export interface PrimitiveRow {
  readonly node: Node;
  /** Восемь пустых гнёзд: их ровно восемь, имён пока нет. */
  outline(): ThreadGenerator;
  /** Гнездо заполняется именем. */
  fill(index: number): ThreadGenerator;
  /** Подсветить кнопку вручную (вне рельсы). */
  light(index: number, level?: number): ThreadGenerator;
  /** Снять ручную подсветку со всех. */
  unlight(): ThreadGenerator;
  /** Привязать подсветку к бегущей по рельсе точке. */
  follow(stops: RailStop[], progress: () => number): void;
  /** Ряд отъезжает, освобождая половину кадра тому, что сейчас объясняют. */
  moveTo(y: number): ThreadGenerator;
  /** Текущая высота ряда — по ней поводки находят свою кнопку. */
  centerY(): number;
}

export interface PrimitiveRowOptions {
  y: number;
}

export function primitiveRow({y}: PrimitiveRowOptions): PrimitiveRow {
  const cells = range(PRIMITIVES.length).map(() => createRef<Rect>());
  const labels = range(PRIMITIVES.length).map(() => createRef<Txt>());

  const accent = colors.cyan;
  const filled = PRIMITIVES.map(() => createSignal(0));
  const manual = PRIMITIVES.map(() => createSignal(0));
  // Рельсы дописывают сюда свои функции: кнопка горит от той, что ярче.
  const railed: Array<Array<() => number>> = PRIMITIVES.map(() => []);

  const lit = (index: number) => () =>
    railed[index].reduce((best, read) => Math.max(best, read()), manual[index]());

  const rowY = createSignal(y);

  const node = (
    <Node y={rowY}>
      {range(PRIMITIVES.length).map(index => (
        <Rect
          ref={cells[index]}
          x={btnX(index)}
          width={BTN.width}
          height={BTN.height}
          radius={BTN.radius}
          fill={() => withAlpha(accent, 0.05 + filled[index]() * 0.04 + lit(index)() * 0.18)}
          stroke={() => withAlpha(accent, 0.28 + filled[index]() * 0.24 + lit(index)() * 0.44)}
          lineWidth={() => 1.3 + lit(index)() * 0.7}
          lineDash={() => (filled[index]() > 0.5 ? [] : [6, 6])}
          shadowColor={withAlpha(accent, 0.75)}
          shadowBlur={() => lit(index)() * 20}
          opacity={0}
        >
          {/* Блик по верхней кромке — из-за него ряд читается как клавиши, а не как рамки. */}
          <Line
            points={[[-BTN.width / 2 + 12, -BTN.height / 2 + 7], [BTN.width / 2 - 12, -BTN.height / 2 + 7]]}
            stroke={() => withAlpha(colors.text, 0.06 + lit(index)() * 0.16)}
            lineWidth={1}
          />
          <Txt
            ref={labels[index]}
            text={PRIMITIVES[index]}
            fill={() => withAlpha(colors.text, 0.55 + lit(index)() * 0.45)}
            fontSize={15}
            fontFamily={fonts.mono}
            fontWeight={500}
            letterSpacing={0.8}
            opacity={() => filled[index]()}
          />
        </Rect>
      ))}
    </Node>
  );

  function* outline(): ThreadGenerator {
    cells.forEach(item => item().scale(0.9));
    yield* all(
      ...cells.map((item, index) =>
        delay(index * STAGGER, all(
          item().opacity(1, OUT, easeOutCubic),
          item().scale(1, OUT, easeOutCubic),
        ))),
    );
  }

  function* fill(index: number): ThreadGenerator {
    cells[index]().scale(0.86);
    yield* all(
      filled[index](1, FILL, easeOutCubic),
      cells[index]().scale(1, FILL, easeOutBack),
    );
  }

  function* light(index: number, level = 1): ThreadGenerator {
    yield* manual[index](level, TONE, easeOutCubic);
  }

  function* unlight(): ThreadGenerator {
    yield* all(...manual.map(item => item(0, TONE, easeInOutCubic)));
  }

  function follow(stops: RailStop[], progress: () => number): void {
    for (const stop of stops) {
      // +RAMP, иначе последняя кнопка (её доля ровно 1.0) не загорается никогда.
      railed[stop.index].push(() =>
        Math.max(0, Math.min(1, (progress() - stop.at) / RAMP + 1)));
    }
  }

  function* moveTo(next: number): ThreadGenerator {
    yield* rowY(next, MOVE, easeInOutCubic);
  }

  return {node, outline, fill, light, unlight, follow, moveTo, centerY: () => rowY()};
}
