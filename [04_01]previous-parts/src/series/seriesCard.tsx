import {Img, Line, Node, Rect, Txt} from '@motion-canvas/2d';
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
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';
import {PULSE_HALF} from './pulse';

// Frame geometry — 16:9, as wide as the 928px inner panel comfortably allows. The two cards
// stack vertically rather than sitting side by side: in a 960 column that's the only way to
// give a thumbnail enough size to actually be read.
const CARD = {width: 620, height: 349, radius: 16, lineWidth: 2} as const;

// Blueprint corner ticks: L-shapes whose vertex sits just outside each corner. They draw
// outwards from that vertex, so `start`/`end` open symmetrically around the polyline's middle.
const BRACKET = {arm: 30, offset: 12, lineWidth: 2.4} as const;

// Каждая карточка подписана: превьюшка говорит о теме, подпись — о номере части.
const LABEL = {gap: 24, fontSize: 21, letterSpacing: 1.3} as const;

// Entrance / docking / exit
const APPEAR = 0.95;
const BRACKETS_IN = {delay: 0.35, duration: 0.6};
const DOCK = 1; // солидный проезд: карточка едет из геройского размера в слот
const DISMISS = 0.9;
const LIFT = 0.6; // подъём слота, когда снизу выезжает чип
const RISE = 22; // how far the card floats up into place
const ENTER_SCALE = 0.94; // relative to the card's resting scale
const EXIT_SCALE = 0.965;
const EXIT_DRIFT = 16;

// Idle: a barely-there breath + glow so the long hold between beats doesn't feel frozen.
const BREATH = {scale: 1.006, half: 3.2} as const;
const GLOW = {rest: 24, breath: 48, pulse: 66, flare: 84} as const;

// The «обязательно посмотри их» beat: one card lights up while the other steps back, so the
// spotlight reads as a choice between two rather than a twitch on one.
const FLARE = {scale: 1.045, up: 0.34, back: 0.5} as const;
const DIM = {opacity: 0.4, duration: 0.3} as const;
const PULSE_SCALE = 1.012;

export interface SeriesCardOptions {
  /** Thumbnail of the video this card stands for. */
  src: string;
  /** Mono caption under the frame — the part number the thumbnail itself doesn't carry. */
  label: string;
  /** Horizontal centre of the resting slot. */
  x: number;
  /** Vertical centre of the resting slot; the card floats up into it on appear. */
  y: number;
  /**
   * Where the card lives *before* its neighbour arrives — centred and a touch larger while it
   * is alone on screen. Omit for a card that appears straight into its slot; any field left
   * out falls back to the slot's own value. {@link SeriesCard.dock} then moves it into
   * `{x, y}` at scale 1.
   */
  enter?: {x?: number; y?: number; scale?: number};
}

export interface SeriesCard extends Widget {
  /** Slide from the solo position into the stacked slot. Only for a card built with `enter`. */
  dock(): ThreadGenerator;
  /** Endless idle motion — fork it with `yield`; it auto-cancels when the scene ends. */
  idle(): ThreadGenerator;
  /** One-off highlight when the narration points at this part. Cancel {@link idle} first. */
  flare(): ThreadGenerator;
  /**
   * Raise the resting slot by `dy` to free room underneath — the CTA chip lands there, and
   * the stack stays optically centred both before and after it appears.
   */
  lift(dy: number): ThreadGenerator;
  /** Step back so the neighbour's {@link flare} reads as a spotlight, not a twitch. */
  dim(): ThreadGenerator;
  /** Return to full presence after a {@link dim}. */
  undim(): ThreadGenerator;
  /**
   * Endless attention pulse for the call-to-action beat — fork it in place of {@link idle}.
   * Shares {@link PULSE_HALF} with the chip so everything on screen breathes together.
   */
  pulse(): ThreadGenerator;
  /** Exit: shrink a touch and drift up, meant to run alongside the panel fade. */
  dismiss(): ThreadGenerator;
}

/**
 * A previous video's thumbnail framed as a blueprint card: rounded, cyan-edged, with corner
 * ticks that draw out of each corner, a mono caption underneath and a slow glow so it stays
 * alive on screen through the hold.
 */
export function seriesCard({src, label, x, y, enter}: SeriesCardOptions): SeriesCard {
  const group = createRef<Node>(); // entrance / docking / exit / flare / dim
  const breath = createRef<Node>(); // idle scale only, so it never fights `dismiss`
  const glow = createSignal<number>(GLOW.rest);
  const draw = createSignal(0); // 0 → 1 opens the corner ticks
  const hot = createSignal(0); // 0 → 1 brightens edges and caption during a flare

  const accent = colors.cyan;

  // The resting pose changes once: solo → docked. Kept in variables so `flare`, `pulse` and
  // `dismiss` always return to wherever the card currently lives.
  let restX = enter?.x ?? x;
  let restY = enter?.y ?? y;
  let restScale = enter?.scale ?? 1;

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
      stroke={() => withAlpha(accent, 0.7 + hot() * 0.3)}
      lineWidth={BRACKET.lineWidth}
      lineCap="round"
      start={() => 0.5 - draw() / 2}
      end={() => 0.5 + draw() / 2}
    />
  );

  const node = (
    <Node ref={group} x={restX} y={restY + RISE} opacity={0} scale={restScale * ENTER_SCALE}>
      <Node ref={breath}>
        <Rect
          width={CARD.width}
          height={CARD.height}
          radius={CARD.radius}
          clip
          stroke={() => withAlpha(accent, 0.55 + hot() * 0.4)}
          lineWidth={CARD.lineWidth}
          shadowColor={withAlpha(accent, 0.4)}
          shadowBlur={glow}
        >
          <Img src={src} width={CARD.width} height={CARD.height}/>
        </Rect>
        {corner(-1, -1)}
        {corner(1, -1)}
        {corner(1, 1)}
        {corner(-1, 1)}
      </Node>
      <Txt
        y={CARD.height / 2 + LABEL.gap}
        text={label}
        fill={() => withAlpha(colors.text, 0.6 + hot() * 0.4)}
        fontSize={LABEL.fontSize}
        fontFamily={fonts.mono}
        letterSpacing={LABEL.letterSpacing}
      />
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* all(
      group().opacity(1, APPEAR, easeOutCubic),
      group().y(restY, APPEAR, easeOutCubic),
      group().scale(restScale, APPEAR, easeOutCubic),
      delay(BRACKETS_IN.delay, draw(1, BRACKETS_IN.duration, easeOutCubic)),
    );
  }

  function* dock(): ThreadGenerator {
    restX = x;
    restY = y;
    restScale = 1;
    yield* all(
      group().x(restX, DOCK, easeInOutCubic),
      group().y(restY, DOCK, easeInOutCubic),
      group().scale(restScale, DOCK, easeInOutCubic),
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

  function* flare(): ThreadGenerator {
    yield* all(
      group().scale(restScale * FLARE.scale, FLARE.up, easeOutCubic),
      hot(1, FLARE.up, easeOutCubic),
      glow(GLOW.flare, FLARE.up, easeOutCubic),
    );
    yield* all(
      group().scale(restScale, FLARE.back, easeInOutCubic),
      hot(0, FLARE.back, easeInOutCubic),
      glow(GLOW.rest, FLARE.back, easeInOutCubic),
    );
  }

  function* lift(dy: number): ThreadGenerator {
    restY -= dy;
    yield* group().y(restY, LIFT, easeInOutCubic);
  }

  function* dim(): ThreadGenerator {
    yield* group().opacity(DIM.opacity, DIM.duration, easeInOutCubic);
  }

  function* undim(): ThreadGenerator {
    yield* group().opacity(1, DIM.duration, easeInOutCubic);
  }

  function* dismiss(): ThreadGenerator {
    yield* all(
      group().opacity(0, DISMISS, easeInOutCubic),
      group().scale(restScale * EXIT_SCALE, DISMISS, easeInOutCubic),
      group().y(restY - EXIT_DRIFT, DISMISS, easeInOutCubic),
      draw(0, DISMISS * 0.6, easeInOutCubic),
    );
  }

  return {node, appear, dock, lift, idle, pulse, flare, dim, undim, dismiss};
}
