import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  easeInOutCubic,
  easeOutCubic,
  linear,
  range,
  waitFor,
} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';

// Тот же трюк, что в `[04_06]`: разговор пиров и фактический путь данных — **одна и та же
// ломаная**, её середина лежит на сигнале `bend`. И тот же конверт, что в `[04_07]`: спускаясь,
// он обрастает заголовками, поднимаясь — теряет их.
const BEND_TIME = 1.4;

const SEGMENTS = [
  {key: 'eth', label: 'ETH', width: 52, tone: 'blue'},
  {key: 'ip', label: 'IP', width: 44, tone: 'purple'},
  {key: 'tcp', label: 'TCP', width: 48, tone: 'cyan'},
  {key: 'data', label: 'ДАННЫЕ', width: 84, tone: 'green'},
] as const;

const BAR = {height: 30, radius: 6, gap: 3} as const;

export interface LiftLink {
  readonly node: Node;
  /** Пунктир между верхними этажами: пиры считают, что говорят напрямую. */
  connect(): ThreadGenerator;
  /** Прямая провисает в лифт-провод-лифт. */
  bendDown(): ThreadGenerator;
  /** Один проход конверта; по дороге вниз он обрастает заголовками. */
  send(duration: number): ThreadGenerator;
  /** Бесконечная отправка — форкать через `yield`. */
  run(duration: number): ThreadGenerator;
  dismiss(): ThreadGenerator;
}

export interface LiftLinkOptions {
  /** Внутренние кромки верхних плит — там линия живёт, пока она «разговор». */
  inner: number;
  /** Центры стопок — туда она дотягивается, оказавшись физическим путём. */
  center: number;
  topY: number;
  wireY: number;
}

export function liftLink({inner, center, topY, wireY}: LiftLinkOptions): LiftLink {
  const path = createRef<Line>();
  const envelope = createRef<Node>();
  const bend = createSignal(0);
  const reach = createSignal(0);
  const travel = createSignal(0);
  const solid = createSignal(0);
  const wrap = createSignal(0); // сколько заголовков навешано: 0…3

  const accent = colors.cyan;
  const tones: Record<string, string> = {
    blue: colors.blue,
    purple: colors.purple,
    cyan: colors.cyan,
    green: colors.green,
  };

  const drop = () => topY + (wireY - topY) * bend();
  const endX = () => inner + (center - inner) * reach();

  const points = () => [
    [-endX(), topY],
    [-endX(), drop()],
    [endX(), drop()],
    [endX(), topY],
  ] as [number, number][];

  const spanH = () => drop() - topY;
  const spanW = () => 2 * endX();
  const total = () => spanW() + 2 * spanH();

  const at = (axis: 'x' | 'y') => () => {
    const d = travel() * total();
    const h = spanH();
    const w = spanW();
    if (d <= h) return axis === 'x' ? -endX() : topY + d;
    if (d <= h + w) return axis === 'x' ? -endX() + (d - h) : drop();
    return axis === 'x' ? endX() : drop() - (d - h - w);
  };

  // Заголовки навешиваются слева от полезной нагрузки, как в `[04_07]`.
  const shown = (index: number) => {
    const headers = SEGMENTS.length - 1;
    if (index === headers) return 1;
    return Math.max(0, Math.min(1, wrap() - (headers - 1 - index)));
  };
  const segWidth = (index: number) => SEGMENTS[index].width * shown(index);
  const barWidth = () =>
    SEGMENTS.reduce((sum, _, index) => sum + segWidth(index) + BAR.gap, -BAR.gap);
  const segX = (index: number) => {
    let cursor = -barWidth() / 2;
    for (let step = 0; step < SEGMENTS.length; step++) {
      const w = segWidth(step);
      if (step === index) return cursor + w / 2;
      cursor += w + BAR.gap;
    }
    return cursor;
  };

  const node = (
    <Node>
      <Line ref={path} points={points}
        stroke={() => withAlpha(accent, 0.4 + solid() * 0.45)}
        lineWidth={() => 1.8 + solid() * 0.8}
        lineDash={() => (solid() > 0.5 ? [] : [9, 8])}
        opacity={0}/>

      <Node ref={envelope} x={at('x')} y={at('y')}
        opacity={() => Math.sin(Math.PI * travel())}>
        {range(SEGMENTS.length).map(index => (
          <Rect x={() => segX(index)} width={() => segWidth(index)} height={BAR.height}
            radius={BAR.radius} fill={() => withAlpha(tones[SEGMENTS[index].tone], 0.28)}
            stroke={() => withAlpha(tones[SEGMENTS[index].tone], 0.9)} lineWidth={1.4}
            opacity={() => Math.min(1, shown(index) * 3)}>
            <Txt text={SEGMENTS[index].label} fill={withAlpha(colors.text, 0.95)}
              fontSize={12} fontFamily={fonts.mono} fontWeight={600} letterSpacing={0.8}/>
          </Rect>
        ))}
      </Node>
    </Node>
  );

  function* connect(): ThreadGenerator {
    yield* path().opacity(1, 0.5, easeOutCubic);
  }

  function* bendDown(): ThreadGenerator {
    yield* reach(1, 0.5, easeInOutCubic);
    yield* all(
      bend(1, BEND_TIME, easeInOutCubic),
      solid(1, BEND_TIME * 0.6, easeOutCubic),
    );
  }

  function* send(duration: number): ThreadGenerator {
    travel(0);
    wrap(0);
    yield* all(
      travel(1, duration, linear),
      // Вниз обрастает, вверх — теряет: ровно посередине пути пакет самый толстый.
      (function* () {
        yield* wrap(3, duration * 0.42, easeOutCubic);
        yield* waitFor(duration * 0.16);
        yield* wrap(0, duration * 0.42, easeInOutCubic);
      })(),
    );
  }

  function* run(duration: number): ThreadGenerator {
    while (true) {
      yield* send(duration);
      yield* waitFor(0.4);
    }
  }

  function* dismiss(): ThreadGenerator {
    yield* all(
      path().opacity(0, 0.5, easeInOutCubic),
      envelope().opacity(0, 0.4),
    );
  }

  return {node, connect, bendDown, send, run, dismiss};
}
