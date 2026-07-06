import {Circle, Layout, Line, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, easeOutCubic, sequence} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';
import {PANEL_WIDTH} from '../metrics';

// Row geometry
const ROW_HEIGHT = 62;
const ROW_GAP = 8;
const SLIDE_IN = 26; // rows slide in from the left by this much
const SPINE_X = -PANEL_WIDTH / 2 - 22; // signal spine sits just left of the stack

// Reveal timings (seconds) — slow enough to read over narration.
const ROW_FADE = 0.7;
const ROW_STAGGER = 0.14;

export interface OsiLayer {
  /** Layer number, 7 (Application) down to 1 (Physical). */
  n: number;
  name: string;
  /** Protocol chips shown on the right, e.g. `['TCP', 'UDP']`. */
  protos: string[];
  accent: string;
}

export interface OsiStackOptions {
  layers: OsiLayer[];
  /** Vertical centre of the whole stack. */
  y: number;
}

/** One outlined layer row: number · name · protocol chips, with a left accent edge. */
function LayerRow({layer, rowRef}: {layer: OsiLayer; rowRef: ReturnType<typeof createRef<Rect>>}) {
  return (
    <Rect ref={rowRef} layout direction="row" alignItems="center" gap={18}
      width={PANEL_WIDTH} height={ROW_HEIGHT} radius={7} padding={[0, 20]}
      fill={colors.track} stroke={colors.border} lineWidth={1.5}
      x={-SLIDE_IN} opacity={0}>
      {/* left accent edge — encodes the layer's identity colour */}
      <Rect width={4} height={ROW_HEIGHT - 16} radius={2} fill={layer.accent}
        shadowColor={layer.accent} shadowBlur={10}/>
      <Txt text={`L${layer.n}`} fill={layer.accent} fontSize={20} fontWeight={700}
        fontFamily={fonts.mono} shadowColor={layer.accent} shadowBlur={8}/>
      <Txt text={layer.name} fill={colors.text} fontSize={25} fontWeight={500} fontFamily={fonts.display}/>
      <Layout grow={1}/>
      <Layout layout direction="row" gap={7}>
        {layer.protos.map(p => (
          <Rect layout radius={5} padding={[3, 9]} stroke={withAlpha(layer.accent, 0.7)}
            lineWidth={1} fill={withAlpha(layer.accent, 0.08)}>
            <Txt text={p} fill={layer.accent} fontSize={16} fontFamily={fonts.mono}/>
          </Rect>
        ))}
      </Layout>
    </Rect>
  );
}

/**
 * The OSI stack: seven colour-coded layer rows that reveal top-to-bottom while a glowing
 * "signal" spine draws down their left edge and a pulse rides it. The hero of the model
 * scene.
 */
export function osiStack(options: OsiStackOptions): Widget {
  const {layers, y} = options;

  const rowRefs = layers.map(() => createRef<Rect>());
  const spine = createRef<Line>();
  const pulse = createRef<Circle>();

  const stackHeight = layers.length * ROW_HEIGHT + (layers.length - 1) * ROW_GAP;

  const node = (
    <Layout y={y}>
      {/* signal spine + pulse, left of the rows */}
      <Line ref={spine} lineWidth={2} stroke={withAlpha(colors.primary, 0.8)} end={0}
        points={[[SPINE_X, -stackHeight / 2], [SPINE_X, stackHeight / 2]]}/>
      <Circle ref={pulse} x={SPINE_X} y={-stackHeight / 2} size={11} fill={colors.primary}
        shadowColor={colors.primary} shadowBlur={16} opacity={0}/>

      <Layout layout direction="column" gap={ROW_GAP} alignItems="center">
        {layers.map((layer, i) => (
          <LayerRow layer={layer} rowRef={rowRefs[i]}/>
        ))}
      </Layout>
    </Layout>
  );

  function* appear(): ThreadGenerator {
    // spine draws down while the pulse rides it, rows light up in its wake
    yield* all(
      spine().end(1, layers.length * ROW_STAGGER + ROW_FADE, easeOutCubic),
      pulse().opacity(1, 0.2).to(1, layers.length * ROW_STAGGER).to(0, 0.3),
      pulse().y(stackHeight / 2, layers.length * ROW_STAGGER + ROW_FADE, easeOutCubic),
      sequence(
        ROW_STAGGER,
        ...rowRefs.map(row =>
          all(
            row().opacity(1, ROW_FADE, easeOutCubic),
            row().x(0, ROW_FADE, easeOutCubic),
          ),
        ),
      ),
    );
  }

  return {node, appear};
}
