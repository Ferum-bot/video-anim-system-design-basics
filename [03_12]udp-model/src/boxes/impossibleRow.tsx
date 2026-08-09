import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, easeOutCubic, sequence} from '@motion-canvas/core';
import type {Reference, ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';

// The two shapes a datagram never takes: glued to its neighbour, or cut in half. Both are
// drawn in the same box language as the lane above, then struck through.
const CASE_X = 232;
const BOX = {width: 78, height: 64, radius: 10} as const;
const HALF = 44; // a visibly torn-off piece, not a mathematically exact half
const LABEL_Y = 74;
const CROSS_PAD = 12;

const SHOW = 0.5;
const STRIKE = 0.45;

export interface ImpossibleRow {
  readonly node: Node;
  /** Box and a half, fused — the shape TCP will happily hand you and UDP never will. */
  glued(): ThreadGenerator;
  /** Half a box on its own. */
  half(): ThreadGenerator;
}

/** «Никогда полтора склеенных» and «половины тоже не бывает», side by side and crossed out. */
export function impossibleRow(): ImpossibleRow {
  const gluedGroup = createRef<Node>();
  const halfGroup = createRef<Node>();
  const gluedCross = [createRef<Line>(), createRef<Line>()];
  const halfCross = [createRef<Line>(), createRef<Line>()];

  const bad = colors.red;
  const muted = withAlpha(colors.textMuted, 0.9);

  const plate = (width: number, x: number, text: string) => (
    <Rect x={x} width={width} height={BOX.height} radius={BOX.radius}
      fill={withAlpha(colors.textMuted, 0.14)} stroke={muted} lineWidth={2}>
      <Txt text={text} fill={colors.textDim} fontSize={22} fontFamily={fonts.mono}
        fontWeight={600}/>
    </Rect>
  );

  const cross = (refs: Reference<Line>[], halfWidth: number) => (
    <Node>
      <Line ref={refs[0]}
        points={[[-halfWidth - CROSS_PAD, -BOX.height / 2 - 12], [halfWidth + CROSS_PAD, BOX.height / 2 + 12]]}
        stroke={bad} lineWidth={2.6} lineCap="round" end={0}/>
      <Line ref={refs[1]}
        points={[[halfWidth + CROSS_PAD, -BOX.height / 2 - 12], [-halfWidth - CROSS_PAD, BOX.height / 2 + 12]]}
        stroke={bad} lineWidth={2.6} lineCap="round" end={0}/>
    </Node>
  );

  const node = (
    <Node>
      <Node ref={gluedGroup} x={-CASE_X} opacity={0}>
        {plate(BOX.width, -HALF / 2, '1')}
        {plate(HALF, BOX.width / 2, '½')}
        {cross(gluedCross, (BOX.width + HALF) / 2)}
        <Txt y={LABEL_Y} text="никогда не склеятся" fill={withAlpha(bad, 0.9)} fontSize={20}
          fontFamily={fonts.display}/>
      </Node>

      <Node ref={halfGroup} x={CASE_X} opacity={0}>
        {plate(HALF, 0, '½')}
        {cross(halfCross, HALF / 2)}
        <Txt y={LABEL_Y} text="половины тоже не бывает" fill={withAlpha(bad, 0.9)}
          fontSize={20} fontFamily={fonts.display}/>
      </Node>
    </Node>
  );

  function* reveal(group: Reference<Node>, marks: Reference<Line>[]): ThreadGenerator {
    yield* group().opacity(1, SHOW, easeOutCubic);
    yield* sequence(0.12, ...marks.map(mark => mark().end(1, STRIKE, easeOutCubic)));
  }

  function* glued(): ThreadGenerator {
    yield* reveal(gluedGroup, gluedCross);
  }

  function* half(): ThreadGenerator {
    yield* reveal(halfGroup, halfCross);
  }

  return {node, glued, half};
}
