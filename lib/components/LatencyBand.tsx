import {Circle, Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, easeInOutCubic, easeOutCubic} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '../theme';

// Two nodes joined by a link; a pulse travels A → B forever, and its travel time is
// the latency — so a slower pulse reads as higher latency. Used for any "A talks to B
// with this delay" comparison (network hops, cache read/write paths…).

export type NodeKind = 'dot' | 'box';

export interface LatencyBandOptions {
  /** Scope label on the left, e.g. "Между AZ". */
  scope: string;
  kind: NodeKind;
  from: string;
  to: string;
  latency: string; // '< 1 ms' | '1–2 ms' | '50–150 ms'
  accent: string;
  /** Pulse travel time in seconds — longer means higher latency. */
  travel: number;
  y: number;
  /** Timeline marker fired before this band reveals. */
  cue: string;
}

export interface LatencyBand {
  node: Node;
  /** Timeline marker fired before this band reveals. */
  cue: string;
  /** Fade in the nodes, draw the link, show the latency value. */
  reveal(): ThreadGenerator;
  /** Endless ping-pong pulse — run as a background thread (`yield band.pulse()`). */
  pulse(): ThreadGenerator;
}

const DOT_RADIUS = 20;
const BOX = {width: 150, height: 60};
const NODE_X = {dot: {a: -40, b: 150}, box: {a: -70, b: 190}} as const;

// Reveal timings — deliberately slow so each tier registers.
const REVEAL_NODES = 1.2;
const REVEAL_LINK = 0.8;
const REVEAL_VALUE = 1.0;

function latencyNode(kind: NodeKind, x: number, label: string, accent: string) {
  const ref = createRef<Node>();
  const glow = {shadowColor: withAlpha(accent, 0.28), shadowBlur: 6};
  const node = kind === 'dot' ? (
    <Node ref={ref} x={x} opacity={0} scale={0.7}>
      <Circle width={DOT_RADIUS * 2} height={DOT_RADIUS * 2}
        fill={colors.surface} stroke={accent} lineWidth={2.5} {...glow}/>
      <Txt text={label} fill={colors.textMuted} fontSize={15} fontFamily={fonts.mono} y={38}/>
    </Node>
  ) : (
    <Node ref={ref} x={x} opacity={0} scale={0.7}>
      <Rect width={BOX.width} height={BOX.height} radius={10}
        fill={colors.surface} stroke={accent} lineWidth={2} {...glow}/>
      <Txt text={label} fill={colors.text} fontSize={20} fontWeight={600} fontFamily={fonts.mono}/>
    </Node>
  );
  return {ref, node};
}

export function latencyBand(options: LatencyBandOptions): LatencyBand {
  const {scope, kind, from, to, latency, accent, travel, y, cue} = options;
  const ax = NODE_X[kind].a;
  const bx = NODE_X[kind].b;
  const edge = kind === 'dot' ? DOT_RADIUS + 4 : BOX.width / 2 + 4;

  const a = latencyNode(kind, ax, from, accent);
  const b = latencyNode(kind, bx, to, accent);
  const scopeRef = createRef<Txt>();
  const linkRef = createRef<Line>();
  const pulseRef = createRef<Circle>();
  const latencyRef = createRef<Txt>();

  const node = (
    <Node y={y}>
      <Txt ref={scopeRef} text={scope} fill={colors.textDim} fontSize={22}
        fontFamily={fonts.mono} x={-340} textAlign="center" opacity={0}/>
      <Line ref={linkRef} points={[[ax + edge, 0], [bx - edge, 0]]}
        stroke={accent} lineWidth={3} lineCap="round" opacity={0.5} end={0}/>
      <Circle ref={pulseRef} width={16} height={16} x={ax} fill={accent}
        shadowColor={accent} shadowBlur={10} opacity={0}/>
      {a.node}
      {b.node}
      <Txt ref={latencyRef} text={latency} fill={accent} fontSize={32}
        fontWeight={700} fontFamily={fonts.mono} x={380} opacity={0}/>
    </Node>
  );

  function* reveal(): ThreadGenerator {
    yield* all(
      scopeRef().opacity(1, REVEAL_NODES, easeOutCubic),
      a.ref().opacity(1, REVEAL_NODES, easeOutCubic),
      a.ref().scale(1, REVEAL_NODES, easeOutCubic),
      b.ref().opacity(1, REVEAL_NODES, easeOutCubic),
      b.ref().scale(1, REVEAL_NODES, easeOutCubic),
    );
    yield* all(
      linkRef().end(1, REVEAL_LINK, easeInOutCubic),
      latencyRef().opacity(1, REVEAL_VALUE, easeOutCubic),
    );
  }

  function* pulse(): ThreadGenerator {
    pulseRef().position.x(ax);
    yield* pulseRef().opacity(1, 0.2);
    // bounce forever; each leg takes `travel` seconds, so latency is visible in speed
    while (true) {
      yield* pulseRef().position.x(bx, travel, easeInOutCubic);
      yield* pulseRef().position.x(ax, travel, easeInOutCubic);
    }
  }

  return {node, cue, reveal, pulse};
}
