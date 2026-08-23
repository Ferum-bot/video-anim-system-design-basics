import {Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, createSignal, delay, easeInOutCubic, easeOutCubic, range} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '../theme';
import type {Widget} from '../widget';

// «Паспорт протокола» — четыре ячейки, на которые раскладывается любой прикладной протокол:
// типы сообщений, синтаксис, семантика, правила. Автор называет его самой полезной вещью
// видео и обещает разбирать по нему каждый протокол сезона, поэтому форма живёт здесь:
// её предстоит инстанцировать ещё шесть раз с другим содержимым.
//
// Ячейка знает два состояния — **пояснение** (что сюда вообще пишут) и **содержимое**
// (что здесь у конкретного протокола). Форма обещана раньше, чем заполнена: карточка
// открывается пустой и с подписями, и только потом получает значения.
export const PASSPORT = {width: 880, height: 532, radius: 18} as const;

const HEADER_HEIGHT = 78;
const PADDING = 22;
const CELL = {width: 416, height: 196, gap: 20, radius: 12} as const;

const GRID_TOP = -PASSPORT.height / 2 + HEADER_HEIGHT + 12;
const CELL_X = (CELL.width + CELL.gap) / 2;
const CELL_Y = (row: number) => GRID_TOP + CELL.height / 2 + row * (CELL.height + CELL.gap);

const OPEN = 0.85;
const TONE = 0.4;
const SWAP = {out: 0.25, in: 0.35} as const;
const STAMP = {scale: 1.3, tilt: -7, press: 0.3, settle: 0.22} as const;

export interface PassportCell {
  /** Имя ячейки — оно же строка чек-листа: ТИПЫ / СИНТАКСИС / СЕМАНТИКА / ПРАВИЛА. */
  label: string;
  /** Что сюда вообще пишут. Показывается, пока протокол не назван. */
  hint: string;
  /** Что здесь у конкретного протокола. Строит вызывающий — форма ему не указ. */
  content?: Node;
}

export interface ProtocolPassportOptions {
  cells: PassportCell[];
  y?: number;
}

export interface ProtocolPassport extends Widget {
  /** Пояснение к ячейке: что сюда вообще пишут. */
  explain(index: number): ThreadGenerator;
  /** Пояснение уступает место содержимому конкретного протокола. */
  fill(index: number): ThreadGenerator;
  /** Имя протокола в шапке. */
  name(text: string): ThreadGenerator;
  /** Штамп поверх карточки — «этот протокол описан». */
  stamp(text: string): ThreadGenerator;
  /** Отъехать вглубь, освобождая место для стопки таких же пустых. */
  recede(scale: number): ThreadGenerator;
  /** Вернуться на место. */
  restore(): ThreadGenerator;
}

/** Карточка из четырёх ячеек, на которые раскладывается любой прикладной протокол. */
export function protocolPassport({cells, y = 0}: ProtocolPassportOptions): ProtocolPassport {
  const group = createRef<Node>();
  const card = createRef<Rect>();
  const title = createRef<Txt>();
  const stampRef = createRef<Rect>();
  const hints = cells.map(() => createRef<Txt>());
  const slots = cells.map(() => createRef<Node>());
  const frames = cells.map(() => createRef<Rect>());
  const lit = cells.map(() => createSignal(0)); // 0 — ячейка ждёт, 1 — про неё говорят

  const accent = colors.cyan;

  const node = (
    <Node ref={group} y={y} opacity={0} scale={0.94}>
      <Rect ref={card} width={PASSPORT.width} height={PASSPORT.height} radius={PASSPORT.radius}
        fill={colors.surface} stroke={withAlpha(accent, 0.7)} lineWidth={2}>
        <Txt
          ref={title}
          x={-PASSPORT.width / 2 + PADDING + 12}
          y={-PASSPORT.height / 2 + HEADER_HEIGHT / 2}
          offsetX={-1}
          text="ПАСПОРТ ПРОТОКОЛА"
          fill={withAlpha(colors.text, 0.85)}
          fontSize={26}
          fontFamily={fonts.mono}
          fontWeight={500}
          letterSpacing={1.5}
        />
      </Rect>

      {cells.map((cell, index) => (
        <Rect
          ref={frames[index]}
          x={(index % 2 === 0 ? -1 : 1) * CELL_X}
          y={CELL_Y(Math.floor(index / 2))}
          width={CELL.width}
          height={CELL.height}
          radius={CELL.radius}
          fill={colors.track}
          stroke={() => withAlpha(accent, 0.28 + lit[index]() * 0.5)}
          lineWidth={1.6}
          shadowColor={withAlpha(accent, 0.5)}
          shadowBlur={() => lit[index]() * 20}
        >
          <Txt
            x={-CELL.width / 2 + 20}
            y={-CELL.height / 2 + 26}
            offsetX={-1}
            text={cell.label}
            fill={() => withAlpha(colors.text, 0.45 + lit[index]() * 0.5)}
            fontSize={19}
            fontFamily={fonts.mono}
            fontWeight={500}
            letterSpacing={1.4}
          />
          <Txt
            ref={hints[index]}
            y={16}
            text={cell.hint}
            fill={colors.textMuted}
            fontSize={17}
            fontFamily={fonts.mono}
            letterSpacing={1.1}
            opacity={0}
          />
          <Node ref={slots[index]} y={16} opacity={0}>
            {cell.content ?? <Node/>}
          </Node>
        </Rect>
      ))}

      {/* Штамп прикладывается поверх всего и слегка наискось. */}
      <Rect
        ref={stampRef}
        x={PASSPORT.width / 2 - PADDING - 12}
        y={-PASSPORT.height / 2 + HEADER_HEIGHT / 2}
        offsetX={1}
        radius={10}
        padding={[10, 22]}
        layout
        fill={withAlpha(accent, 0.16)}
        stroke={accent}
        lineWidth={2.2}
        opacity={0}
        scale={STAMP.scale}
        rotation={STAMP.tilt}
      >
        <Txt text="" fill={accent} fontSize={26} fontFamily={fonts.mono} fontWeight={600}
          letterSpacing={2}/>
      </Rect>
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* all(
      group().opacity(1, OPEN, easeOutCubic),
      group().scale(1, OPEN, easeOutCubic),
    );
  }

  function* explain(index: number): ThreadGenerator {
    yield* all(
      lit[index](1, TONE, easeOutCubic),
      hints[index]().opacity(1, TONE, easeOutCubic),
      ...range(cells.length)
        .filter(other => other !== index)
        .map(other => lit[other](0, TONE, easeInOutCubic)),
    );
  }

  function* fill(index: number): ThreadGenerator {
    yield* all(
      lit[index](1, TONE, easeOutCubic),
      ...range(cells.length)
        .filter(other => other !== index)
        .map(other => lit[other](0, TONE, easeInOutCubic)),
      hints[index]().opacity(0, SWAP.out),
    );
    yield* slots[index]().opacity(1, SWAP.in, easeOutCubic);
  }

  function* name(text: string): ThreadGenerator {
    yield* title().opacity(0, SWAP.out);
    title().text(text);
    yield* title().opacity(1, SWAP.in, easeOutCubic);
  }

  /** Штамп прикладывается: приезжает крупным и вдавливается до своего размера. */
  function* stamp(text: string): ThreadGenerator {
    (stampRef().children()[0] as Txt).text(text);
    yield* all(
      stampRef().opacity(1, STAMP.press, easeOutCubic),
      stampRef().scale(1, STAMP.press, easeOutCubic),
    );
    yield* stampRef().rotation(STAMP.tilt + 2, STAMP.settle, easeInOutCubic);
  }

  function* recede(scale: number): ThreadGenerator {
    yield* group().scale(scale, 0.7, easeInOutCubic);
  }

  function* restore(): ThreadGenerator {
    yield* group().scale(1, 0.6, easeInOutCubic);
  }

  return {node, appear, explain, fill, name, stamp, recede, restore};
}
