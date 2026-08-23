import {Circle, Line, Node} from '@motion-canvas/2d';
import {all, createRef, createSignal, easeInOutCubic, easeOutCubic, waitFor} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, withAlpha} from '@lib';

// «Как обычная программа должна просить у ядра соединение?» — запрос доезжает до стены и
// **отскакивает**: двери ещё нет. Круг ряби на кромке — единственное, что от него остаётся.
const DOWN = 1.0;
const UP = 0.7;
const RIPPLE = 0.55;

export interface Request {
  readonly node: Node;
  /** Пунктирный канал от программы к ядру — он есть с самого начала, двери в нём нет. */
  channel(): ThreadGenerator;
  /** Один запрос: вниз, удар о глухую кромку, обратно вверх. */
  knock(): ThreadGenerator;
  /** Канал больше не нужен: его место занимает плитка. */
  dismiss(): ThreadGenerator;
}

export interface RequestOptions {
  x: number;
  fromY: number;
  toY: number;
}

/** Запрос программы к ядру, которому некуда прийти. */
export function request({x, fromY, toY}: RequestOptions): Request {
  const group = createRef<Node>();
  const guide = createRef<Line>();
  const ripple = createRef<Circle>();
  const token = createRef<Circle>();

  const accent = colors.cyan;
  const travel = createSignal(0);

  const node = (
    <Node ref={group} x={x}>
      <Line ref={guide} points={[[0, fromY], [0, toY]]} stroke={withAlpha(accent, 0.28)}
        lineWidth={1.6} lineDash={[8, 9]} end={0}/>
      <Circle ref={ripple} y={toY} width={0} height={0}
        stroke={withAlpha(colors.red, 0.9)} lineWidth={2.4} opacity={0}/>
      <Circle ref={token} width={15} height={15} fill={accent}
        shadowColor={withAlpha(accent, 0.85)} shadowBlur={14} opacity={0}
        y={() => fromY + (toY - fromY) * travel()}/>
    </Node>
  );

  function* channel(): ThreadGenerator {
    yield* guide().end(1, 0.9, easeOutCubic);
  }

  function* knock(): ThreadGenerator {
    travel(0);
    yield* token().opacity(1, 0.3, easeOutCubic);
    yield* travel(1, DOWN, easeInOutCubic);
    ripple().width(0).height(0).opacity(1);
    yield* all(
      ripple().width(120, RIPPLE, easeOutCubic),
      ripple().height(120, RIPPLE, easeOutCubic),
      ripple().opacity(0, RIPPLE, easeOutCubic),
      travel(0.72, UP, easeOutCubic),
    );
    yield* waitFor(0.15);
    yield* token().opacity(0, 0.45, easeInOutCubic);
  }

  function* dismiss(): ThreadGenerator {
    yield* guide().opacity(0, 0.5, easeInOutCubic);
  }

  return {node, channel, knock, dismiss};
}
