import {Node, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  easeInOutCubic,
  easeOutCubic,
  sequence,
  waitFor,
} from '@motion-canvas/core';
import type {Reference, ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// ── Geometry ──────────────────────────────────────────────────────────────────
// Both rows start on the same left edge, so the difference in length is the whole point.
const LEFT = -280;
const MINI = {width: 240, height: 34, radius: 6, head: 22, tail: 12} as const;
const GAP = 12;
const NUB = 36; // the handful of redundant bytes row B pays instead of a second frame

const ROW_A_Y = -50;
const ROW_B_Y = 76;
const LABEL_DY = -34;
const VERDICT_Y = 152;

// ── Timing ────────────────────────────────────────────────────────────────────
const LABEL_IN = 0.45;
const SLIDE = 0.55;
const STAGGER = 0.18;
const BETWEEN_ROWS = 0.8;
const VERDICT_IN = 0.7;

export interface CostCompareOptions {
  /** Vertical centre of the comparison. */
  y: number;
}

export interface CostCompare extends Widget {
  /** Cross-fade the framing line into the two rows and land the verdict. */
  compare(): ThreadGenerator;
  /** Leave, so the closing line stands alone. */
  dismiss(): ThreadGenerator;
}

/**
 * What the overhead buys, priced in the same bar language the scene already uses: sending
 * the frame a second time against topping it up with a few redundant bytes. Both rows share
 * a left edge, so the answer is just which one is longer.
 */
export function costCompare({y}: CostCompareOptions): CostCompare {
  const group = createRef<Node>();
  const intro = createRef<Txt>();
  const labelA = createRef<Txt>();
  const labelB = createRef<Txt>();
  const framesA = [createRef<Node>(), createRef<Node>()];
  const frameB = createRef<Node>();
  const nub = createRef<Node>();
  const verdict = createRef<Txt>();

  const accent = colors.cyan;
  const accentFill = withAlpha(accent, 0.28);
  const accentStroke = withAlpha(accent, 0.9);

  /** A frame in miniature — same grammar as the big bar: overhead, payload, overhead. */
  const miniFrame = (ref: Reference<Node>, centre: number) => {
    const body = MINI.width - MINI.head - MINI.tail;
    return (
      <Node ref={ref} x={centre - 40} opacity={0}>
        <Rect x={-MINI.width / 2 + MINI.head / 2} width={MINI.head} height={MINI.height}
          radius={[MINI.radius, 0, 0, MINI.radius]} fill={accentFill} stroke={accentStroke}
          lineWidth={1.5}/>
        <Rect x={-MINI.width / 2 + MINI.head + body / 2} width={body} height={MINI.height}
          fill={colors.track} stroke={colors.border} lineWidth={1.5}/>
        <Rect x={MINI.width / 2 - MINI.tail / 2} width={MINI.tail} height={MINI.height}
          radius={[0, MINI.radius, MINI.radius, 0]} fill={accentFill} stroke={accentStroke}
          lineWidth={1.5}/>
      </Node>
    );
  };

  const rowLabel = (ref: Reference<Txt>, text: string, rowY: number) => (
    <Txt ref={ref} offset={[-1, 0]} x={LEFT} y={rowY + LABEL_DY} text={text}
      fill={colors.textMuted} fontSize={20} fontFamily={fonts.mono} letterSpacing={1.2}
      opacity={0}/>
  );

  const firstCentre = LEFT + MINI.width / 2;
  const secondCentre = firstCentre + MINI.width + GAP;
  const nubCentre = firstCentre + MINI.width / 2 + GAP + NUB / 2;

  const node = (
    <Node ref={group} y={y}>
      <Txt ref={intro} y={ROW_A_Y} text="26 байт — плата за то, чтобы данные не потерялись"
        fill={colors.textDim} fontSize={25} fontFamily={fonts.display} opacity={0}/>

      {rowLabel(labelA, 'ПЕРЕСЛАТЬ КАДР ЗАНОВО', ROW_A_Y)}
      <Node y={ROW_A_Y}>
        {miniFrame(framesA[0], firstCentre)}
        {miniFrame(framesA[1], secondCentre)}
      </Node>

      {rowLabel(labelB, 'ДОЛОЖИТЬ ИЗБЫТОЧНЫХ БАЙТ', ROW_B_Y)}
      <Node y={ROW_B_Y}>
        {miniFrame(frameB, firstCentre)}
        <Node ref={nub} x={nubCentre - 40} opacity={0}>
          <Rect width={NUB} height={MINI.height} radius={MINI.radius}
            fill={withAlpha(colors.orange, 0.26)} stroke={withAlpha(colors.orange, 0.9)}
            lineWidth={1.5}>
            <Txt text="+" fill={colors.orange} fontSize={22} fontFamily={fonts.mono}
              fontWeight={600}/>
          </Rect>
        </Node>
      </Node>

      <Txt ref={verdict} y={VERDICT_Y} text="дешевле доложить, чем передавать второй раз"
        fill={colors.text} fontSize={26} fontFamily={fonts.display} fontWeight={600}
        opacity={0}/>
    </Node>
  );

  /** Slide a row's pieces in from a touch to the left of where they belong. */
  function* slideIn(...pieces: Reference<Node>[]): ThreadGenerator {
    yield* sequence(
      STAGGER,
      ...pieces.map(piece =>
        all(
          piece().opacity(1, SLIDE, easeOutCubic),
          piece().x(piece().x() + 40, SLIDE, easeOutCubic),
        ),
      ),
    );
  }

  function* appear(): ThreadGenerator {
    yield* intro().opacity(1, 0.6, easeOutCubic);
  }

  function* compare(): ThreadGenerator {
    yield* intro().opacity(0, 0.35, easeInOutCubic);
    yield* all(labelA().opacity(1, LABEL_IN, easeOutCubic), slideIn(...framesA));
    yield* waitFor(BETWEEN_ROWS);
    yield* all(labelB().opacity(1, LABEL_IN, easeOutCubic), slideIn(frameB, nub));
    yield* waitFor(0.5);
    yield* verdict().opacity(1, VERDICT_IN, easeOutCubic);
  }

  function* dismiss(): ThreadGenerator {
    yield* all(
      group().opacity(0, 0.6, easeInOutCubic),
      group().y(group().y() + 22, 0.6, easeInOutCubic),
    );
  }

  return {node, appear, compare, dismiss};
}
