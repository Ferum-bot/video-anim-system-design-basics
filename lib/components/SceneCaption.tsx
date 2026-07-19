import {Txt} from '@motion-canvas/2d';
import {createRef, easeOutCubic} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '../theme';
import type {Widget} from '../widget';

// One mono caption pinned near the top of a scene's frame. Timing/easing are shared so every
// scene's heading reads and re-titles the same way.
const APPEAR = 0.9; // first fade-in, usually composed into the scene's reveal
const RETITLE_OUT = 0.25; // fade the old text out before swapping…
const RETITLE_IN = 0.35; // …then fade the new text in

export interface SceneCaptionOptions {
  text: string;
  /** Vertical position in the panel. Defaults to the top heading slot. */
  y?: number;
  /** Text colour. Defaults to the theme's primary accent at 85% alpha. */
  fill?: string;
  fontSize?: number;
  fontWeight?: number;
  letterSpacing?: number;
}

export interface SceneCaption extends Widget {
  /** Cross-fade to new text as the scene moves to its next beat. */
  retitle(text: string): ThreadGenerator;
}

/**
 * The mono caption a scene keeps near the top of its frame. Shown once with
 * {@link Widget.appear} — usually composed into the scene's fade-in — and optionally
 * re-titled per beat with {@link SceneCaption.retitle} so the heading tracks what's on screen.
 */
export function sceneCaption(options: SceneCaptionOptions): SceneCaption {
  const ref = createRef<Txt>();

  const node = (
    <Txt ref={ref} text={options.text} opacity={0} fontFamily={fonts.mono}
      y={options.y ?? -410}
      fill={options.fill ?? withAlpha(colors.cyan, 0.85)}
      fontSize={options.fontSize ?? 30}
      fontWeight={options.fontWeight ?? 400}
      letterSpacing={options.letterSpacing ?? 1}/>
  );

  function* appear(duration = APPEAR): ThreadGenerator {
    yield* ref().opacity(1, duration);
  }

  function* retitle(next: string): ThreadGenerator {
    yield* ref().opacity(0, RETITLE_OUT);
    ref().text(next);
    yield* ref().opacity(1, RETITLE_IN, easeOutCubic);
  }

  return {node, appear, retitle};
}
