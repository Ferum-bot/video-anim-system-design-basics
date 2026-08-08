import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  delay,
  easeInOutCubic,
  easeOutCubic,
  range,
  sequence,
} from '@motion-canvas/core';
import type {Reference, ThreadGenerator} from '@motion-canvas/core';
import {colors, counter, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// ── Byte row ──────────────────────────────────────────────────────────────────
const BYTES = 6;
const CHIP = {width: 96, height: 74, radius: 12, gap: 14, fontSize: 40} as const;
const STEP = CHIP.width + CHIP.gap;
const FIRST_X = -((BYTES - 1) * STEP) / 2; // centre of byte 0
const ROW_WIDTH = BYTES * CHIP.width + (BYTES - 1) * CHIP.gap;
const SEAM = 24; // how far each half slides out when the address is cut in two
const HALF_X = 182; // centre of a half once the seam has opened

// ── The frame header the address unfolds out of ───────────────────────────────
const STRIP = {height: 56, radius: 10, cell: 150, gap: 8, payload: 250} as const;
const STRIP_WIDTH = 3 * STRIP.cell + 3 * STRIP.gap + STRIP.payload;
const stripCellX = (i: number) =>
  -STRIP_WIDTH / 2 + STRIP.cell / 2 + i * (STRIP.cell + STRIP.gap);
const STRIP_PAYLOAD_X =
  -STRIP_WIDTH / 2 + 3 * (STRIP.cell + STRIP.gap) + STRIP.payload / 2;

// ── Label slots, relative to the row's centre ─────────────────────────────────
const TITLE_Y = -104;
const NOTE_Y = -74;
const MEASURE_Y = 76;
const FACTORY_Y = 122;
const BADGE_Y = 154;

// ── Timing ────────────────────────────────────────────────────────────────────
const APPEAR = 0.7;
const UNFOLD = 0.85;
const SWEEP = 0.85;
const COUNT_UP = 1.3;
const FACTORY_AFTER = 3.6; // «вшит на заводе» lands well after the bit count
const LABEL_IN = 0.5;
const CUT = 0.6;
const FOCUS = 0.5;
const SWAP = 0.5;
const DOCK = 0.9;
const DIMMED = 0.28; // opacity of the half that isn't in focus

// A real Apple prefix first, a real Intel one after the swap — the serial half never
// changes, which is the whole point of the beat.
const VENDORS = [
  {name: 'Apple', oui: ['A4', '83', 'E7']},
  {name: 'Intel', oui: ['00', '1B', '21']},
] as const;
const SERIAL = ['2B', '19', 'C4'] as const;

/** The address the row ends on — props that echo it read it from here. */
export const MAC_TEXT = [...VENDORS[1].oui, ...SERIAL].join(':');

export interface AddressBytesOptions {
  /** Resting vertical position of the byte row. */
  y: number;
}

export interface AddressBytes extends Widget {
  /** Header cell widens and dissolves into the six bytes. */
  unfold(): ThreadGenerator;
  /** Sweep across the address, count up to 48 bits, then note where it comes from. */
  measure(): ThreadGenerator;
  /** Cut between byte 3 and 4; the vendor-id half takes the signal accent. */
  cut(): ThreadGenerator;
  /** Label the second half as the vendor's own serial. */
  markSerial(): ThreadGenerator;
  /** Dim the serial, put the vendor id in focus and hang a vendor badge off it. */
  focusVendor(): ThreadGenerator;
  /** Flip the prefix to another real vendor — the serial half stays put. */
  swapVendor(): ThreadGenerator;
  /** Drop every annotation and shrink up to `y`, making room for the scope diagram. */
  dock(y: number, scale: number): ThreadGenerator;
}

/**
 * The MAC address as six byte chips: it unfolds out of a frame header, gets measured,
 * cut into vendor id + serial, resolved to a vendor, and finally shrinks away to become
 * a prop in the scope diagram. One object, six phases — the scene never cuts away from it.
 */
export function addressBytes({y}: AddressBytesOptions): AddressBytes {
  const group = createRef<Node>();
  const intro = createRef<Node>(); // the header strip, before the address exists
  const cell = createRef<Rect>(); // the ADDRESS cell that grows into the row
  const cellLabel = createRef<Txt>();
  const otherCells = createRef<Node>();
  const row = createRef<Node>();
  const left = createRef<Node>();
  const right = createRef<Node>();
  const midColon = createRef<Txt>();
  const sweep = createRef<Rect>();
  const chips = range(BYTES).map(() => createRef<Rect>());
  const ouiBytes = range(3).map(() => createRef<Txt>());
  const measureLabel = createRef<Txt>();
  const factoryLabel = createRef<Txt>();
  const ouiTitle = createRef<Node>();
  const serialTitle = createRef<Node>();
  const leftCount = createRef<Txt>();
  const rightCount = createRef<Txt>();
  const connector = createRef<Line>();
  const badge = createRef<Rect>();
  const badgeText = createRef<Txt>();

  const bits = counter(48, value => `${Math.round(value)} БИТ · 6 БАЙТ`);

  const neutralStroke = withAlpha(colors.borderStrong, 0.9);
  const neutralFill = withAlpha(colors.surface, 0.8);

  const byteChip = (index: number, text: string, textRef?: Reference<Txt>) => (
    <Rect
      ref={chips[index]}
      x={FIRST_X + index * STEP}
      width={CHIP.width}
      height={CHIP.height}
      radius={CHIP.radius}
      fill={neutralFill}
      stroke={neutralStroke}
      lineWidth={1.5}
    >
      <Txt ref={textRef} text={text} fill={colors.text} fontSize={CHIP.fontSize}
        fontFamily={fonts.mono} fontWeight={500}/>
    </Rect>
  );

  const colon = (index: number, ref?: Reference<Txt>) => (
    <Txt ref={ref} x={FIRST_X + index * STEP + STEP / 2} text=":"
      fill={colors.textMuted} fontSize={34} fontFamily={fonts.mono}/>
  );

  // Title + note pair sitting over one half of the address.
  const halfTitle = (
    ref: Reference<Node>,
    x: number,
    title: string,
    note: string,
    accent: string,
  ) => (
    <Node ref={ref} x={x} opacity={0}>
      <Txt y={TITLE_Y} text={title} fill={accent} fontSize={22} fontWeight={600}
        fontFamily={fonts.mono} letterSpacing={1.5}/>
      <Txt y={NOTE_Y} text={note} fill={colors.textMuted} fontSize={21}
        fontFamily={fonts.display}/>
    </Node>
  );

  const node = (
    <Node ref={group} y={y}>
      <Node ref={intro} opacity={0} scale={0.96}>
        <Rect ref={cell} x={stripCellX(0)} width={STRIP.cell} height={STRIP.height}
          radius={STRIP.radius} fill={withAlpha(colors.cyan, 0.14)}
          stroke={withAlpha(colors.cyan, 0.8)} lineWidth={1.5} opacity={0}>
          <Txt ref={cellLabel} text="АДРЕС" fill={colors.cyan} fontSize={22}
            fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.5} opacity={0}/>
        </Rect>
        <Node ref={otherCells} opacity={0}>
          {[1, 2].map(i => (
            <Rect x={stripCellX(i)} width={STRIP.cell} height={STRIP.height}
              radius={STRIP.radius} fill={withAlpha(colors.surface, 0.6)}
              stroke={withAlpha(colors.border, 0.9)} lineWidth={1.5}>
              <Txt text="···" fill={colors.textMuted} fontSize={24} fontFamily={fonts.mono}/>
            </Rect>
          ))}
          <Rect x={STRIP_PAYLOAD_X} width={STRIP.payload} height={STRIP.height}
            radius={STRIP.radius} fill={colors.track /* already carries its own alpha */}
            stroke={withAlpha(colors.border, 0.7)} lineWidth={1.5}>
            <Txt text="ДАННЫЕ" fill={colors.textMuted} fontSize={20}
              fontFamily={fonts.mono} letterSpacing={1.5}/>
          </Rect>
        </Node>
      </Node>

      <Node ref={row} opacity={0}>
        <Node ref={left}>
          {byteChip(0, VENDORS[0].oui[0], ouiBytes[0])}
          {colon(0)}
          {byteChip(1, VENDORS[0].oui[1], ouiBytes[1])}
          {colon(1)}
          {byteChip(2, VENDORS[0].oui[2], ouiBytes[2])}
        </Node>
        {colon(2, midColon)}
        <Node ref={right}>
          {byteChip(3, SERIAL[0])}
          {colon(3)}
          {byteChip(4, SERIAL[1])}
          {colon(4)}
          {byteChip(5, SERIAL[2])}
        </Node>
        <Rect ref={sweep} width={3} height={CHIP.height + 26} fill={colors.cyan}
          shadowColor={colors.cyan} shadowBlur={22} opacity={0}/>
      </Node>

      {halfTitle(ouiTitle, -HALF_X, 'ИДЕНТИФИКАТОР ВЕНДОРА', 'выдаёт институт', colors.cyan)}
      {halfTitle(serialTitle, HALF_X, 'СЕРИЙНЫЙ НОМЕР', 'вендор раздаёт сам', colors.orange)}

      <Txt ref={measureLabel} y={MEASURE_Y} text={bits.text} fill={colors.textDim}
        fontSize={24} fontFamily={fonts.mono} letterSpacing={1.5} opacity={0}/>
      <Txt ref={factoryLabel} y={FACTORY_Y} text="вшит в сетевую карту на заводе"
        fill={colors.textMuted} fontSize={22} fontFamily={fonts.display} opacity={0}/>
      <Txt ref={leftCount} x={-HALF_X} y={MEASURE_Y} text="3 БАЙТА" fill={colors.cyan}
        fontSize={22} fontFamily={fonts.mono} letterSpacing={1.5} opacity={0}/>
      <Txt ref={rightCount} x={HALF_X} y={MEASURE_Y} text="3 БАЙТА" fill={colors.orange}
        fontSize={22} fontFamily={fonts.mono} letterSpacing={1.5} opacity={0}/>

      <Line ref={connector} x={-HALF_X} y={MEASURE_Y + 22}
        points={[[0, 0], [0, BADGE_Y - MEASURE_Y - 48]]}
        stroke={withAlpha(colors.cyan, 0.5)} lineWidth={1.5} lineDash={[5, 5]} end={0}/>
      <Rect ref={badge} x={-HALF_X} y={BADGE_Y + 14} layout alignItems="center" gap={12}
        padding={[10, 22]} radius={999} fill={withAlpha(colors.cyan, 0.12)}
        stroke={withAlpha(colors.cyan, 0.55)} lineWidth={1.5} opacity={0}>
        <Txt text="ВЕНДОР" fill={colors.textMuted} fontSize={18} fontFamily={fonts.mono}
          letterSpacing={1.5}/>
        <Txt ref={badgeText} text={VENDORS[0].name} fill={colors.text} fontSize={26}
          fontFamily={fonts.display} fontWeight={600}/>
      </Rect>
    </Node>
  );

  /** Cross-fade a label to new text in place. */
  function* retext(ref: Reference<Txt>, text: string): ThreadGenerator {
    yield* ref().opacity(0, SWAP / 2, easeInOutCubic);
    ref().text(text);
    yield* ref().opacity(1, SWAP / 2, easeOutCubic);
  }

  function* appear(): ThreadGenerator {
    yield* all(
      intro().opacity(1, APPEAR, easeOutCubic),
      intro().scale(1, APPEAR, easeOutCubic),
      cell().opacity(1, APPEAR, easeOutCubic),
      cellLabel().opacity(1, APPEAR, easeOutCubic),
      delay(0.2, otherCells().opacity(1, APPEAR, easeOutCubic)),
    );
  }

  function* unfold(): ThreadGenerator {
    yield* all(
      otherCells().opacity(0, 0.4, easeInOutCubic),
      cellLabel().opacity(0, 0.3, easeInOutCubic),
      cell().width(ROW_WIDTH, UNFOLD, easeInOutCubic),
      cell().height(CHIP.height, UNFOLD, easeInOutCubic),
      cell().x(0, UNFOLD, easeInOutCubic),
      delay(0.35, all(
        row().opacity(1, 0.5, easeOutCubic),
        cell().opacity(0, 0.5, easeInOutCubic),
      )),
    );
  }

  function* measure(): ThreadGenerator {
    sweep().x(-ROW_WIDTH / 2 - 24);
    yield* all(
      sweep().opacity(1, 0.15),
      sweep().x(ROW_WIDTH / 2 + 24, SWEEP, easeInOutCubic),
      delay(SWEEP * 0.6, sweep().opacity(0, 0.3)),
      delay(0.3, all(measureLabel().opacity(1, LABEL_IN, easeOutCubic), bits.count(COUNT_UP))),
      delay(FACTORY_AFTER, factoryLabel().opacity(1, LABEL_IN, easeOutCubic)),
    );
  }

  function* cut(): ThreadGenerator {
    yield* all(
      left().x(-SEAM, CUT, easeInOutCubic),
      right().x(SEAM, CUT, easeInOutCubic),
      midColon().opacity(0, 0.3, easeInOutCubic),
      measureLabel().opacity(0, 0.35, easeInOutCubic),
      factoryLabel().opacity(0, 0.35, easeInOutCubic),
      ...chips.slice(0, 3).flatMap(chip => [
        chip().stroke(withAlpha(colors.cyan, 0.85), CUT),
        chip().fill(withAlpha(colors.cyan, 0.14), CUT),
      ]),
      delay(0.3, all(
        ouiTitle().opacity(1, LABEL_IN, easeOutCubic),
        leftCount().opacity(1, LABEL_IN, easeOutCubic),
      )),
    );
  }

  function* markSerial(): ThreadGenerator {
    yield* all(
      ...chips.slice(3).flatMap(chip => [
        chip().stroke(withAlpha(colors.orange, 0.85), CUT),
        chip().fill(withAlpha(colors.orange, 0.12), CUT),
      ]),
      delay(0.2, all(
        serialTitle().opacity(1, LABEL_IN, easeOutCubic),
        rightCount().opacity(1, LABEL_IN, easeOutCubic),
      )),
    );
  }

  function* focusVendor(): ThreadGenerator {
    yield* all(
      right().opacity(DIMMED, FOCUS, easeInOutCubic),
      serialTitle().opacity(DIMMED, FOCUS, easeInOutCubic),
      rightCount().opacity(DIMMED, FOCUS, easeInOutCubic),
      delay(0.2, connector().end(1, 0.45, easeOutCubic)),
      delay(0.45, all(
        badge().opacity(1, LABEL_IN, easeOutCubic),
        badge().y(BADGE_Y, LABEL_IN, easeOutCubic),
      )),
    );
  }

  function* swapVendor(): ThreadGenerator {
    const next = VENDORS[1];
    yield* all(
      sequence(0.08, ...ouiBytes.map((ref, i) => retext(ref, next.oui[i]))),
      delay(0.22, retext(badgeText, next.name)),
    );
  }

  function* dock(toY: number, scale: number): ThreadGenerator {
    yield* all(
      ouiTitle().opacity(0, 0.4, easeInOutCubic),
      serialTitle().opacity(0, 0.4, easeInOutCubic),
      leftCount().opacity(0, 0.4, easeInOutCubic),
      rightCount().opacity(0, 0.4, easeInOutCubic),
      connector().opacity(0, 0.35, easeInOutCubic),
      badge().opacity(0, 0.4, easeInOutCubic),
      right().opacity(1, 0.5, easeInOutCubic),
      delay(0.25, all(
        group().y(toY, DOCK, easeInOutCubic),
        group().scale(scale, DOCK, easeInOutCubic),
      )),
    );
  }

  return {node, appear, unfold, measure, cut, markSerial, focusVendor, swapVendor, dock};
}
