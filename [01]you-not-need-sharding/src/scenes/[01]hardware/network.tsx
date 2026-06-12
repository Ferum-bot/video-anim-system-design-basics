import {Circle, Line, makeScene2D, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, easeInOutCubic, easeOutCubic, waitFor} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {
  banner, colors, createStage, fonts, formatThousands,
  sceneTitle, specCard, withAlpha,
} from '@lib';

// ─── Latency band ──────────────────────────────────────────────────────────────
// Two nodes joined by a link; a pulse travels A → B, and its travel time is the
// latency — so cross-region visibly crawls compared to within-AZ.

type NodeKind = 'dot' | 'box';

interface LatencyBandOptions {
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
}

const DOT_RADIUS = 20;
const BOX = {width: 150, height: 60};
const NODE_X = {dot: {a: -40, b: 150}, box: {a: -70, b: 190}} as const;

// Reveal timings — deliberately slow (~2× the card reveals) so each tier registers.
const REVEAL_NODES = 1.2;
const REVEAL_LINK = 0.8;
const REVEAL_VALUE = 1.0;

function latencyNode(kind: NodeKind, x: number, label: string, accent: string) {
  const ref = createRef<Node>();
  const glow = {shadowColor: withAlpha(accent, 0.33), shadowBlur: 12};
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

interface LatencyBand {
  node: Node;
  /** Fade in the nodes, draw the link, show the latency value. */
  reveal(): ThreadGenerator;
  /** Endless ping-pong pulse — run as a background thread (`yield band.pulse()`). */
  pulse(): ThreadGenerator;
}

function latencyBand(options: LatencyBandOptions): LatencyBand {
  const {scope, kind, from, to, latency, accent, travel, y} = options;
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
        shadowColor={accent} shadowBlur={16} opacity={0}/>
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

  return {node, reveal, pulse};
}

// ─── Scene ────────────────────────────────────────────────────────────────────
export default makeScene2D(function* (view) {
  const stage = createStage(view);

  const title = sceneTitle({
    title: 'Сеть',
    subtitle: 'Современные сетевые возможности',
    accent: colors.blue,
  });
  stage.add(title.node);
  yield* title.appear();

  // Section label, reused across the two phases.
  const phase = createRef<Txt>();
  stage.add(
    <Txt ref={phase} text="Пропускная способность" fill={colors.textMuted}
      fontSize={26} fontWeight={600} fontFamily={fonts.mono} y={-330} opacity={0}/>,
  );
  yield* phase().opacity(1, 0.5, easeOutCubic);
  yield* waitFor(0.3);

  // ── Phase A: bandwidth (cards without a price) ──────────────────────────────
  const standard = specCard({
    name: 'Standard instance', tag: 'EC2', spec: 'Внутри датацентра',
    accent: colors.blue, y: -200, pace: 1.5,
    meter: {label: 'Пропускная способность', fill: 0.25, value: 25, format: v => `${formatThousands(v)} Gbps`},
  });
  stage.add(standard.node);
  yield* standard.appear();
  yield* waitFor(0.6);

  const highPerf = specCard({
    name: 'High-performance', tag: 'EFA / Enhanced', spec: '50–100 Gbps и выше',
    accent: colors.green, y: 30, pace: 1.5,
    meter: {label: 'Пропускная способность', fill: 1.0, value: 100, format: v => `${formatThousands(v)} Gbps`},
  });
  stage.add(highPerf.node);
  yield* highPerf.appear();
  yield* waitFor(0.4);

  const note = createRef<Txt>();
  stage.add(
    <Txt ref={note} text="Между AZ в регионе — ограничено только сетью инстанса"
      fill={colors.textMuted} fontSize={21} fontFamily={fonts.mono} y={210} opacity={0}/>,
  );
  yield* note().opacity(1, 0.7, easeOutCubic);
  yield* waitFor(1.6);

  // ── Transition to latency ───────────────────────────────────────────────────
  yield* all(
    standard.node.opacity(0, 0.6),
    highPerf.node.opacity(0, 0.6),
    note().opacity(0, 0.6),
  );
  standard.node.remove();
  highPerf.node.remove();
  note().remove();
  yield* phase().text('Задержки предсказуемы', 0.4);
  yield* waitFor(0.3);

  // ── Phase B: latency topology ───────────────────────────────────────────────
  const bands = [
    latencyBand({scope: 'Внутри AZ', kind: 'dot', from: 'node', to: 'node',
      latency: '< 1 ms', accent: colors.green, travel: 0.4, y: -170}),
    latencyBand({scope: 'Между AZ', kind: 'box', from: 'AZ-a', to: 'AZ-b',
      latency: '1–2 ms', accent: colors.cyan, travel: 0.7, y: 40}),
    latencyBand({scope: 'Между регионами', kind: 'box', from: 'us-east-1', to: 'eu-west-1',
      latency: '50–150 ms', accent: colors.orange, travel: 1.5, y: 250}),
  ];
  for (const band of bands) stage.add(band.node);
  for (const band of bands) {
    yield* band.reveal();
    yield band.pulse(); // fork: keeps bouncing in the background
    yield* waitFor(0.5);
  }

  const outro = banner({
    text: 'Предсказуемая сеть → надёжные распределённые системы',
    accent: colors.blue, y: 410,
  });
  stage.add(outro.node);
  yield* outro.appear();
  yield* waitFor(8.5); // long hold on the final frame for narration
});
