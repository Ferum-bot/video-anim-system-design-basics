import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, easeOutCubic, sequence} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';

// The OSI idea before the concrete stack: a few abstraction layers where each one uses the
// layer below as a set of APIs — and where each layer lives in a different component/vendor.
// Dissolves once the real 7-layer stack takes over.

const SLAB_W = 400;
const SLAB_H = 66;
const SLABS = [
  {label: 'уровень n+1', owner: 'ваш код', accent: colors.cyan, y: -100},
  {label: 'уровень n', owner: 'ОС', accent: colors.blue, y: 0},
  {label: 'уровень n−1', owner: 'вендор', accent: colors.purple, y: 100},
];

export interface AbstractionIntro {
  node: Node;
  appear(): ThreadGenerator;
  /** Draw the "API ↑" arrows between the layers. */
  showApi(): ThreadGenerator;
  /** Reveal an owner tag on each layer — each part lives in a different component/vendor. */
  showComponents(): ThreadGenerator;
  /** Cross-fade the caption to a new line. */
  note(text: string): ThreadGenerator;
  /** Fade the whole intro out as the real stack appears. */
  dissolve(): ThreadGenerator;
}

/** Two upward "API" arrows on the right, from each lower slab to the one above it. */
function ApiArrow({y, arrowRef}: {y: number; arrowRef: ReturnType<typeof createRef<Node>>}) {
  return (
    <Node ref={arrowRef} x={SLAB_W / 2 + 46} y={y} opacity={0}>
      <Line points={[[0, 24], [0, -24]]} lineWidth={2} stroke={colors.cyan} endArrow arrowSize={10}/>
      <Txt text="API" x={34} fill={colors.cyan} fontSize={15} fontFamily={fonts.mono}/>
    </Node>
  );
}

export function abstractionIntro(options: {y: number}): AbstractionIntro {
  const group = createRef<Node>();
  const slabRefs = SLABS.map(() => createRef<Rect>());
  const arrowTop = createRef<Node>();
  const arrowBottom = createRef<Node>();
  const ownerRefs = SLABS.map(() => createRef<Node>());
  const caption = createRef<Txt>();

  const node = (
    <Node ref={group} y={options.y}>
      {SLABS.map((s, i) => (
        <Rect ref={slabRefs[i]} y={s.y} width={SLAB_W} height={SLAB_H} radius={12}
          fill={withAlpha(s.accent, 0.08)} stroke={withAlpha(s.accent, 0.65)} lineWidth={2}
          opacity={0} scale={0.94}>
          <Txt text={s.label} fill={colors.textDim} fontSize={22} fontFamily={fonts.mono}/>
        </Rect>
      ))}

      {/* owner tags to the left — each layer lives in a different component */}
      {SLABS.map((s, i) => (
        <Node ref={ownerRefs[i]} x={-SLAB_W / 2 - 96} y={s.y} opacity={0}>
          <Line points={[[52, 0], [92, 0]]} lineWidth={1.5} stroke={withAlpha(s.accent, 0.5)} lineDash={[3, 4]}/>
          <Rect layout radius={6} padding={[4, 10]} fill={withAlpha(s.accent, 0.1)}
            stroke={withAlpha(s.accent, 0.6)} lineWidth={1}>
            <Txt text={s.owner} fill={s.accent} fontSize={16} fontFamily={fonts.mono}/>
          </Rect>
        </Node>
      ))}

      <ApiArrow y={-50} arrowRef={arrowTop}/>
      <ApiArrow y={50} arrowRef={arrowBottom}/>

      <Txt ref={caption} text="уровни абстракции" y={188} fill={colors.textMuted}
        fontSize={24} letterSpacing={1} fontFamily={fonts.mono} opacity={0}/>
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* all(
      sequence(0.14, ...slabRefs.map(s => all(
        s().opacity(1, 0.5, easeOutCubic),
        s().scale(1, 0.5, easeOutCubic),
      ))),
      caption().opacity(1, 0.7, easeOutCubic),
    );
  }

  function* showApi(): ThreadGenerator {
    yield* all(
      arrowTop().opacity(1, 0.5, easeOutCubic),
      arrowBottom().opacity(1, 0.5, easeOutCubic),
    );
  }

  function* showComponents(): ThreadGenerator {
    yield* sequence(0.15, ...ownerRefs.map(o => o().opacity(1, 0.5, easeOutCubic)));
  }

  function* note(text: string): ThreadGenerator {
    yield* caption().opacity(0, 0.25);
    caption().text(text);
    yield* caption().opacity(1, 0.35, easeOutCubic);
  }

  function* dissolve(): ThreadGenerator {
    yield* group().opacity(0, 0.6, easeOutCubic);
  }

  return {node, appear, showApi, showComponents, note, dissolve};
}
