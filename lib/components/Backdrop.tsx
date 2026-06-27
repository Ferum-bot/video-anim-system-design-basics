import {Rect} from '@motion-canvas/2d';
import {createRef, easeOutCubic} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors} from '../theme';
import {STAGE, TRANSPARENT} from '../stage';
import type {Widget} from '../widget';

// Solid dark panel that fades in behind the content so it stays readable when the
// animation is composited over bright footage. Only shows in transparent (export)
// mode — on the dark editor backdrop it stays invisible.
const OPACITY = 0.9; // strong dark backing; raise toward 1 for fully opaque
const FADE_IN = 1.2;

// Sized to hug the content (which spans roughly y -400..+460 across the scenes) with
// a small margin, instead of filling the whole frame — avoids empty dark space.
const HEIGHT = 900;
const Y_OFFSET = 24; // content sits slightly below centre

export function backdrop(): Widget {
  const ref = createRef<Rect>();
  const target = TRANSPARENT ? OPACITY : 0;

  const node = (
    <Rect ref={ref} width={STAGE.width - 20} height={HEIGHT} radius={24} y={Y_OFFSET}
      fill={colors.backdrop} opacity={0}/>
  );

  function* appear(): ThreadGenerator {
    yield* ref().opacity(target, FADE_IN, easeOutCubic);
  }

  return {node, appear};
}
