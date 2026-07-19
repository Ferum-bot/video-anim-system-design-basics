import {Circle, Layout, Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, easeOutBack, easeOutCubic, sequence} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';

// The four signature ideas of the video, recapped as a 2×2 grid. Reading order (net → OSI →
// standards → TCP/IP) mirrors how the video walked them, so the reveal follows the same path.

const TILE_W = 366;
const TILE_H = 208;
const TILE_DX = 194; // half the horizontal gap between tile centres
const TILE_DY = 118; // half the vertical gap

type Glyph = (accent: string) => Node;

interface Tile {glyph: Glyph; name: string; sub: string; accent: string; x: number; y: number}

// ── mini glyphs (≈104×72, drawn in the tile's accent) ────────────────────────
function netGlyph(accent: string): Node {
  const sat = [[-42, -22], [42, -22], [-42, 22], [42, 22]] as const;
  return (
    <Layout width={104} height={72}>
      {sat.map(([x, y]) => <Line points={[[0, 0], [x, y]]} stroke={withAlpha(accent, 0.5)} lineWidth={2}/>)}
      {sat.map(([x, y]) => <Circle x={x} y={y} size={13} fill={withAlpha(accent, 0.85)}/>)}
      <Circle size={24} fill={accent}/>
    </Layout>
  );
}

function osiGlyph(accent: string): Node {
  return (
    <Layout width={104} height={72}>
      {[0, 1, 2, 3, 4].map(i => (
        <Rect y={-32 + i * 16} width={74} height={11} radius={3} fill={withAlpha(accent, 0.85)}/>
      ))}
    </Layout>
  );
}

function stdGlyph(accent: string): Node {
  // the "two elephants" curve — research hump + investment hump, valley in the middle
  return (
    <Layout width={104} height={72}>
      <Line
        points={[[-52, 24], [-38, 20], [-26, -20], [-14, 20], [0, 18], [14, 20], [26, -20], [38, 20], [52, 24]]}
        radius={6} stroke={accent} lineWidth={3} lineCap="round"/>
    </Layout>
  );
}

function tcpGlyph(accent: string): Node {
  return (
    <Layout width={104} height={72}>
      {[0, 1, 2, 3].map(i => (
        <Rect y={-27 + i * 18} width={82} height={15} radius={4}
          fill={withAlpha(accent, 0.18)} stroke={accent} lineWidth={2}/>
      ))}
    </Layout>
  );
}

const TILES: Tile[] = [
  {glyph: netGlyph, name: 'Сеть из сетей', sub: 'путь пакета не выбираешь', accent: colors.cyan, x: -TILE_DX, y: -TILE_DY},
  {glyph: osiGlyph, name: 'OSI · 7 уровней', sub: 'абстракции, каждый — код', accent: colors.purple, x: TILE_DX, y: -TILE_DY},
  {glyph: stdGlyph, name: 'Стандарты', sub: 'побеждает работающий', accent: colors.orange, x: -TILE_DX, y: TILE_DY},
  {glyph: tcpGlyph, name: 'TCP/IP · 4', sub: 'на этом работает интернет', accent: colors.green, x: TILE_DX, y: TILE_DY},
];

export interface RecapGrid {
  node: Node;
  /** Reveal the four tiles one by one in reading order. */
  assemble(): ThreadGenerator;
}

export function recapGrid(options: {y: number}): RecapGrid {
  const refs = TILES.map(() => createRef<Rect>());

  const node = (
    <Node y={options.y}>
      {TILES.map((t, i) => (
        <Rect ref={refs[i]} x={t.x} y={t.y} width={TILE_W} height={TILE_H} radius={16}
          fill={withAlpha(colors.surface, 0.55)} stroke={t.accent} lineWidth={2} opacity={0} scale={0.9}
          layout direction="column" gap={13} alignItems="center" justifyContent="center" padding={22}>
          {t.glyph(t.accent)}
          <Txt text={t.name} fill={colors.text} fontSize={25} fontWeight={700} fontFamily={fonts.mono}/>
          <Txt text={t.sub} fill={colors.textMuted} fontSize={17} fontFamily={fonts.mono}/>
        </Rect>
      ))}
    </Node>
  );

  function* assemble(): ThreadGenerator {
    yield* sequence(0.16, ...refs.map(ref =>
      all(ref().opacity(1, 0.5, easeOutCubic), ref().scale(1, 0.5, easeOutBack)),
    ));
  }

  return {node, assemble};
}
