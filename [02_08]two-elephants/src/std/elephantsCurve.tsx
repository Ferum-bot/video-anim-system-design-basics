import {Circle, Layout, Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, easeOutBack, easeOutCubic} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';

// Tanenbaum's "apocalypse of two elephants": a technology first spikes with research, then
// with investment. The standard must land in the valley between the two humps.

const BASE_Y = 160; // x-axis baseline
const H1 = {c: -195, a: 275, w: 95}; // research hump
const H2 = {c: 195, a: 305, w: 100}; // investment hump

function curveY(x: number): number {
  return BASE_Y - (H1.a * Math.exp(-(((x - H1.c) / H1.w) ** 2)) + H2.a * Math.exp(-(((x - H2.c) / H2.w) ** 2)));
}

function humpPoints(): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 72; i++) {
    const x = -395 + (i / 72) * 790;
    pts.push([x, curveY(x)]);
  }
  return pts;
}

export interface ElephantsCurve {
  node: Node;
  /** Draw the axes. */
  appear(): ThreadGenerator;
  /** Draw the first hump (research) + its label. */
  research(): ThreadGenerator;
  /** Draw the second hump (investment) + its label. */
  investment(): ThreadGenerator;
  /** Highlight the valley + the "write the standard here" flag. */
  window(): ThreadGenerator;
  /** Mark the left slope as "слишком рано". */
  early(): ThreadGenerator;
  /** Mark the right hump as "слишком поздно". */
  late(): ThreadGenerator;
}

export function elephantsCurve(options: {y: number}): ElephantsCurve {
  const axes = createRef<Node>();
  const curve = createRef<Line>();
  const researchLbl = createRef<Node>();
  const investLbl = createRef<Node>();
  const band = createRef<Rect>();
  const flag = createRef<Node>();
  const earlyRef = createRef<Node>();
  const lateRef = createRef<Node>();

  const node = (
    <Layout y={options.y}>
      {/* axes */}
      <Node ref={axes} opacity={0}>
        <Line points={[[-395, BASE_Y], [400, BASE_Y]]} lineWidth={2} stroke={withAlpha(colors.text, 0.35)} endArrow arrowSize={10}/>
        <Line points={[[-395, BASE_Y + 8], [-395, -215]]} lineWidth={2} stroke={withAlpha(colors.text, 0.35)} endArrow arrowSize={10}/>
        <Txt text="время →" x={360} y={188} fill={colors.textMuted} fontSize={15} fontFamily={fonts.mono}/>
        <Txt text="активность" x={-330} y={-205} fill={colors.textMuted} fontSize={15} fontFamily={fonts.mono}/>
      </Node>

      {/* valley window (under the curve) */}
      <Rect ref={band} x={0} y={55} width={92} height={220} radius={6} fill={withAlpha(colors.green, 0.12)} opacity={0}/>

      {/* the two-humps curve */}
      <Line ref={curve} points={humpPoints()} lineWidth={3} lineCap="round" end={0}
        stroke={colors.cyan} shadowColor={withAlpha(colors.cyan, 0.5)} shadowBlur={8}/>

      {/* hump labels */}
      <Node ref={researchLbl} x={H1.c} y={212} opacity={0}>
        <Txt text="ИССЛЕДОВАНИЯ" fill={colors.blue} fontSize={22} fontWeight={700} letterSpacing={1} fontFamily={fonts.mono}/>
        <Txt text="статьи · конференции" y={26} fill={colors.textMuted} fontSize={15} fontFamily={fonts.mono}/>
      </Node>
      <Node ref={investLbl} x={H2.c} y={212} opacity={0}>
        <Txt text="ИНВЕСТИЦИИ" fill={colors.orange} fontSize={22} fontWeight={700} letterSpacing={1} fontFamily={fonts.mono}/>
        <Txt text="млрд · корпорации" y={26} fill={colors.textMuted} fontSize={15} fontFamily={fonts.mono}/>
      </Node>

      {/* valley flag */}
      <Node ref={flag} x={0} opacity={0} scale={0.85}>
        <Line points={[[0, 150], [0, -46]]} lineWidth={2} lineDash={[4, 5]} stroke={withAlpha(colors.green, 0.7)}/>
        <Rect layout radius={8} y={-72} padding={[7, 15]} fill={withAlpha(colors.green, 0.16)} stroke={colors.green} lineWidth={2}>
          <Txt text="СТАНДАРТ — сюда" fill={colors.green} fontSize={20} fontWeight={700} fontFamily={fonts.mono}/>
        </Rect>
      </Node>

      {/* too early / too late */}
      <Node ref={earlyRef} opacity={0}>
        <Circle x={-300} y={curveY(-300)} size={13} fill={colors.red} shadowColor={colors.red} shadowBlur={8}/>
        <Txt text="слишком рано ✗" x={-292} y={30} fill={colors.red} fontSize={18} fontFamily={fonts.mono}/>
      </Node>
      <Node ref={lateRef} opacity={0}>
        <Circle x={H2.c} y={curveY(H2.c)} size={13} fill={colors.red} shadowColor={colors.red} shadowBlur={8}/>
        <Txt text="слишком поздно ✗" x={250} y={-168} fill={colors.red} fontSize={18} fontFamily={fonts.mono}/>
      </Node>
    </Layout>
  );

  function* appear(): ThreadGenerator {
    yield* axes().opacity(1, 0.7, easeOutCubic);
  }

  function* research(): ThreadGenerator {
    yield* all(
      curve().end(0.52, 1.4, easeOutCubic),
      researchLbl().opacity(1, 0.8, easeOutCubic),
    );
  }

  function* investment(): ThreadGenerator {
    yield* all(
      curve().end(1, 1.4, easeOutCubic),
      investLbl().opacity(1, 0.8, easeOutCubic),
    );
  }

  function* window(): ThreadGenerator {
    yield* all(
      band().opacity(1, 0.5, easeOutCubic),
      flag().opacity(1, 0.5, easeOutCubic),
      flag().scale(1, 0.5, easeOutBack),
    );
  }

  function* early(): ThreadGenerator {
    yield* earlyRef().opacity(1, 0.5, easeOutCubic);
  }

  function* late(): ThreadGenerator {
    yield* lateRef().opacity(1, 0.5, easeOutCubic);
  }

  return {node, appear, research, investment, window, early, late};
}
