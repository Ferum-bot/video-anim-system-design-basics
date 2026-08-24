import {Circle, Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, createSignal, easeInOutCubic, easeOutCubic, linear, waitFor} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import {BTN, PRIMITIVES, btnX} from './primitiveRow';
import type {RailStop} from './primitiveRow';

// Порядок вызова примитивов, нарисованный целиком. Рельса идёт вдоль ряда и опускает
// засечку к каждой кнопке, которая этой роли нужна; над ненужными она **выгибается дугой** —
// поэтому серверная и клиентская рельсы отличаются не подписью, а силуэтом.
const BUMP = 46;
const TICK_GAP = 6;
const DOT = 15;

const IN = 0.4;

export interface CallRail {
  readonly node: Node;
  /** Рельса и подпись роли появляются пустыми — точка ещё не поехала. */
  appear(label: string): ThreadGenerator;
  /** Доехать до конкретной кнопки: сцена ведёт точку ровно по словам. */
  stepTo(index: number, duration: number): ThreadGenerator;
  /** Зафиксировать след: дальше точка может бегать, а трасса остаётся. */
  settle(): ThreadGenerator;
  /** Бесконечный прогон по уже нарисованной трассе — форкать через `yield`. */
  run(duration: number): ThreadGenerator;
  /** Подпись роли уезжает в плиту: клиент и сервер — не свойство машины. */
  liftLabel(x: number, y: number): ThreadGenerator;
  /** Куда рельса доводит точку для каждой своей кнопки. */
  readonly stops: RailStop[];
  /** Текущая доля пути — по ней ряд и зажигает кнопки. */
  progress(): number;
}

export interface CallRailOptions {
  /** -1 — рельса над рядом, +1 — под рядом. */
  side: -1 | 1;
  y: number;
  /** Индексы кнопок, которые этой роли нужны. */
  visits: number[];
  labelY: number;
  accent: string;
}

export function callRail({side, y, visits, labelY, accent}: CallRailOptions): CallRail {
  const group = createRef<Node>();
  const trail = createRef<Line>();
  const chip = createRef<Rect>();
  const chipText = createRef<Txt>();

  const travel = createSignal(0);
  const drawn = createSignal(0);
  // Пока рельса не поехала, доля пути отрицательная: иначе первая кнопка (её доля ровно 0)
  // горела бы с первого кадра сцены.
  const live = createSignal(0);

  const uses = (index: number) => visits.includes(index);
  const bumpY = y + side * BUMP;
  const tickY = side * (BTN.height / 2 + TICK_GAP);

  // Одна ломаная: заходит в каждую свою кнопку и обходит дугой чужие.
  const points: [number, number][] = [];
  const vertexOf = new Map<number, number>();
  {
    let index = 0;
    while (index < PRIMITIVES.length) {
      if (uses(index)) {
        vertexOf.set(index, points.length);
        points.push([btnX(index), y]);
        index += 1;
      } else {
        let end = index;
        while (end < PRIMITIVES.length && !uses(end)) end += 1;
        const left = btnX(index) - BTN.pitch / 2;
        const right = btnX(end - 1) + BTN.pitch / 2;
        points.push([left, y], [left, bumpY], [right, bumpY], [right, y]);
        index = end;
      }
    }
  }

  const spans = points.slice(1).map((point, index) =>
    Math.hypot(point[0] - points[index][0], point[1] - points[index][1]));
  const total = spans.reduce((sum, value) => sum + value, 0);
  const cumulative = spans.reduce<number[]>(
    (acc, value) => [...acc, acc[acc.length - 1] + value],
    [0],
  );

  const stops: RailStop[] = visits.map(index => ({
    index,
    at: cumulative[vertexOf.get(index)!] / total,
  }));

  const reached = () => (live() > 0 ? Math.max(drawn(), travel()) : -1);

  const at = (axis: 0 | 1) => () => {
    let left = travel() * total;
    for (let index = 0; index < spans.length; index++) {
      if (left <= spans[index] || index === spans.length - 1) {
        const share = spans[index] === 0 ? 0 : Math.min(1, left / spans[index]);
        return points[index][axis] + (points[index + 1][axis] - points[index][axis]) * share;
      }
      left -= spans[index];
    }
    return points[points.length - 1][axis];
  };

  const node = (
    <Node ref={group} opacity={0}>
      {/* Засечки проступают ровно тогда, когда точка до них доезжает. */}
      {visits.map(index => {
        const stop = stops.find(entry => entry.index === index)!;
        return (
          <Line points={[[btnX(index), y], [btnX(index), tickY]]}
            stroke={withAlpha(accent, 0.7)} lineWidth={1.6}
            opacity={() => Math.max(0, Math.min(1, (reached() - stop.at) / 0.05 + 1))}/>
        );
      })}

      <Line ref={trail} points={points} stroke={withAlpha(accent, 0.85)} lineWidth={2.2}
        radius={16} end={reached}/>

      <Circle width={DOT} height={DOT} fill={accent}
        shadowColor={withAlpha(accent, 0.9)} shadowBlur={16}
        x={at(0)} y={at(1)}
        opacity={() => Math.sin(Math.PI * Math.min(1, travel())) * 0.9 + (travel() > 0 ? 0.1 : 0)}/>

      <Rect ref={chip} y={labelY} radius={999} padding={[7, 20]} layout
        fill={colors.surface} stroke={withAlpha(accent, 0.85)} lineWidth={1.5} opacity={0}>
        <Txt ref={chipText} text="" fill={accent} fontSize={17} fontFamily={fonts.mono}
          fontWeight={600} letterSpacing={1.6}/>
      </Rect>
    </Node>
  );

  function* appear(label: string): ThreadGenerator {
    chipText().text(label);
    yield* all(
      group().opacity(1, 0.01),
      chip().opacity(1, IN, easeOutCubic),
    );
  }

  function* stepTo(index: number, duration: number): ThreadGenerator {
    live(1);
    const stop = stops.find(entry => entry.index === index);
    yield* travel(stop ? stop.at : 1, duration, index === visits[0] ? easeOutCubic : linear);
  }

  function* settle(): ThreadGenerator {
    yield* drawn(1, 0.3, easeOutCubic);
  }

  function* run(duration: number): ThreadGenerator {
    while (true) {
      travel(0);
      yield* travel(1, duration, linear);
      yield* waitFor(0.5);
    }
  }

  function* liftLabel(nextX: number, nextY: number): ThreadGenerator {
    yield* all(
      chip().x(nextX, 0.9, easeInOutCubic),
      chip().y(nextY, 0.9, easeInOutCubic),
      chip().scale(0.7, 0.9, easeInOutCubic),
      chip().opacity(0, 0.9, easeInOutCubic),
    );
  }

  return {node, appear, stepTo, settle, run, liftLabel, stops, progress: reached};
}
