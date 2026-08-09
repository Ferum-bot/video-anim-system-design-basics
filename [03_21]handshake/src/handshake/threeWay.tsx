import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  easeInOutCubic,
  easeOutCubic,
  range,
} from '@motion-canvas/core';
import type {SimpleSignal, ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// A sequence diagram of the handshake, plus the ledger that explains why it is exactly three
// steps: each side has to announce its own count and see that the other side noticed. The
// fourth cell can only be filled by step three — which is the argument, drawn.
const SIDE = 300;
const HEAD = {width: 224, height: 62, radius: 12, y: -260} as const;
const LIFELINE_END = 46;
const STEPS_Y = [-160, -80, 0] as const;
const GHOST_Y = 80;
const MATRIX = {header: 138, rows: [190, 248], cell: {width: 268, height: 50}, gap: 10} as const;
const LABEL_COL = 126;

const IN = 0.7;
const DRAW = 0.8;
const LIGHT = 0.4;
const DIM = 0.15;

interface Step {
  label: string;
  from: number;
  to: number;
}

const STEPS: readonly Step[] = [
  {label: 'SYN · SEQ 3921', from: -SIDE, to: SIDE},
  {label: 'SYN+ACK · SEQ 7745 · ACK 3922', from: SIDE, to: -SIDE},
  {label: 'ACK · 7746', from: -SIDE, to: SIDE},
];

const COLUMNS = ['ЗАЯВИЛ СВОЙ ОТСЧЁТ', 'УВИДЕЛ ПОДТВЕРЖДЕНИЕ'] as const;
const ROWS = ['КЛИЕНТ', 'СЕРВЕР'] as const;
// Which step fills which cell — the cell that only step 3 can fill is the last one.
const FILLED_BY = [
  [1, 2],
  [2, 3],
] as const;

export interface ThreeWay extends Widget {
  /** Draw one arrow of the handshake. */
  step(index: number): ThreadGenerator;
  /** «Три шага» — the count lands over the diagram. */
  count(): ThreadGenerator;
  /** The diagram steps up and the ledger fills in, in the order the steps filled it. */
  explain(): ThreadGenerator;
  /** Take the third step away: one cell stays empty. */
  onlyTwo(): ThreadGenerator;
  /** Put it back, then show that a fourth step has nothing left to confirm. */
  fourth(): ThreadGenerator;
  /** Ledger leaves and the diagram steps back — the ISN beat takes the floor. */
  clearMatrix(): ThreadGenerator;
  /** Highlight the initial sequence number carried by the first step. */
  spotlightSeq(): ThreadGenerator;
}

/** Тройное рукопожатие и бухгалтерия, из которой следует «три». */
export function threeWay({y, raisedY}: {y: number; raisedY: number}): ThreeWay {
  const group = createRef<Node>();
  const arrows = STEPS.map(() => createRef<Line>());
  const labels = STEPS.map(() => createRef<Txt>());
  const ghost = createRef<Line>();
  const ghostLabel = createRef<Txt>();
  const countBadge = createRef<Rect>();
  const matrix = createRef<Node>();
  const cells = ROWS.map(() => COLUMNS.map(() => createRef<Rect>()));
  const ticks = ROWS.map(() => COLUMNS.map(() => createRef<Txt>()));

  const accent = colors.cyan;
  const seqGlow: SimpleSignal<number> = createSignal(0);

  const colX = [
    -SIDE - 41 + LABEL_COL + MATRIX.gap + MATRIX.cell.width / 2,
    -SIDE - 41 + LABEL_COL + MATRIX.gap * 2 + MATRIX.cell.width * 1.5,
  ];
  const labelX = -SIDE - 41;

  const head = (x: number, title: string) => (
    <Rect x={x} y={HEAD.y} width={HEAD.width} height={HEAD.height} radius={HEAD.radius}
      fill={withAlpha(colors.surface, 0.92)} stroke={withAlpha(accent, 0.6)} lineWidth={1.6}>
      <Txt text={title} fill={colors.textDim} fontSize={20} fontFamily={fonts.mono}
        letterSpacing={1.1}/>
    </Rect>
  );

  const node = (
    <Node ref={group} y={y} opacity={0}>
      {head(-SIDE, 'КЛИЕНТ')}
      {head(SIDE, 'СЕРВЕР')}

      {[-SIDE, SIDE].map(x => (
        <Line points={[[x, HEAD.y + HEAD.height / 2], [x, LIFELINE_END]]}
          stroke={withAlpha(accent, 0.22)} lineWidth={2} lineDash={[8, 8]}/>
      ))}

      {STEPS.map((step, index) => (
        <Line ref={arrows[index]} points={[[step.from, STEPS_Y[index]], [step.to, STEPS_Y[index]]]}
          stroke={index === 1 ? colors.orange : accent} lineWidth={2.4} endArrow arrowSize={11}
          end={0}
          shadowColor={() => withAlpha(accent, index === 0 ? 0.55 * seqGlow() : 0)}
          shadowBlur={() => 16 * (index === 0 ? seqGlow() : 0)}/>
      ))}
      {STEPS.map((step, index) => (
        <Txt ref={labels[index]} y={STEPS_Y[index] - 26} text={step.label}
          fill={index === 1 ? colors.orange : accent} fontSize={19} fontFamily={fonts.mono}
          fontWeight={500} letterSpacing={1.1} opacity={0}/>
      ))}

      <Line ref={ghost} points={[[SIDE, GHOST_Y], [-SIDE, GHOST_Y]]}
        stroke={colors.textMuted} lineWidth={2.4} lineDash={[9, 8]} endArrow arrowSize={11}
        end={0}/>
      <Txt ref={ghostLabel} y={GHOST_Y - 26} text="ЧЕТВЁРТЫЙ ШАГ" fill={colors.textMuted}
        fontSize={19} fontFamily={fonts.mono} letterSpacing={1.1} opacity={0}/>

      <Rect ref={countBadge} y={STEPS_Y[0] - 84} width={168} height={48} radius={10} scale={0.9}
        fill={withAlpha(accent, 0.14)} stroke={withAlpha(accent, 0.8)} lineWidth={1.6}
        opacity={0}>
        <Txt text="ТРИ ШАГА" fill={accent} fontSize={22} fontFamily={fonts.mono}
          fontWeight={600} letterSpacing={1.4}/>
      </Rect>

      <Node ref={matrix} opacity={0}>
        {COLUMNS.map((title, col) => (
          <Txt x={colX[col]} y={MATRIX.header} text={title} fill={colors.textMuted} fontSize={15}
            fontFamily={fonts.mono} letterSpacing={1.2}/>
        ))}
        {ROWS.map((title, row) => (
          <Txt offset={[-1, 0]} x={labelX} y={MATRIX.rows[row]} text={title}
            fill={colors.textDim} fontSize={17} fontFamily={fonts.mono} letterSpacing={1.2}/>
        ))}
        {ROWS.flatMap((_, row) =>
          COLUMNS.map((__, col) => (
            <Rect ref={cells[row][col]} x={colX[col]} y={MATRIX.rows[row]}
              width={MATRIX.cell.width} height={MATRIX.cell.height} radius={9}
              fill={withAlpha(colors.surface, 0.85)} stroke={withAlpha(accent, 0.28)}
              lineWidth={1.5}>
              <Txt ref={ticks[row][col]} text={`ШАГ ${FILLED_BY[row][col]}  ✓`}
                fill={colors.green} fontSize={18} fontFamily={fonts.mono} fontWeight={500}
                letterSpacing={1.2} opacity={0}/>
            </Rect>
          )),
        )}
      </Node>
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* group().opacity(1, IN, easeOutCubic);
  }

  function* step(index: number): ThreadGenerator {
    yield* all(
      arrows[index]().end(1, DRAW, easeInOutCubic),
      labels[index]().opacity(1, LIGHT, easeOutCubic),
    );
  }

  function* count(): ThreadGenerator {
    yield* all(
      countBadge().opacity(1, LIGHT, easeOutCubic),
      countBadge().scale(1, LIGHT, easeOutCubic),
    );
  }

  /** Light the cell filled by step `n`, in the order the steps happened. */
  function* light(n: number, on: boolean, dur = LIGHT): ThreadGenerator {
    const spots = range(2).flatMap(row =>
      range(2).filter(col => FILLED_BY[row][col] === n).map(col => [row, col] as const),
    );
    yield* all(
      ...spots.flatMap(([row, col]) => [
        ticks[row][col]().opacity(on ? 1 : 0, dur, easeOutCubic),
        cells[row][col]().stroke(withAlpha(on ? colors.green : accent, on ? 0.8 : 0.28), dur),
        cells[row][col]().fill(
          withAlpha(on ? colors.green : colors.surface, on ? 0.12 : 0.85), dur),
      ]),
    );
  }

  function* explain(): ThreadGenerator {
    // Until now the diagram sat centred; it steps up to make room for its own ledger.
    yield* all(
      group().y(raisedY, 0.6, easeInOutCubic),
      matrix().opacity(1, LIGHT, easeOutCubic),
    );
    for (const n of [1, 2, 3]) yield* light(n, true, 0.45);
  }

  function* onlyTwo(): ThreadGenerator {
    yield* all(
      arrows[2]().opacity(DIM, 0.4, easeInOutCubic),
      labels[2]().opacity(DIM, 0.4, easeInOutCubic),
      light(3, false, 0.4),
    );
    yield* all(
      cells[1][1]().stroke(colors.red, 0.35),
      cells[1][1]().fill(withAlpha(colors.red, 0.12), 0.35),
    );
  }

  function* fourth(): ThreadGenerator {
    yield* all(
      arrows[2]().opacity(1, 0.35, easeOutCubic),
      labels[2]().opacity(1, 0.35, easeOutCubic),
      light(3, true, 0.35),
    );
    yield* all(
      ghost().end(1, 0.6, easeInOutCubic),
      ghostLabel().opacity(1, 0.4, easeOutCubic),
    );
    yield* all(
      ghost().opacity(0, 0.5, easeInOutCubic),
      ghostLabel().opacity(0, 0.5, easeInOutCubic),
    );
  }

  function* clearMatrix(): ThreadGenerator {
    yield* all(
      matrix().opacity(0, 0.45, easeInOutCubic),
      countBadge().opacity(0, 0.45, easeInOutCubic),
      ...labels.slice(1).map(label => label().opacity(0.3, 0.45, easeInOutCubic)),
      ...arrows.slice(1).map(arrow => arrow().opacity(0.3, 0.45, easeInOutCubic)),
    );
  }

  function* spotlightSeq(): ThreadGenerator {
    yield* seqGlow(1, 0.5, easeOutCubic);
  }

  return {node, appear, step, count, explain, onlyTwo, fourth, clearMatrix, spotlightSeq};
}
