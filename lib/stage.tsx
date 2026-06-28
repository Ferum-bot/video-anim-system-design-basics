import {Rect} from '@motion-canvas/2d';
import type {View2D} from '@motion-canvas/2d';
import {createRef, easeInOutCubic, waitUntil} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors} from './theme';

/**
 * The full canvas is 1920×1080. Scenes render into a centred 960-wide column so
 * the host can place a talking head / narration in the other half of the frame.
 */
export const STAGE = {width: 960, height: 1080} as const;

/** Default width for full-width elements (spec cards, banners). */
export const CARD_WIDTH = 800;

/**
 * Render with a **transparent** background instead of the dark fill.
 *
 * Flip to `true` before exporting frames for an overlay (composited over footage in
 * CapCut etc.) — the PNG sequence then carries an alpha channel. Flip back to `false`
 * for comfortable work, so the editor shows the usual dark backdrop. Rendering runs
 * from the dev editor, so this is a manual switch rather than a build-time flag.
 */
export const TRANSPARENT = true;

/**
 * Fill the view with the background and return a clipped, centred panel to mount
 * scene content into. Every scene starts with `const stage = createStage(view)`.
 */
export function createStage(view: View2D): Rect {
  if (!TRANSPARENT) view.fill(colors.background);

  const panel = createRef<Rect>();
  view.add(
    <Rect ref={panel} width={STAGE.width} height={STAGE.height}
      fill={TRANSPARENT ? null : colors.background} clip/>,
  );
  return panel();
}

/** Seconds for the closing fade every scene shares. */
const FADE_OUT = 0.8;

/**
 * The shared scene ending: wait on the draggable `end` timeline anchor, then fade
 * the whole panel out. Every scene finishes with `yield* endScene(stage)`.
 */
export function* endScene(stage: Rect): ThreadGenerator {
  yield* waitUntil('end'); // drag this anchor to set where the scene ends
  yield* stage.opacity(0, FADE_OUT, easeInOutCubic); // smooth fade-out of everything
}
