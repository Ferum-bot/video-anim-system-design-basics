import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, delay, easeOutCubic} from '@motion-canvas/core';
import type {Reference, ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';

// Two rows with the same shape, so the only thing that differs is where the arrow lands:
// IP gets you to the machine, UDP gets you to one process inside it.
const CHIP = {x: -200, width: 132, height: 62, radius: 10} as const;
const ARROW = {from: -122, to: -34} as const;
const BOX = {x: 120, width: 272, height: 78, radius: 12} as const;
const ROW_Y = {ip: -62, udp: 88} as const;
const CAPTION_DY = 64;
const VERDICT_Y = 212;

const IN = 0.55;
const DRAW = 0.45;

export interface PortsPoint {
  readonly node: Node;
  /** IP already got the packet to the right machine. */
  toMachine(): ThreadGenerator;
  /** UDP adds the one thing IP has no idea about: which process. */
  toProcess(): ThreadGenerator;
  /** «Это единственная его задача». */
  verdict(): ThreadGenerator;
}

/** «IP доставляет до машины, UDP добавляет одно — какому процессу отдать». */
export function portsPoint(): PortsPoint {
  const ipRow = createRef<Node>();
  const udpRow = createRef<Node>();
  const ipArrow = createRef<Line>();
  const udpArrow = createRef<Line>();
  const verdictLabel = createRef<Txt>();

  const accent = colors.cyan;

  const row = (
    ref: Reference<Node>,
    arrowRef: Reference<Line>,
    y: number,
    chip: string,
    target: string,
    caption: string,
    highlight: boolean,
  ) => {
    const tone = highlight ? colors.orange : accent;
    return (
      <Node ref={ref} y={y} opacity={0}>
        <Rect x={CHIP.x} width={CHIP.width} height={CHIP.height} radius={CHIP.radius}
          fill={withAlpha(tone, 0.16)} stroke={withAlpha(tone, 0.8)} lineWidth={1.8}>
          <Txt text={chip} fill={tone} fontSize={26} fontFamily={fonts.mono} fontWeight={600}/>
        </Rect>

        <Line ref={arrowRef} points={[[ARROW.from, 0], [ARROW.to, 0]]}
          stroke={withAlpha(tone, 0.85)} lineWidth={2.4} endArrow arrowSize={11} end={0}/>

        <Rect x={BOX.x} width={BOX.width} height={BOX.height} radius={BOX.radius}
          fill={withAlpha(colors.surface, 0.92)}
          stroke={withAlpha(tone, highlight ? 0.9 : 0.5)} lineWidth={1.8}
          shadowColor={highlight ? withAlpha(tone, 0.5) : withAlpha(tone, 0)}
          shadowBlur={highlight ? 16 : 0}>
          <Txt text={target} fill={colors.text} fontSize={24} fontFamily={fonts.mono}
            fontWeight={500}/>
        </Rect>

        <Txt y={CAPTION_DY} text={caption} fill={colors.textMuted} fontSize={21}
          fontFamily={fonts.display}/>
      </Node>
    );
  };

  const node = (
    <Node>
      {row(ipRow, ipArrow, ROW_Y.ip, 'IP', 'МАШИНА', 'доставляет до машины', false)}
      {row(udpRow, udpArrow, ROW_Y.udp, 'UDP', 'ПРОЦЕСС :443', 'добавляет одно — какому процессу отдать', true)}
      <Txt ref={verdictLabel} y={VERDICT_Y} text="это единственная его задача"
        fill={colors.text} fontSize={25} fontFamily={fonts.display} fontWeight={600}
        opacity={0}/>
    </Node>
  );

  function* enter(group: Reference<Node>, arrow: Reference<Line>): ThreadGenerator {
    yield* all(
      group().opacity(1, IN, easeOutCubic),
      delay(0.2, arrow().end(1, DRAW, easeOutCubic)),
    );
  }

  function* toMachine(): ThreadGenerator {
    yield* enter(ipRow, ipArrow);
  }

  function* toProcess(): ThreadGenerator {
    yield* enter(udpRow, udpArrow);
  }

  function* verdict(): ThreadGenerator {
    yield* verdictLabel().opacity(1, 0.6, easeOutCubic);
  }

  return {node, toMachine, toProcess, verdict};
}
