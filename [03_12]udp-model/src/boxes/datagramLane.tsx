import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  delay,
  easeInCubic,
  easeInOutCubic,
  easeOutCubic,
  range,
  sequence,
  waitFor,
} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// Sender and receiver with a gap between them. Everything that matters happens to the boxes
// crossing that gap, so the endpoints stay deliberately plain.
const END = {width: 150, height: 104, radius: 14, x: 352} as const;
const LANE_Y = -54;
const BOX = {width: 54, height: 50, radius: 9, gap: 8} as const;
const TRAVEL = {from: -170, to: 170} as const;
const DROP_Y = 130; // how far a lost datagram falls out of the lane

const COUNTER_Y = 34;
const NOTE_Y = 84;

const APPEAR = 0.8;
const CROSS = 0.9;
const STAGGER = 0.3;
const LABEL_IN = 0.5;

export interface DatagramLaneOptions {
  y: number;
}

export interface DatagramLane extends Widget {
  /** One send call, one datagram, one receive on the far side. */
  single(): ThreadGenerator;
  /** Two more follow it: three sent, three received. */
  three(): ThreadGenerator;
  /** Send the same three again — one falls out of the lane on the way. */
  lose(index: number): ThreadGenerator;
  /** Point at the one that fell: it went missing whole, not in pieces. */
  stressWhole(): ThreadGenerator;
}

/** Three boxes across a gap — the whole argument about message boundaries fits in them. */
export function datagramLane({y}: DatagramLaneOptions): DatagramLane {
  const group = createRef<Node>();
  const ends = [createRef<Rect>(), createRef<Rect>()];
  const boxes = range(3).map(() => createRef<Rect>());
  const sentLabel = createRef<Txt>();
  const gotLabel = createRef<Txt>();
  const note = createRef<Txt>();

  const sent = createSignal(0);
  const got = createSignal(0);
  const accent = colors.cyan;

  const endpoint = (index: number, x: number, title: string, call: string) => (
    <Rect ref={ends[index]} x={x} y={LANE_Y} width={END.width} height={END.height}
      radius={END.radius} fill={withAlpha(colors.surface, 0.9)}
      stroke={withAlpha(accent, 0.6)} lineWidth={1.5} opacity={0} scale={0.94}>
      <Txt y={-18} text={title} fill={colors.textDim} fontSize={19} fontFamily={fonts.mono}
        letterSpacing={1.2}/>
      <Txt y={16} text={call} fill={accent} fontSize={22} fontFamily={fonts.mono}
        fontWeight={600}/>
    </Rect>
  );

  const laneX = (index: number) => (index - 1) * (BOX.width + BOX.gap);

  const node = (
    <Node ref={group} y={y}>
      <Line points={[[-END.x + END.width / 2, LANE_Y], [END.x - END.width / 2, LANE_Y]]}
        stroke={withAlpha(accent, 0.25)} lineWidth={2} lineDash={[10, 9]}/>

      {endpoint(0, -END.x, 'ОТПРАВИТЕЛЬ', 'send()')}
      {endpoint(1, END.x, 'ПОЛУЧАТЕЛЬ', 'recv()')}

      {range(3).map(index => (
        <Rect ref={boxes[index]} x={TRAVEL.from + laneX(index)} y={LANE_Y} width={BOX.width}
          height={BOX.height} radius={BOX.radius} fill={withAlpha(accent, 0.2)}
          stroke={accent} lineWidth={2} shadowColor={withAlpha(accent, 0.5)} shadowBlur={12}
          opacity={0}>
          <Txt text={`${index + 1}`} fill={colors.text} fontSize={24} fontFamily={fonts.mono}
            fontWeight={600}/>
        </Rect>
      ))}

      <Txt ref={sentLabel} x={-END.x} y={COUNTER_Y} text={() => `отправлено: ${Math.round(sent())}`}
        fill={colors.textMuted} fontSize={20} fontFamily={fonts.display} opacity={0}/>
      <Txt ref={gotLabel} x={END.x} y={COUNTER_Y} text={() => `получено: ${Math.round(got())}`}
        fill={colors.textMuted} fontSize={20} fontFamily={fonts.display} opacity={0}/>
      <Txt ref={note} y={NOTE_Y} text="" fill={colors.textDim} fontSize={23}
        fontFamily={fonts.display} opacity={0}/>
    </Node>
  );

  /** Put a box back at the sender, ready to go again. */
  const rewind = (index: number) => {
    boxes[index]().position([TRAVEL.from + laneX(index), LANE_Y]).opacity(0).scale(1);
  };

  function* cross(index: number, lost: boolean): ThreadGenerator {
    rewind(index);
    yield* boxes[index]().opacity(1, 0.2, easeOutCubic);
    sent(sent() + 1);
    if (lost) {
      yield* all(
        boxes[index]().position([laneX(index), LANE_Y + DROP_Y], CROSS * 0.75, easeInCubic),
        delay(CROSS * 0.35, boxes[index]().opacity(0, CROSS * 0.4, easeInOutCubic)),
      );
      return;
    }
    yield* boxes[index]().position([TRAVEL.to + laneX(index), LANE_Y], CROSS, easeInOutCubic);
    got(got() + 1);
  }

  function* appear(): ThreadGenerator {
    yield* all(
      ...ends.flatMap(end => [
        end().opacity(1, APPEAR, easeOutCubic),
        end().scale(1, APPEAR, easeOutCubic),
      ]),
    );
  }

  function* single(): ThreadGenerator {
    yield* all(
      sentLabel().opacity(1, LABEL_IN, easeOutCubic),
      gotLabel().opacity(1, LABEL_IN, easeOutCubic),
    );
    yield* cross(0, false);
  }

  function* three(): ThreadGenerator {
    yield* sequence(STAGGER, ...[1, 2].map(index => cross(index, false)));
  }

  function* lose(index: number): ThreadGenerator {
    sent(0);
    got(0);
    range(3).forEach(rewind);
    yield* sequence(STAGGER, ...range(3).map(i => cross(i, i === index)));
    yield* swapNote('может меньше — если что-то случилось по пути');
  }

  function* stressWhole(): ThreadGenerator {
    yield* swapNote('дошла бы целиком — или не дошла вообще');
  }

  function* swapNote(text: string): ThreadGenerator {
    if (note().opacity() > 0) yield* note().opacity(0, 0.22, easeInOutCubic);
    note().text(text);
    yield* note().opacity(1, LABEL_IN, easeOutCubic);
  }

  return {node, appear, single, three, lose, stressWhole};
}
