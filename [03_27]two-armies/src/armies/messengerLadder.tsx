import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, delay, easeInOutCubic, easeOutCubic, range} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// Лестница подтверждений, которая уходит вниз и не кончается. Каждый следующий ряд мельче и
// бледнее предыдущего — это и есть «и так до бесконечности», нарисованное, а не сказанное.
const CAMP = {width: 216, height: 92, radius: 12, x: 330, y: -172} as const;
const ROW = {top: -74, step: 44, span: 620} as const;
const PLATE_Y = 222;
const ROWS = 6;

const IN = 0.7;
const DRAW = 0.7;
const LIGHT = 0.45;

interface Step {
  label: string;
  /** Куда летит гонец: 1 — слева направо. */
  dir: 1 | -1;
}

const STEPS: readonly Step[] = [
  {label: 'ЗАКРЫВАЮ', dir: 1},
  {label: 'ПОДТВЕРЖДАЮ', dir: -1},
  {label: 'ПОДТВЕРЖДАЮ ПОДТВЕРЖДЕНИЕ', dir: 1},
  {label: 'ПОДТВЕРЖДАЮ И ЭТО', dir: -1},
  {label: 'И ЭТО ТОЖЕ', dir: 1},
  {label: '…', dir: -1},
];

/** Чем дальше вниз по лестнице, тем мельче и бледнее ряд. */
const rowScale = (index: number) => 1 - index * 0.075;
const rowAlpha = (index: number) => Math.max(0.14, 1 - index * 0.16);

export interface MessengerLadder extends Widget {
  /** Первый шаг: одна сторона объявляет, что закрывает. */
  first(): ThreadGenerator;
  /** Ответное подтверждение. */
  second(): ThreadGenerator;
  /** Гонец с подтверждением пропал. */
  lose(index: number): ThreadGenerator;
  /** Подтверждение подтверждения — и оно тоже. */
  third(): ThreadGenerator;
  /** Лестница уходит вниз и не кончается. */
  forever(): ThreadGenerator;
  /** Плита с доказанным выводом. */
  proven(): ThreadGenerator;
}

/** «Договориться через ненадёжного гонца со стопроцентной уверенностью невозможно». */
export function messengerLadder({y}: {y: number}): MessengerLadder {
  const group = createRef<Node>();
  const rows = STEPS.map(() => createRef<Node>());
  const arrows = STEPS.map(() => createRef<Line>());
  const crosses = STEPS.map(() => createRef<Node>());
  const plate = createRef<Rect>();

  const accent = colors.cyan;
  const rowY = (index: number) => ROW.top + index * ROW.step;

  const camp = (x: number, title: string) => (
    <Rect x={x} y={CAMP.y} width={CAMP.width} height={CAMP.height} radius={CAMP.radius}
      fill={withAlpha(colors.surface, 0.92)} stroke={withAlpha(accent, 0.6)} lineWidth={1.6}>
      <Txt text={title} fill={colors.textDim} fontSize={20} fontFamily={fonts.mono}
        letterSpacing={1.1}/>
    </Rect>
  );

  const node = (
    <Node ref={group} y={y} opacity={0}>
      {camp(-CAMP.x, 'СТОРОНА А')}
      {camp(CAMP.x, 'СТОРОНА Б')}

      {[-CAMP.x, CAMP.x].map(x => (
        <Line points={[[x, CAMP.y + CAMP.height / 2], [x, rowY(ROWS - 1) + 20]]}
          stroke={withAlpha(accent, 0.2)} lineWidth={2} lineDash={[8, 8]}/>
      ))}

      {STEPS.map((step, index) => (
        <Node ref={rows[index]} y={rowY(index)} scale={rowScale(index)} opacity={0}>
          <Line ref={arrows[index]}
            points={[[(-ROW.span / 2) * step.dir, 0], [(ROW.span / 2) * step.dir, 0]]}
            stroke={index % 2 === 0 ? accent : colors.orange} lineWidth={2.4} endArrow
            arrowSize={11} end={0}/>
          <Txt y={-19} text={step.label} fill={index % 2 === 0 ? accent : colors.orange}
            fontSize={18} fontFamily={fonts.mono} fontWeight={500} letterSpacing={1.1}/>
          <Node ref={crosses[index]} opacity={0}>
            <Line points={[[-11, -11], [11, 11]]} stroke={colors.red} lineWidth={3}
              lineCap="round"/>
            <Line points={[[11, -11], [-11, 11]]} stroke={colors.red} lineWidth={3}
              lineCap="round"/>
          </Node>
        </Node>
      ))}

      <Rect ref={plate} y={PLATE_Y} width={640} height={62} radius={12}
        fill={withAlpha(colors.red, 0.12)} stroke={withAlpha(colors.red, 0.8)} lineWidth={1.6}
        opacity={0}>
        <Txt text="ТАКОГО ПРОТОКОЛА НЕ СУЩЕСТВУЕТ — ДОКАЗАНО" fill={colors.red} fontSize={20}
          fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.2}/>
      </Rect>
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* group().opacity(1, IN, easeOutCubic);
  }

  function* show(index: number): ThreadGenerator {
    yield* all(
      rows[index]().opacity(rowAlpha(index), LIGHT, easeOutCubic),
      arrows[index]().end(1, DRAW, easeInOutCubic),
    );
  }

  function* first(): ThreadGenerator {
    yield* show(0);
  }

  function* second(): ThreadGenerator {
    yield* show(1);
  }

  function* third(): ThreadGenerator {
    yield* show(2);
  }

  /** Гонец пропал: на середине ряда встаёт крест, а сама стрелка гаснет. */
  function* lose(index: number): ThreadGenerator {
    yield* all(
      crosses[index]().opacity(1, LIGHT, easeOutCubic),
      arrows[index]().opacity(0.3, LIGHT, easeInOutCubic),
      arrows[index]().stroke(colors.red, LIGHT),
    );
  }

  function* forever(): ThreadGenerator {
    yield* all(
      ...range(ROWS).slice(3).map(index =>
        delay((index - 3) * 0.35, all(
          rows[index]().opacity(rowAlpha(index), 0.5, easeOutCubic),
          arrows[index]().end(1, 0.5, easeInOutCubic),
        )),
      ),
    );
  }

  function* proven(): ThreadGenerator {
    yield* plate().opacity(1, LIGHT, easeOutCubic);
  }

  return {node, appear, first, second, third, lose, forever, proven};
}
