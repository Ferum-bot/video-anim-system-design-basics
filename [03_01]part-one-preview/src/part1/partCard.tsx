import {Img, Line, Node, Rect} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  delay,
  easeInOutCubic,
  easeInOutSine,
  easeOutCubic,
} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, withAlpha} from '@lib';
import type {Widget} from '@lib';
import thumbnail from '../assets/part-one-thumbnail.jpg';
import {PULSE_HALF} from './pulse';

// Frame geometry — 16:9 at the panel's comfortable inner width (928 minus a 32px margin).
const CARD = {width: 864, height: 486, radius: 18, lineWidth: 2} as const;

// Blueprint corner ticks: L-shapes whose vertex sits just outside each corner. They draw
// outwards from that vertex, so `start`/`end` open symmetrically around the polyline's middle.
const BRACKET = {arm: 34, offset: 14, lineWidth: 2.5} as const;

// Entrance / exit
const APPEAR = 0.95;
const BRACKETS_IN = {delay: 0.35, duration: 0.6};
const DISMISS = 0.9;
const RISE = 24; // how far the card floats up into place
const ENTER_SCALE = 0.94;
const EXIT_SCALE = 0.965;
const EXIT_DRIFT = 18;

// Idle: a barely-there breath + glow so a still frame doesn't feel frozen over its long hold.
const BREATH = {scale: 1.008, half: 3.2} as const;
const GLOW = {rest: 30, breath: 58, pulse: 80} as const;

// The «переходи по подсказкам» beat: one nudge, then a livelier pulse shared with the chip.
const NUDGE = {scale: 1.022, out: 0.22, back: 0.42} as const;
const PULSE_SCALE = 1.018;

export interface PartCardOptions {
  /** Resting vertical position; the card floats up into it on appear. */
  y: number;
}

export interface PartCard extends Widget {
  /** Endless idle motion — fork it with `yield`; it auto-cancels when the scene ends. */
  idle(): ThreadGenerator;
  /** One-off emphasis when the narration points at the YouTube card. */
  nudge(): ThreadGenerator;
  /**
   * Endless attention pulse for the call-to-action beat — fork it in place of {@link idle}.
   * Shares {@link PULSE_HALF} with the chip so the two breathe together.
   */
  pulse(): ThreadGenerator;
  /** Exit: shrink a touch and drift up, meant to run alongside the panel fade. */
  dismiss(): ThreadGenerator;
}

/**
 * The previous video's thumbnail, framed as a blueprint card: rounded, cyan-edged, with
 * corner ticks that draw out of each corner and a slow glow so it stays alive on screen.
 */
export function partCard({y}: PartCardOptions): PartCard {
  const group = createRef<Node>(); // entrance / exit / nudge
  const breath = createRef<Node>(); // idle scale only, so it never fights `dismiss`
  const glow = createSignal<number>(GLOW.rest);
  const draw = createSignal(0); // 0 → 1 opens the corner ticks

  const accent = colors.cyan;

  // sx/sy pick the corner (-1 or 1); the arms always point back into the frame.
  const corner = (sx: number, sy: number) => (
    <Line
      x={sx * (CARD.width / 2 + BRACKET.offset)}
      y={sy * (CARD.height / 2 + BRACKET.offset)}
      points={[
        [0, -sy * BRACKET.arm],
        [0, 0],
        [-sx * BRACKET.arm, 0],
      ]}
      stroke={withAlpha(accent, 0.8)}
      lineWidth={BRACKET.lineWidth}
      lineCap="round"
      start={() => 0.5 - draw() / 2}
      end={() => 0.5 + draw() / 2}
    />
  );

  const node = (
    <Node ref={group} y={y + RISE} opacity={0} scale={ENTER_SCALE}>
      <Node ref={breath}>
        <Rect
          width={CARD.width}
          height={CARD.height}
          radius={CARD.radius}
          clip
          stroke={withAlpha(accent, 0.6)}
          lineWidth={CARD.lineWidth}
          shadowColor={withAlpha(accent, 0.4)}
          shadowBlur={glow}
        >
          <Img src={thumbnail} width={CARD.width} height={CARD.height}/>
        </Rect>
        {corner(-1, -1)}
        {corner(1, -1)}
        {corner(1, 1)}
        {corner(-1, 1)}
      </Node>
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* all(
      group().opacity(1, APPEAR, easeOutCubic),
      group().y(y, APPEAR, easeOutCubic),
      group().scale(1, APPEAR, easeOutCubic),
      delay(BRACKETS_IN.delay, draw(1, BRACKETS_IN.duration, easeOutCubic)),
    );
  }

  // Both loops drive the same two properties, so only one of them may run at a time.
  function* breathe(scale: number, peak: number, half: number): ThreadGenerator {
    while (true) {
      yield* all(
        breath().scale(scale, half, easeInOutSine),
        glow(peak, half, easeInOutSine),
      );
      yield* all(
        breath().scale(1, half, easeInOutSine),
        glow(GLOW.rest, half, easeInOutSine),
      );
    }
  }

  function* idle(): ThreadGenerator {
    yield* breathe(BREATH.scale, GLOW.breath, BREATH.half);
  }

  function* pulse(): ThreadGenerator {
    yield* breathe(PULSE_SCALE, GLOW.pulse, PULSE_HALF);
  }

  function* nudge(): ThreadGenerator {
    yield* group().scale(NUDGE.scale, NUDGE.out, easeOutCubic);
    yield* group().scale(1, NUDGE.back, easeInOutCubic);
  }

  function* dismiss(): ThreadGenerator {
    yield* all(
      group().opacity(0, DISMISS, easeInOutCubic),
      group().scale(EXIT_SCALE, DISMISS, easeInOutCubic),
      group().y(y - EXIT_DRIFT, DISMISS, easeInOutCubic),
      draw(0, DISMISS * 0.6, easeInOutCubic),
    );
  }

  return {node, appear, idle, pulse, nudge, dismiss};
}
