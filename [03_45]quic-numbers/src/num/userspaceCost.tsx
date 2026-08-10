import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, easeInOutCubic, easeOutCubic, range, waitFor} from '@motion-canvas/core';
import type {Reference, ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// Почему цифры такие: слева ядро за сорок лет научилось склеивать пакеты в крупные пачки,
// справа те же байты приезжают наверх поштучно — и разбирает их уже твой процесс.
const COL = {x: 250, width: 404, radius: 12} as const;
const APP = {y: -136, height: 80} as const;
const KERNEL = {y: 116, height: 80} as const;
const SUB_Y = 176;
const STRIP_Y = 234;
const RISE = {from: 70, to: -90} as const;

const BIG = {width: 148, height: 34, radius: 8, count: 2, period: 1.5, travel: 1.8} as const;
const SMALL = {width: 30, height: 22, radius: 6, count: 8, period: 0.28, travel: 1.1} as const;

const IN = 0.7;
const LIGHT = 0.45;

export interface UserspaceCost extends Widget {
  /** Endless: обе стороны отдают наверх — **fork** it. */
  flow(): ThreadGenerator;
  /** «У TCP 40 лет форы». */
  forty(): ThreadGenerator;
}

/** Цена юзерспейса: крупные пачки против лавины мелких пакетов. */
export function userspaceCost({y}: {y: number}): UserspaceCost {
  const group = createRef<Node>();
  const bigs = range(BIG.count).map(() => createRef<Rect>());
  const smalls = range(SMALL.count).map(() => createRef<Rect>());
  const strip = createRef<Rect>();

  const accent = colors.cyan;
  const other = colors.orange;

  const column = (side: number, title: string, sub: string, tone: string) => (
    <Node x={side * COL.x}>
      <Rect y={APP.y} width={COL.width} height={APP.height} radius={COL.radius}
        fill={withAlpha(colors.surface, 0.9)} stroke={withAlpha(tone, 0.55)} lineWidth={1.6}>
        <Txt text="ПРИЛОЖЕНИЕ" fill={colors.textDim} fontSize={18} fontFamily={fonts.mono}
          letterSpacing={1.1}/>
      </Rect>
      <Rect y={KERNEL.y} width={COL.width} height={KERNEL.height} radius={COL.radius}
        fill={withAlpha(colors.surface, 0.9)} stroke={withAlpha(tone, 0.55)} lineWidth={1.6}>
        <Txt text="ЯДРО ОС" fill={colors.textDim} fontSize={18} fontFamily={fonts.mono}
          letterSpacing={1.1}/>
      </Rect>
      {[-1, 1].map(edge => (
        <Line points={[[edge * 108, KERNEL.y - KERNEL.height / 2],
          [edge * 108, APP.y + APP.height / 2]]} stroke={withAlpha(tone, 0.22)} lineWidth={2}
          lineDash={[9, 8]}/>
      ))}
      <Txt y={APP.y - APP.height / 2 - 26} text={title} fill={withAlpha(tone, 0.95)}
        fontSize={20} fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.2}/>
      <Txt y={SUB_Y} text={sub} fill={colors.textDim} fontSize={17} fontFamily={fonts.mono}
        letterSpacing={1.2}/>
    </Node>
  );

  const node = (
    <Node ref={group} y={y} opacity={0}>
      {column(-1, 'TCP', 'ОФЛОАДЫ — КРУПНЫМИ ПАЧКАМИ', accent)}
      {column(1, 'QUIC', 'ПОШТУЧНО, ЛАВИНОЙ', other)}

      {bigs.map(ref => (
        <Rect ref={ref} x={-COL.x} width={BIG.width} height={BIG.height} radius={BIG.radius}
          fill={withAlpha(accent, 0.24)} stroke={accent} lineWidth={1.6} opacity={0}/>
      ))}
      {smalls.map(ref => (
        <Rect ref={ref} x={COL.x} width={SMALL.width} height={SMALL.height}
          radius={SMALL.radius} fill={withAlpha(other, 0.26)} stroke={other} lineWidth={1.5}
          opacity={0}/>
      ))}

      <Rect ref={strip} y={STRIP_Y} width={790} height={54} radius={12}
        fill={withAlpha(accent, 0.12)} stroke={withAlpha(accent, 0.8)} lineWidth={1.6}
        opacity={0}>
        <Txt text="У TCP 40 ЛЕТ ФОРЫ ОПТИМИЗАЦИЙ ЯДРА И ЖЕЛЕЗА" fill={accent} fontSize={20}
          fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.2}/>
      </Rect>
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* group().opacity(1, IN, easeOutCubic);
  }

  /** Одна порция уезжает из ядра наверх и растворяется в приложении. */
  function* lift(
    ref: Reference<Rect>,
    x: number,
    period: number,
    travel: number,
    jitter: number,
  ): ThreadGenerator {
    ref().position([x + jitter, RISE.from]).opacity(0);
    yield* ref().opacity(1, 0.14, easeOutCubic);
    yield* ref().y(RISE.to, travel, easeInOutCubic);
    yield* ref().opacity(0, 0.2);
    yield* waitFor(period);
  }

  function* flow(): ThreadGenerator {
    yield* all(
      ...bigs.map(function* (ref, index): ThreadGenerator {
        yield* waitFor((index / BIG.count) * (BIG.travel + BIG.period));
        while (true) yield* lift(ref, -COL.x, BIG.period, BIG.travel, 0);
      }),
      ...smalls.map(function* (ref, index): ThreadGenerator {
        yield* waitFor((index / SMALL.count) * (SMALL.travel + SMALL.period));
        // Разводим лавину по ширине колонки, чтобы она читалась именно как лавина.
        while (true) {
          yield* lift(ref, COL.x, SMALL.period, SMALL.travel, ((index % 5) - 2) * 34);
        }
      }),
    );
  }

  function* forty(): ThreadGenerator {
    yield* strip().opacity(1, LIGHT, easeOutCubic);
    yield* waitFor(0);
  }

  return {node, appear, flow, forty};
}
