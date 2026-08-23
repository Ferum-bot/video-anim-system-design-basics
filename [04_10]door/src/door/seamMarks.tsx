import {Circle, Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  delay,
  easeInOutCubic,
  easeOutCubic,
  range,
} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';

// «Десятки уровней, десятки интерфейсов». Рисовать два десятка линий поперёк стопки нельзя —
// плиты начинают читаться как перечёркнутые. Поэтому каждый **зазор** оказывается не одним
// стыком, а пачкой: пять этажей — схема, на самом деле их куда больше. Считает счётчик,
// показывает густота, и всё это живёт внутри габарита стопки — кадр не перекашивает.
const SUB = 3; // сколько подстыков проступает в одном зазоре
const PITCH = 7;
const INSET = 26;
const LOCK_INSET = 46;
const TOTAL = 24; // до скольких добегает счётчик

const LOCK = {body: 16, shackle: 15} as const;

const IN = 0.35;
const TONE = 0.45;

export interface SeamMarks {
  readonly node: Node;
  /** Зазоры оказываются пачками стыков, счётчик добегает до двух десятков. */
  swarm(): ThreadGenerator;
  /** На каждом защёлкивается замок, линии гаснут: твой остался один. */
  lock(): ThreadGenerator;
  /** Убрать: дальше важен только один стык. */
  dismiss(): ThreadGenerator;
}

export interface SeamMarksOptions {
  /** Центры зазоров между плитами. */
  gapY: number[];
  width: number;
  chipY: number;
}

export function seamMarks({gapY, width, chipY}: SeamMarksOptions): SeamMarks {
  const group = createRef<Node>();
  const lines = gapY.flatMap(() => range(SUB).map(() => createRef<Line>()));
  const locks = gapY.map(() => createRef<Node>());
  const chip = createRef<Rect>();
  const chipText = createRef<Txt>();

  const count = createSignal(0);
  const owned = createSignal(0); // 0 — считаем все стыки, 1 — остался твой один
  const dim = createSignal(0);

  const half = width / 2;
  const label = () =>
    owned() < 0.5 ? `ИНТЕРФЕЙСОВ  ${Math.round(count())}` : 'ТВОИХ ИЗ НИХ  1';
  const tone = () => withAlpha(colors.cyan, 0.55 - dim() * 0.35);

  const node = (
    <Node ref={group}>
      {gapY.flatMap((y, gap) =>
        range(SUB).map(step => (
          <Line ref={lines[gap * SUB + step]}
            points={[[-half + INSET, y + (step - (SUB - 1) / 2) * PITCH],
              [half - INSET, y + (step - (SUB - 1) / 2) * PITCH]]}
            stroke={tone} lineWidth={1.4} opacity={0}/>
        )),
      )}

      {gapY.map((y, gap) => (
        <Node ref={locks[gap]} x={half - LOCK_INSET} y={y} opacity={0}>
          <Circle width={LOCK.shackle} height={LOCK.shackle} y={-6}
            startAngle={180} endAngle={360}
            stroke={withAlpha(colors.textMuted, 0.95)} lineWidth={2}/>
          <Rect width={LOCK.body} height={12} radius={2.5} y={3.5}
            fill={withAlpha(colors.textMuted, 0.95)}/>
        </Node>
      ))}

      {/* Счётчик стоит по центру над стопкой — он ничего не перевешивает. */}
      <Rect ref={chip} y={chipY} radius={999} padding={[8, 18]} layout
        fill={colors.surface} stroke={withAlpha(colors.cyan, 0.6)} lineWidth={1.4}
        opacity={0}>
        <Txt ref={chipText} text={label} fill={colors.text} fontSize={17}
          fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.3}/>
      </Rect>
    </Node>
  );

  function* swarm(): ThreadGenerator {
    yield* all(
      chip().opacity(1, TONE, easeOutCubic),
      count(TOTAL, 1.6, easeOutCubic),
      ...lines.map((item, index) => delay(index * 0.06, item().opacity(1, IN, easeOutCubic))),
    );
  }

  function* lock(): ThreadGenerator {
    yield* all(
      dim(1, 0.6, easeInOutCubic),
      ...locks.map((item, index) => delay(index * 0.14, item().opacity(1, 0.32, easeOutCubic))),
    );
    yield* chipText().opacity(0, 0.2);
    owned(1);
    yield* all(
      chipText().opacity(1, 0.3, easeOutCubic),
      chipText().fill(colors.orange, 0.3),
      chip().stroke(withAlpha(colors.orange, 0.85), 0.3),
    );
  }

  function* dismiss(): ThreadGenerator {
    yield* group().opacity(0, 0.7, easeInOutCubic);
  }

  return {node, swarm, lock, dismiss};
}
