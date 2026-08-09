import {Node, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  delay,
  easeInOutCubic,
  easeOutCubic,
  range,
} from '@motion-canvas/core';
import type {SimpleSignal, ThreadGenerator} from '@motion-canvas/core';
import {colors, counter, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// Four fields, two bytes each, and that is the entire protocol header. It gets to be big
// on screen precisely because there is so little of it.
const CELL = {width: 200, height: 150, radius: 12, gap: 12} as const;
const STEP = CELL.width + CELL.gap;
const FIRST_X = -((4 - 1) * STEP) / 2;

const TOTAL_Y = -156;
const SIZE_Y = -98;
const LABEL_Y = 100;
const ASIDE_Y = 158;

const DOCK_SCALE = 0.62;

const APPEAR = 0.8;
const COUNT_UP = 1.0;
const SPLIT = 0.55;
const LIGHT = 0.45;
const LABEL_IN = 0.45;
const DOCK = 0.9;

interface Field {
  key: string;
  label: string;
  value: string;
}

const FIELDS: readonly Field[] = [
  {key: 'src', label: 'ПОРТ ОТПРАВИТЕЛЯ', value: '54321'},
  {key: 'dst', label: 'ПОРТ ПОЛУЧАТЕЛЯ', value: '443'},
  {key: 'len', label: 'ДЛИНА', value: '1208'},
  {key: 'sum', label: 'КОНТРОЛЬНАЯ СУММА', value: '0x8F2A'},
];

export interface UdpHeaderOptions {
  y: number;
}

export interface UdpHeader extends Widget {
  /** Count the whole header up to its eight bytes. */
  count(): ThreadGenerator;
  /** Split it into four two-byte fields. */
  split(): ThreadGenerator;
  /** Light one field and bring up its name. */
  light(...keys: string[]): ThreadGenerator;
  /** «И это вообще всё». */
  thatsAll(): ThreadGenerator;
  /** Shrink to the top so the overhead comparison can take the floor. */
  dock(y: number): ThreadGenerator;
}

/** The UDP header: eight bytes, four fields, nothing else. */
export function udpHeader({y}: UdpHeaderOptions): UdpHeader {
  const group = createRef<Node>();
  const totalLabel = createRef<Txt>();
  const aside = createRef<Txt>();
  const cells = FIELDS.map(() => createRef<Rect>());
  const labels = FIELDS.map(() => createRef<Txt>());
  const sizes = FIELDS.map(() => createRef<Txt>());
  const values = FIELDS.map(() => createRef<Txt>());

  const split = createSignal(0); // 0 = one solid block, 1 = four separate fields
  const lit: SimpleSignal<number>[] = FIELDS.map(() => createSignal(0));

  const total = counter(8, value => `${Math.round(value)} БАЙТ — ВЕСЬ ЗАГОЛОВОК`);
  const accent = colors.cyan;

  // Before the split the four cells sit flush, so the header reads as one block.
  const cellX = (index: number) => () => FIRST_X + index * (CELL.width + CELL.gap * split());
  const cellWidth = () => CELL.width + CELL.gap * (1 - split());

  const node = (
    <Node ref={group} y={y} opacity={0}>
      <Txt ref={totalLabel} y={TOTAL_Y} text={total.text} fill={accent} fontSize={26}
        fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.4} opacity={0}/>

      {FIELDS.map((field, index) => (
        <Rect ref={cells[index]} x={cellX(index)} width={cellWidth} height={CELL.height}
          radius={CELL.radius}
          fill={() => withAlpha(accent, 0.08 + lit[index]() * 0.18)}
          stroke={() => withAlpha(accent, 0.4 + lit[index]() * 0.55)}
          lineWidth={() => 1.5 + lit[index]() * 0.8}>
          <Txt ref={values[index]} text={field.value} fill={colors.text} fontSize={32}
            fontFamily={fonts.mono} fontWeight={500} opacity={0}/>
        </Rect>
      ))}

      {FIELDS.map((_, index) => (
        <Txt ref={sizes[index]} x={cellX(index)} y={SIZE_Y} text="2 БАЙТА"
          fill={colors.textMuted} fontSize={16} fontFamily={fonts.mono} letterSpacing={1.2}
          opacity={0}/>
      ))}

      {FIELDS.map((field, index) => (
        <Txt ref={labels[index]} x={cellX(index)} y={LABEL_Y} text={field.label}
          fill={() => withAlpha(accent, 0.55 + lit[index]() * 0.45)} fontSize={16}
          fontFamily={fonts.mono} letterSpacing={1.1} opacity={0}/>
      ))}

      <Txt ref={aside} y={ASIDE_Y} text="и это вообще всё" fill={colors.textDim}
        fontSize={24} fontFamily={fonts.display} opacity={0}/>
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* group().opacity(1, APPEAR, easeOutCubic);
  }

  function* count(): ThreadGenerator {
    yield* all(totalLabel().opacity(1, LIGHT, easeOutCubic), total.count(COUNT_UP));
  }

  function* split4(): ThreadGenerator {
    yield* all(
      split(1, SPLIT, easeInOutCubic),
      ...sizes.map((size, index) => delay(index * 0.06, size().opacity(1, LABEL_IN, easeOutCubic))),
    );
  }

  function* light(...keys: string[]): ThreadGenerator {
    const indices = keys.map(key => FIELDS.findIndex(field => field.key === key));
    yield* all(
      ...indices.flatMap((index, order) => [
        delay(order * 0.14, lit[index](1, LIGHT, easeOutCubic)),
        delay(order * 0.14, labels[index]().opacity(1, LABEL_IN, easeOutCubic)),
        delay(order * 0.14 + 0.1, values[index]().opacity(1, LABEL_IN, easeOutCubic)),
      ]),
    );
  }

  function* thatsAll(): ThreadGenerator {
    yield* aside().opacity(1, LABEL_IN, easeOutCubic);
  }

  function* dock(toY: number): ThreadGenerator {
    yield* all(
      aside().opacity(0, 0.35, easeInOutCubic),
      ...labels.map(label => label().opacity(0, 0.35, easeInOutCubic)),
      ...sizes.map(size => size().opacity(0, 0.35, easeInOutCubic)),
      delay(0.2, all(
        group().y(toY, DOCK, easeInOutCubic),
        group().scale(DOCK_SCALE, DOCK, easeInOutCubic),
      )),
    );
  }

  return {node, appear, count, split: split4, light, thatsAll, dock};
}
