import {Line, Node} from '@motion-canvas/2d';
import {createRef, easeInOutCubic, easeOutCubic} from '@motion-canvas/core';
import type {PossibleVector2, ThreadGenerator} from '@motion-canvas/core';
import {colors, withAlpha} from '@lib';

// A classic OS arrow pointer. The hotspot (tip) sits at the node's local origin,
// so the node's position *is* the tip — and scaling on click keeps the tip pinned.
const ARROW = [
  [0, 0], [0, 34], [9, 26], [15, 40], [21, 37], [15, 24], [26, 24],
] as PossibleVector2[];

const MOVE = 0.9; // default glide duration toward a target
const FADE = 0.3; // appear / disappear

export interface Cursor {
  readonly node: Node;
  /** Fade in at a starting point (tip position), hidden until then. */
  appearAt(pos: PossibleVector2): ThreadGenerator;
  /** Glide the tip to a target point. */
  moveTo(pos: PossibleVector2, duration?: number): ThreadGenerator;
  /** A quick press: dip + scale down and back, like a real tap. */
  click(): ThreadGenerator;
  /** Fade the cursor out. */
  fadeOut(): ThreadGenerator;
}

/** An arrow cursor that can glide to a target and perform a click tap. */
export function cursor(): Cursor {
  const ref = createRef<Line>();

  const node = (
    <Line ref={ref} points={ARROW} closed lineJoin="round"
      fill={colors.text} stroke={colors.background} lineWidth={1.5}
      shadowColor={withAlpha(colors.background, 0.25)} shadowBlur={3}
      opacity={0} scale={1}/>
  );

  function* appearAt(pos: PossibleVector2): ThreadGenerator {
    ref().position(pos);
    yield* ref().opacity(1, FADE, easeOutCubic);
  }

  function* moveTo(pos: PossibleVector2, duration = MOVE): ThreadGenerator {
    yield* ref().position(pos, duration, easeInOutCubic);
  }

  function* click(): ThreadGenerator {
    yield* ref().scale(0.82, 0.09).to(1, 0.14, easeOutCubic);
  }

  function* fadeOut(): ThreadGenerator {
    yield* ref().opacity(0, FADE, easeInOutCubic);
  }

  return {node, appearAt, moveTo, click, fadeOut};
}
