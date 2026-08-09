import {Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, createSignal, delay, easeInOutCubic, easeOutCubic} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';

// Three bars on one scale, so 26 : 20 : 8 is true to the eye and needs no explaining. The
// byte counts sit in a fixed column to the right of the longest bar — aligned numbers
// compare far better than numbers chasing the ends of their own bars.
const PX_PER_BYTE = 16;
const BAR = {height: 54, radius: 8, left: -180} as const;
const LABEL_RIGHT = -202;
const NUMBER_X = 350;
const ROW_STEP = 88;
const VERDICT_Y = 180;

const GROW = 0.7;
const LABEL_IN = 0.4;
const DIM = 0.32;

interface Row {
  key: string;
  label: string;
  bytes: number;
}

const ROWS: readonly Row[] = [
  {key: 'eth', label: 'ETHERNET · КАДР', bytes: 26},
  {key: 'ip', label: 'IP · ПАКЕТ', bytes: 20},
  {key: 'udp', label: 'UDP · ДАТАГРАММА', bytes: 8},
];

export interface OverheadStack {
  readonly node: Node;
  /** Grow one row's bar and count its bytes up. */
  show(key: string): ThreadGenerator;
  /** Push the other two back and land the verdict on UDP. */
  crownUdp(): ThreadGenerator;
  /** Leave, so the ports beat gets the floor. */
  dismiss(): ThreadGenerator;
}

/** Системные байты трёх уровней в одном масштабе. */
export function overheadStack(): OverheadStack {
  const group = createRef<Node>();
  const rows = ROWS.map(() => createRef<Node>());
  const bars = ROWS.map(() => createRef<Rect>());
  const counts = ROWS.map(() => createSignal(0));
  const verdict = createRef<Txt>();

  const accent = colors.cyan;
  const rowY = (index: number) => (index - 1) * ROW_STEP;

  const node = (
    <Node ref={group}>
      {ROWS.map((row, index) => (
        <Node ref={rows[index]} y={rowY(index)} opacity={0}>
          <Txt offset={[1, 0]} x={LABEL_RIGHT} text={row.label} fill={colors.textDim}
            fontSize={20} fontFamily={fonts.mono} letterSpacing={1.2}/>
          <Rect ref={bars[index]} offset={[-1, 0]} x={BAR.left} width={0} height={BAR.height}
            radius={BAR.radius} fill={withAlpha(accent, 0.22)} stroke={accent} lineWidth={1.8}/>
          <Txt offset={[-1, 0]} x={NUMBER_X}
            text={() => `${Math.round(counts[index]())} Б`} fill={colors.text} fontSize={26}
            fontFamily={fonts.mono} fontWeight={600}/>
        </Node>
      ))}

      <Txt ref={verdict} y={VERDICT_Y} text="самый дешёвый транспорт из возможных"
        fill={colors.text} fontSize={25} fontFamily={fonts.display} fontWeight={600}
        opacity={0}/>
    </Node>
  );

  function* show(key: string): ThreadGenerator {
    const index = ROWS.findIndex(row => row.key === key);
    yield* all(
      rows[index]().opacity(1, LABEL_IN, easeOutCubic),
      bars[index]().width(ROWS[index].bytes * PX_PER_BYTE, GROW, easeOutCubic),
      counts[index](ROWS[index].bytes, GROW, easeOutCubic),
    );
  }

  function* crownUdp(): ThreadGenerator {
    const udp = ROWS.findIndex(row => row.key === 'udp');
    yield* all(
      ...rows.map((row, index) =>
        index === udp ? row().opacity(1, 0.4) : row().opacity(DIM, 0.5, easeInOutCubic),
      ),
      bars[udp]().fill(withAlpha(colors.orange, 0.28), 0.5),
      bars[udp]().stroke(colors.orange, 0.5),
      delay(0.3, verdict().opacity(1, 0.6, easeOutCubic)),
    );
  }

  function* dismiss(): ThreadGenerator {
    yield* all(
      group().opacity(0, 0.5, easeInOutCubic),
      group().y(group().y() - 24, 0.5, easeInOutCubic),
    );
  }

  return {node, show, crownUdp, dismiss};
}
