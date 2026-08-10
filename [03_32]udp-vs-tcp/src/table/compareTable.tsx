import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, createSignal, delay, easeInOutCubic, easeOutCubic, range} from '@motion-canvas/core';
import type {SimpleSignal, ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// Таблица, про которую он говорит «ты видишь её на экране»: пустой каркас появляется сразу,
// а строки прилетают ровно на своих названиях — по одной за реплику.
const COL = {label: -400, udp: -165, tcp: 130} as const;
const HEADER_Y = -262;
const ROW = {top: -196, step: 60, height: 54} as const;
const BAND = {left: -412, right: 462} as const;

const IN = 0.6;
const LAND = 0.4;
const LIGHT = 0.35;
const REST = 0.0; // подсветка снятой строки

interface Row {
  label: string;
  udp: string;
  tcp: string;
}

const ROWS: readonly Row[] = [
  {label: 'МОДЕЛЬ', udp: 'сообщения (границы святы)', tcp: 'поток байтов (границ нет)'},
  {label: 'СОЕДИНЕНИЕ', udp: 'нет', tcp: 'да, рукопожатие 1 RTT'},
  {label: 'ДОСТАВКА', udp: 'не гарантирует', tcp: 'гарантирует (повторы)'},
  {label: 'ПОРЯДОК', udp: 'нет', tcp: 'строгий (ценой HOL)'},
  {label: 'ПОТОК / ПЕРЕГРУЗКА', udp: 'нет / нет', tcp: 'окно / AIMD-CUBIC'},
  {label: 'ЗАГОЛОВОК', udp: '8 байт', tcp: '20+ байт'},
  {label: 'СОСТОЯНИЕ', udp: 'нет', tcp: 'на обеих сторонах'},
  {label: 'СПЕЦИФИКАЦИЯ', udp: '3 страницы, 1980, нетронута', tcp: '1981 + 40 лет патчей → 9293 (2022)'},
  {label: 'ХАРАКТЕР', udp: 'не обещает — не платит', tcp: 'обещает всё — платишь везде'},
];

export interface CompareTable extends Widget {
  /** Шапка: два столбца, которые сравниваем. */
  columns(): ThreadGenerator;
  /** Строка приезжает и подсвечивается; предыдущая гаснет до обычной. */
  row(index: number): ThreadGenerator;
  /** Подсветка снимается — таблица целиком. */
  settle(): ThreadGenerator;
  /** Снова выделить строку. */
  focus(index: number): ThreadGenerator;
  /** Подсветить одну ячейку строки: 0 — UDP, 1 — TCP. */
  cell(index: number, column: number): ThreadGenerator;
}

/** Сравнительная таблица UDP и TCP. */
export function compareTable({y}: {y: number}): CompareTable {
  const group = createRef<Node>();
  const head = createRef<Node>();
  const rowNodes = ROWS.map(() => createRef<Node>());

  const accent = colors.cyan;
  const shown: SimpleSignal<number>[] = ROWS.map(() => createSignal(0));
  const lit: SimpleSignal<number>[] = ROWS.map(() => createSignal(0));
  const hot: SimpleSignal<number>[][] = ROWS.map(() => [createSignal(0), createSignal(0)]);

  const rowY = (index: number) => ROW.top + index * ROW.step;

  const node = (
    <Node ref={group} y={y} opacity={0}>
      {/* Каркас: он появляется сразу и обещает форму того, что сейчас соберётся. */}
      <Line points={[[BAND.left, HEADER_Y + 30], [BAND.right, HEADER_Y + 30]]}
        stroke={withAlpha(accent, 0.4)} lineWidth={1.8}/>
      {range(ROWS.length).map(index => (
        <Line points={[[BAND.left, rowY(index) + ROW.step / 2],
          [BAND.right, rowY(index) + ROW.step / 2]]}
          stroke={withAlpha(colors.textMuted, 0.22)} lineWidth={1.2}/>
      ))}

      <Node ref={head} opacity={0}>
        <Txt offset={[-1, 0]} x={COL.udp} y={HEADER_Y} text="UDP" fill={colors.textDim}
          fontSize={26} fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.4}/>
        <Txt offset={[-1, 0]} x={COL.tcp} y={HEADER_Y} text="TCP" fill={accent} fontSize={26}
          fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.4}/>
      </Node>

      {ROWS.map((row, index) => (
        <Node ref={rowNodes[index]} y={rowY(index)} opacity={shown[index]}>
          <Rect x={(BAND.left + BAND.right) / 2} width={BAND.right - BAND.left}
            height={ROW.height} radius={8} fill={() => withAlpha(accent, 0.11 * lit[index]())}/>
          <Txt offset={[-1, 0]} x={COL.label} text={row.label}
            fill={() => withAlpha(colors.textDim, 0.7 + lit[index]() * 0.3)} fontSize={17}
            fontFamily={fonts.mono} letterSpacing={1.2}/>
          <Txt offset={[-1, 0]} x={COL.udp} text={row.udp}
            fill={() => withAlpha(colors.text, 0.6 + lit[index]() * 0.2 + hot[index][0]() * 0.2)}
            fontSize={18} fontFamily={fonts.display}/>
          <Txt offset={[-1, 0]} x={COL.tcp} text={row.tcp}
            fill={() => withAlpha(accent, 0.6 + lit[index]() * 0.2 + hot[index][1]() * 0.2)}
            fontSize={18} fontFamily={fonts.display}/>
        </Node>
      ))}
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* group().opacity(1, IN, easeOutCubic);
  }

  function* columns(): ThreadGenerator {
    yield* head().opacity(1, LAND, easeOutCubic);
  }

  function* row(index: number): ThreadGenerator {
    rowNodes[index]().x(-26);
    yield* all(
      shown[index](1, LAND, easeOutCubic),
      lit[index](1, LIGHT, easeOutCubic),
      rowNodes[index]().x(0, LAND, easeOutCubic),
      ...(index > 0 ? [lit[index - 1](REST, LIGHT, easeInOutCubic)] : []),
    );
  }

  function* settle(): ThreadGenerator {
    yield* all(...lit.map(signal => signal(REST, 0.4, easeInOutCubic)));
  }

  function* focus(index: number): ThreadGenerator {
    yield* all(
      ...lit.map((signal, i) => signal(i === index ? 1 : REST, LIGHT, easeInOutCubic)),
    );
  }

  function* cell(index: number, column: number): ThreadGenerator {
    yield* all(
      hot[index][column](1, LIGHT, easeOutCubic),
      delay(0.05, lit[index](1, LIGHT, easeOutCubic)),
    );
  }

  return {node, appear, columns, row, settle, focus, cell};
}
