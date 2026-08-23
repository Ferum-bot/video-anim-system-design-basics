import {Circle, Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  easeInOutCubic,
  easeInOutSine,
  easeOutCubic,
  linear,
  range,
  waitFor,
} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';

// Что каждый нижний этаж делает — не подписью, а маленькой схемой, которая крутится сама.
// Все четыре живут в одинаковом слоте справа на плите и форкаются бесконечными циклами:
// этажи остаются в работе, пока речь идёт дальше, и именно поэтому «полезной работы 0»
// в следующем бите читается как приговор, а не как утверждение.
export const SLOT = {width: 320, height: 92} as const;

export interface Job {
  readonly node: Node;
  /** Бесконечный цикл — форкать через `yield`; сам отменится в конце сцены. */
  run(): ThreadGenerator;
}

/** Транспорт умеет ещё и щёлкнуть тумблером гарантий — про них отдельная реплика. */
export interface TransportJob extends Job {
  guarantee(): ThreadGenerator;
}

const WIRE_Y = -6;

/** Физический: биты едут по кабелю. */
export function bitsOnWire(): Job {
  const t = createSignal(0);
  const count = 7;
  const span = SLOT.width - 40;

  const node = (
    <Node>
      <Line points={[[-span / 2, WIRE_Y], [span / 2, WIRE_Y]]}
        stroke={withAlpha(colors.cyan, 0.3)} lineWidth={2}/>
      {range(count).map(index => (
        <Rect
          width={10}
          height={16}
          radius={2}
          y={WIRE_Y}
          fill={withAlpha(colors.cyan, 0.85)}
          x={() => -span / 2 + span * ((t() + index / count) % 1)}
        />
      ))}
      <Txt y={30} text="БИТЫ ПО КАБЕЛЮ" fill={colors.textMuted} fontSize={15}
        fontFamily={fonts.mono} letterSpacing={1.2}/>
    </Node>
  );

  function* run(): ThreadGenerator {
    while (true) {
      t(0);
      yield* t(1, 2.4, linear);
    }
  }

  return {node, run};
}

/** Канальный: битый кадр чинится и уезжает ровно к одному соседу. */
export function frameRepair(): Job {
  const cells = 4;
  const cell = {width: 34, height: 26, gap: 6} as const;
  const rowWidth = cells * cell.width + (cells - 1) * cell.gap;
  const broken = 1; // какая ячейка ломается

  const damage = createSignal(0); // 1 — ячейка битая, 0 — починена
  const hop = createSignal(0); // 0 → 1 — кадр уходит к соседу

  const hopFrom = -rowWidth / 2 + 8;
  const hopTo = rowWidth / 2 + 26;

  const node = (
    <Node>
      {range(cells).map(index => (
        <Rect
          x={-rowWidth / 2 + cell.width / 2 + index * (cell.width + cell.gap)}
          y={WIRE_Y - 10}
          width={cell.width}
          height={cell.height}
          radius={4}
          fill={colors.track}
          stroke={index === broken
            ? () => withAlpha(damage() > 0.5 ? colors.red : colors.green, 0.9)
            : withAlpha(colors.cyan, 0.45)}
          lineWidth={index === broken ? 2 : 1.4}
        />
      ))}

      {/* Один сосед, и дальше него канальный уровень не достаёт. */}
      <Line points={[[hopFrom, WIRE_Y + 26], [hopTo, WIRE_Y + 26]]}
        stroke={withAlpha(colors.cyan, 0.22)} lineWidth={1.6} lineDash={[6, 6]}/>
      <Circle width={9} height={9} y={WIRE_Y + 26} fill={colors.cyan}
        x={() => hopFrom + (hopTo - hopFrom) * hop()}
        opacity={() => Math.sin(Math.PI * hop())}/>
      <Circle width={12} height={12} x={hopTo} y={WIRE_Y + 26}
        fill={colors.background} stroke={withAlpha(colors.cyan, 0.7)} lineWidth={1.6}/>

      <Txt y={44} text="ЧИНИТ КАДР · ОДИН СОСЕД" fill={colors.textMuted} fontSize={15}
        fontFamily={fonts.mono} letterSpacing={1.2}/>
    </Node>
  );

  function* run(): ThreadGenerator {
    while (true) {
      damage(1);
      yield* waitFor(0.55);
      yield* damage(0, 0.3, easeOutCubic);
      yield* hop(1, 0.9, easeInOutCubic);
      hop(0);
      yield* waitFor(0.35);
    }
  }

  return {node, run};
}

/** Сетевой: путь через чужие сети. */
export function pathHops(): Job {
  const hops = 5;
  const span = SLOT.width - 46;
  const t = createSignal(0);
  const nodeX = (index: number) => -span / 2 + (span / (hops - 1)) * index;
  // Свои — только края; всё между ними чужое, и по этому «между» пакет и идёт.
  const foreign = (index: number) => index > 0 && index < hops - 1;

  const packetX = () => {
    const p = t() * (hops - 1);
    const from = Math.min(Math.floor(p), hops - 2);
    return nodeX(from) + (nodeX(from + 1) - nodeX(from)) * (p - from);
  };

  const node = (
    <Node>
      <Line points={range(hops).map(index => [nodeX(index), WIRE_Y])}
        stroke={withAlpha(colors.cyan, 0.25)} lineWidth={1.8} lineDash={[7, 6]}/>
      {range(hops).map(index => (
        <Circle
          x={nodeX(index)}
          y={WIRE_Y}
          width={foreign(index) ? 11 : 15}
          height={foreign(index) ? 11 : 15}
          fill={foreign(index) ? colors.background : withAlpha(colors.cyan, 0.8)}
          stroke={withAlpha(colors.cyan, foreign(index) ? 0.4 : 0.9)}
          lineWidth={1.6}
        />
      ))}
      <Circle width={12} height={12} y={WIRE_Y} fill={colors.cyan}
        shadowColor={withAlpha(colors.cyan, 0.8)} shadowBlur={10}
        x={packetX} opacity={() => Math.sin(Math.PI * t()) * 0.6 + 0.4}/>
      <Txt y={30} text="ПУТЬ ЧЕРЕЗ ЧУЖИЕ СЕТИ" fill={colors.textMuted} fontSize={15}
        fontFamily={fonts.mono} letterSpacing={1.2}/>
    </Node>
  );

  function* run(): ThreadGenerator {
    while (true) {
      t(0);
      yield* t(1, 2.2, linear);
      yield* waitFor(0.35);
    }
  }

  return {node, run};
}

/** Транспортный: доставляет не до машины, а до процесса — и умеет добавить гарантии. */
export function toProcess(): TransportJob {
  const span = SLOT.width - 40;
  const boxWidth = 108;
  const t = createSignal(0);
  const guard = createSignal(0); // 0 → 1 — тумблер гарантий включён

  const from = -span / 2;
  const to = span / 2 - boxWidth - 6;
  const toggle = createRef<Node>();

  const node = (
    <Node>
      <Line points={[[from, WIRE_Y], [to, WIRE_Y]]}
        stroke={withAlpha(colors.cyan, 0.3)} lineWidth={2} lineDash={[7, 6]}/>
      <Circle width={11} height={11} y={WIRE_Y} fill={colors.cyan}
        x={() => from + (to - from) * t()}
        opacity={() => Math.sin(Math.PI * t())}/>
      <Rect x={span / 2 - boxWidth / 2} y={WIRE_Y} width={boxWidth} height={38} radius={8}
        fill={colors.track} stroke={withAlpha(colors.cyan, 0.7)} lineWidth={1.6}>
        <Txt text="ПРОЦЕСС" fill={colors.text} fontSize={14} fontFamily={fonts.mono}
          letterSpacing={1.1}/>
      </Rect>

      {/* Тумблер приезжает отдельной репликой — гарантии не бесплатны и не по умолчанию. */}
      <Node ref={toggle} y={WIRE_Y + 34} opacity={0}>
        <Rect width={38} height={19} radius={999} x={-46}
          fill={() => withAlpha(colors.green, 0.14 + guard() * 0.2)}
          stroke={() => withAlpha(guard() > 0.5 ? colors.green : colors.textMuted, 0.8)}
          lineWidth={1.4}>
          <Circle width={13} height={13} fill={() => guard() > 0.5 ? colors.green : colors.textMuted}
            x={() => -8 + guard() * 16}/>
        </Rect>
        <Txt x={-18} offsetX={-1} text="ГАРАНТИИ" fill={colors.textMuted} fontSize={14}
          fontFamily={fonts.mono} letterSpacing={1.1}/>
      </Node>

      <Txt y={-34} text="ДО ТВОЕГО ПРОЦЕССА" fill={colors.textMuted} fontSize={15}
        fontFamily={fonts.mono} letterSpacing={1.2}/>
    </Node>
  );

  function* run(): ThreadGenerator {
    while (true) {
      t(0);
      yield* t(1, 1.9, linear);
      yield* waitFor(0.3);
    }
  }

  function* guarantee(): ThreadGenerator {
    yield* all(
      toggle().opacity(1, 0.4, easeOutCubic),
      guard(1, 0.5, easeInOutSine),
    );
  }

  return {node, run, guarantee};
}
