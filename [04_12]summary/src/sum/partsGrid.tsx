import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, delay, easeInOutCubic, easeOutCubic, range} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';

// «Протокол — это не технология, а договорённость из четырёх частей»: слово перечёркивается,
// под ним встаёт другое, и раскрывается сетка 2×2 — паспорт протокола из `[04_05]`,
// сведённый к скелету. Ячейки заполняются по одной ровно на словах.
const CELL = {width: 194, height: 64, radius: 10, gapX: 12, gapY: 14} as const;
const GRID_Y = 2;
const DENY_Y = -160;
const AFFIRM_Y = -108;

const IN = 0.45;
const OUT = 0.3;

export interface PartsGrid {
  readonly node: Node;
  /** Слово «технология» появляется и перечёркивается. */
  deny(): ThreadGenerator;
  /** И заменяется тем, чем протокол является на самом деле. */
  affirm(): ThreadGenerator;
  /** Четыре пустые ячейки: частей ровно четыре. */
  open(): ThreadGenerator;
  /** Ячейка получает содержание. */
  fill(index: number, text: string): ThreadGenerator;
  dismiss(): ThreadGenerator;
}

export interface PartsGridOptions {
  x: number;
}

export function partsGrid({x}: PartsGridOptions): PartsGrid {
  const group = createRef<Node>();
  const denyText = createRef<Txt>();
  const strike = createRef<Line>();
  const affirmText = createRef<Txt>();
  const cells = range(4).map(() => createRef<Rect>());
  const labels = range(4).map(() => createRef<Txt>());

  const accent = colors.cyan;
  const cellX = (index: number) => (index % 2) * (CELL.width + CELL.gapX);
  const cellY = (index: number) => GRID_Y + Math.floor(index / 2) * (CELL.height + CELL.gapY);

  const node = (
    <Node ref={group} x={x}>
      <Txt ref={denyText} x={39} offsetX={-1} y={DENY_Y} text="ТЕХНОЛОГИЯ"
        fill={colors.textMuted} fontSize={22} fontFamily={fonts.mono} fontWeight={500}
        letterSpacing={1.4} opacity={0}/>
      <Line ref={strike} points={[[39, DENY_Y], [189, DENY_Y]]}
        stroke={withAlpha(colors.red, 0.9)} lineWidth={2.4} end={0}/>

      <Txt ref={affirmText} x={39} offsetX={-1} y={AFFIRM_Y} text="ДОГОВОРЁННОСТЬ"
        fill={colors.text} fontSize={24} fontFamily={fonts.mono} fontWeight={600}
        letterSpacing={1.5} opacity={0}/>

      {range(4).map(index => (
        <Rect ref={cells[index]} x={39 + cellX(index)} offsetX={-1} y={cellY(index)}
          width={CELL.width} height={CELL.height} radius={CELL.radius}
          fill={withAlpha(accent, 0.05)} stroke={withAlpha(accent, 0.4)} lineWidth={1.3}
          lineDash={() => (labels[index]().opacity() > 0.5 ? [] : [6, 6])} opacity={0}>
          <Txt ref={labels[index]} text="" fill={withAlpha(colors.text, 0.9)} fontSize={14}
            fontFamily={fonts.mono} fontWeight={500} letterSpacing={1} opacity={0}/>
        </Rect>
      ))}
    </Node>
  );

  function* deny(): ThreadGenerator {
    yield* denyText().opacity(1, IN, easeOutCubic);
    yield* strike().end(1, 0.35, easeOutCubic);
  }

  function* affirm(): ThreadGenerator {
    yield* all(
      denyText().opacity(0.35, OUT),
      affirmText().opacity(1, IN, easeOutCubic),
    );
  }

  function* open(): ThreadGenerator {
    yield* all(...cells.map((item, index) =>
      delay(index * 0.09, item().opacity(1, IN, easeOutCubic))));
  }

  function* fill(index: number, text: string): ThreadGenerator {
    labels[index]().text(text);
    cells[index]().scale(0.9);
    yield* all(
      labels[index]().opacity(1, 0.3, easeOutCubic),
      cells[index]().scale(1, 0.3, easeOutCubic),
      cells[index]().stroke(withAlpha(accent, 0.75), 0.3),
      cells[index]().fill(withAlpha(accent, 0.12), 0.3),
    );
  }

  function* dismiss(): ThreadGenerator {
    yield* group().opacity(0, 0.6, easeInOutCubic);
  }

  return {node, deny, affirm, open, fill, dismiss};
}
