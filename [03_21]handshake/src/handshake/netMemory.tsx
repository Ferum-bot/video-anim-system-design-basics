import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  delay,
  easeInOutCubic,
  easeOutCubic,
  range,
  waitFor,
} from '@motion-canvas/core';
import type {Reference, ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// «У сети есть память». One packet drops into a router's buffer, the packets sent after it
// sail past, and then it climbs back out and arrives last — which is the whole reason a
// connection needs a way to tell a fresh packet from a corpse.
const NODE = {width: 168, height: 92, radius: 12} as const;
const ENDS = 372;
const LANE_Y = -70;
const ROUTER = {width: 150, height: 92} as const;
const BUFFER = {width: 150, height: 92, y: 84, radius: 10} as const;
const PACKET = {size: 36, radius: 8} as const;
const RAIL = {y: 200, step: 96} as const;

const IN = 0.7;
const HOP = 2.0; // end to end along the lane
const DROP = 0.55;
const LAND = 0.35;
const MARK = 0.5;

const SENT = ['#1', '#2', '#3'];

export interface NetMemory extends Widget {
  /** «Почему нельзя просто слать байты» — один байт улетает и доезжает. */
  plainSend(): ThreadGenerator;
  /** Маршрутизатор и его буфер проступают на том же маршруте. */
  showRouter(): ThreadGenerator;
  /** #1 застревает в буфере, #2 и #3 проходят мимо и приходят раньше. */
  stall(): ThreadGenerator;
  /** #1 выползает и приходит последним. */
  surface(): ThreadGenerator;
  /** «Свежий или мёртвый?» — над прибывшими встают вопросы. */
  question(): ThreadGenerator;
  /** #1 краснеет: он восстал. */
  markDead(): ThreadGenerator;
  dismiss(): ThreadGenerator;
}

/** Пакет, который всплыл позже тех, кого отправили после него. */
export function netMemory({y}: {y: number}): NetMemory {
  const group = createRef<Node>();
  const routerNode = createRef<Node>();
  const first = createRef<Rect>();
  const plain = createRef<Rect>();
  const others = range(2).map(() => createRef<Rect>());
  const rail = range(3).map(() => createRef<Rect>());
  const railLabel = createRef<Txt>();
  const marks = range(3).map(() => createRef<Txt>());
  const verdict = createRef<Txt>();

  const accent = colors.cyan;
  const dead = createSignal(0);

  const endpoint = (x: number, title: string) => (
    <Rect x={x} y={LANE_Y} width={NODE.width} height={NODE.height} radius={NODE.radius}
      fill={withAlpha(colors.surface, 0.92)} stroke={withAlpha(accent, 0.5)} lineWidth={1.6}>
      <Txt text={title} fill={colors.textDim} fontSize={19} fontFamily={fonts.mono}
        letterSpacing={1.1}/>
    </Rect>
  );

  const packet = (ref: Reference<Rect>, label: string, tone: () => string) => (
    <Rect ref={ref} width={PACKET.size} height={PACKET.size} radius={PACKET.radius}
      fill={() => withAlpha(tone(), 0.28)} stroke={tone} lineWidth={1.6}
      shadowColor={() => withAlpha(tone(), 0.5)} shadowBlur={10} opacity={0}>
      <Txt text={label} fill={colors.text} fontSize={15} fontFamily={fonts.mono}/>
    </Rect>
  );

  const railSlot = (index: number) => (
    <Rect ref={rail[index]} x={(index - 1) * RAIL.step} y={RAIL.y} width={72} height={44}
      radius={9} fill={withAlpha(accent, 0.12)} stroke={withAlpha(accent, 0.7)} lineWidth={1.5}
      opacity={0}>
      <Txt text="" fill={colors.text} fontSize={19} fontFamily={fonts.mono} fontWeight={500}/>
      <Txt ref={marks[index]} y={-44} text="?" fill={colors.orange} fontSize={26}
        fontFamily={fonts.mono} fontWeight={600} opacity={0}/>
    </Rect>
  );

  const node = (
    <Node ref={group} y={y} opacity={0}>
      <Line points={[[-ENDS + NODE.width / 2, LANE_Y], [ENDS - NODE.width / 2, LANE_Y]]}
        stroke={withAlpha(accent, 0.25)} lineWidth={2} lineDash={[9, 8]}/>

      {endpoint(-ENDS, 'ОТПРАВИТЕЛЬ')}
      {endpoint(ENDS, 'ПОЛУЧАТЕЛЬ')}

      <Node ref={routerNode} opacity={0}>
        <Line points={[[0, LANE_Y + ROUTER.height / 2], [0, BUFFER.y - BUFFER.height / 2]]}
          stroke={withAlpha(accent, 0.25)} lineWidth={2} lineDash={[7, 6]}/>
        <Rect y={LANE_Y} width={ROUTER.width} height={ROUTER.height} radius={NODE.radius}
          fill={withAlpha(colors.surface, 0.95)} stroke={withAlpha(accent, 0.7)} lineWidth={1.6}>
          <Txt text="РОУТЕР" fill={colors.textDim} fontSize={19} fontFamily={fonts.mono}
            letterSpacing={1.1}/>
        </Rect>
        <Rect y={BUFFER.y} width={BUFFER.width} height={BUFFER.height} radius={BUFFER.radius}
          fill={withAlpha(colors.surface, 0.8)} stroke={withAlpha(accent, 0.4)} lineWidth={1.5}
          lineDash={[8, 7]}>
          <Txt y={-BUFFER.height / 2 + 20} text="БУФЕР" fill={colors.textMuted} fontSize={16}
            fontFamily={fonts.mono} letterSpacing={1.2}/>
        </Rect>
      </Node>

      {packet(plain, '', () => accent)} {/* просто байт, без подписи — она бы не влезла */}
      {packet(first, SENT[0], () => (dead() > 0.5 ? colors.red : accent))}
      {others.map((ref, index) => packet(ref, SENT[index + 1], () => accent))}

      <Txt ref={railLabel} offset={[-1, 0]} x={-ENDS} y={RAIL.y - 52} text="ПОРЯДОК ПРИБЫТИЯ"
        fill={colors.textMuted} fontSize={16} fontFamily={fonts.mono} letterSpacing={1.2}
        opacity={0}/>
      {range(3).map(index => railSlot(index))}

      <Txt ref={verdict} y={RAIL.y + 54} text="ВОССТАЛ ИЗ МЁРТВЫХ" fill={colors.red}
        fontSize={20} fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.3} opacity={0}/>
    </Node>
  );

  const laneStart = -ENDS + NODE.width / 2 + 30;
  const laneEnd = ENDS - NODE.width / 2 - 30;

  /** Put an arrived packet's number into the next free slot on the rail. */
  function* land(index: number, label: string): ThreadGenerator {
    (rail[index]().children()[0] as Txt).text(label);
    yield* rail[index]().opacity(1, LAND, easeOutCubic);
  }

  function* appear(): ThreadGenerator {
    yield* group().opacity(1, IN, easeOutCubic);
  }

  function* plainSend(): ThreadGenerator {
    plain().position([laneStart, LANE_Y]);
    yield* plain().opacity(1, 0.2, easeOutCubic);
    yield* plain().position([laneEnd, LANE_Y], HOP * 0.75, easeInOutCubic);
    yield* plain().opacity(0, 0.25);
  }

  function* showRouter(): ThreadGenerator {
    yield* all(
      routerNode().opacity(1, IN, easeOutCubic),
      railLabel().opacity(1, IN, easeOutCubic),
    );
  }

  /** #1 falls into the buffer while the two packets behind it go straight through. */
  function* stalled(): ThreadGenerator {
    first().position([laneStart, LANE_Y]).opacity(0);
    yield* first().opacity(1, 0.18, easeOutCubic);
    yield* first().position([0, LANE_Y], HOP * 0.45, easeInOutCubic);
    yield* all(
      first().position([0, BUFFER.y], DROP, easeInOutCubic),
      first().scale(0.86, DROP, easeInOutCubic),
    );
  }

  function* through(ref: Reference<Rect>, index: number): ThreadGenerator {
    ref().position([laneStart, LANE_Y]).opacity(0);
    yield* ref().opacity(1, 0.18, easeOutCubic);
    yield* ref().position([laneEnd, LANE_Y], HOP, easeInOutCubic);
    yield* all(ref().opacity(0, 0.22), land(index, SENT[index + 1]));
  }

  function* stall(): ThreadGenerator {
    yield* all(
      stalled(),
      delay(0.7, through(others[0], 0)),
      delay(1.5, through(others[1], 1)),
    );
  }

  function* surface(): ThreadGenerator {
    yield* all(
      first().position([0, LANE_Y], DROP, easeInOutCubic),
      first().scale(1, DROP, easeInOutCubic),
    );
    yield* first().position([laneEnd, LANE_Y], HOP * 0.55, easeInOutCubic);
    yield* all(first().opacity(0, 0.22), land(2, SENT[0]));
  }

  function* question(): ThreadGenerator {
    yield* all(
      ...marks.map((mark, index) => delay(index * 0.12, mark().opacity(1, 0.4, easeOutCubic))),
    );
  }

  function* markDead(): ThreadGenerator {
    const box = rail[2]();
    yield* all(
      dead(1, MARK, easeOutCubic),
      box.stroke(colors.red, MARK),
      box.fill(withAlpha(colors.red, 0.16), MARK),
      delay(0.2, verdict().opacity(1, 0.5, easeOutCubic)),
      ...marks.map(mark => mark().opacity(0, 0.35, easeInOutCubic)),
    );
  }

  function* dismiss(): ThreadGenerator {
    yield* all(
      group().opacity(0, 0.6, easeInOutCubic),
      group().y(group().y() - 26, 0.6, easeInOutCubic),
    );
    yield* waitFor(0);
  }

  return {
    node, appear, plainSend, showRouter, stall, surface, question, markDead, dismiss,
  };
}
