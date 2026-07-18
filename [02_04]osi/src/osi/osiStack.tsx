import {Circle, Layout, Line, Rect, Txt} from '@motion-canvas/2d';
import type {Node} from '@motion-canvas/2d';
import {all, createRef, easeInOutCubic, easeOutCubic, waitFor} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';

// Row geometry
const ROW_W = 760;
const ROW_H = 78;
const ROW_GAP = 9;
const SLIDE_IN = 26; // rows slide in from the left on reveal
const SPINE_X = -ROW_W / 2 - 24;

// Timings + focus look
const REVEAL = 0.6;
const REFOCUS = 0.4;
const DIM = 0.4; // opacity of a revealed-but-not-focused row
const GLOW = 14; // glow on the focused row
const BASE_GLOW = 5; // glow when nothing is focused (all layers shown together)

export interface OsiLayer {
  /** Layer number, 7 (Application) down to 1 (Physical). */
  n: number;
  name: string;
  /** One-line plain-language role. */
  role: string;
  protos: string[];
  accent: string;
}

export interface OsiStack {
  node: Node;
  /** Draw the signal spine (rows stay hidden until revealed). */
  appear(): ThreadGenerator;
  /** Reveal the given rows (slide + fade in) and make them the focused (bright) ones. */
  reveal(...idx: number[]): ThreadGenerator;
  /** Shift the focus glow to the given already-revealed rows, dimming the rest. */
  focus(...idx: number[]): ThreadGenerator;
  /** Drop the focus — every revealed row returns to full brightness. */
  unfocus(): ThreadGenerator;
  /** Endless pulse riding down the spine — a background thread (`yield stack.ridePulse()`). */
  ridePulse(): ThreadGenerator;
  /** Send a packet down the whole stack (L7→L1) then back up, lighting each layer it passes. */
  traverse(): ThreadGenerator;
}

function LayerRow({layer, rowRef}: {layer: OsiLayer; rowRef: ReturnType<typeof createRef<Rect>>}) {
  return (
    <Rect ref={rowRef} layout direction="row" alignItems="center" gap={16}
      width={ROW_W} height={ROW_H} radius={8} padding={[0, 22]}
      fill={colors.track} stroke={colors.border} lineWidth={1.5}
      shadowColor={layer.accent} shadowBlur={0} x={-SLIDE_IN} opacity={0}>
      <Rect width={4} height={ROW_H - 22} radius={2} fill={layer.accent}/>
      <Txt text={`L${layer.n}`} fill={layer.accent} fontSize={22} fontWeight={700} fontFamily={fonts.mono}/>
      <Layout layout direction="column" gap={3} grow={1}>
        <Txt text={layer.name} fill={colors.text} fontSize={24} fontWeight={600} fontFamily={fonts.display}/>
        <Txt text={layer.role} fill={colors.textMuted} fontSize={15} fontFamily={fonts.mono}/>
      </Layout>
      <Layout layout direction="row" gap={6}>
        {layer.protos.map(p => (
          <Rect layout radius={5} padding={[3, 9]} stroke={withAlpha(layer.accent, 0.7)} lineWidth={1}
            fill={withAlpha(layer.accent, 0.08)}>
            <Txt text={p} fill={layer.accent} fontSize={15} fontFamily={fonts.mono}/>
          </Rect>
        ))}
      </Layout>
    </Rect>
  );
}

/**
 * The OSI stack, revealed to match the narration: rows light up one (or two) at a time as
 * the narrator walks down the model, with the currently-discussed layer kept bright and the
 * rest dimmed. Later a packet traverses the whole stack (down then up) with every layer lit.
 */
export function osiStack(options: {layers: OsiLayer[]; y: number}): OsiStack {
  const {layers, y} = options;

  const rows = layers.map(() => createRef<Rect>());
  const spine = createRef<Line>();
  const pulse = createRef<Circle>();
  const revealed = layers.map(() => false);
  let focused = new Set<number>();

  const stackH = layers.length * ROW_H + (layers.length - 1) * ROW_GAP;
  const rowY = (i: number) => -stackH / 2 + ROW_H / 2 + i * (ROW_H + ROW_GAP);

  const node = (
    <Layout y={y}>
      <Line ref={spine} lineWidth={2} stroke={withAlpha(colors.primary, 0.7)} end={0}
        points={[[SPINE_X, -stackH / 2], [SPINE_X, stackH / 2]]}/>
      <Circle ref={pulse} x={SPINE_X} y={-stackH / 2} size={10} fill={colors.primary}
        shadowColor={colors.primary} shadowBlur={14} opacity={0}/>
      <Layout layout direction="column" gap={ROW_GAP} alignItems="center">
        {layers.map((layer, i) => <LayerRow layer={layer} rowRef={rows[i]}/>)}
      </Layout>
    </Layout>
  );

  const brightFor = (i: number) => (focused.size === 0 || focused.has(i) ? 1 : DIM);
  const glowFor = (i: number) => (focused.has(i) ? GLOW : focused.size === 0 ? BASE_GLOW : 0);

  function* applyFocus(dur: number): ThreadGenerator {
    const tw: ThreadGenerator[] = [];
    revealed.forEach((r, i) => {
      if (!r) return;
      tw.push(rows[i]().opacity(brightFor(i), dur, easeOutCubic));
      tw.push(rows[i]().shadowBlur(glowFor(i), dur, easeOutCubic));
    });
    yield* all(...tw);
  }

  function* appear(): ThreadGenerator {
    yield* spine().end(1, 0.9, easeOutCubic);
  }

  function* reveal(...idx: number[]): ThreadGenerator {
    focused = new Set(idx);
    const tw: ThreadGenerator[] = [];
    idx.forEach(i => {
      if (!revealed[i]) {
        revealed[i] = true;
        tw.push(rows[i]().opacity(1, REVEAL, easeOutCubic));
        tw.push(rows[i]().x(0, REVEAL, easeOutCubic));
        tw.push(rows[i]().shadowBlur(GLOW, REVEAL, easeOutCubic));
      }
    });
    revealed.forEach((r, i) => {
      if (r && !idx.includes(i)) {
        tw.push(rows[i]().opacity(DIM, REFOCUS, easeOutCubic));
        tw.push(rows[i]().shadowBlur(0, REFOCUS, easeOutCubic));
      }
    });
    yield* all(...tw);
  }

  function* focus(...idx: number[]): ThreadGenerator {
    focused = new Set(idx);
    yield* applyFocus(REFOCUS);
  }

  function* unfocus(): ThreadGenerator {
    focused = new Set();
    yield* applyFocus(0.6);
  }

  function* ridePulse(): ThreadGenerator {
    while (true) {
      pulse().position([SPINE_X, -stackH / 2]).opacity(0);
      yield* pulse().opacity(0.9, 0.3);
      yield* pulse().position.y(stackH / 2, 3.0, easeInOutCubic);
      yield* pulse().opacity(0, 0.3);
      yield* waitFor(1.2);
    }
  }

  function* flashRow(i: number): ThreadGenerator {
    yield* rows[i]().shadowBlur(26, 0.12).to(BASE_GLOW, 0.28);
  }

  function* traverse(): ThreadGenerator {
    const STEP = 0.32;
    pulse().position([SPINE_X, rowY(0)]).opacity(1);
    // down: L7 → L1 (encapsulation)
    for (let i = 0; i < layers.length; i++) {
      yield* all(pulse().position.y(rowY(i), STEP, easeInOutCubic), flashRow(i));
    }
    yield* waitFor(0.25);
    // up: L1 → L7 (decapsulation)
    for (let i = layers.length - 1; i >= 0; i--) {
      yield* all(pulse().position.y(rowY(i), STEP, easeInOutCubic), flashRow(i));
    }
    yield* pulse().opacity(0, 0.3);
  }

  return {node, appear, reveal, focus, unfocus, ridePulse, traverse};
}
