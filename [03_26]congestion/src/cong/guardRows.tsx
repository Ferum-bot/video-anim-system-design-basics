import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, createSignal, delay, easeInOutCubic, easeOutCubic} from '@motion-canvas/core';
import type {SimpleSignal, ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// Два защитных механизма и два общих ресурса. Управление потоком уже разобрали — оно приходит
// приглушённым; контроль перегрузки загорается, когда речь доходит до самой сети.
const ROW = {width: 372, height: 68, radius: 12, step: 96} as const;
const TARGET = {width: 260, height: 68, radius: 12} as const;
const LEFT_X = -238;
const RIGHT_X = 250;
const CHIP_Y = 132;

const IN = 0.6;
const LIGHT = 0.5;

interface Guard {
  mechanism: string;
  guards: string;
}

const GUARDS: readonly Guard[] = [
  {mechanism: 'УПРАВЛЕНИЕ ПОТОКОМ', guards: 'ПОЛУЧАТЕЛЬ'},
  {mechanism: 'КОНТРОЛЬ ПЕРЕГРУЗКИ', guards: 'САМА СЕТЬ'},
];

export interface GuardRows extends Widget {
  /** Второй общий ресурс — сеть; загорается вторая строка. */
  highlight(): ThreadGenerator;
  /** Чип с авторством алгоритма. */
  credit(): ThreadGenerator;
  dismiss(): ThreadGenerator;
}

/** «Управление потоком бережёт получателя, но есть второй общий ресурс — сама сеть». */
export function guardRows({y}: {y: number}): GuardRows {
  const group = createRef<Node>();
  const chip = createRef<Rect>();
  const lit: SimpleSignal<number>[] = GUARDS.map((_, index) => createSignal(index === 0 ? 1 : 0));

  const accent = colors.cyan;
  const rowY = (index: number) => (index - 0.5) * ROW.step;

  const node = (
    <Node ref={group} y={y} opacity={0}>
      {GUARDS.map((guard, index) => (
        <Node y={rowY(index)}>
          <Rect x={LEFT_X} width={ROW.width} height={ROW.height} radius={ROW.radius}
            fill={withAlpha(colors.surface, 0.92)}
            stroke={() => withAlpha(accent, 0.28 + lit[index]() * 0.55)} lineWidth={1.6}>
            <Txt text={guard.mechanism}
              fill={() => withAlpha(colors.textDim, 0.55 + lit[index]() * 0.45)} fontSize={19}
              fontFamily={fonts.mono} letterSpacing={1.1}/>
          </Rect>
          <Line points={[[LEFT_X + ROW.width / 2 + 12, 0], [RIGHT_X - TARGET.width / 2 - 12, 0]]}
            stroke={() => withAlpha(accent, 0.2 + lit[index]() * 0.5)} lineWidth={2}
            lineDash={[8, 7]} endArrow arrowSize={10}/>
          <Rect x={RIGHT_X} width={TARGET.width} height={TARGET.height} radius={TARGET.radius}
            fill={() => withAlpha(accent, 0.06 + lit[index]() * 0.12)}
            stroke={() => withAlpha(accent, 0.28 + lit[index]() * 0.55)} lineWidth={1.6}>
            <Txt text={guard.guards}
              fill={() => withAlpha(accent, 0.55 + lit[index]() * 0.45)} fontSize={20}
              fontFamily={fonts.mono} fontWeight={500} letterSpacing={1.2}/>
          </Rect>
        </Node>
      ))}

      <Rect ref={chip} y={CHIP_Y} width={434} height={50} radius={10}
        fill={withAlpha(colors.orange, 0.12)} stroke={withAlpha(colors.orange, 0.75)}
        lineWidth={1.5} opacity={0}>
        <Txt text="АЛГОРИТМ · 1988 · ВАН ДЖЕКОБСОН" fill={colors.orange} fontSize={19}
          fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.2}/>
      </Rect>
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* group().opacity(1, IN, easeOutCubic);
  }

  function* highlight(): ThreadGenerator {
    yield* all(lit[1](1, LIGHT, easeOutCubic), delay(0.15, lit[0](0.4, LIGHT, easeInOutCubic)));
  }

  function* credit(): ThreadGenerator {
    yield* chip().opacity(1, LIGHT, easeOutCubic);
  }

  function* dismiss(): ThreadGenerator {
    yield* all(
      group().opacity(0, 0.55, easeInOutCubic),
      group().y(group().y() - 26, 0.55, easeInOutCubic),
    );
  }

  return {node, appear, highlight, credit, dismiss};
}
