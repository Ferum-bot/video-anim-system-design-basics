import {Circle, Layout, Line, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, createSignal, easeInOutCubic, easeOutCubic, waitFor} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts} from '@lib';
import type {Widget} from '@lib';

// Geometry
const NODE_W = 132;
const NODE_H = 88;
const SPAN = 300; // distance of each node centre from the middle
const WIRE_X = SPAN - NODE_W / 2 - 6; // wire reaches from -WIRE_X to +WIRE_X

// Timings
const REVEAL = 0.7;
const TRAVEL = 1.1; // one packet crossing

export interface HandshakeStep {
  label: string; // 'SYN', 'SYN-ACK', 'ACK'
  /** `1` = client → server, `-1` = server → client. */
  dir: 1 | -1;
  color: string;
}

export interface HandshakeOptions {
  client: string;
  server: string;
  steps: HandshakeStep[];
  y: number;
}

/** A labelled endpoint tile (client / server). */
function DeviceNode({title, sub, x, nodeRef}: {
  title: string; sub: string; x: number; nodeRef: ReturnType<typeof createRef<Rect>>;
}) {
  return (
    <Rect ref={nodeRef} layout direction="column" gap={8} alignItems="center" justifyContent="center"
      x={x} width={NODE_W} height={NODE_H} radius={12}
      fill={colors.surface} stroke={colors.borderStrong} lineWidth={2} opacity={0}>
      <Txt text={title} fill={colors.text} fontSize={26} fontWeight={700} fontFamily={fonts.mono}/>
      <Txt text={sub} fill={colors.textMuted} fontSize={15} fontFamily={fonts.mono}/>
    </Rect>
  );
}

/**
 * The TCP three-way handshake: two endpoints joined by a dashed wire; packets ride
 * across one at a time with their flag label, then the link is marked ESTABLISHED.
 * `appear()` reveals the endpoints + wire; `play()` runs the exchange.
 */
export function handshake(options: HandshakeOptions): Widget & {play(): ThreadGenerator} {
  const {client, server, steps, y} = options;

  const clientRef = createRef<Rect>();
  const serverRef = createRef<Rect>();
  const wire = createRef<Line>();
  const packet = createRef<Circle>();
  const label = createRef<Txt>();
  const established = createRef<Layout>();

  const packetX = createSignal(-WIRE_X);

  const node = (
    <Layout y={y}>
      <Line ref={wire} lineWidth={2} stroke={colors.borderStrong} lineDash={[6, 8]} end={0}
        points={[[-WIRE_X, 0], [WIRE_X, 0]]}/>

      <DeviceNode title={client} sub="client" x={-SPAN} nodeRef={clientRef}/>
      <DeviceNode title={server} sub="server" x={SPAN} nodeRef={serverRef}/>

      {/* travelling packet + its flag label */}
      <Txt ref={label} y={-38} x={() => packetX()} text="" fill={colors.text}
        fontSize={22} fontWeight={700} fontFamily={fonts.mono} opacity={0}/>
      <Circle ref={packet} x={() => packetX()} size={16} fill={colors.primary}
        shadowColor={colors.primary} shadowBlur={16} opacity={0}/>

      {/* status badge, revealed once the handshake completes */}
      <Layout ref={established} layout y={54} gap={8} alignItems="center" opacity={0}>
        <Circle size={9} fill={colors.green} shadowColor={colors.green} shadowBlur={10}/>
        <Txt text="ESTABLISHED" fill={colors.green} fontSize={18} letterSpacing={3} fontFamily={fonts.mono}/>
      </Layout>
    </Layout>
  );

  function* send(step: HandshakeStep): ThreadGenerator {
    const from = -step.dir * WIRE_X;
    const to = step.dir * WIRE_X;
    packetX(from);
    packet().fill(step.color).shadowColor(step.color);
    label().text(step.label).fill(step.color);
    yield* all(
      packet().opacity(1, 0.2),
      label().opacity(1, 0.2),
    );
    yield* packetX(to, TRAVEL, easeInOutCubic);
    yield* all(
      packet().opacity(0, 0.25),
      label().opacity(0, 0.25),
    );
  }

  function* appear(): ThreadGenerator {
    yield* all(
      clientRef().opacity(1, REVEAL, easeOutCubic),
      serverRef().opacity(1, REVEAL, easeOutCubic),
      wire().end(1, REVEAL, easeOutCubic),
    );
  }

  function* play(): ThreadGenerator {
    for (const step of steps) {
      yield* send(step);
      yield* waitFor(0.15);
    }
    yield* established().opacity(1, 0.5, easeOutCubic);
  }

  return {node, appear, play};
}
