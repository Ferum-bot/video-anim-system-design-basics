import {Circle, Layout, Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, easeOutBack, easeOutCubic, sequence} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';

// Two ways a standard is born: DE-FACTO (a protocol grows on its own, bottom-up, then gets
// standardised — HTTP) vs DE-JURE (a committee approves it top-down, then requires it — OSI).

const LX = -235; // de-facto column centre
const RX = 235; // de-jure column centre
const HEAD_Y = -370;

/** A small labelled chip. */
function Chip({label, accent, sub}: {label: string; accent: string; sub?: string}) {
  return (
    <Rect layout direction="column" gap={3} alignItems="center" justifyContent="center"
      radius={9} padding={[10, 16]} fill={colors.track} stroke={accent} lineWidth={2}
      shadowColor={withAlpha(accent, 0.4)} shadowBlur={8}>
      <Txt text={label} fill={colors.text} fontSize={22} fontWeight={600} fontFamily={fonts.mono}/>
      {sub && <Txt text={sub} fill={accent} fontSize={14} fontFamily={fonts.mono}/>}
    </Rect>
  );
}

export interface StandardsWays {
  node: Node;
  appear(): ThreadGenerator;
  /** De-facto: the developer node at the bottom of the left column. */
  defacto(): ThreadGenerator;
  /** De-facto: HTTP rises and spreads virally on its own. */
  http(): ThreadGenerator;
  /** De-facto: the "СТАНДАРТ" badge lands on top + the order tag (made → standardised). */
  dfactoDone(): ThreadGenerator;
  /** De-jure: the committee node at the top of the right column. */
  dejure(): ThreadGenerator;
  /** De-jure: it is pushed down and required for development + OSI + the order tag. */
  dejureDone(): ThreadGenerator;
}

export function standardsWays(options: {y: number}): StandardsWays {
  const dfHead = createRef<Node>();
  const djHead = createRef<Node>();
  const dev = createRef<Node>();
  const rise = createRef<Line>();
  const httpNode = createRef<Node>();
  const sats = [0, 1, 2, 3].map(() => createRef<Circle>());
  const stdBadge = createRef<Node>();
  const dfOrder = createRef<Txt>();
  const committee = createRef<Node>();
  const downArrow = createRef<Line>();
  const adopters = createRef<Node>();
  const osiChip = createRef<Node>();
  const djOrder = createRef<Txt>();

  const SAT = [[-58, 120], [58, 118], [-34, 38], [40, 40]]; // spread offsets around HTTP

  const node = (
    <Layout y={options.y}>
      {/* ── headers ── */}
      <Node ref={dfHead} x={LX} y={HEAD_Y} opacity={0}>
        <Txt text="DE-FACTO" fill={colors.green} fontSize={30} fontWeight={700} letterSpacing={2} fontFamily={fonts.mono}/>
        <Txt text="вырос сам · снизу вверх" y={30} fill={colors.textMuted} fontSize={16} fontFamily={fonts.mono}/>
        <Line points={[[-150, 0], [150, 0]]} y={52} lineWidth={2} stroke={withAlpha(colors.green, 0.5)}/>
      </Node>
      <Node ref={djHead} x={RX} y={HEAD_Y} opacity={0}>
        <Txt text="DE-JURE" fill={colors.blue} fontSize={30} fontWeight={700} letterSpacing={2} fontFamily={fonts.mono}/>
        <Txt text="спущен сверху · сверху вниз" y={30} fill={colors.textMuted} fontSize={16} fontFamily={fonts.mono}/>
        <Line points={[[-150, 0], [150, 0]]} y={52} lineWidth={2} stroke={withAlpha(colors.blue, 0.5)}/>
      </Node>

      {/* ── de-facto column (left) ── */}
      <Line ref={rise} points={[[LX, 210], [LX, -110]]} lineWidth={2} lineDash={[5, 7]}
        stroke={withAlpha(colors.green, 0.5)} end={0} endArrow arrowSize={11}/>
      <Node ref={dev} x={LX} y={250} opacity={0} scale={0.9}>
        <Chip label="разработчик" accent={colors.green}/>
      </Node>
      {SAT.map((s, i) => (
        <Circle ref={sats[i]} x={LX + s[0]} y={0 + s[1] - 60} size={12} fill={colors.green}
          shadowColor={colors.green} shadowBlur={8} opacity={0}/>
      ))}
      <Node ref={httpNode} x={LX} y={40} opacity={0} scale={0.8}>
        <Chip label="HTTP" accent={colors.green} sub="распространился сам"/>
      </Node>
      <Node ref={stdBadge} x={LX} y={-170} opacity={0} scale={0.8}>
        <Rect layout radius={8} padding={[8, 16]} fill={withAlpha(colors.green, 0.14)}
          stroke={colors.green} lineWidth={2}>
          <Txt text="СТАНДАРТ ✓" fill={colors.green} fontSize={22} fontWeight={700} fontFamily={fonts.mono}/>
        </Rect>
      </Node>
      <Txt ref={dfOrder} x={LX} y={330} text="① сделали → ② стандартизировали"
        fill={colors.textDim} fontSize={17} fontFamily={fonts.mono} opacity={0}/>

      {/* ── de-jure column (right) ── */}
      <Node ref={committee} x={RX} y={-170} opacity={0} scale={0.9}>
        <Chip label="КОМИТЕТ" accent={colors.blue} sub="утверждает первым"/>
      </Node>
      <Line ref={downArrow} points={[[RX, -110], [RX, 130]]} lineWidth={2} lineDash={[5, 7]}
        stroke={withAlpha(colors.blue, 0.5)} end={0} endArrow arrowSize={11}/>
      <Node ref={adopters} x={RX} y={195} opacity={0}>
        <Layout layout direction="row" gap={12}>
          {[0, 1, 2].map(() => (
            <Rect layout radius={7} padding={[9, 12]} fill={colors.track} stroke={colors.blue} lineWidth={1.5}>
              <Txt text="!" fill={colors.red} fontSize={22} fontWeight={800} fontFamily={fonts.mono}/>
            </Rect>
          ))}
        </Layout>
      </Node>
      <Node ref={osiChip} x={RX} y={80} opacity={0} scale={0.8}>
        <Chip label="OSI" accent={colors.blue} sub="требовали к разработке"/>
      </Node>
      <Txt ref={djOrder} x={RX} y={330} text="① утвердили → ② требовали"
        fill={colors.textDim} fontSize={17} fontFamily={fonts.mono} opacity={0}/>
    </Layout>
  );

  function* appear(): ThreadGenerator {
    yield* all(
      dfHead().opacity(1, 0.6, easeOutCubic),
      djHead().opacity(1, 0.6, easeOutCubic),
    );
  }

  function* defacto(): ThreadGenerator {
    yield* all(
      dev().opacity(1, 0.5, easeOutCubic),
      dev().scale(1, 0.5, easeOutBack),
      rise().end(1, 0.9, easeOutCubic),
    );
  }

  function* http(): ThreadGenerator {
    yield* all(
      httpNode().opacity(1, 0.5, easeOutCubic),
      httpNode().scale(1, 0.5, easeOutBack),
    );
    yield* sequence(0.1, ...sats.map(s => all(
      s().opacity(1, 0.4, easeOutCubic),
    )));
  }

  function* dfactoDone(): ThreadGenerator {
    yield* all(
      stdBadge().opacity(1, 0.5, easeOutCubic),
      stdBadge().scale(1, 0.5, easeOutBack),
      dfOrder().opacity(1, 0.6, easeOutCubic),
    );
  }

  function* dejure(): ThreadGenerator {
    yield* all(
      committee().opacity(1, 0.5, easeOutCubic),
      committee().scale(1, 0.5, easeOutBack),
    );
  }

  function* dejureDone(): ThreadGenerator {
    yield* all(
      downArrow().end(1, 0.7, easeOutCubic),
      osiChip().opacity(1, 0.5, easeOutCubic),
      osiChip().scale(1, 0.5, easeOutBack),
    );
    yield* all(
      adopters().opacity(1, 0.5, easeOutCubic),
      djOrder().opacity(1, 0.6, easeOutCubic),
    );
  }

  return {node, appear, defacto, http, dfactoDone, dejure, dejureDone};
}
