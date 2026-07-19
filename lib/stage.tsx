import {Grid, Rect} from '@motion-canvas/2d';
import type {View2D} from '@motion-canvas/2d';
import {createRef, easeInOutCubic, waitUntil} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {activeTheme, withAlpha} from './theme';

/**
 * The full canvas is 1920×1080. Scenes render into a centred 960-wide column so the host
 * can composite a talking head in the other half of the frame.
 */
export const STAGE = {width: 960, height: 1080} as const;

/** Default width for full-width elements (spec cards, banners). */
export const CARD_WIDTH = 800;

/** Grid multiple: a brighter major line every N minor cells. */
const GRID_MAJOR = 4;

/**
 * Fill the view per the active theme's {@link StageStyle} and return a clipped, centred
 * panel to mount scene content into. Every scene starts with `const stage = createStage(view)`.
 *
 * Handles both looks from one place:
 * - **Solid** (`scrimAlpha: 1`) — opaque backdrop while editing; transparent frame on
 *   export (a `backdrop()` plate gives readability). Video 01.
 * - **Scrim** (`scrimAlpha < 1`) — a translucent dark panel (+ optional grid) that darkens
 *   footage rather than hiding it. Video 02.
 */
export function createStage(view: View2D): Rect {
  const {stage} = activeTheme();
  const editing = !stage.transparent;
  const solid = stage.scrimAlpha >= 1;

  // While editing, paint something behind the panel: the footage stand-in if the theme
  // wants to preview a translucent scrim, otherwise the solid fill.
  if (editing) view.fill(stage.footageSim ?? stage.fill);

  // Panel fill: solid themes drop to a transparent frame on export (backdrop() handles
  // readability); scrim themes keep their translucent plate in both modes.
  const panelFill = solid
    ? (editing ? stage.fill : null)
    : withAlpha(stage.fill, stage.scrimAlpha);

  // Optional explicit frame: inset the panel from the column edges, round it, and stroke it.
  const frame = stage.frame;
  const width = STAGE.width - (frame ? frame.inset * 2 : 0);
  const height = STAGE.height - (frame ? frame.inset * 2 : 0);

  const panel = createRef<Rect>();
  view.add(
    <Rect ref={panel} width={width} height={height} fill={panelFill} clip
      radius={frame?.radius ?? 0} stroke={frame?.stroke} lineWidth={frame?.lineWidth ?? 0}>
      {stage.grid && (
        <>
          <Grid width={width} height={height}
            spacing={stage.grid.pitch} stroke={stage.grid.minor} lineWidth={1}/>
          <Grid width={width} height={height}
            spacing={stage.grid.pitch * GRID_MAJOR} stroke={stage.grid.major} lineWidth={1.5}/>
        </>
      )}
    </Rect>,
  );
  return panel();
}

/** Seconds for the opening fade every scene shares. */
const FADE_IN = 1;

/**
 * The shared scene opening: fade the whole panel in. Scenes start hidden
 * (`stage.opacity(0)`) and reveal here, usually composed with their first content so the
 * frame appears together with it — `yield* all(revealStage(stage), heading.appear(), …)`.
 * Returns the tween so it can sit inside an {@link all}.
 */
export function revealStage(stage: Rect, duration = FADE_IN): ThreadGenerator {
  return stage.opacity(1, duration, easeInOutCubic);
}

/** Seconds for the closing fade every scene shares. */
const FADE_OUT = 0.8;

/**
 * The shared scene ending: wait on the draggable `end` timeline anchor, then fade the
 * whole panel out. Every scene finishes with `yield* endScene(stage)`.
 */
export function* endScene(stage: Rect): ThreadGenerator {
  yield* waitUntil('end'); // drag this anchor to set where the scene ends
  yield* stage.opacity(0, FADE_OUT, easeInOutCubic); // smooth fade-out of everything
}
