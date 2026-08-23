import {Circle, Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  delay,
  easeInOutCubic,
  easeOutCubic,
  range,
  waitFor,
} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// «Какой формы должна быть эта дверь?» — вопрос показан буквально: на стол по очереди
// кладут три формы проёма и по очереди же их подсвечивают. Подсветка живёт в одном сигнале
// `focus`, как этажи в `[04_06]`, поэтому перебор — это твин, а не набор состояний.
const CARD = {width: 190, height: 158, radius: 12} as const;
const GAP = 40;
const SHAPE_Y = -16;
const CAPTION_Y = 54;

const CANDIDATES = [
  {caption: 'ОСОБЫЙ ВЫЗОВ'},
  {caption: 'СВОЯ МОДЕЛЬ В/В'},
  {caption: 'ОТДЕЛЬНАЯ МАГИЯ'},
] as const;

const IN = 0.55;
const STAGGER = 0.18;
const STEP = 0.55; // сколько держится подсветка на одном варианте
const OUT = 0.7;

export interface ShapeTrial extends Widget {
  /** Перебор вариантов — форкать через `yield`. */
  cycle(): ThreadGenerator;
  /** Перебор кончился: все варианты лежат ровно. */
  settle(): ThreadGenerator;
  /** Ни один не подошёл — перечеркнуть и убрать. */
  reject(): ThreadGenerator;
}

export interface ShapeTrialOptions {
  y: number;
}

/** Три формы двери, которые могли бы стать сокетом, но не стали. */
export function shapeTrial({y}: ShapeTrialOptions): ShapeTrial {
  const group = createRef<Node>();
  const cards = range(CANDIDATES.length).map(() => createRef<Rect>());
  const strikes = range(CANDIDATES.length).map(() => createRef<Line>());

  const accent = colors.cyan;
  const focus = createSignal(-1);
  const lit = (index: number) => () => Math.max(0, 1 - Math.abs(index - focus()));

  const cardX = (index: number) => (index - 1) * (CARD.width + GAP);
  const tone = (index: number) => () => withAlpha(accent, 0.45 + lit(index)() * 0.5);

  const shape = (index: number) => {
    const stroke = tone(index);
    if (index === 0) {
      return (
        <Node y={SHAPE_Y}>
          <Circle width={78} height={78} stroke={stroke} lineWidth={2.4}/>
          <Circle width={30} height={30} fill={() => withAlpha(accent, 0.18 + lit(index)() * 0.3)}/>
        </Node>
      );
    }
    if (index === 1) {
      return (
        <Node y={SHAPE_Y}>
          <Rect width={104} height={26} radius={7} stroke={stroke} lineWidth={2.4}/>
          <Rect width={104} height={26} radius={7}
            fill={() => withAlpha(accent, 0.08 + lit(index)() * 0.2)}/>
        </Node>
      );
    }
    return (
      <Node y={SHAPE_Y}>
        <Circle width={78} height={78} stroke={stroke} lineWidth={2.4}/>
        {range(4).map(spoke => (
          <Line points={[[0, 0], [0, -34]]} rotation={spoke * 90} stroke={stroke} lineWidth={2.4}/>
        ))}
      </Node>
    );
  };

  const node = (
    <Node ref={group} y={y}>
      {range(CANDIDATES.length).map(index => (
        <Rect ref={cards[index]} x={cardX(index)} width={CARD.width} height={CARD.height}
          radius={CARD.radius} fill={colors.track}
          stroke={() => withAlpha(colors.border, 0.7 + lit(index)() * 0.3)} lineWidth={1.4}
          shadowColor={withAlpha(accent, 0.5)} shadowBlur={() => lit(index)() * 18}
          opacity={0}>
          {shape(index)}
          <Txt y={CAPTION_Y} text={CANDIDATES[index].caption}
            fill={() => withAlpha(colors.textMuted, 0.75 + lit(index)() * 0.25)} fontSize={13}
            fontFamily={fonts.mono} letterSpacing={1.2}/>
          <Line ref={strikes[index]}
            points={[[-CARD.width / 2 + 14, CARD.height / 2 - 14], [CARD.width / 2 - 14, -CARD.height / 2 + 14]]}
            stroke={withAlpha(colors.red, 0.9)} lineWidth={2.4} end={0}/>
        </Rect>
      ))}
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* all(...cards.map((item, index) =>
      delay(index * STAGGER, item().opacity(1, IN, easeOutCubic))));
  }

  function* cycle(): ThreadGenerator {
    let index = 0;
    while (true) {
      yield* focus(index, STEP, easeInOutCubic);
      yield* waitFor(0.25);
      index = (index + 1) % CANDIDATES.length;
    }
  }

  function* settle(): ThreadGenerator {
    yield* focus(-1, 0.5, easeInOutCubic);
  }

  function* reject(): ThreadGenerator {
    yield* all(...strikes.map((item, index) =>
      delay(index * 0.12, item().end(1, 0.35, easeOutCubic))));
    yield* waitFor(0.35);
    yield* group().opacity(0, OUT, easeInOutCubic);
  }

  return {node, appear, cycle, settle, reject};
}
