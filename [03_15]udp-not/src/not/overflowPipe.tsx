import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  easeInCubic,
  easeInOutCubic,
  easeOutCubic,
  range,
  waitFor,
} from '@motion-canvas/core';
import type {Reference, ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// Source → buffer → sink. The same picture serves both halves of the section: an OS receive
// buffer the application can't drain fast enough, and a router queue the network can't. That
// they look identical is the point — it's one failure mode, one level apart. The blocks stay
// narrow and wear their names underneath, which buys a long lane between source and buffer —
// the only stretch where the eye can actually watch a datagram travel.
const BLOCK = {width: 156, height: 136, radius: 12, x: 346} as const;
const METER_PAD = 12;
const SLOTS = 5;
const SLOT_STEP = 22;
const LANE_Y = -12;
const TITLE_Y = 82;
const STRANGER_Y = 150;
const STRANGER = {width: 208, height: 52} as const;
const NOTE_Y = 226;
const DATAGRAM = {size: 26, radius: 6} as const;
const POOL = 4;

const IN = 0.7;
const HOP = 1.05;
const SPILL = 0.8;
const FILL_TIME = 2.6;
const FULL = 0.92; // above this the buffer stops accepting and arrivals fall out

type Point = [number, number];

export interface OverflowPipeOptions {
  y: number;
}

export interface OverflowPipe extends Widget {
  /** Rename the three blocks — same mechanism, different level of the stack. */
  relabel(source: string, buffer: string, sink: string): ThreadGenerator;
  /** Endless stream of datagrams — **fork** it with `yield`, it never returns. */
  feed(period?: number): ThreadGenerator;
  /** Fill the buffer to the brim, after which arrivals fall out instead of going in. */
  overflow(): ThreadGenerator;
  /** Empty it again so the same picture can replay one level down. */
  drain(): ThreadGenerator;
  /** Someone else's traffic into the very same queue — **fork** it, it never returns. */
  stranger(): ThreadGenerator;
  /** Leave, so the closing line stands on its own. */
  dismiss(): ThreadGenerator;
  /** Swap the line under the pipe. */
  note(text: string): ThreadGenerator;
}

/** Буфер, который переполняется, и всё, что из этого следует. */
export function overflowPipe({y}: OverflowPipeOptions): OverflowPipe {
  const group = createRef<Node>();
  const blocks = range(3).map(() => createRef<Node>());
  const titles = range(3).map(() => createRef<Txt>());
  const packets = range(POOL).map(() => createRef<Rect>());
  const strangers = range(3).map(() => createRef<Rect>());
  const strangerNode = createRef<Node>();
  const noteLabel = createRef<Txt>();

  const fill = createSignal(0);
  const accent = colors.cyan;
  const other = colors.purple;

  const blockX = (index: number) => (index - 1) * BLOCK.x;

  const block = (index: number, title: string) => (
    <Node ref={blocks[index]} x={blockX(index)} opacity={0} scale={0.95}>
      <Rect y={LANE_Y} width={BLOCK.width} height={BLOCK.height} radius={BLOCK.radius}
        fill={withAlpha(colors.surface, 0.92)}
        stroke={withAlpha(accent, index === 1 ? 0.75 : 0.5)} lineWidth={1.6} clip>
        {index === 1 && (
          <>
            <Rect offset={[0, 1]} y={BLOCK.height / 2 - METER_PAD}
              width={BLOCK.width - METER_PAD * 2}
              height={() => fill() * (BLOCK.height - METER_PAD * 2)} radius={6}
              fill={() => withAlpha(fill() > FULL ? colors.red : accent, 0.28)}/>
            {/* Slots, so the tile reads as a queue even while it's empty. */}
            {range(SLOTS).map(slot => (
              <Line y={(slot - (SLOTS - 1) / 2) * SLOT_STEP}
                points={[[-BLOCK.width / 2 + METER_PAD, 0], [BLOCK.width / 2 - METER_PAD, 0]]}
                stroke={withAlpha(accent, 0.16)} lineWidth={1.2}/>
            ))}
          </>
        )}
      </Rect>
      <Txt ref={titles[index]} y={TITLE_Y} text={title} fill={colors.textDim} fontSize={19}
        fontFamily={fonts.mono} letterSpacing={1.1}/>
    </Node>
  );

  const datagram = (ref: Reference<Rect>, tone: string) => (
    <Rect ref={ref} width={DATAGRAM.size} height={DATAGRAM.size} radius={DATAGRAM.radius}
      fill={withAlpha(tone, 0.3)} stroke={tone} lineWidth={1.6}
      shadowColor={withAlpha(tone, 0.5)} shadowBlur={10} opacity={0}/>
  );

  // Both streams end at the same left edge of the buffer — the second one arriving there is
  // the whole argument: it's a shared queue, and your traffic isn't alone in it.
  const laneStart = blockX(0) + BLOCK.width / 2 + 26;
  const laneEnd = blockX(1) - BLOCK.width / 2 - 22;
  const mouth: Point = [laneEnd, LANE_Y + 34];

  const node = (
    <Node ref={group} y={y} opacity={0}>
      <Line points={[[blockX(0) + BLOCK.width / 2, LANE_Y], [blockX(1) - BLOCK.width / 2, LANE_Y]]}
        stroke={withAlpha(accent, 0.25)} lineWidth={2} lineDash={[9, 8]}/>
      <Line points={[[blockX(1) + BLOCK.width / 2, LANE_Y], [blockX(2) - BLOCK.width / 2, LANE_Y]]}
        stroke={withAlpha(accent, 0.25)} lineWidth={2} lineDash={[9, 8]}/>

      {block(0, 'СЕТЕВАЯ КАРТА')}
      {block(1, 'БУФЕР ОС')}
      {block(2, 'ПРИЛОЖЕНИЕ')}

      {packets.map(ref => datagram(ref, accent))}

      <Node ref={strangerNode} opacity={0}>
        <Line points={[[blockX(0) + STRANGER.width / 2, STRANGER_Y], mouth]}
          stroke={withAlpha(other, 0.3)} lineWidth={2} lineDash={[9, 8]}/>
        <Rect x={blockX(0)} y={STRANGER_Y} width={STRANGER.width} height={STRANGER.height}
          radius={10} fill={withAlpha(other, 0.12)} stroke={withAlpha(other, 0.65)}
          lineWidth={1.6}>
          <Txt text="ЧУЖОЙ ТРАФИК" fill={withAlpha(other, 0.95)} fontSize={18}
            fontFamily={fonts.mono} letterSpacing={1.1}/>
        </Rect>
        {strangers.map(ref => datagram(ref, other))}
      </Node>

      <Txt ref={noteLabel} y={NOTE_Y} text="" fill={colors.textDim} fontSize={23}
        fontFamily={fonts.display} opacity={0}/>
    </Node>
  );

  /** One datagram runs at the buffer — and either gets in or gets turned away at the door. */
  function* run(ref: Reference<Rect>, from: Point, to: Point, period: number): ThreadGenerator {
    ref().position(from).opacity(0).scale(1);
    yield* ref().opacity(1, 0.15, easeOutCubic);
    if (fill() > FULL) {
      // It still makes the whole trip — the refusal has to happen at the buffer, not before it.
      const [doorX, doorY] = [to[0] - 24, to[1]];
      yield* ref().position([doorX, doorY], HOP * 0.75, easeInOutCubic);
      yield* all(
        ref().position([doorX - 26, doorY + 168], SPILL, easeInCubic),
        ref().opacity(0, SPILL, easeInOutCubic),
        ref().scale(0.7, SPILL),
      );
    } else {
      yield* ref().position(to, HOP, easeInOutCubic);
      yield* ref().opacity(0, 0.2);
    }
    yield* waitFor(period);
  }

  /** The same loop, phase-shifted, so a handful of refs read as one steady stream. */
  function* phased(
    ref: Reference<Rect>,
    from: Point,
    to: Point,
    period: number,
    share: number,
  ): ThreadGenerator {
    yield* waitFor(share * (HOP + period));
    while (true) yield* run(ref, from, to, period);
  }

  function* appear(): ThreadGenerator {
    yield* all(
      group().opacity(1, IN, easeOutCubic),
      ...blocks.flatMap(box => [
        box().opacity(1, IN, easeOutCubic),
        box().scale(1, IN, easeOutCubic),
      ]),
    );
  }

  function* relabel(source: string, buffer: string, sink: string): ThreadGenerator {
    const next = [source, buffer, sink];
    yield* all(...titles.map(title => title().opacity(0, 0.25, easeInOutCubic)));
    titles.forEach((title, index) => title().text(next[index]));
    yield* all(...titles.map(title => title().opacity(1, 0.35, easeOutCubic)));
  }

  function* feed(period = 0.45): ThreadGenerator {
    yield* all(
      ...packets.map((ref, index) =>
        phased(ref, [laneStart, LANE_Y], [laneEnd, LANE_Y], period, index / POOL),
      ),
    );
  }

  function* overflow(): ThreadGenerator {
    yield* fill(1, FILL_TIME, easeInOutCubic);
  }

  function* drain(): ThreadGenerator {
    yield* fill(0.12, 0.8, easeInOutCubic);
  }

  function* stranger(): ThreadGenerator {
    yield* strangerNode().opacity(1, 0.6, easeOutCubic);
    yield* all(
      ...strangers.map((ref, index) =>
        phased(ref, [laneStart, STRANGER_Y], mouth, 0.5, index / strangers.length),
      ),
    );
  }

  function* dismiss(): ThreadGenerator {
    yield* all(
      group().opacity(0, 0.6, easeInOutCubic),
      group().y(group().y() + 20, 0.6, easeInOutCubic),
    );
  }

  function* note(text: string): ThreadGenerator {
    if (noteLabel().opacity() > 0) yield* noteLabel().opacity(0, 0.22, easeInOutCubic);
    noteLabel().text(text);
    yield* noteLabel().opacity(1, 0.5, easeOutCubic);
  }

  return {node, appear, relabel, feed, overflow, drain, stranger, dismiss, note};
}
