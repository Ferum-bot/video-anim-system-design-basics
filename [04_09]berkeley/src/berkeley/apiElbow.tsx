import {Circle, Line, Node} from '@motion-canvas/2d';
import {createRef, createSignal, easeOutCubic, linear, waitFor} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, withAlpha} from '@lib';

// Провод от сокета в дверь. Пакет едет **по длине ломаной**, а не по индексу сегмента,
// поэтому колено не сбивает ему скорость — та же арифметика, что у пилы в `[03_26]`.
const DRAW = 1.1;

export interface ApiElbow {
  readonly node: Node;
  /** Провод протягивается от плитки до развилки внутри стены. */
  draw(): ThreadGenerator;
  /** Бесконечный вызов по проводу — форкать через `yield`. */
  run(duration: number): ThreadGenerator;
}

export interface ApiElbowOptions {
  fromX: number;
  fromY: number;
  /** Высота горизонтального колена. */
  midY: number;
  toX: number;
  toY: number;
}

export function apiElbow({fromX, fromY, midY, toX, toY}: ApiElbowOptions): ApiElbow {
  const line = createRef<Line>();
  const accent = colors.cyan;
  const travel = createSignal(0);

  const points: [number, number][] = [
    [fromX, fromY],
    [fromX, midY],
    [toX, midY],
    [toX, toY],
  ];

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
    <Node>
      <Line ref={line} points={points} stroke={withAlpha(accent, 0.75)} lineWidth={2}
        radius={10} end={0}/>
      <Circle width={13} height={13} fill={accent} shadowColor={withAlpha(accent, 0.85)}
        shadowBlur={14} x={at(0)} y={at(1)}
        opacity={() => Math.sin(Math.PI * travel())}/>
    </Node>
  );

  function* draw(): ThreadGenerator {
    yield* line().end(1, DRAW, easeOutCubic);
  }

  function* run(duration: number): ThreadGenerator {
    while (true) {
      travel(0);
      yield* travel(1, duration, linear);
      yield* waitFor(0.3);
    }
  }

  return {node, draw, run};
}
