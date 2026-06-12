import {Rect} from '@motion-canvas/2d';
import type {View2D} from '@motion-canvas/2d';
import {createRef} from '@motion-canvas/core';
import {colors} from './theme';

/**
 * The full canvas is 1920×1080. Scenes render into a centred 960-wide column so
 * the host can place a talking head / narration in the other half of the frame.
 */
export const STAGE = {width: 960, height: 1080} as const;

/** Default width for full-width elements (spec cards, banners). */
export const CARD_WIDTH = 800;

/**
 * Fill the view with the background and return a clipped, centred panel to mount
 * scene content into. Every scene starts with `const stage = createStage(view)`.
 */
export function createStage(view: View2D): Rect {
  view.fill(colors.background);

  const panel = createRef<Rect>();
  view.add(
    <Rect ref={panel} width={STAGE.width} height={STAGE.height} fill={colors.background} clip/>,
  );
  return panel();
}
