import type {Node} from '@motion-canvas/2d';
import type {ThreadGenerator} from '@motion-canvas/core';

/**
 * A self-contained piece of a scene: a node tree plus the animation that reveals
 * it. Scenes mount `node`, then `yield* appear()` when it's time to show it.
 */
export interface Widget {
  readonly node: Node;
  appear(): ThreadGenerator;
}
