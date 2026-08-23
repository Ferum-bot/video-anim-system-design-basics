import {Circle, Line, Node, Rect} from '@motion-canvas/2d';
import {createRef, createSignal, linear, waitFor} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, withAlpha} from '@lib';

// Путь сообщения по ломаной. Токен едет **по длине пути**, а не по индексу сегмента,
// поэтому колени не сбивают ему скорость, а сцена может остановить его на любой доле:
// на «вытаскивает за дверь» конверт доходит только до провода и там ждёт получателя.
export interface EnvelopeRun {
  readonly node: Node;
  /** Доехать до доли пути `to`. */
  send(to: number, duration: number): ThreadGenerator;
  /** Бесконечный поток — форкать через `yield`. */
  run(duration: number): ThreadGenerator;
  /** Убрать токен из кадра. */
  dismiss(): ThreadGenerator;
}

export interface EnvelopeRunOptions {
  points: [number, number][];
  /** `letter` — конверт с клапаном, `bit` — просто бит в канале. */
  kind: 'letter' | 'bit';
}

export function envelopeRun({points, kind}: EnvelopeRunOptions): EnvelopeRun {
  const group = createRef<Node>();
  const travel = createSignal(0);
  const accent = kind === 'letter' ? colors.green : colors.cyan;

  const spans = points.slice(1).map((point, index) =>
    Math.hypot(point[0] - points[index][0], point[1] - points[index][1]));
  const total = spans.reduce((sum, value) => sum + value, 0);

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
    <Node ref={group} x={at(0)} y={at(1)} opacity={0}>
      {kind === 'letter' ? (
        <Rect width={40} height={27} radius={4} fill={withAlpha(accent, 0.22)}
          stroke={accent} lineWidth={1.6} shadowColor={withAlpha(accent, 0.7)} shadowBlur={12}>
          <Line points={[[-20, -13.5], [0, 2], [20, -13.5]]} stroke={accent} lineWidth={1.4}/>
        </Rect>
      ) : (
        <Circle width={14} height={14} fill={accent}
          shadowColor={withAlpha(accent, 0.85)} shadowBlur={14}/>
      )}
    </Node>
  );

  function* send(to: number, duration: number): ThreadGenerator {
    if (group().opacity() < 1) yield* group().opacity(1, 0.25);
    yield* travel(to, duration, linear);
  }

  function* run(duration: number): ThreadGenerator {
    while (true) {
      travel(0);
      group().opacity(1);
      yield* travel(1, duration, linear);
      group().opacity(0);
      yield* waitFor(0.35);
    }
  }

  function* dismiss(): ThreadGenerator {
    yield* group().opacity(0, 0.4);
  }

  return {node, send, run, dismiss};
}
