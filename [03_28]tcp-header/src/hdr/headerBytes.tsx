import {Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, createSignal, delay, easeInOutCubic, easeOutCubic} from '@motion-canvas/core';
import type {SimpleSignal, ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// Двадцать байт TCP на той же линейке, что и восемь байт UDP, — а под ними список того, что
// на эти байты куплено. Каждая группа полей загорается ровно тогда, когда её называют.
const PX = 38; // пикселей на байт — общая линейка для обоих заголовков
const LEFT = -380;
const UDP_Y = -152;
const BAR_Y = -38;
const BAR_H = 90;
const UDP_H = 46;
const TITLE_Y = -100;
const LEGEND = {top: 52, step: 42} as const;

const IN = 0.7;
const LIGHT = 0.45;

interface Group {
  key: string;
  label: string;
  from: number;
  size: number;
}

const GROUPS: readonly Group[] = [
  {key: 'ports', label: 'ПОРТЫ', from: 0, size: 4},
  {key: 'seq', label: 'SEQ', from: 4, size: 4},
  {key: 'ack', label: 'ACK', from: 8, size: 4},
  {key: 'flags', label: 'ФЛАГИ', from: 12, size: 2},
  {key: 'win', label: 'ОКНО', from: 14, size: 2},
  {key: 'rest', label: 'ПРОЧЕЕ', from: 16, size: 4},
];

/** Что куплено на эти байты — по одной строке за раз. */
const LEGEND_LINES: readonly {keys: string[]; text: string}[] = [
  {keys: ['ports'], text: 'ПОРТЫ → АДРЕСАЦИЯ ПРОЦЕССА'},
  {keys: ['seq', 'ack'], text: 'SEQ / ACK → НАДЁЖНОСТЬ И ПОРЯДОК'},
  {keys: ['flags'], text: 'ФЛАГИ → РУКОПОЖАТИЯ И ПРОЩАНИЯ'},
  {keys: ['win'], text: 'ОКНО → УПРАВЛЕНИЕ ПОТОКОМ'},
];

export interface HeaderBytes extends Widget {
  /** Восемь байт UDP на той же линейке. */
  compare(): ThreadGenerator;
  /** Подсветить группу полей и выдать её строку в списке. */
  light(...keys: string[]): ThreadGenerator;
  /** «Каждая группа полей — это гарантии, отлитые в байты». */
  allBought(): ThreadGenerator;
  dismiss(): ThreadGenerator;
}

/** Заголовок TCP: 20 байт, шесть групп, четыре купленные гарантии. */
export function headerBytes({y}: {y: number}): HeaderBytes {
  const group = createRef<Node>();
  const udpBar = createRef<Node>();
  const legend = LEGEND_LINES.map(() => createRef<Txt>());
  const lit: SimpleSignal<number>[] = GROUPS.map(() => createSignal(0));

  const accent = colors.cyan;
  const groupX = (item: Group) => LEFT + (item.from + item.size / 2) * PX;

  const node = (
    <Node ref={group} y={y} opacity={0}>
      <Node ref={udpBar} opacity={0}>
        <Rect offset={[-1, 0]} x={LEFT} y={UDP_Y} width={8 * PX} height={UDP_H} radius={8}
          fill={withAlpha(colors.textMuted, 0.12)} stroke={withAlpha(colors.textMuted, 0.7)}
          lineWidth={1.5}/>
        <Txt offset={[-1, 0]} x={LEFT + 8 * PX + 18} y={UDP_Y} text="UDP · 8 Б"
          fill={colors.textMuted} fontSize={18} fontFamily={fonts.mono} letterSpacing={1.2}/>
      </Node>

      <Txt offset={[-1, 0]} x={LEFT} y={TITLE_Y} text="TCP · МИНИМУМ 20 Б"
        fill={withAlpha(accent, 0.9)} fontSize={18} fontFamily={fonts.mono} fontWeight={500}
        letterSpacing={1.2}/>

      {GROUPS.map((item, index) => (
        <Rect x={groupX(item)} y={BAR_Y} width={item.size * PX - 3} height={BAR_H} radius={8}
          fill={() => withAlpha(accent, 0.08 + lit[index]() * 0.2)}
          stroke={() => withAlpha(accent, 0.35 + lit[index]() * 0.6)}
          lineWidth={() => 1.5 + lit[index]() * 0.7}>
          <Txt y={-13} text={item.label}
            fill={() => withAlpha(colors.text, 0.55 + lit[index]() * 0.45)} fontSize={17}
            fontFamily={fonts.mono} fontWeight={500} letterSpacing={1.1}/>
          <Txt y={16} text={`${item.size} Б`}
            fill={() => withAlpha(colors.textMuted, 0.7 + lit[index]() * 0.3)} fontSize={15}
            fontFamily={fonts.mono}/>
        </Rect>
      ))}

      {LEGEND_LINES.map((line, index) => (
        <Txt ref={legend[index]} y={LEGEND.top + index * LEGEND.step} text={line.text}
          fill={accent} fontSize={20} fontFamily={fonts.mono} letterSpacing={1.1} opacity={0}/>
      ))}
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* group().opacity(1, IN, easeOutCubic);
  }

  function* compare(): ThreadGenerator {
    yield* udpBar().opacity(1, LIGHT, easeOutCubic);
  }

  function* light(...keys: string[]): ThreadGenerator {
    const indices = keys.map(key => GROUPS.findIndex(item => item.key === key));
    const line = LEGEND_LINES.findIndex(item => item.keys.every(key => keys.includes(key)));
    yield* all(
      ...indices.map(index => lit[index](1, LIGHT, easeOutCubic)),
      ...(line >= 0 ? [delay(0.2, legend[line]().opacity(1, LIGHT, easeOutCubic))] : []),
    );
  }

  function* allBought(): ThreadGenerator {
    yield* all(...legend.map((item, index) => delay(index * 0.1, item().opacity(1, 0.4))));
  }

  function* dismiss(): ThreadGenerator {
    yield* all(
      group().opacity(0, 0.55, easeInOutCubic),
      group().y(group().y() - 26, 0.55, easeInOutCubic),
    );
  }

  return {node, appear, compare, light, allBought, dismiss};
}
