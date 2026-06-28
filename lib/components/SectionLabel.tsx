import {Txt} from '@motion-canvas/2d';
import {createRef, easeOutCubic} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts} from '../theme';
import type {Widget} from '../widget';

/** Y-position pinned near the top of the panel; the label stays here all scene. */
const LABEL_Y = -330;
const FADE_IN = 0.5; // how long the label takes to appear
const RETITLE = 0.4; // cross-fade when the same label changes its text

export interface SectionLabel extends Widget {
  /** Cross-fade to a new caption as the scene moves to its next beat. */
  retitle(text: string, duration?: number): ThreadGenerator;
}

/**
 * The muted caption at the top of a "numbers / scaling" scene. One label is
 * shown once with {@link SectionLabel.appear} and then re-titled per beat, so the
 * heading text tracks what's currently on screen.
 */
export function sectionLabel(text: string): SectionLabel {
  const ref = createRef<Txt>();

  const node = (
    <Txt ref={ref} text={text} fill={colors.textMuted}
      fontSize={26} fontWeight={600} fontFamily={fonts.mono} y={LABEL_Y} opacity={0}/>
  );

  function* appear(): ThreadGenerator {
    yield* ref().opacity(1, FADE_IN, easeOutCubic);
  }

  function* retitle(next: string, duration = RETITLE): ThreadGenerator {
    yield* ref().text(next, duration);
  }

  return {node, appear, retitle};
}
