import {Node, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  clamp,
  createRef,
  createSignal,
  delay,
  easeInOutCubic,
  easeInOutSine,
  easeOutCubic,
  range,
  sequence,
} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, counter, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// ── The bar ───────────────────────────────────────────────────────────────────
const BAR = {width: 860, height: 78, radius: 10} as const;
const GAP = 4; // opens between fields when they separate; all but gone at true scale

/**
 * The frame laid out as it goes on the wire — the checksum sits *after* the payload, so
 * the overhead visibly wraps the useful part.
 *
 * `share` is the readable, deliberately-not-to-scale width used while fields are being
 * named; `bytes` is the truth the bar switches to once the proportion becomes the point.
 */
const SEGMENTS = [
  {label: 'ПРЕАМБУЛА', bytes: 8, share: 0.137, kind: 'overhead'},
  {label: 'MAC', bytes: 6, share: 0.107, kind: 'address'},
  {label: 'MAC', bytes: 6, share: 0.107, kind: 'address'},
  {label: 'ТИП', bytes: 2, share: 0.077, kind: 'overhead'},
  {label: '', bytes: null, share: 0.465, kind: 'payload'},
  {label: 'CRC', bytes: 4, share: 0.107, kind: 'overhead'},
] as const;

const PAYLOAD_INDEX = 4;
const LAST_HEADER_INDEX = 3;
const OVERHEAD_BYTES = SEGMENTS.reduce((sum, s) => sum + (s.bytes ?? 0), 0); // 26
const FULL_PAYLOAD = 1500;

// A label only earns its place once its segment is wide enough to hold it.
const LABEL_FIT = {floor: 46, ramp: 34} as const;

// ── Label slots, relative to the bar's centre ─────────────────────────────────
const TOTAL_Y = -BAR.height / 2 - 34;
const LEGEND_Y = 68;
const DEFINE_Y = 96;
const STATS_Y = 116;
const SHARE_Y = 186;
const SHARE_NOTE_Y = 226;

// ── Timing ────────────────────────────────────────────────────────────────────
const APPEAR = 0.8;
const LABEL_IN = 0.5;
const SPREAD = 0.55;
const COUNT_UP = 1.1;
const TO_SCALE = 1.4; // schematic → true proportion; the overhead collapsing is the payoff
const SHRINK = 3.4; // the slider drag — long on purpose, it carries a 13-second line
const DOCK = 0.9;

export interface FrameBarOptions {
  /** Resting vertical position of the bar. */
  y: number;
}

export interface FrameBar extends Widget {
  /** Spell out what "служебное" means. */
  define(): ThreadGenerator;
  /** Drop the abstract labels — the bar is about to get concrete. */
  concrete(): ThreadGenerator;
  /** Count the overhead up to 26 bytes. */
  countTotal(): ThreadGenerator;
  /** Separate the overhead into named fields; `from`..`to` are segment indices. */
  revealFields(from: number, to: number): ThreadGenerator;
  /** Redraw to true proportion with a full payload — the overhead becomes a hairline. */
  toScale(): ThreadGenerator;
  /** Drag the payload down; the overhead share climbs with it. */
  shrinkPayload(bytes: number): ThreadGenerator;
  /** Swap the line under the share readout. */
  note(text: string): ThreadGenerator;
  /** Shrink up out of the way so the cost comparison can take the floor. */
  dock(y: number, scale: number): ThreadGenerator;
  /** Leave, so the closing line stands alone. */
  dismiss(): ThreadGenerator;
}

/**
 * The Ethernet frame as one bar that never leaves the screen. It starts abstract (useful
 * vs overhead), splits into named fields, then redraws itself to true scale — and that
 * redraw *is* the argument: 26 bytes against 1500 collapse to a hairline on their own.
 * Dragging the payload back down re-inflates them.
 */
export function frameBar({y}: FrameBarOptions): FrameBar {
  const group = createRef<Node>();
  const bar = createRef<Node>();
  const segments = range(SEGMENTS.length).map(() => createRef<Rect>());
  const sizes = range(SEGMENTS.length).map(() => createRef<Txt>());
  const serviceLabel = createRef<Txt>();
  const payloadLabel = createRef<Txt>();
  const defineLabel = createRef<Node>();
  const totalLabel = createRef<Txt>();
  const stats = createRef<Node>();
  const shareLabel = createRef<Txt>();
  const shareNote = createRef<Txt>();

  const payload = createSignal<number>(FULL_PAYLOAD);
  const scaled = createSignal(0); // 0 = readable schematic, 1 = true proportion
  const spread = createSignal(0); // 0 = overhead reads as one block, 1 = separate fields
  const legendOn = createSignal(0);

  const total = counter(OVERHEAD_BYTES, value => `${Math.round(value)} Б СЛУЖЕБНЫХ`);

  const accent = colors.cyan;
  const fills: Record<string, string> = {
    overhead: withAlpha(accent, 0.16),
    address: withAlpha(accent, 0.28), // brighter: the same two addresses as the last scene
    payload: colors.track, // already carries its own alpha
  };
  const strokes: Record<string, string> = {
    overhead: withAlpha(accent, 0.7),
    address: withAlpha(accent, 0.95),
    payload: colors.border,
  };

  const gapNow = () => GAP * spread() * (1 - scaled() * 0.8);
  const available = () => BAR.width - gapNow() * (SEGMENTS.length - 1);
  const totalBytes = () => OVERHEAD_BYTES + payload();

  const widths = SEGMENTS.map(segment => () => {
    const schematic = segment.share * available();
    const truth = (available() * (segment.bytes ?? payload())) / totalBytes();
    return schematic + (truth - schematic) * scaled();
  });

  const offsets = SEGMENTS.map((_, index) => () => {
    let left = -BAR.width / 2;
    for (let k = 0; k < index; k++) left += widths[k]() + gapNow();
    return left + widths[index]() / 2;
  });

  /** Centre of the four header fields, so the abstract label sits over all of them. */
  const headerCentre = () => {
    let span = -gapNow();
    for (let k = 0; k <= LAST_HEADER_INDEX; k++) span += widths[k]() + gapNow();
    return -BAR.width / 2 + span / 2;
  };

  /** Fades a label out as its segment gets too narrow to hold it. */
  const fitsIn = (index: number) => () =>
    clamp(0, 1, (widths[index]() - LABEL_FIT.floor) / LABEL_FIT.ramp);

  const cornerOf = (index: number) =>
    index === 0
      ? [BAR.radius, 0, 0, BAR.radius]
      : index === SEGMENTS.length - 1
        ? [0, BAR.radius, BAR.radius, 0]
        : 0;

  const node = (
    <Node ref={group} y={y}>
      <Node ref={bar} opacity={0} scale={0.97}>
        {SEGMENTS.map((segment, index) => (
          <Rect
            ref={segments[index]}
            x={offsets[index]}
            width={widths[index]}
            height={BAR.height}
            radius={cornerOf(index)}
            fill={fills[segment.kind]}
            stroke={strokes[segment.kind]}
            lineWidth={1.5}
          >
            <Txt ref={sizes[index]} text={segment.bytes ? String(segment.bytes) : ''}
              fill={colors.text} fontSize={30} fontFamily={fonts.mono} fontWeight={500}
              opacity={0}/>
          </Rect>
        ))}

        {/* Abstract labels: they carry the first beat, then hand over to the field names. */}
        <Txt ref={serviceLabel} x={headerCentre} text="СЛУЖЕБНОЕ" fill={accent}
          fontSize={22} fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.5}
          opacity={0}/>
        <Txt ref={payloadLabel} x={offsets[PAYLOAD_INDEX]} text="ПОЛЕЗНЫЕ ДАННЫЕ"
          fill={colors.textDim} fontSize={22} fontFamily={fonts.mono} letterSpacing={1.5}
          opacity={0}/>
      </Node>

      {SEGMENTS.map((segment, index) => (
        <Txt x={offsets[index]} y={LEGEND_Y} text={segment.label} fill={colors.textMuted}
          fontSize={17} fontFamily={fonts.mono} letterSpacing={1.2}
          opacity={() => legendOn() * fitsIn(index)()}/>
      ))}

      <Node ref={defineLabel} y={DEFINE_Y} opacity={0}>
        <Txt text="не несут никакой полезной информации" fill={colors.textDim}
          fontSize={24} fontFamily={fonts.display}/>
        <Txt y={34} text="нужны только для того, чтобы работал сам протокол"
          fill={colors.textMuted} fontSize={22} fontFamily={fonts.display}/>
      </Node>

      <Txt ref={totalLabel} y={TOTAL_Y} text={total.text} fill={accent} fontSize={26}
        fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.5} opacity={0}/>

      <Node ref={stats} y={STATS_Y} opacity={0}>
        <Txt x={-200} text={`СЛУЖЕБНОЕ  ${OVERHEAD_BYTES} Б`} fill={accent} fontSize={22}
          fontFamily={fonts.mono} letterSpacing={1.2}/>
        <Txt x={200} text={() => `ПОЛЕЗНОЕ  ${Math.round(payload())} Б`}
          fill={colors.textDim} fontSize={22} fontFamily={fonts.mono} letterSpacing={1.2}/>
      </Node>

      <Txt ref={shareLabel} y={SHARE_Y}
        text={() => `≈ ${Math.round((OVERHEAD_BYTES / totalBytes()) * 100)}%`}
        fill={accent} fontSize={54} fontFamily={fonts.mono} fontWeight={600} opacity={0}/>
      <Txt ref={shareNote} y={SHARE_NOTE_Y} text="служебного в кадре" fill={colors.textMuted}
        fontSize={21} fontFamily={fonts.display} opacity={0}/>
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* all(
      bar().opacity(1, APPEAR, easeOutCubic),
      bar().scale(1, APPEAR, easeOutCubic),
      delay(0.3, all(
        serviceLabel().opacity(1, LABEL_IN, easeOutCubic),
        payloadLabel().opacity(1, LABEL_IN, easeOutCubic),
      )),
    );
  }

  function* define(): ThreadGenerator {
    yield* defineLabel().opacity(1, LABEL_IN, easeOutCubic);
  }

  function* concrete(): ThreadGenerator {
    yield* all(
      defineLabel().opacity(0, 0.4, easeInOutCubic),
      serviceLabel().opacity(0, 0.4, easeInOutCubic),
    );
  }

  function* countTotal(): ThreadGenerator {
    yield* all(totalLabel().opacity(1, LABEL_IN, easeOutCubic), total.count(COUNT_UP));
  }

  function* revealFields(from: number, to: number): ThreadGenerator {
    const opening = from === 0;
    const indices = range(from, to + 1).filter(index => index !== PAYLOAD_INDEX);
    yield* all(
      ...(opening
        ? [spread(1, SPREAD, easeInOutCubic), legendOn(1, SPREAD, easeOutCubic)]
        : []),
      sequence(0.12, ...indices.map(i => sizes[i]().opacity(1, LABEL_IN, easeOutCubic))),
    );
  }

  function* toScale(): ThreadGenerator {
    yield* all(
      scaled(1, TO_SCALE, easeInOutCubic),
      totalLabel().opacity(0, 0.5, easeInOutCubic),
      delay(TO_SCALE * 0.55, all(
        stats().opacity(1, LABEL_IN, easeOutCubic),
        shareLabel().opacity(1, LABEL_IN, easeOutCubic),
        shareNote().opacity(1, LABEL_IN, easeOutCubic),
      )),
    );
  }

  function* shrinkPayload(bytes: number): ThreadGenerator {
    yield* all(
      payload(bytes, SHRINK, easeInOutSine),
      // the share stops being a footnote and becomes the problem
      shareLabel().fill(colors.orange, SHRINK, easeInOutSine),
    );
  }

  function* note(text: string): ThreadGenerator {
    yield* shareNote().opacity(0, 0.3, easeInOutCubic);
    shareNote().text(text);
    yield* shareNote().opacity(1, 0.4, easeOutCubic);
  }

  function* dock(toY: number, scale: number): ThreadGenerator {
    yield* all(
      stats().opacity(0, 0.4, easeInOutCubic),
      shareNote().opacity(0, 0.4, easeInOutCubic),
      shareLabel().opacity(0, 0.4, easeInOutCubic),
      legendOn(0, 0.4, easeInOutCubic),
      delay(0.2, all(
        group().y(toY, DOCK, easeInOutCubic),
        group().scale(scale, DOCK, easeInOutCubic),
      )),
    );
  }

  function* dismiss(): ThreadGenerator {
    yield* all(
      group().opacity(0, 0.6, easeInOutCubic),
      group().y(group().y() - 26, 0.6, easeInOutCubic),
    );
  }

  return {
    node,
    appear,
    define,
    concrete,
    countTotal,
    revealFields,
    toScale,
    shrinkPayload,
    note,
    dock,
    dismiss,
  };
}
