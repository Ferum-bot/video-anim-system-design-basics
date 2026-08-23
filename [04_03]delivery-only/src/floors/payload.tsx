import {Circle, Img, Node, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  delay,
  easeInCubic,
  easeInOutCubic,
  easeOutBack,
  easeOutCubic,
} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import kafkaUrl from '@lib/assets/icons/kafka.svg';

// «Никто из них не открывает страницу. Никто не отправляет сообщение в Kafka. Никто не
// проводит платёж». Три вещи по очереди падают на стопку сверху и **проваливаются сквозь
// все четыре нижних этажа**, будто ищут, за что зацепиться, и вываливаются серыми. На
// «полезная работа начинается именно тут» они взлетают обратно и прилипают к верхнему.
const TILE = {size: 68, radius: 14} as const;
const LABEL_GAP = 24;

const DROP = 1.15; // сквозь всю стопку
const RETURN = 0.85;
const SPREAD = 112; // шаг между иконками: подписи под ними длиннее самих тайлов

export interface PayloadOptions {
  /** Откуда падают и куда возвращаются — верх и низ панели. */
  top: number;
  bottom: number;
}

export interface Payload {
  readonly node: Node;
  /** Одна иконка падает сквозь стопку и гаснет за нижним краем. */
  drop(index: number): ThreadGenerator;
  /** Все три возвращаются и садятся на верхний этаж. */
  land(x: number, y: number): ThreadGenerator;
  /** Уступают слот следующему содержанию верхней плиты. */
  dismiss(): ThreadGenerator;
}

/** Страница, сообщение в Kafka и платёж — то, ради чего вся машинерия внизу и работает. */
export function payload({top, bottom}: PayloadOptions): Payload {
  const items = [
    {label: 'СТРАНИЦА', glyph: 'page' as const},
    {label: 'СООБЩЕНИЕ', glyph: 'kafka' as const},
    {label: 'ПЛАТЁЖ', glyph: 'card' as const},
  ];

  const groups = items.map(() => createRef<Node>());
  const accent = colors.cyan;

  /** Мини-глиф в тайле: браузерное окно, логотип Kafka, банковская карта. */
  const glyph = (kind: 'page' | 'kafka' | 'card') => {
    if (kind === 'kafka') return <Img src={kafkaUrl} width={38} height={38}/>;
    if (kind === 'page') {
      return (
        <Rect width={38} height={30} radius={4} stroke={accent} lineWidth={1.8}>
          <Rect y={-10} width={38} height={9} fill={withAlpha(accent, 0.35)}/>
          <Circle x={-13} y={-10} width={4} height={4} fill={colors.background}/>
        </Rect>
      );
    }
    return (
      <Rect width={40} height={27} radius={4} stroke={accent} lineWidth={1.8}>
        <Rect y={-4} width={40} height={7} fill={withAlpha(accent, 0.45)}/>
        <Rect x={-10} y={7} width={16} height={4} radius={2} fill={withAlpha(accent, 0.6)}/>
      </Rect>
    );
  };

  const node = (
    <Node>
      {items.map((item, index) => (
        <Node ref={groups[index]} y={top} opacity={0}>
          <Rect
            width={TILE.size}
            height={TILE.size}
            radius={TILE.radius}
            fill={colors.surface}
            stroke={withAlpha(accent, 0.7)}
            lineWidth={1.6}
            layout
            justifyContent="center"
            alignItems="center"
          >
            {glyph(item.glyph)}
          </Rect>
          <Txt
            y={TILE.size / 2 + LABEL_GAP}
            text={item.label}
            fill={colors.textDim}
            fontSize={15}
            fontFamily={fonts.mono}
            letterSpacing={1.2}
          />
        </Node>
      ))}
    </Node>
  );

  /**
   * Падение сквозь стопку: иконка появляется над кадром, проходит все четыре этажа, не
   * зацепившись ни за один, и гаснет внизу. Серость набирается по дороге, а не в конце —
   * так видно, что этажи её именно не приняли.
   */
  function* drop(index: number): ThreadGenerator {
    const group = groups[index]();
    group.y(top);
    group.opacity(0);
    group.scale(1);
    yield* all(
      group.opacity(1, 0.22, easeOutCubic),
      group.y(bottom, DROP, easeInCubic),
      delay(DROP * 0.55, group.opacity(0.12, DROP * 0.45, easeInOutCubic)),
    );
  }

  /** Возвращаются снизу и садятся в ряд на верхнюю плиту. */
  function* land(x: number, y: number): ThreadGenerator {
    groups.forEach((group, index) => {
      group().x(x + (index - 1) * SPREAD);
      group().scale(0.86);
    });
    yield* all(
      ...groups.map((group, index) =>
        delay(index * 0.12, all(
          group().y(y, RETURN, easeOutCubic),
          group().opacity(1, RETURN * 0.6, easeOutCubic),
          group().scale(1, RETURN, easeOutBack),
        )),
      ),
    );
  }

  function* dismiss(): ThreadGenerator {
    yield* all(...groups.map(group => group().opacity(0, 0.35, easeInOutCubic)));
  }

  return {node, drop, land, dismiss};
}
