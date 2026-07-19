import {Layout, Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, easeOutBack, easeOutCubic} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';

// The TCP/IP stack, walked bottom→up: Link → Internet(IP) → Transport → Application. IP's
// "guarantees nothing" chaos and the TCP-vs-UDP split appear as side callouts on their layers.

const ROW_W = 470;
const ROW_H = 92;
const SX = -175; // stack centre x (left of the callout column)
const CALLOUT_X = 258; // right-hand callout column centre
const YS = [165, 55, -55, -165]; // Link, Internet, Transport, App

const DIM = 0.4;
const GLOW = 14;
const BASE_GLOW = 4;

interface Layer {
  tag: string;
  name: string;
  role: string;
  protos: string[];
  accent: string;
}
const LAYERS: Layer[] = [
  {tag: 'L1–2', name: 'Канальный', role: 'хост ↔ соседний узел', protos: ['Ethernet', 'Wi-Fi'], accent: colors.orange},
  {tag: 'L3', name: 'Межсетевой · IP', role: 'пакет в любую сеть', protos: ['IP', 'ICMP'], accent: colors.blue},
  {tag: 'L4', name: 'Транспортный', role: 'между процессами', protos: ['TCP', 'UDP', 'QUIC'], accent: colors.cyan},
  {tag: 'L5–7', name: 'Прикладной', role: 'осмысленное общение', protos: ['HTTP', 'DNS'], accent: colors.purple},
];

function Row({layer, y, rowRef}: {layer: Layer; y: number; rowRef: ReturnType<typeof createRef<Rect>>}) {
  return (
    <Rect ref={rowRef} x={SX} y={y} width={ROW_W} height={ROW_H} radius={9} padding={[0, 20]}
      layout direction="row" alignItems="center" gap={14}
      fill={colors.track} stroke={layer.accent} lineWidth={2}
      shadowColor={layer.accent} shadowBlur={0} opacity={0}>
      <Rect layout radius={5} padding={[3, 7]} fill={withAlpha(layer.accent, 0.12)}>
        <Txt text={layer.tag} fill={layer.accent} fontSize={15} fontFamily={fonts.mono}/>
      </Rect>
      <Layout layout direction="column" gap={3} grow={1}>
        <Txt text={layer.name} fill={colors.text} fontSize={23} fontWeight={600} fontFamily={fonts.display}/>
        <Txt text={layer.role} fill={colors.textMuted} fontSize={15} fontFamily={fonts.mono}/>
      </Layout>
      <Layout layout direction="row" gap={5}>
        {layer.protos.map(p => (
          <Rect layout radius={5} padding={[3, 8]} stroke={withAlpha(layer.accent, 0.7)} lineWidth={1}
            fill={withAlpha(layer.accent, 0.08)}>
            <Txt text={p} fill={layer.accent} fontSize={14} fontFamily={fonts.mono}/>
          </Rect>
        ))}
      </Layout>
    </Rect>
  );
}

export interface TcpipStack {
  node: Node;
  /** Reveal layer `i` (0 Link … 3 App) and focus it. */
  reveal(i: number): ThreadGenerator;
  /** "…живёт в железе" tag on the Link layer. */
  hw(): ThreadGenerator;
  /** IP "guarantees nothing" callout next to the Internet layer. */
  chaos(): ThreadGenerator;
  /** TCP-vs-UDP callout next to the Transport layer. */
  tcpudp(): ThreadGenerator;
}

export function tcpipStack(options: {y: number}): TcpipStack {
  const rowRefs = LAYERS.map(() => createRef<Rect>());
  const arrow = createRef<Line>();
  const hwTag = createRef<Node>();
  const chaosPanel = createRef<Node>();
  const tcpudpPanel = createRef<Node>();
  const revealed = LAYERS.map(() => false);
  let focused = -1;

  const faults = ['дубли', 'потери', 'петли', 'порядок'];

  const node = (
    <Layout y={options.y}>
      {/* bottom→up direction arrow, left of the stack */}
      <Line ref={arrow} points={[[SX - ROW_W / 2 - 24, 200], [SX - ROW_W / 2 - 24, -200]]}
        lineWidth={2} lineDash={[5, 7]} stroke={withAlpha(colors.primary, 0.5)} endArrow arrowSize={11}/>

      {LAYERS.map((l, i) => <Row layer={l} y={YS[i]} rowRef={rowRefs[i]}/>)}

      {/* Link: lives in hardware */}
      <Node ref={hwTag} x={CALLOUT_X} y={YS[0]} opacity={0}>
        <Rect layout radius={7} padding={[6, 12]} fill={withAlpha(colors.orange, 0.1)} stroke={colors.orange} lineWidth={1.5}>
          <Txt text="в железе · NIC / коммутатор" fill={colors.orange} fontSize={15} fontFamily={fonts.mono}/>
        </Rect>
      </Node>

      {/* Internet/IP: guarantees nothing */}
      <Node ref={chaosPanel} x={CALLOUT_X} y={YS[1]} opacity={0} scale={0.9}>
        <Rect layout direction="column" gap={7} alignItems="center" radius={9} padding={[10, 14]}
          fill={withAlpha(colors.red, 0.08)} stroke={colors.red} lineWidth={2}>
          <Txt text="IP не гарантирует ничего" fill={colors.red} fontSize={17} fontWeight={700} fontFamily={fonts.mono}/>
          <Layout layout direction="row" gap={6}>
            {faults.map(f => (
              <Rect layout radius={5} padding={[3, 7]} stroke={withAlpha(colors.red, 0.6)} lineWidth={1}>
                <Txt text={f} fill={withAlpha(colors.red, 0.9)} fontSize={14} fontFamily={fonts.mono}/>
              </Rect>
            ))}
          </Layout>
        </Rect>
      </Node>

      {/* Transport: TCP vs UDP */}
      <Node ref={tcpudpPanel} x={CALLOUT_X} y={YS[2]} opacity={0} scale={0.9}>
        <Layout layout direction="column" gap={8} alignItems="center">
          <Rect layout radius={7} padding={[5, 12]} fill={withAlpha(colors.green, 0.1)} stroke={colors.green} lineWidth={1.5}>
            <Txt text="TCP · гарантирует ✓" fill={colors.green} fontSize={16} fontFamily={fonts.mono}/>
          </Rect>
          <Rect layout radius={7} padding={[5, 12]} fill={withAlpha(colors.orange, 0.1)} stroke={colors.orange} lineWidth={1.5}>
            <Txt text="UDP · без гарантий ⚡" fill={colors.orange} fontSize={16} fontFamily={fonts.mono}/>
          </Rect>
        </Layout>
      </Node>
    </Layout>
  );

  function* reveal(i: number): ThreadGenerator {
    focused = i;
    revealed[i] = true;
    const tw: ThreadGenerator[] = [
      rowRefs[i]().opacity(1, 0.55, easeOutCubic),
      rowRefs[i]().shadowBlur(GLOW, 0.55, easeOutCubic),
    ];
    if (i === 0) tw.push(arrow().end(1, 1.0, easeOutCubic));
    revealed.forEach((r, j) => {
      if (r && j !== i) {
        tw.push(rowRefs[j]().opacity(DIM, 0.4, easeOutCubic));
        tw.push(rowRefs[j]().shadowBlur(0, 0.4, easeOutCubic));
      }
    });
    yield* all(...tw);
  }

  function* hw(): ThreadGenerator {
    yield* hwTag().opacity(1, 0.5, easeOutCubic);
  }

  function* chaos(): ThreadGenerator {
    yield* all(chaosPanel().opacity(1, 0.5, easeOutCubic), chaosPanel().scale(1, 0.5, easeOutBack));
  }

  function* tcpudp(): ThreadGenerator {
    yield* all(tcpudpPanel().opacity(1, 0.5, easeOutCubic), tcpudpPanel().scale(1, 0.5, easeOutBack));
  }

  return {node, reveal, hw, chaos, tcpudp};
}
