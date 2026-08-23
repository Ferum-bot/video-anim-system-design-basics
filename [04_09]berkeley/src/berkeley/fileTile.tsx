import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  easeInOutCubic,
  easeInOutSine,
  easeOutCubic,
  range,
  waitFor,
} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// Сквозной объект всей части: плитка с одним и тем же набором кнопок. Сначала это файл,
// потом — под копирку — сетевое соединение, потом WinSock. Кнопки **не перерисовываются**
// от плитки к плитке: в том и мысль, что программисту не пришлось учить ничего нового.
export const TILE = {width: 380, height: 210, radius: 14} as const;

const CALLS = ['open', 'read', 'write', 'close'] as const;
const BTN = {width: 78, height: 34, radius: 8, step: 87, y: 6} as const;

const PAD = 22;
const TITLE_Y = -72;
const DIVIDER_Y = -46;
const NOTE_Y = 62;

const IN = 0.6;
const TONE = 0.45;
const SWAP = {out: 0.22, in: 0.3} as const;
const EMERGE = 1.0;
const BLINK = 0.34;

export interface FileTile extends Widget {
  /** Появиться под копирку: выехать из-под другой плитки на своё место. */
  emerge(fromX: number, fromY: number): ThreadGenerator;
  /** Переименоваться. */
  named(text: string): ThreadGenerator;
  /** Открыл — получил дескриптор. */
  descriptor(text: string): ThreadGenerator;
  /** Строка под кнопками; пустая строка гасит её. */
  note(text: string): ThreadGenerator;
  /** Штамп поверх правого нижнего угла. */
  stamp(text: string): ThreadGenerator;
  /** Ряд кнопок мигает — на обеих плитках это запускают одним `all`. */
  blink(times: number): ThreadGenerator;
  /** Переехать. */
  moveTo(x: number, y: number): ThreadGenerator;
  /** Тихое дыхание свечения — форкать через `yield`. */
  idle(): ThreadGenerator;
  /** Уйти из кадра: своё дело плитка уже сделала. */
  dismiss(): ThreadGenerator;
}

export interface FileTileOptions {
  x: number;
  y: number;
  label: string;
}

/** «Всё есть файл» — в виде одной плитки. */
export function fileTile({x, y, label}: FileTileOptions): FileTile {
  const group = createRef<Node>();
  const title = createRef<Txt>();
  const fd = createRef<Rect>();
  const fdText = createRef<Txt>();
  const noteText = createRef<Txt>();
  const stampNode = createRef<Rect>();
  const stampText = createRef<Txt>();

  const accent = colors.cyan;
  const pulse = createSignal(0); // подсветка ряда кнопок
  const glow = createSignal(0);

  const half = TILE.width / 2;
  const btnX = (index: number) => (index - (CALLS.length - 1) / 2) * BTN.step;

  const node = (
    <Node ref={group} x={x} y={y} opacity={0} scale={0.94}>
      <Rect width={TILE.width} height={TILE.height} radius={TILE.radius}
        fill={colors.surface} stroke={withAlpha(accent, 0.7)} lineWidth={1.8}
        shadowColor={withAlpha(accent, 0.55)} shadowBlur={() => glow() * 20}>
        <Txt ref={title} x={-half + PAD} y={TITLE_Y} offsetX={-1} text={label}
          fill={withAlpha(colors.text, 0.95)} fontSize={19} fontFamily={fonts.mono}
          fontWeight={600} letterSpacing={1.2}/>

        <Rect ref={fd} x={half - PAD} y={TITLE_Y} offsetX={1} radius={999} padding={[4, 12]}
          layout fill={withAlpha(colors.green, 0.14)} stroke={withAlpha(colors.green, 0.7)}
          lineWidth={1.2} opacity={0}>
          <Txt ref={fdText} text="fd 3" fill={colors.green} fontSize={15}
            fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.1}/>
        </Rect>

        <Line points={[[-half + PAD, DIVIDER_Y], [half - PAD, DIVIDER_Y]]}
          stroke={withAlpha(colors.border, 0.9)} lineWidth={1.2}/>

        {range(CALLS.length).map(index => (
          <Rect x={btnX(index)} y={BTN.y} width={BTN.width} height={BTN.height}
            radius={BTN.radius} fill={() => withAlpha(accent, 0.09 + pulse() * 0.26)}
            stroke={() => withAlpha(accent, 0.5 + pulse() * 0.45)} lineWidth={1.3}
            shadowColor={withAlpha(accent, 0.7)} shadowBlur={() => pulse() * 14}>
            <Txt text={CALLS[index]} fill={() => withAlpha(colors.text, 0.75 + pulse() * 0.25)}
              fontSize={15} fontFamily={fonts.mono} letterSpacing={0.9}/>
          </Rect>
        ))}

        <Txt ref={noteText} x={-half + PAD} y={NOTE_Y} offsetX={-1} text=""
          fill={colors.textMuted} fontSize={15} fontFamily={fonts.mono} letterSpacing={1.1}
          opacity={0}/>

        <Rect ref={stampNode} x={half - PAD} y={NOTE_Y} offsetX={1} rotation={-8}
          radius={6} padding={[6, 14]} layout fill={withAlpha(colors.orange, 0.12)}
          stroke={withAlpha(colors.orange, 0.9)} lineWidth={2} opacity={0} scale={1.5}>
          <Txt ref={stampText} text="" fill={colors.orange} fontSize={16}
            fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.4}/>
        </Rect>
      </Rect>
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* all(
      group().opacity(1, IN, easeOutCubic),
      group().scale(1, IN, easeOutCubic),
    );
  }

  function* emerge(fromX: number, fromY: number): ThreadGenerator {
    group().position([fromX, fromY]);
    group().scale(0.98);
    group().rotation(-2);
    yield* all(
      group().opacity(1, EMERGE * 0.5, easeOutCubic),
      group().x(x, EMERGE, easeInOutCubic),
      group().y(y, EMERGE, easeInOutCubic),
      group().scale(1, EMERGE, easeInOutCubic),
      group().rotation(0, EMERGE, easeInOutCubic),
    );
  }

  function* named(text: string): ThreadGenerator {
    yield* title().opacity(0, SWAP.out);
    title().text(text);
    yield* title().opacity(1, SWAP.in, easeOutCubic);
  }

  function* descriptor(text: string): ThreadGenerator {
    fdText().text(text);
    fd().scale(0.7);
    yield* all(
      fd().opacity(1, TONE, easeOutCubic),
      fd().scale(1, TONE, easeOutCubic),
    );
  }

  function* note(text: string): ThreadGenerator {
    if (noteText().opacity() > 0) yield* noteText().opacity(0, SWAP.out);
    if (!text) return;
    noteText().text(text);
    yield* noteText().opacity(1, SWAP.in, easeOutCubic);
  }

  function* stamp(text: string): ThreadGenerator {
    stampText().text(text);
    yield* all(
      stampNode().opacity(1, 0.28, easeOutCubic),
      stampNode().scale(1, 0.28, easeOutCubic),
    );
  }

  function* blink(times: number): ThreadGenerator {
    for (const index of range(times)) {
      yield* pulse(1, BLINK, easeOutCubic);
      yield* pulse(0, BLINK, easeInOutCubic);
      if (index < times - 1) yield* waitFor(0.12);
    }
  }

  function* moveTo(nextX: number, nextY: number): ThreadGenerator {
    yield* all(
      group().x(nextX, 0.9, easeInOutCubic),
      group().y(nextY, 0.9, easeInOutCubic),
    );
  }

  function* idle(): ThreadGenerator {
    while (true) {
      yield* glow(1, 1.6, easeInOutSine);
      yield* glow(0, 1.6, easeInOutSine);
    }
  }

  function* dismiss(): ThreadGenerator {
    yield* all(
      group().opacity(0, 0.6, easeInOutCubic),
      group().scale(0.94, 0.6, easeInOutCubic),
    );
  }

  return {node, appear, emerge, named, descriptor, note, stamp, blink, moveTo, idle, dismiss};
}

export interface CarbonSheet {
  readonly node: Node;
  /** Третья копия выезжает из-под сокета — её видно только краем. */
  emerge(fromX: number, fromY: number): ThreadGenerator;
  /** Подпись в той полосе, которую сокет не закрывает. */
  name(label: string): ThreadGenerator;
  /** Убрать копию. */
  dismiss(): ThreadGenerator;
}

export interface CarbonSheetOptions {
  x: number;
  y: number;
}

/**
 * Третий лист под копирку. Полноразмерная плитка, но она уезжает **за** сокет и наружу
 * торчит только полоса снизу — в неё и ложится подпись. Копию видно как копию.
 */
export function carbonSheet({x, y}: CarbonSheetOptions): CarbonSheet {
  const group = createRef<Node>();
  const caption = createRef<Txt>();
  const accent = colors.cyan;

  const node = (
    <Node ref={group} x={x} y={y} opacity={0}>
      <Rect width={TILE.width} height={TILE.height} radius={TILE.radius}
        fill={colors.surface} stroke={withAlpha(accent, 0.45)} lineWidth={1.6}/>
      {/* Подпись живёт в той полосе, которую сокет не закрывает. */}
      <Txt ref={caption} y={TILE.height / 2 - 21} text="" fill={colors.textDim}
        fontSize={15} fontFamily={fonts.mono} letterSpacing={1.3} opacity={0}/>
    </Node>
  );

  function* emerge(fromX: number, fromY: number): ThreadGenerator {
    group().position([fromX, fromY]);
    group().rotation(-2);
    yield* all(
      group().opacity(1, 0.5, easeOutCubic),
      group().x(x, EMERGE, easeInOutCubic),
      group().y(y, EMERGE, easeInOutCubic),
      group().rotation(0, EMERGE, easeInOutCubic),
    );
  }

  function* name(label: string): ThreadGenerator {
    caption().text(label);
    yield* caption().opacity(1, TONE, easeOutCubic);
  }

  function* dismiss(): ThreadGenerator {
    yield* group().opacity(0, 0.5, easeInOutCubic);
  }

  return {node, emerge, name, dismiss};
}
