import {Txt} from '@motion-canvas/2d';
import {createRef, easeInOutCubic, easeOutCubic} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts} from '@lib';

// The commentary line under the scene. It outlives the widgets above it, so it lives at the
// scene level instead of inside one of them.
const OUT = 0.22;
const IN = 0.45;

export interface RunningNote {
  readonly node: Txt;
  /** Cross-fade to the next line. */
  say(text: string): ThreadGenerator;
}

/** Одна бегущая строка-комментарий под сценой. */
export function runningNote({y}: {y: number}): RunningNote {
  const ref = createRef<Txt>();
  const node = (
    <Txt ref={ref} y={y} text="" fill={colors.textDim} fontSize={23} fontFamily={fonts.display}
      opacity={0}/>
  );

  function* say(text: string): ThreadGenerator {
    if (ref().opacity() > 0) yield* ref().opacity(0, OUT, easeInOutCubic);
    ref().text(text);
    yield* ref().opacity(1, IN, easeOutCubic);
  }

  return {node: node as Txt, say};
}
