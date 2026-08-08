import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  delay,
  easeInCubic,
  easeInOutCubic,
  easeOutCubic,
  waitFor,
} from '@motion-canvas/core';
import type {Reference, ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// ── Geometry ──────────────────────────────────────────────────────────────────
const NODE = {width: 150, height: 88, radius: 14} as const;
const NODE_X = 212;
const BOUNDARY = {x: 344, height: 188} as const;
const PILL = {radius: 999, padding: [8, 16] satisfies [number, number]};
// Caption and verdict share one slot — they cross-fade, never coexist.
const LINE_Y = 104;
const BOUNDARY_LABEL_Y = -126;

// ── Timing ────────────────────────────────────────────────────────────────────
const APPEAR = 0.7;
const LINK_IN = 0.55;
const BOUNDARY_IN = 0.5;
const RUN = 1.15; // how long a frame takes to reach the edge
const DIE = 0.35;
const RETRY_GAP = 1.2; // pause between doomed attempts

export interface SegmentScopeOptions {
  /** Vertical centre of the link. */
  y: number;
  /** The address text echoed on the travelling frame. */
  address: string;
}

export interface SegmentScope extends Widget {
  /** Draw the segment edge, send one frame into it, and land the verdict. */
  bound(): ThreadGenerator;
  /** Endless: another frame tries to cross and dies. Fork it with `yield`. */
  keepTrying(): ThreadGenerator;
}

/**
 * Where the address actually works: a link between two neighbours, and the segment edge
 * it never gets past. Frames keep running at that edge and keep dying on it, so the beat
 * stays alive while the narration finishes the thought.
 */
export function segmentScope({y, address}: SegmentScopeOptions): SegmentScope {
  const group = createRef<Node>();
  const link = createRef<Line>();
  const nodes = [createRef<Rect>(), createRef<Rect>()];
  const resting = createRef<Rect>();
  const runner = createRef<Rect>();
  const boundary = createRef<Line>();
  const boundaryLabel = createRef<Txt>();
  const impact = createRef<Rect>();
  const caption = createRef<Txt>();
  const verdict = createRef<Txt>();

  const accent = colors.cyan;

  const host = (index: number, x: number, label: string) => (
    <Rect ref={nodes[index]} x={x} width={NODE.width} height={NODE.height}
      radius={NODE.radius} fill={withAlpha(colors.surface, 0.85)}
      stroke={withAlpha(colors.borderStrong, 0.9)} lineWidth={1.5}
      opacity={0} scale={0.9}>
      <Txt text={label} fill={colors.textDim} fontSize={22} fontFamily={fonts.mono}
        letterSpacing={1.5}/>
    </Rect>
  );

  const framePill = (ref: Reference<Rect>, opacity: number) => (
    <Rect ref={ref} layout padding={PILL.padding} radius={PILL.radius}
      fill={withAlpha(accent, 0.16)} stroke={withAlpha(accent, 0.6)} lineWidth={1.5}
      opacity={opacity}>
      <Txt text={address} fill={colors.text} fontSize={17} fontFamily={fonts.mono}/>
    </Rect>
  );

  const node = (
    <Node ref={group} y={y}>
      <Line ref={link} points={[[-NODE_X + NODE.width / 2, 0], [NODE_X - NODE.width / 2, 0]]}
        stroke={withAlpha(accent, 0.45)} lineWidth={2} end={0}/>
      {host(0, -NODE_X, 'ТЫ')}
      {host(1, NODE_X, 'СОСЕД')}

      <Line ref={boundary} x={BOUNDARY.x}
        points={[[0, -BOUNDARY.height / 2], [0, BOUNDARY.height / 2]]}
        stroke={withAlpha(colors.red, 0.7)} lineWidth={2.5} lineDash={[9, 8]} end={0}/>
      <Rect ref={impact} x={BOUNDARY.x} width={5} height={BOUNDARY.height} radius={3}
        fill={colors.red} shadowColor={colors.red} shadowBlur={26} opacity={0}/>
      <Txt ref={boundaryLabel} x={BOUNDARY.x} y={BOUNDARY_LABEL_Y} text="ГРАНИЦА СЕГМЕНТА"
        fill={withAlpha(colors.red, 0.85)} fontSize={16} fontFamily={fonts.mono}
        letterSpacing={1} opacity={0}/>

      {framePill(resting, 0)}
      {framePill(runner, 0)}

      <Txt ref={caption} y={LINE_Y} text="адрес соседа — по кабелю или по эфиру"
        fill={colors.textMuted} fontSize={22} fontFamily={fonts.display} opacity={0}/>
      <Txt ref={verdict} y={LINE_Y} text="за пределы своего сегмента не уходит"
        fill={colors.textDim} fontSize={24} fontFamily={fonts.display} fontWeight={600}
        opacity={0}/>
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* all(
      ...nodes.flatMap(host => [
        host().opacity(1, APPEAR, easeOutCubic),
        host().scale(1, APPEAR, easeOutCubic),
      ]),
      delay(0.25, link().end(1, LINK_IN, easeInOutCubic)),
      delay(0.5, resting().opacity(1, 0.45, easeOutCubic)),
      delay(0.7, caption().opacity(1, 0.5, easeOutCubic)),
    );
  }

  /** One frame leaves the neighbour, reaches the edge and dies there. */
  function* run(): ThreadGenerator {
    runner().x(0).opacity(0).scale(1);
    yield* all(
      runner().opacity(1, 0.2, easeOutCubic),
      runner().x(BOUNDARY.x - 30, RUN, easeInCubic),
    );
    yield* all(
      runner().opacity(0, DIE, easeInOutCubic),
      runner().scale(0.72, DIE, easeInOutCubic),
      impact().opacity(1, DIE * 0.35, easeOutCubic),
      delay(DIE * 0.35, impact().opacity(0, DIE * 1.4, easeInOutCubic)),
    );
  }

  function* bound(): ThreadGenerator {
    yield* all(
      boundary().end(1, BOUNDARY_IN, easeOutCubic),
      boundaryLabel().opacity(1, BOUNDARY_IN, easeOutCubic),
      caption().opacity(0, 0.35, easeInOutCubic),
    );
    yield* run();
    yield* verdict().opacity(1, 0.5, easeOutCubic);
  }

  function* keepTrying(): ThreadGenerator {
    while (true) {
      yield* waitFor(RETRY_GAP);
      yield* run();
    }
  }

  return {node, appear, bound, keepTrying};
}
