import {createSignal, easeOutCubic} from '@motion-canvas/core';
import type {SignalValue, ThreadGenerator} from '@motion-canvas/core';

/**
 * A value rendered as text that can animate from `0` up to a target — used for the
 * "counting up" numbers on cards (RAM, price, capacity…).
 *
 * Pass a number to get an animated counter, or a string for a fixed label (e.g.
 * `'∞'`) that renders immediately and ignores `count()`.
 */
export interface Counter {
  /** Reactive text — bind straight to a `<Txt text={...}/>`. */
  readonly text: SignalValue<string>;
  /** Tween the value to its target over `duration` seconds (no-op when static). */
  count(duration: number): ThreadGenerator;
}

function* noop(): ThreadGenerator {
  // static counters have nothing to animate
}

export function counter(
  target: number | string,
  format: (value: number) => string = value => String(Math.round(value)),
): Counter {
  if (typeof target === 'string') {
    return {text: target, count: noop};
  }

  const value = createSignal(0);
  return {
    text: () => format(value()),
    count: duration => value(target, duration, easeOutCubic),
  };
}
