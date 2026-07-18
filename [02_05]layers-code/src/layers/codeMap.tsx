import {Circle, Layout, Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, easeOutBack, easeOutCubic, sequence} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';

// "Каждый уровень — это реальный код в разных местах." Maps grouped OSI/TCP-IP layers (left)
// to where their code actually lives (right): the network card, the OS, the language libs.

const GROUP_W = 300;
const GROUP_H = 96;
const HOME_W = 336;
const HOME_H = 104;
const GX = -240; // left column x
const HX = 226; // right column x
const ROWS_Y = [-158, 0, 158];

// Left: grouped layers. Right: the component that holds that layer's code. Rows are aligned,
// so group i maps to home i.
const GROUPS = [
  {name: 'Application', sub: 'HTTP · DNS', accent: colors.purple},
  {name: 'Transport · Network', sub: 'TCP · IP', accent: colors.cyan},
  {name: 'Data Link · Physical', sub: 'Ethernet', accent: colors.orange},
];
const HOMES = [
  {name: 'Библиотеки языка', code: 'http.get() · dns', author: 'разработчики языка'},
  {name: 'Операционная система', code: 'socket · tcp/ip', author: 'разработчики ОС'},
  {name: 'Сетевая карта · коммутатор', code: '// C', author: 'вендор железа'},
];

export interface CodeMap {
  node: Node;
  /** Reveal the grouped layers on the left. */
  appear(): ThreadGenerator;
  /** Reveal the code homes on the right, dimmed (code lives somewhere you don't manage). */
  homes(): ThreadGenerator;
  /** Light home `i` and draw the connector from its layer group. */
  link(i: number): ThreadGenerator;
  /** Slot a "＋ свой протокол" chip into the stack — you can inject at any layer. */
  inject(): ThreadGenerator;
  /** Scatter bug markers across the homes — written by thousands over decades, with bugs. */
  humans(): ThreadGenerator;
}

export function codeMap(options: {y: number}): CodeMap {
  const groupRefs = GROUPS.map(() => createRef<Rect>());
  const homeRefs = HOMES.map(() => createRef<Node>());
  const cardRefs = HOMES.map(() => createRef<Rect>());
  const detailRefs = HOMES.map(() => createRef<Node>());
  const connRefs = HOMES.map(() => createRef<Line>());
  const bugRefs = HOMES.map(() => createRef<Node>());
  const injectRef = createRef<Node>();

  const node = (
    <Layout y={options.y}>
      {/* connectors (under the cards) */}
      {HOMES.map((_, i) => (
        <Line ref={connRefs[i]} end={0} lineWidth={2} lineDash={[6, 6]}
          stroke={withAlpha(colors.cyan, 0.7)}
          points={[[GX + GROUP_W / 2, ROWS_Y[i]], [HX - HOME_W / 2, ROWS_Y[i]]]}/>
      ))}

      {/* left: grouped layers */}
      {GROUPS.map((g, i) => (
        <Rect ref={groupRefs[i]} y={ROWS_Y[i]} width={GROUP_W} height={GROUP_H} radius={10}
          layout direction="column" gap={5} alignItems="center" justifyContent="center"
          fill={colors.track} stroke={g.accent} lineWidth={2} x={GX - 24} opacity={0}>
          <Txt text={g.name} fill={colors.text} fontSize={23} fontWeight={600} fontFamily={fonts.display}/>
          <Txt text={g.sub} fill={g.accent} fontSize={15} fontFamily={fonts.mono}/>
        </Rect>
      ))}

      {/* right: where the code lives */}
      {HOMES.map((h, i) => (
        <Node ref={homeRefs[i]} x={HX} y={ROWS_Y[i]} opacity={0}>
          <Rect ref={cardRefs[i]} width={HOME_W} height={HOME_H} radius={10} fill={colors.surface}
            stroke={colors.border} lineWidth={1.5} shadowColor={colors.cyan} shadowBlur={0}/>
          <Txt text={h.name} y={-30} fill={colors.text} fontSize={19} fontWeight={600} fontFamily={fonts.display}/>
          <Node ref={detailRefs[i]} opacity={0}>
            <Rect y={2} layout radius={5} padding={[3, 10]} fill={withAlpha(colors.cyan, 0.1)}
              stroke={withAlpha(colors.cyan, 0.5)} lineWidth={1}>
              <Txt text={h.code} fill={colors.cyan} fontSize={16} fontFamily={fonts.mono}/>
            </Rect>
            <Txt text={h.author} y={33} fill={colors.textMuted} fontSize={14} fontFamily={fonts.mono}/>
          </Node>
          {/* bug markers, revealed at the end */}
          <Node ref={bugRefs[i]} opacity={0}>
            {[-1, 0, 1].map(k => (
              <Circle x={HOME_W / 2 - 16 + k * 13} y={-HOME_H / 2 + 14} size={7}
                fill={colors.red} shadowColor={colors.red} shadowBlur={6}/>
            ))}
          </Node>
        </Node>
      ))}

      {/* inject chip, slotted into the left stack */}
      <Node ref={injectRef} x={GX} y={ROWS_Y[0] + GROUP_H / 2 + 30} opacity={0} scale={0.9}>
        <Rect layout radius={7} padding={[5, 12]} fill={withAlpha(colors.green, 0.12)}
          stroke={colors.green} lineWidth={1.5} lineDash={[5, 4]}>
          <Txt text="＋ свой протокол" fill={colors.green} fontSize={17} fontFamily={fonts.mono}/>
        </Rect>
      </Node>
    </Layout>
  );

  function* appear(): ThreadGenerator {
    yield* sequence(0.15, ...groupRefs.map(g => all(
      g().opacity(1, 0.55, easeOutCubic),
      g().x(GX, 0.55, easeOutCubic),
    )));
  }

  function* homes(): ThreadGenerator {
    yield* sequence(0.14, ...homeRefs.map(h => h().opacity(0.5, 0.5, easeOutCubic)));
  }

  function* link(i: number): ThreadGenerator {
    yield* all(
      homeRefs[i]().opacity(1, 0.4, easeOutCubic),
      detailRefs[i]().opacity(1, 0.5, easeOutCubic),
      cardRefs[i]().shadowBlur(12, 0.5, easeOutCubic),
      cardRefs[i]().stroke(colors.cyan, 0.5),
      connRefs[i]().end(1, 0.6, easeOutCubic),
    );
  }

  function* inject(): ThreadGenerator {
    yield* all(
      injectRef().opacity(1, 0.4, easeOutCubic),
      injectRef().scale(1, 0.5, easeOutBack),
    );
  }

  function* humans(): ThreadGenerator {
    yield* sequence(0.12, ...bugRefs.map(b => b().opacity(1, 0.4, easeOutCubic)));
  }

  return {node, appear, homes, link, inject, humans};
}
