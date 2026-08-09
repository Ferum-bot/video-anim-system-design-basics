import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  clamp,
  createRef,
  createSignal,
  delay,
  easeInOutCubic,
  easeOutCubic,
  linear,
  range,
  waitFor,
} from '@motion-canvas/core';
import type {Reference, SimpleSignal, ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// One bar, two different rulers. The writes notch it from the top, the reads notch it from
// the bottom, and the band between the notches is never cut — that band *is* the stream, and
// the whole point of the scene is that it carries no boundaries of its own.
const TOTAL = 2048;
const BAR = {width: 760, height: 128, radius: 10} as const;
const NOTCH = 32;
const CHIP = {height: 40, radius: 8, gap: 4} as const;
const ROW = {write: -162, read: 162} as const;
const LABEL = {write: -208, read: 208} as const;
const NOTE_Y = 266;
const INSIDE_Y = -4;

// Three cut signals cover every layout we need; a cut parked at TOTAL collapses its chunk to
// nothing, so "one chunk" and "four chunks" are the same geometry at different values.
const CUTS = 3;
const CHUNKS = CUTS + 1;
const WRITES = [512, 1024, 1536];
const WRITE_STARTS = [0, ...WRITES];

const px = (bytes: number) => (bytes / TOTAL) * BAR.width;
const left = -BAR.width / 2;

const APPEAR = 0.8;
const SEAM = 0.55;
const CHIPS_IN = 0.5;
const POUR = 0.9;
const CUT = 0.55;
const NOTE = 0.45;
const DIM = 0; // the real reads step aside entirely, so the ghost has the row to itself
const FLOW_STEP = 46;
const FLOW_PERIOD = 1.9;
const REROLL_HOLD = 1.3;

/** Cut sets the tail keeps rolling through, so the last beat never freezes. */
const REROLL: readonly (readonly number[])[] = [
  [700, 900, 1800],
  [120, 1180, 1300],
  [980, 1500, 1700],
  [420, 610, 1900],
];

export interface ByteBarOptions {
  y: number;
}

export interface ByteBar extends Widget {
  /** «Границы сообщения не существует» — the message seams shrink away. */
  dissolveSeams(): ThreadGenerator;
  /** Name the two sides of the apparatus. */
  nameSides(): ThreadGenerator;
  /** Four writes of 512 B: chips above, notches on the top edge. */
  write(): ThreadGenerator;
  /** The writes become one continuous stream inside the bar. */
  pour(): ThreadGenerator;
  /** Re-cut the read side. An empty list means one chunk of everything. */
  read(cuts: number[]): ThreadGenerator;
  /** The top notches go — the stream keeps no record of how it was written. */
  forgetSeams(): ThreadGenerator;
  /** Dim the writes and say it out loud, inside the bar. */
  noInfo(): ThreadGenerator;
  /** What UDP would have delivered: the writes, unchanged, on the read side. */
  ghostUdp(): ThreadGenerator;
  dropGhost(): ThreadGenerator;
  /** Endless: the stream keeps moving — **fork** it. */
  flow(): ThreadGenerator;
  /** Endless: the read cuts keep landing elsewhere — **fork** it. */
  reroll(): ThreadGenerator;
  /** Swap the running line under the apparatus. */
  note(text: string): ThreadGenerator;
}

/** «Записали» сверху, «прочитали» снизу, а между ними — поток без границ. */
export function byteBar({y}: ByteBarOptions): ByteBar {
  const group = createRef<Node>();
  const bar = createRef<Rect>();
  const liquid = createRef<Node>();
  const seams = WRITES.map(() => createRef<Line>());
  const compartments = WRITE_STARTS.map(() => createRef<Txt>());
  const writeChips = WRITE_STARTS.map(() => createRef<Rect>());
  const ghostRow = createRef<Node>();
  const writeLabel = createRef<Txt>();
  const readLabel = createRef<Txt>();
  const insideLabel = createRef<Txt>();
  const noteLabel = createRef<Txt>();

  const written = colors.cyan;
  const gotten = colors.orange;

  const filled = createSignal(0); // 0 = empty bar, 1 = full of stream
  const writesShown = createSignal(0); // drives the top notches only
  const readShown = createSignal(0);
  const cuts: SimpleSignal<number>[] = range(CUTS).map(() => createSignal(TOTAL));

  // Chunk i runs from the previous cut to its own; cuts parked at TOTAL make it zero-wide.
  const edge = (index: number) => (index < 0 ? 0 : index >= CUTS ? TOTAL : cuts[index]());
  const chunkStart = (index: number) => edge(index - 1);
  const chunkEnd = (index: number) => (index === CHUNKS - 1 ? TOTAL : edge(index));
  const chunkSize = (index: number) => Math.max(0, chunkEnd(index) - chunkStart(index));
  // A chunk too narrow to hold a chip disappears entirely; one too narrow for its number
  // keeps the chip and drops the number.
  const chunkGate = (index: number) => clamp(0, 1, (px(chunkSize(index)) - 6) / 18);
  const chunkFit = (index: number) => clamp(0, 1, (px(chunkSize(index)) - 54) / 30);

  const notch = (
    ref: Reference<Line>,
    tone: string,
    from: number,
    to: number,
    x: () => number,
    opacity: () => number,
  ) => (
    <Line ref={ref} x={x} points={[[0, from], [0, to]]} stroke={tone} lineWidth={2}
      lineCap="round" opacity={opacity}/>
  );

  const node = (
    <Node ref={group} y={y} opacity={0}>
      <Txt ref={writeLabel} offset={[-1, 0]} x={left} y={LABEL.write} text="ЗАПИСАЛИ · 4 × 512 Б"
        fill={withAlpha(written, 0.85)} fontSize={17} fontFamily={fonts.mono} letterSpacing={1.2}
        opacity={0}/>

      {WRITE_STARTS.map((start, index) => (
        <Rect ref={writeChips[index]} y={ROW.write} x={left + px(start) + px(512) / 2}
          width={px(512) - CHIP.gap} height={CHIP.height} radius={CHIP.radius}
          fill={withAlpha(written, 0.16)} stroke={withAlpha(written, 0.8)} lineWidth={1.5}
          opacity={0}>
          <Txt text="512" fill={written} fontSize={18} fontFamily={fonts.mono} fontWeight={500}/>
        </Rect>
      ))}

      <Rect ref={bar} width={BAR.width} height={BAR.height} radius={BAR.radius} scale={0.96}
        fill={withAlpha(colors.surface, 0.92)} stroke={withAlpha(written, 0.55)}
        lineWidth={1.6} clip>
        <Rect offset={[-1, 0]} x={left} width={() => filled() * BAR.width} height={BAR.height}
          fill={withAlpha(written, 0.2)}/>
        <Node ref={liquid} opacity={0}>
          {range(24).map(i => (
            <Line x={left + i * FLOW_STEP} points={[[7, -BAR.height / 2], [-7, BAR.height / 2]]}
              stroke={withAlpha(written, 0.1)} lineWidth={15}/>
          ))}
        </Node>

        {/* The message boundaries TCP does not have: full-height, and gone within seconds. */}
        {WRITES.map((bytes, index) =>
          notch(seams[index], withAlpha(colors.textMuted, 0.85), -BAR.height / 2, BAR.height / 2,
            () => left + px(bytes), () => 1),
        )}
        {WRITE_STARTS.map((start, index) => (
          <Txt ref={compartments[index]} x={left + px(start) + px(512) / 2} text="СООБЩЕНИЕ"
            fill={colors.textMuted} fontSize={15} fontFamily={fonts.mono} letterSpacing={1.3}/>
        ))}

        {WRITES.map((bytes, index) =>
          notch(createRef<Line>(), written, -BAR.height / 2, -BAR.height / 2 + NOTCH,
            () => left + px(bytes), () => writesShown()),
        )}
        {range(CUTS).map(index =>
          notch(createRef<Line>(), gotten, BAR.height / 2, BAR.height / 2 - NOTCH,
            () => left + px(cuts[index]()),
            () => readShown() * clamp(0, 1, (TOTAL - cuts[index]()) / 40)),
        )}

        <Txt ref={insideLabel} y={INSIDE_Y} text="В ПОТОКЕ ЭТОЙ ИНФОРМАЦИИ НЕТ"
          fill={colors.textMuted} fontSize={17} fontFamily={fonts.mono} letterSpacing={1.4}
          opacity={0}/>
      </Rect>

      {range(CHUNKS).map(index => (
        <Rect y={ROW.read} x={() => left + (px(chunkStart(index)) + px(chunkEnd(index))) / 2}
          width={() => Math.max(0, px(chunkSize(index)) - CHIP.gap)} height={CHIP.height}
          radius={CHIP.radius} fill={withAlpha(gotten, 0.16)} stroke={withAlpha(gotten, 0.8)}
          lineWidth={1.5} opacity={() => readShown() * chunkGate(index)} clip>
          <Txt text={() => `${Math.round(chunkSize(index))}`} fill={gotten} fontSize={18}
            fontFamily={fonts.mono} fontWeight={500} opacity={() => chunkFit(index)}/>
        </Rect>
      ))}

      <Node ref={ghostRow} opacity={0}>
        {WRITE_STARTS.map(start => (
          <Rect y={ROW.read} x={left + px(start) + px(512) / 2} width={px(512) - CHIP.gap}
            height={CHIP.height} radius={CHIP.radius} fill={withAlpha(colors.green, 0.14)}
            stroke={withAlpha(colors.green, 0.9)} lineWidth={1.5} lineDash={[7, 6]}>
            <Txt text="512" fill={colors.green} fontSize={18} fontFamily={fonts.mono}/>
          </Rect>
        ))}
      </Node>

      <Txt ref={readLabel} offset={[-1, 0]} x={left} y={LABEL.read} text="ПРОЧИТАЛИ"
        fill={withAlpha(gotten, 0.85)} fontSize={17} fontFamily={fonts.mono} letterSpacing={1.2}
        opacity={0}/>

      <Txt ref={noteLabel} y={NOTE_Y} text="" fill={colors.textDim} fontSize={23}
        fontFamily={fonts.display} opacity={0}/>
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* all(
      group().opacity(1, APPEAR, easeOutCubic),
      bar().scale(1, APPEAR, easeOutCubic),
    );
  }

  function* dissolveSeams(): ThreadGenerator {
    yield* all(
      ...seams.map((seam, index) =>
        delay(index * 0.08, all(
          seam().opacity(0, SEAM, easeInOutCubic),
          seam().scale.y(0, SEAM, easeInOutCubic),
        )),
      ),
      ...compartments.map((label, index) =>
        delay(index * 0.08, label().opacity(0, SEAM, easeInOutCubic)),
      ),
    );
  }

  function* nameSides(): ThreadGenerator {
    yield* all(
      writeLabel().opacity(1, CHIPS_IN, easeOutCubic),
      delay(0.12, readLabel().opacity(1, CHIPS_IN, easeOutCubic)),
    );
  }

  function* write(): ThreadGenerator {
    yield* all(
      writesShown(1, CHIPS_IN, easeOutCubic),
      ...writeChips.map((box, index) =>
        delay(index * 0.11, box().opacity(1, CHIPS_IN, easeOutCubic)),
      ),
    );
  }

  function* pour(): ThreadGenerator {
    yield* filled(1, POUR, easeInOutCubic);
  }

  function* setCuts(next: readonly number[], dur: number): ThreadGenerator {
    const padded = [...next, TOTAL, TOTAL, TOTAL].slice(0, CUTS);
    yield* all(...cuts.map((cut, index) => cut(padded[index], dur, easeInOutCubic)));
  }

  function* read(next: number[]): ThreadGenerator {
    const first = readShown() === 0;
    yield* all(readShown(1, CHIPS_IN, easeOutCubic), setCuts(next, first ? POUR : CUT));
  }

  function* forgetSeams(): ThreadGenerator {
    yield* writesShown(0, SEAM, easeInOutCubic);
  }

  function* noInfo(): ThreadGenerator {
    yield* all(
      insideLabel().opacity(1, NOTE, easeOutCubic),
      ...writeChips.map(box => box().opacity(0.3, NOTE, easeInOutCubic)),
    );
  }

  function* ghostUdp(): ThreadGenerator {
    yield* all(
      insideLabel().opacity(0, 0.3, easeInOutCubic),
      ...writeChips.map(box => box().opacity(1, NOTE, easeOutCubic)),
      readShown(DIM, NOTE, easeInOutCubic),
      delay(0.2, ghostRow().opacity(1, 0.6, easeOutCubic)),
    );
  }

  function* dropGhost(): ThreadGenerator {
    yield* all(
      ghostRow().opacity(0, 0.45, easeInOutCubic),
      ...writeChips.map(box => box().opacity(0.35, NOTE, easeInOutCubic)),
      readShown(1, NOTE, easeOutCubic),
    );
  }

  function* flow(): ThreadGenerator {
    yield* liquid().opacity(1, 0.7, easeOutCubic);
    // The tile is one step wide, so sliding it exactly one step loops seamlessly.
    while (true) {
      liquid().x(-FLOW_STEP);
      yield* liquid().x(0, FLOW_PERIOD, linear);
    }
  }

  function* reroll(): ThreadGenerator {
    let index = 0;
    while (true) {
      yield* waitFor(REROLL_HOLD);
      yield* setCuts(REROLL[index % REROLL.length], CUT);
      index++;
    }
  }

  function* note(text: string): ThreadGenerator {
    if (noteLabel().opacity() > 0) yield* noteLabel().opacity(0, 0.22, easeInOutCubic);
    noteLabel().text(text);
    yield* noteLabel().opacity(1, NOTE, easeOutCubic);
  }

  return {
    node, appear, dissolveSeams, nameSides, write, pour, read, forgetSeams, noInfo,
    ghostUdp, dropGhost, flow, reroll, note,
  };
}
