import {Layout, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, easeOutBack, easeOutCubic, sequence} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';

// The committee world: ITU / ISO / IEEE / IETF, the "suits vs jeans" culture split, and the
// rule that makes a standard real — consensus + working code, ≥2 independent implementations.

const CARD_W = 210;
const CARD_H = 150;
const X = [-345, -115, 115, 345];
const CARD_Y = -30;

const COMMITTEES = [
  {abbr: 'ITU', note: 'телеком · с 1865', accent: colors.blue},
  {abbr: 'ISO', note: 'сделал OSI', accent: colors.purple},
  {abbr: 'IEEE', note: 'Ethernet · Wi-Fi', accent: colors.orange},
  {abbr: 'IETF', note: 'интернет-стандарты', accent: colors.green},
];

/** A small dress-code pill under a committee (suits / jeans). */
function Pill({label, accent, x, tagRef}: {
  label: string; accent: string; x: number; tagRef: ReturnType<typeof createRef<Node>>;
}) {
  return (
    <Node ref={tagRef} x={x} y={CARD_Y + CARD_H / 2 + 32} opacity={0} scale={0.85}>
      <Rect layout radius={20} padding={[5, 14]} fill={withAlpha(accent, 0.14)} stroke={accent} lineWidth={1.5}>
        <Txt text={label} fill={accent} fontSize={17} fontFamily={fonts.mono}/>
      </Rect>
    </Node>
  );
}

export interface CommitteesRow {
  node: Node;
  /** Reveal committee `i` (0 ITU … 3 IETF). */
  reveal(i: number): ThreadGenerator;
  /** "Костюмы vs джинсы" — dress-code pills on ISO/ITU vs IETF. */
  dress(): ThreadGenerator;
  /** The working-code rule badge. */
  rule(): ThreadGenerator;
}

export function committeesRow(options: {y: number}): CommitteesRow {
  const cardRefs = COMMITTEES.map(() => createRef<Node>());
  const suitItu = createRef<Node>();
  const suitIso = createRef<Node>();
  const jeansIetf = createRef<Node>();
  const ruleRef = createRef<Node>();

  const node = (
    <Layout y={options.y}>
      {COMMITTEES.map((c, i) => (
        <Node ref={cardRefs[i]} x={X[i]} y={CARD_Y + 22} opacity={0}>
          <Rect width={CARD_W} height={CARD_H} radius={12} fill={colors.track}
            stroke={c.accent} lineWidth={2} shadowColor={withAlpha(c.accent, 0.4)} shadowBlur={9}
            layout direction="column" gap={10} alignItems="center" justifyContent="center">
            <Txt text={c.abbr} fill={colors.text} fontSize={36} fontWeight={700} fontFamily={fonts.mono}/>
            <Txt text={c.note} fill={c.accent} fontSize={15} fontFamily={fonts.mono}/>
          </Rect>
        </Node>
      ))}

      <Pill label="костюмы" accent={colors.blue} x={X[0]} tagRef={suitItu}/>
      <Pill label="костюмы" accent={colors.blue} x={X[1]} tagRef={suitIso}/>
      <Pill label="джинсы" accent={colors.green} x={X[3]} tagRef={jeansIetf}/>

      <Node ref={ruleRef} y={280} opacity={0} scale={0.92}>
        <Rect layout direction="column" gap={5} alignItems="center" radius={10} padding={[12, 22]}
          fill={withAlpha(colors.cyan, 0.1)} stroke={colors.cyan} lineWidth={2}>
          <Txt text="стандарт = консенсус + работающий код" fill={colors.cyan}
            fontSize={23} fontWeight={600} fontFamily={fonts.mono}/>
          <Txt text="≥ 2 независимые реализации · не бумага" fill={colors.textDim}
            fontSize={16} fontFamily={fonts.mono}/>
        </Rect>
      </Node>
    </Layout>
  );

  function* reveal(i: number): ThreadGenerator {
    yield* all(
      cardRefs[i]().opacity(1, 0.5, easeOutCubic),
      cardRefs[i]().y(CARD_Y, 0.5, easeOutBack),
    );
  }

  function* dress(): ThreadGenerator {
    yield* sequence(0.14,
      all(suitItu().opacity(1, 0.45, easeOutCubic), suitItu().scale(1, 0.45, easeOutBack)),
      all(suitIso().opacity(1, 0.45, easeOutCubic), suitIso().scale(1, 0.45, easeOutBack)),
      all(jeansIetf().opacity(1, 0.45, easeOutCubic), jeansIetf().scale(1, 0.45, easeOutBack)),
    );
  }

  function* rule(): ThreadGenerator {
    yield* all(
      ruleRef().opacity(1, 0.6, easeOutCubic),
      ruleRef().scale(1, 0.6, easeOutBack),
    );
  }

  return {node, reveal, dress, rule};
}
