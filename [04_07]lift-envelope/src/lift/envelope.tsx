import {Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, createSignal, easeInOutCubic, easeOutCubic} from '@motion-canvas/core';
import type {SimpleSignal, ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';

// Сообщение как полоса, которая обрастает заголовками, — тот же язык, что в `[03_04]` и
// `[03_07]`. Ключевое: **сегменты не перерисовываются**. У каждого две геометрии — полоса и
// вложенная рамка, — а между ними лерп по одному сигналу `nest`. Поэтому «матрёшка» это не
// другая картинка, а тот же объект в другой проекции.

export type SegmentKey = 'eth' | 'ip' | 'tcp' | 'data' | 'fcs';

interface Segment {
  key: SegmentKey;
  /** Ширина в полосе. */
  w: number;
  label: string;
  /** Сколько байт этот заголовок стоит — цифры из видео 03. */
  bytes?: string;
  tone: 'frame' | 'packet' | 'segment' | 'payload' | 'trailer';
  /** Габарит и смещение, когда полоса свернулась в матрёшку. */
  nest: {w: number; h: number; x?: number};
  /** Как называется этот слой, когда его называют вложением. */
  nested: string;
}

/** Порядок объявления = порядок отрисовки: внешние рамки раньше, нагрузка поверх всех. */
const SEGMENTS: Segment[] = [
  {key: 'eth', w: 66, label: 'ETH', bytes: '26 Б', tone: 'frame',
    nest: {w: 528, h: 288}, nested: 'КАДР'},
  {key: 'fcs', w: 40, label: 'FCS', bytes: '4 Б', tone: 'trailer',
    nest: {w: 26, h: 288, x: 251}, nested: 'ХВОСТ'},
  {key: 'ip', w: 60, label: 'IP', bytes: '20 Б', tone: 'packet',
    nest: {w: 424, h: 222}, nested: 'ПАКЕТ'},
  {key: 'tcp', w: 60, label: 'TCP', bytes: '20 Б', tone: 'segment',
    nest: {w: 322, h: 158}, nested: 'СЕГМЕНТ'},
  {key: 'data', w: 250, label: 'СООБЩЕНИЕ', tone: 'payload',
    nest: {w: 222, h: 94}, nested: 'СООБЩЕНИЕ'},
];

/** Слева направо в полосе: заголовки спереди, концевик сзади. */
const BAR_ORDER: SegmentKey[] = ['eth', 'ip', 'tcp', 'data', 'fcs'];

const BAR = {height: 58, radius: 8, gap: 3} as const;
const SPLIT_OFFSET = 38; // на сколько ряды расходятся, когда сообщение режут
const WIRE_TRIP = 620; // насколько уезжает за кадр по проводу

const GROW = 0.55;
const MOVE = 0.7;
const FOCUS = 0.45;
const FOLD = 1.5;
const TRIP = 1.1;

const DIM = 0.07; // «этаж не видит чужие наклейки» — почти в ноль, но не в ноль

export interface Envelope {
  readonly node: Node;
  /** Сообщение рождается — одна полоса без заголовков. */
  appear(): ThreadGenerator;
  /** Заголовок пристыковывается, полоса раздаётся ему навстречу. */
  wrap(key: SegmentKey): ThreadGenerator;
  /** Заголовок снимается. */
  unwrap(key: SegmentKey): ThreadGenerator;
  /** Сообщение режется на два куска — они расходятся в два ряда. */
  split(): ThreadGenerator;
  /** Куски собираются обратно. */
  merge(): ThreadGenerator;
  /** Переехать на другой этаж. */
  moveTo(y: number): ThreadGenerator;
  /** Уехать по проводу вправо. */
  toWire(wireY: number): ThreadGenerator;
  /** Прийти с другой стороны и подняться на этаж. */
  fromWire(y: number): ThreadGenerator;
  /** Виден только один сегмент: этаж читает только свою наклейку. */
  focus(key: SegmentKey | null): ThreadGenerator;
  /** Выйти в заданную точку кадра и укрупниться — матрёшке колонка уже не нужна. */
  center(cx: number, cy: number, scale: number): ThreadGenerator;
  /** Полоса сворачивается в матрёшку. */
  fold(): ThreadGenerator;
  /** Заголовки переименовываются в кадр / пакет / сегмент. */
  rename(): ThreadGenerator;
}

export interface EnvelopeOptions {
  x: number;
  y: number;
}

export function envelope({x, y}: EnvelopeOptions): Envelope {
  const tones: Record<Segment['tone'], string> = {
    frame: colors.blue,
    packet: colors.purple,
    segment: colors.cyan,
    payload: colors.green,
    trailer: colors.orange,
  };

  const nest = createSignal(0); // 0 — полоса, 1 — матрёшка
  const stack = createRef<Node>();

  /** Один ряд: свои ширины сегментов, своя доля нагрузки и своя яркость по сегментам. */
  function buildRow() {
    const group = createRef<Node>();
    const show = {} as Record<SegmentKey, SimpleSignal<number>>;
    const bright = {} as Record<SegmentKey, SimpleSignal<number>>;
    SEGMENTS.forEach(item => {
      show[item.key] = createSignal(0);
      bright[item.key] = createSignal(1);
    });
    const share = createSignal(1); // 1 — всё сообщение, 0.5 — половина после разреза
    const labels = {} as Record<SegmentKey, ReturnType<typeof createRef<Txt>>>;
    SEGMENTS.forEach(item => {
      labels[item.key] = createRef<Txt>();
    });

    const width = (key: SegmentKey) => {
      const item = SEGMENTS.find(entry => entry.key === key)!;
      return item.w * show[key]() * (key === 'data' ? share() : 1);
    };

    const total = () =>
      BAR_ORDER.reduce(
        (sum, key) => sum + width(key) + (show[key]() > 0.01 ? BAR.gap : 0),
        -BAR.gap,
      );

    /** Центр сегмента в полосе — считается от текущих ширин, поэтому рост плавный. */
    const barX = (key: SegmentKey) => {
      let cursor = -total() / 2;
      for (const other of BAR_ORDER) {
        const w = width(other);
        if (other === key) return cursor + w / 2;
        if (show[other]() > 0.01) cursor += w + BAR.gap;
      }
      return cursor;
    };

    const node = (
      <Node ref={group} opacity={0}>
        {SEGMENTS.map(item => {
          const tone = tones[item.tone];
          return (
            <Rect
              width={() => width(item.key) * (1 - nest()) + item.nest.w * nest()}
              height={() => BAR.height * (1 - nest()) + item.nest.h * nest()}
              x={() => barX(item.key) * (1 - nest()) + (item.nest.x ?? 0) * nest()}
              radius={() => BAR.radius + 6 * nest()}
              fill={() =>
                withAlpha(tone, (item.key === 'data' ? 0.3 : 0.2) * (1 - nest() * 0.78))}
              stroke={() => withAlpha(tone, 0.85)}
              lineWidth={() => 1.6 + nest() * 0.7}
              opacity={() => Math.min(show[item.key](), 1) * bright[item.key]()}
            >
              <Txt
                ref={labels[item.key]}
                y={() => -(item.nest.h / 2 - 18) * nest()}
                text={item.label}
                fill={withAlpha(colors.text, 0.95)}
                fontSize={() => (item.key === 'data' ? 19 : 17) + nest() * 2}
                fontFamily={fonts.mono}
                fontWeight={600}
                letterSpacing={1.2}
              />
              {item.bytes && (
                <Txt y={20} text={item.bytes} fill={colors.textMuted} fontSize={13}
                  fontFamily={fonts.mono} letterSpacing={1}
                  opacity={() => 1 - nest()}/>
              )}
            </Rect>
          );
        })}
      </Node>
    );

    return {node, group, show, bright, share, labels};
  }

  const rows = [buildRow(), buildRow()];
  const live = () => rows.filter(item => item.group().opacity() > 0.01);

  const node = (
    <Node ref={stack} x={x} y={y}>
      {rows.map(item => item.node)}
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* all(
      rows[0].group().opacity(1, GROW, easeOutCubic),
      rows[0].show.data(1, GROW, easeOutCubic),
    );
  }

  function* wrap(key: SegmentKey): ThreadGenerator {
    yield* all(...live().map(item => item.show[key](1, GROW, easeOutCubic)));
  }

  function* unwrap(key: SegmentKey): ThreadGenerator {
    yield* all(...live().map(item => item.show[key](0, GROW, easeInOutCubic)));
  }

  function* split(): ThreadGenerator {
    // Второй кусок рождается с той же начинкой, что уже есть у первого.
    BAR_ORDER.forEach(key => rows[1].show[key](rows[0].show[key]()));
    rows[1].share(0.5);
    rows[1].group().y(0);
    yield* all(
      rows[0].share(0.5, MOVE, easeInOutCubic),
      rows[0].group().y(-SPLIT_OFFSET, MOVE, easeInOutCubic),
      rows[1].group().opacity(1, MOVE, easeOutCubic),
      rows[1].group().y(SPLIT_OFFSET, MOVE, easeInOutCubic),
    );
  }

  function* merge(): ThreadGenerator {
    yield* all(
      rows[0].share(1, MOVE, easeInOutCubic),
      rows[0].group().y(0, MOVE, easeInOutCubic),
      rows[1].group().opacity(0, MOVE * 0.7, easeInOutCubic),
      rows[1].group().y(0, MOVE, easeInOutCubic),
    );
  }

  function* moveTo(nextY: number): ThreadGenerator {
    yield* stack().y(nextY, MOVE, easeInOutCubic);
  }

  function* toWire(wireY: number): ThreadGenerator {
    yield* stack().y(wireY, MOVE, easeInOutCubic);
    yield* stack().x(x + WIRE_TRIP, TRIP, easeInOutCubic);
  }

  function* fromWire(nextY: number): ThreadGenerator {
    stack().x(x - WIRE_TRIP);
    yield* stack().x(x, TRIP, easeInOutCubic);
    yield* stack().y(nextY, MOVE, easeInOutCubic);
  }

  function* focus(key: SegmentKey | null): ThreadGenerator {
    yield* all(
      ...rows.flatMap(item =>
        BAR_ORDER.map(other =>
          item.bright[other](!key || other === key ? 1 : DIM, FOCUS, easeInOutCubic),
        ),
      ),
    );
  }

  function* center(cx: number, cy: number, scale: number): ThreadGenerator {
    yield* all(
      stack().x(cx, FOLD, easeInOutCubic),
      stack().y(cy, FOLD, easeInOutCubic),
      stack().scale(scale, FOLD, easeInOutCubic),
    );
  }

  function* fold(): ThreadGenerator {
    yield* nest(1, FOLD, easeInOutCubic);
  }

  function* rename(): ThreadGenerator {
    const texts = rows.flatMap(item => SEGMENTS.map(spec => ({ref: item.labels[spec.key], spec})));
    yield* all(...texts.map(({ref}) => ref().opacity(0, 0.25)));
    texts.forEach(({ref, spec}) => ref().text(spec.nested));
    yield* all(...texts.map(({ref}) => ref().opacity(1, 0.35, easeOutCubic)));
  }

  return {
    node, appear, wrap, unwrap, split, merge, moveTo, toWire, fromWire, focus, center,
    fold, rename,
  };
}
