import {Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, createSignal, easeInOutSine, easeOutCubic} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';
import {PULSE_HALF} from './pulse';

const APPEAR = 0.6;
const RISE = 14; // the chip lifts into place rather than just fading

// Attention pulse — the same beat as the card's, one notch stronger since the chip is small.
const PULSE_SCALE = 1.035;
const GLOW = {rest: 10, peak: 38} as const;

export interface HintChipOptions {
  text: string;
  /** Resting vertical position. */
  y: number;
}

export interface HintChip extends Widget {
  /**
   * Endless attention pulse — fork it with `yield` on the same frame as the card's, so the
   * shared {@link PULSE_HALF} keeps both breathing in step.
   */
  pulse(): ThreadGenerator;
}

/** A pill that points the viewer at the YouTube card — one line of mono plus an arrow. */
export function hintChip({text, y}: HintChipOptions): HintChip {
  const ref = createRef<Rect>();
  const glow = createSignal<number>(GLOW.rest);
  const accent = colors.cyan;

  const node = (
    <Rect
      ref={ref}
      layout
      alignItems="center"
      gap={14}
      padding={[14, 26]}
      radius={999}
      fill={withAlpha(accent, 0.1)}
      stroke={withAlpha(accent, 0.5)}
      lineWidth={1.5}
      shadowColor={withAlpha(accent, 0.45)}
      shadowBlur={glow}
      y={y + RISE}
      opacity={0}
    >
      <Txt text={text} fill={colors.text} fontSize={24} fontFamily={fonts.mono} letterSpacing={1.5}/>
      <Txt text="↗" fill={accent} fontSize={26} fontFamily={fonts.mono}/>
    </Rect>
  );

  function* appear(): ThreadGenerator {
    yield* all(
      ref().opacity(1, APPEAR, easeOutCubic),
      ref().y(y, APPEAR, easeOutCubic),
    );
  }

  function* pulse(): ThreadGenerator {
    while (true) {
      yield* all(
        ref().scale(PULSE_SCALE, PULSE_HALF, easeInOutSine),
        glow(GLOW.peak, PULSE_HALF, easeInOutSine),
      );
      yield* all(
        ref().scale(1, PULSE_HALF, easeInOutSine),
        glow(GLOW.rest, PULSE_HALF, easeInOutSine),
      );
    }
  }

  return {node, appear, pulse};
}
