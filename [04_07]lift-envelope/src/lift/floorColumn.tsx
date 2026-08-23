import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, createSignal, delay, easeInOutCubic, easeOutCubic, range} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// Узкая колонка этажей слева: она задаёт, на каком уровне сейчас находится сообщение.
// «Лифт» показан тем, что подсветка едет по ней вниз, а полоса справа обрастает
// заголовками, — двигать саму полосу через весь кадр не нужно.
const PLATE = {width: 180, height: 62, radius: 9, gap: 10} as const;
const LAYERS = ['ПРИКЛАДНОЙ', 'ТРАНСПОРТНЫЙ', 'СЕТЕВОЙ', 'КАНАЛЬНЫЙ', 'ФИЗИЧЕСКИЙ'] as const;
const COUNT = LAYERS.length;
const STEP = PLATE.height + PLATE.gap;

export const COLUMN = {
  width: PLATE.width,
  /** Центр `index`-го этажа — по нему сцена выравнивает полосу. */
  floorY: (index: number) => -((COUNT - 1) / 2) * STEP + index * STEP,
  topY: -((COUNT - 1) / 2) * STEP,
  bottomY: ((COUNT - 1) / 2) * STEP + PLATE.height / 2,
} as const;

const IN = 0.6;
const STAGGER = 0.07;
const WALK = 0.6;

export interface FloorColumn extends Widget {
  /** Подсветка переезжает на этаж — не переключается, а именно едет. */
  light(index: number): ThreadGenerator;
  /** «На той стороне» — колонка меняет заголовок, оставаясь на месте. */
  retitle(text: string): ThreadGenerator;
  /** Уйти из кадра: на бите про матрёшку речь уже не про этажи, а про сам объект. */
  recede(): ThreadGenerator;
}

export function floorColumn({x, titleY}: {x: number; titleY: number}): FloorColumn {
  const group = createRef<Node>();
  const plates = range(COUNT).map(() => createRef<Rect>());
  const title = createRef<Txt>();
  const marker = createRef<Line>();

  const accent = colors.cyan;
  const active = createSignal(-1);
  const lit = (index: number) => () => Math.max(0, 1 - Math.abs(index - active()));

  const node = (
    <Node ref={group} x={x}>
      <Txt ref={title} y={titleY} text="ОТПРАВИТЕЛЬ" fill={colors.textDim} fontSize={17}
        fontFamily={fonts.mono} fontWeight={500} letterSpacing={1.4}/>

      {range(COUNT).map(index => (
        <Rect
          ref={plates[index]}
          y={COLUMN.floorY(index)}
          width={PLATE.width}
          height={PLATE.height}
          radius={PLATE.radius}
          fill={colors.track}
          stroke={() => withAlpha(accent, 0.28 + lit(index)() * 0.6)}
          lineWidth={1.5}
          shadowColor={withAlpha(accent, 0.5)}
          shadowBlur={() => lit(index)() * 20}
          opacity={0}
        >
          <Txt text={LAYERS[index]} fill={() => withAlpha(colors.text, 0.4 + lit(index)() * 0.55)}
            fontSize={16} fontFamily={fonts.mono} fontWeight={500} letterSpacing={1.2}/>
        </Rect>
      ))}

      {/* Стрелка от активного этажа к полосе: видно, чей сейчас заголовок клеится. */}
      <Line
        ref={marker}
        points={[[PLATE.width / 2 + 10, 0], [PLATE.width / 2 + 56, 0]]}
        y={() => COLUMN.floorY(0) + (active() < 0 ? 0 : active()) * STEP}
        stroke={withAlpha(accent, 0.8)}
        lineWidth={2}
        endArrow
        arrowSize={8}
        opacity={0}
      />
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* all(
      ...range(COUNT).map(index =>
        delay(index * STAGGER, plates[index]().opacity(1, IN, easeOutCubic)),
      ),
    );
  }

  function* light(index: number): ThreadGenerator {
    yield* all(
      active(index, active() < 0 ? 0.4 : WALK, easeInOutCubic),
      marker().opacity(1, 0.3, easeOutCubic),
    );
  }

  function* retitle(text: string): ThreadGenerator {
    yield* title().opacity(0, 0.22);
    title().text(text);
    yield* title().opacity(1, 0.32, easeOutCubic);
  }

  function* recede(): ThreadGenerator {
    yield* group().opacity(0, 0.6, easeInOutCubic);
  }

  return {node, appear, light, retitle, recede};
}
