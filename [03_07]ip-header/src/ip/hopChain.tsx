import {Circle, Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  delay,
  easeInOutCubic,
  easeInOutSine,
  easeOutCubic,
  linear,
  range,
  waitFor,
} from '@motion-canvas/core';
import type {SimpleSignal, ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// Sender plus four routers — few enough that a TTL small enough to die on screen is still
// believable, wide enough that the packet visibly travels.
const HOPS = ['ТЫ', 'R1', 'R2', 'R3', 'R4'] as const;
const SPAN = 780;
const NODE = {size: 62, radius: 12} as const;
const CHAIN_Y = -30;
const LIST_Y = 78;
const LIST_STEP = 40;
const LOOP = {x: 300, y: 150, radius: 58} as const;

const TRACE = [
  '1   192.168.0.1        1.4 ms',
  '2   81.211.44.1        6.2 ms',
  '3   85.132.9.17       14.8 ms',
] as const;

const APPEAR = 0.7;
const HOP_TIME = 0.75;
const DIE = 0.45;
const WARN = 0.9;
const LINE_IN = 0.45;

const nodeX = (index: number) => -SPAN / 2 + (index * SPAN) / (HOPS.length - 1);

export interface HopChainOptions {
  y: number;
  /** The same number the header cell shows. */
  ttl: SimpleSignal<number>;
}

export interface HopChain extends Widget {
  /** Move the packet one router along and spend a hop. */
  hop(index: number): ThreadGenerator;
  /** The counter hit zero: the packet is dropped. */
  die(): ThreadGenerator;
  /** A warning runs back down the chain to whoever sent it. */
  warn(): ThreadGenerator;
  /** Put the packet back at the sender with a fresh budget. */
  reset(ttl: number): ThreadGenerator;
  /** The counter-example: without TTL the packet just keeps going round. */
  showLoop(): ThreadGenerator;
  /** Endless orbit for the loop — fork it. */
  spinLoop(): ThreadGenerator;
  hideLoop(): ThreadGenerator;
  /** One line of traceroute output. */
  traceLine(index: number): ThreadGenerator;
}

/** Routers in a row, a packet with a hop budget, and what happens when it runs out. */
export function hopChain({y, ttl}: HopChainOptions): HopChain {
  const group = createRef<Node>();
  const nodes = HOPS.map(() => createRef<Rect>());
  const packet = createRef<Rect>();
  const flash = createRef<Circle>();
  const warning = createRef<Line>();
  const loop = createRef<Node>();
  const orbit = createRef<Circle>();
  const lines = TRACE.map(() => createRef<Txt>());

  const at = createSignal(0); // packet position along the chain, in node indices
  const orbitAngle = createSignal(0);

  const accent = colors.cyan;

  const node = (
    <Node ref={group} y={y}>
      <Line points={[[nodeX(0), CHAIN_Y], [nodeX(HOPS.length - 1), CHAIN_Y]]}
        stroke={withAlpha(accent, 0.3)} lineWidth={2}/>

      {HOPS.map((label, index) => (
        <Rect ref={nodes[index]} x={nodeX(index)} y={CHAIN_Y} width={NODE.size}
          height={NODE.size} radius={NODE.radius} fill={withAlpha(colors.surface, 0.9)}
          stroke={withAlpha(accent, index === 0 ? 0.85 : 0.5)} lineWidth={1.5}
          opacity={0} scale={0.9}>
          <Txt text={label} fill={index === 0 ? colors.text : colors.textDim} fontSize={18}
            fontFamily={fonts.mono} letterSpacing={1}/>
        </Rect>
      ))}

      <Circle ref={flash} y={CHAIN_Y} x={() => nodeX(0) + at() * (SPAN / (HOPS.length - 1))}
        size={96} fill={withAlpha(colors.red, 0.35)} shadowColor={colors.red}
        shadowBlur={36} opacity={0}/>

      <Rect ref={packet} y={CHAIN_Y - 52}
        x={() => nodeX(0) + at() * (SPAN / (HOPS.length - 1))}
        width={68} height={38} radius={8} fill={withAlpha(colors.orange, 0.22)}
        stroke={colors.orange} lineWidth={1.5} shadowColor={withAlpha(colors.orange, 0.6)}
        shadowBlur={14} opacity={0}>
        <Txt text={() => `TTL ${Math.round(ttl())}`} fill={colors.text} fontSize={18}
          fontFamily={fonts.mono} fontWeight={600}/>
      </Rect>

      <Line ref={warning} y={CHAIN_Y + 46}
        points={[[nodeX(HOPS.length - 1), 0], [nodeX(0), 0]]} stroke={colors.red}
        lineWidth={2} lineDash={[9, 7]} endArrow arrowSize={10} end={0}/>

      <Node ref={loop} x={LOOP.x} y={LOOP.y} opacity={0}>
        <Circle size={LOOP.radius * 2} stroke={withAlpha(colors.red, 0.5)} lineWidth={2}
          lineDash={[8, 7]}/>
        <Circle ref={orbit} size={13} fill={colors.red} shadowColor={colors.red}
          shadowBlur={16}
          position={() => [
            Math.cos(orbitAngle()) * LOOP.radius,
            Math.sin(orbitAngle()) * LOOP.radius,
          ]}/>
        <Txt y={LOOP.radius + 26} text="без TTL — вечно" fill={withAlpha(colors.red, 0.9)}
          fontSize={19} fontFamily={fonts.display}/>
      </Node>

      {TRACE.map((text, index) => (
        <Txt ref={lines[index]} offset={[-1, 0]} x={-SPAN / 2} y={LIST_Y + index * LIST_STEP}
          text={text} fill={colors.textDim} fontSize={21} fontFamily={fonts.mono}
          opacity={0}/>
      ))}
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* all(
      ...nodes.flatMap((host, index) => [
        delay(index * 0.06, host().opacity(1, APPEAR, easeOutCubic)),
        delay(index * 0.06, host().scale(1, APPEAR, easeOutCubic)),
      ]),
      delay(0.4, packet().opacity(1, 0.5, easeOutCubic)),
    );
  }

  function* hop(index: number): ThreadGenerator {
    yield* all(at(index, HOP_TIME, easeInOutCubic), ttl(ttl() - 1, HOP_TIME, linear));
  }

  function* die(): ThreadGenerator {
    yield* all(
      flash().opacity(1, DIE * 0.3, easeOutCubic),
      delay(DIE * 0.3, flash().opacity(0, DIE, easeInOutCubic)),
      delay(DIE * 0.2, all(packet().opacity(0, DIE, easeInOutCubic), packet().scale(0.7, DIE))),
    );
    packet().scale(1);
  }

  function* warn(): ThreadGenerator {
    warning().points([[nodeX(at()), 0], [nodeX(0), 0]]).end(0);
    yield* warning().end(1, WARN, easeInOutCubic);
    yield* warning().opacity(0.4, 0.4, easeInOutCubic);
  }

  function* reset(value: number): ThreadGenerator {
    warning().opacity(1).end(0);
    at(0);
    ttl(value);
    yield* packet().opacity(1, 0.35, easeOutCubic);
  }

  function* showLoop(): ThreadGenerator {
    yield* loop().opacity(1, 0.6, easeOutCubic);
  }

  function* spinLoop(): ThreadGenerator {
    while (true) {
      orbitAngle(0);
      yield* orbitAngle(Math.PI * 2, 2.4, linear);
    }
  }

  function* hideLoop(): ThreadGenerator {
    yield* loop().opacity(0, 0.5, easeInOutSine);
  }

  function* traceLine(index: number): ThreadGenerator {
    yield* all(
      lines[index]().opacity(1, LINE_IN, easeOutCubic),
      lines[index]().x(-SPAN / 2 + 12, LINE_IN, easeOutCubic),
    );
  }

  return {node, appear, hop, die, warn, reset, showLoop, spinLoop, hideLoop, traceLine};
}
