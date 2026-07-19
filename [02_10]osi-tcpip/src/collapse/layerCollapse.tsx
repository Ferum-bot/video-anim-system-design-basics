import {Layout, Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, easeOutBack, easeOutCubic, sequence} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';

// OSI's 7 layers map onto TCP/IP's 4: the lower ones line up, but the top three (Application,
// Presentation, Session) collapse into TCP/IP's single Application layer.

const OSI_X = -250;
const OSI_W = 210;
const OSI_H = 46;
const TCP_X = 215;
const TCP_W = 230;
const OSI_EDGE = OSI_X + OSI_W / 2; // right edge of OSI rows
const TCP_EDGE = TCP_X - TCP_W / 2; // left edge of TCP/IP blocks

interface OsiRow {n: number; name: string; y: number; accent: string}
const OSI: OsiRow[] = [
  {n: 7, name: 'Application', y: -180, accent: colors.purple},
  {n: 6, name: 'Presentation', y: -120, accent: colors.purple},
  {n: 5, name: 'Session', y: -60, accent: colors.blue},
  {n: 4, name: 'Transport', y: 0, accent: colors.cyan},
  {n: 3, name: 'Network', y: 60, accent: colors.blue},
  {n: 2, name: 'Data Link', y: 120, accent: colors.orange},
  {n: 1, name: 'Physical', y: 180, accent: colors.red},
];

interface TcpBlock {name: string; note?: string; y: number; h: number; accent: string}
const TCP: TcpBlock[] = [
  {name: 'Прикладной', y: -120, h: 150, accent: colors.purple},
  {name: 'Транспортный', y: 0, h: 52, accent: colors.cyan},
  {name: 'Межсетевой', y: 60, h: 52, accent: colors.blue},
  {name: 'Канальный', note: 'L2 · L1', y: 150, h: 92, accent: colors.orange},
];

export interface LayerCollapse {
  node: Node;
  /** Reveal the OSI 7-layer stack on the left. */
  showOsi(): ThreadGenerator;
  /** Reveal the TCP/IP blocks + the 1:1 links for the lower layers. */
  showTcpip(): ThreadGenerator;
  /** Collapse the top three OSI layers into the single Application block. */
  collapse(): ThreadGenerator;
}

export function layerCollapse(options: {y: number}): LayerCollapse {
  const osiRefs = OSI.map(() => createRef<Rect>());
  const tcpRefs = TCP.map(() => createRef<Rect>());
  const tcpNote = createRef<Txt>(); // "= L7 · L6 · L5" on the App block
  const lowerLinks = createRef<Node>(); // L4→T, L3→I, L2/L1→Link
  const appLinks = createRef<Node>(); // L7/L6/L5 → App
  const mergeBadge = createRef<Node>();

  const link = (fromY: number, toY: number, accent: string, ref?: ReturnType<typeof createRef<Line>>) => (
    <Line ref={ref} points={[[OSI_EDGE, fromY], [TCP_EDGE, toY]]} lineWidth={2} lineDash={[5, 6]}
      stroke={withAlpha(accent, 0.7)} end={0} endArrow arrowSize={9}/>
  );

  const node = (
    <Layout y={options.y}>
      {/* headers */}
      <Txt text="OSI · 7" x={OSI_X} y={-235} fill={colors.textDim} fontSize={20} fontWeight={700} letterSpacing={2} fontFamily={fonts.mono}/>
      <Txt text="TCP/IP · 4" x={TCP_X} y={-235} fill={colors.cyan} fontSize={20} fontWeight={700} letterSpacing={2} fontFamily={fonts.mono}/>

      {/* connectors (under the blocks) */}
      <Node ref={lowerLinks}>
        {link(0, 0, colors.cyan)}
        {link(60, 60, colors.blue)}
        {link(120, 150, colors.orange)}
        {link(180, 150, colors.orange)}
      </Node>
      <Node ref={appLinks}>
        {link(-180, -120, colors.purple)}
        {link(-120, -120, colors.purple)}
        {link(-60, -120, colors.purple)}
      </Node>

      {/* OSI rows */}
      {OSI.map((l, i) => (
        <Rect ref={osiRefs[i]} x={OSI_X - 20} y={l.y} width={OSI_W} height={OSI_H} radius={8}
          layout direction="row" alignItems="center" gap={12} padding={[0, 14]}
          fill={colors.track} stroke={l.accent} lineWidth={1.5} opacity={0}>
          <Txt text={`L${l.n}`} fill={l.accent} fontSize={17} fontWeight={700} fontFamily={fonts.mono}/>
          <Txt text={l.name} fill={colors.text} fontSize={18} fontFamily={fonts.mono}/>
        </Rect>
      ))}

      {/* TCP/IP blocks */}
      {TCP.map((b, i) => (
        <Rect ref={tcpRefs[i]} x={TCP_X + 20} y={b.y} width={TCP_W} height={b.h} radius={10}
          layout direction="column" gap={5} alignItems="center" justifyContent="center"
          fill={colors.track} stroke={b.accent} lineWidth={2}
          shadowColor={b.accent} shadowBlur={0} opacity={0}>
          <Txt text={b.name} fill={colors.text} fontSize={22} fontWeight={600} fontFamily={fonts.display}/>
          {b.name === 'Прикладной'
            ? <Txt ref={tcpNote} text="= L7 · L6 · L5" fill={b.accent} fontSize={15} fontFamily={fonts.mono} opacity={0}/>
            : b.note && <Txt text={`= ${b.note}`} fill={b.accent} fontSize={14} fontFamily={fonts.mono}/>}
        </Rect>
      ))}

      {/* collapse badge — sits just above the App block's name, inside the card bounds */}
      <Node ref={mergeBadge} x={TCP_X} y={-168} opacity={0} scale={0.85}>
        <Rect layout radius={20} padding={[3, 12]} fill={withAlpha(colors.purple, 0.18)} stroke={colors.purple} lineWidth={1.5}>
          <Txt text="3 → 1" fill={colors.purple} fontSize={16} fontWeight={700} fontFamily={fonts.mono}/>
        </Rect>
      </Node>
    </Layout>
  );

  function* showOsi(): ThreadGenerator {
    yield* sequence(0.1, ...osiRefs.map(r => all(
      r().opacity(1, 0.4, easeOutCubic),
      r().x(OSI_X, 0.4, easeOutCubic),
    )));
  }

  function* showTcpip(): ThreadGenerator {
    // lower blocks + their 1:1 links
    yield* all(
      tcpRefs[1]().opacity(1, 0.45, easeOutCubic), tcpRefs[1]().x(TCP_X, 0.45, easeOutCubic),
      tcpRefs[2]().opacity(1, 0.45, easeOutCubic), tcpRefs[2]().x(TCP_X, 0.45, easeOutCubic),
      tcpRefs[3]().opacity(1, 0.45, easeOutCubic), tcpRefs[3]().x(TCP_X, 0.45, easeOutCubic),
    );
    yield* sequence(0.08, ...lowerLinks().children().map(c => (c as Line).end(1, 0.5, easeOutCubic)));
  }

  function* collapse(): ThreadGenerator {
    // the App block appears and the three top OSI layers converge into it
    yield* all(
      tcpRefs[0]().opacity(1, 0.5, easeOutCubic),
      tcpRefs[0]().x(TCP_X, 0.5, easeOutBack),
      tcpRefs[0]().shadowBlur(16, 0.5, easeOutCubic),
    );
    yield* all(
      ...appLinks().children().map(c => (c as Line).end(1, 0.6, easeOutCubic)),
      tcpNote().opacity(1, 0.5, easeOutCubic),
      mergeBadge().opacity(1, 0.5, easeOutCubic),
      mergeBadge().scale(1, 0.5, easeOutBack),
    );
  }

  return {node, showOsi, showTcpip, collapse};
}
