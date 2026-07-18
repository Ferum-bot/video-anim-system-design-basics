import {Line, Node, Spline, Txt} from '@motion-canvas/2d';
import {all, createRef, easeOutCubic, range} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';

// Schematic "world": two landmasses across an ocean, in blueprint line-art. Deliberately
// not literal geography — just enough to read "your region" ↔ "another continent".

const LAND_FILL = withAlpha(colors.surface, 0.45);
const COAST = withAlpha(colors.cyan, 0.28);

// Rough closed coastlines (local coords). Continent A holds the phone→router hops;
// continent B (far right) holds the destination datacentre.
const CONTINENT_A: [number, number][] = [
  [-400, -250], [-250, -315], [-70, -280], [-15, -120], [-60, 30], [-230, 70], [-395, -30],
];
const CONTINENT_B: [number, number][] = [
  [155, -120], [300, -165], [415, -70], [400, 70], [285, 130], [170, 65],
];

/** A faint horizontal wave line (sampled sine) for ocean texture. */
function wave(y: number, amp: number, phase: number): [number, number][] {
  return range(33).map(i => {
    const x = -430 + (i / 32) * 860;
    return [x, y + Math.sin(i / 2 + phase) * amp] as [number, number];
  });
}

export interface WorldMap {
  node: Node;
  appear(): ThreadGenerator;
  /** Reveal the "ДРУГОЙ КОНТИНЕНТ" label on the far landmass. */
  labelFar(): ThreadGenerator;
}

export function worldMap(): WorldMap {
  const group = createRef<Node>();
  const landA = createRef<Spline>();
  const landB = createRef<Spline>();
  const farLabel = createRef<Txt>();

  const node = (
    <Node ref={group} opacity={0}>
      {/* ocean texture, behind the land */}
      {[[210, 8, 0], [255, 6, 1.3], [300, 9, 2.1]].map(([y, amp, ph]) => (
        <Line points={wave(y, amp, ph)} stroke={withAlpha(colors.cyan, 0.09)} lineWidth={1.5}/>
      ))}

      <Spline ref={landA} closed smoothness={0.6} points={CONTINENT_A}
        fill={LAND_FILL} stroke={COAST} lineWidth={2} lineDash={[7, 6]}/>
      <Spline ref={landB} closed smoothness={0.6} points={CONTINENT_B}
        fill={LAND_FILL} stroke={COAST} lineWidth={2} lineDash={[7, 6]}/>

      <Txt ref={farLabel} text="ДРУГОЙ КОНТИНЕНТ" x={285} y={-118} fill={colors.textMuted}
        fontSize={16} letterSpacing={2} fontFamily={fonts.mono} opacity={0}/>
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* group().opacity(1, 1.0, easeOutCubic);
  }

  function* labelFar(): ThreadGenerator {
    yield* all(
      farLabel().opacity(1, 0.6, easeOutCubic),
      farLabel().y(-150, 0.6, easeOutCubic),
    );
  }

  return {node, appear, labelFar};
}
