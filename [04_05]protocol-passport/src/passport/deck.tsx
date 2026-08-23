import {Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, delay, easeOutCubic, range} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {PASSPORT, colors, fonts, withAlpha} from '@lib';

// «В рамках этого шаблона можно описать любой протокол прикладного уровня». Стопка из
// шести таких же, но пустых карточек — одним кадром объясняет, зачем зритель это запомнил.
// Размер призраков совпадает с отъехавшим паспортом, так что стопка читается как один
// объект, а не как декорация рядом.
const GHOSTS = 6;
const SCALE = 0.72; // тот же, до которого отъезжает заполненный паспорт
const STEP = {x: 22, y: -17} as const;

const NAMES = 'DNS · GraphQL · gRPC · WEBSOCKET · SSE · WEBRTC';

export interface Deck {
  readonly node: Node;
  /** Призраки проступают из-за карточки. */
  reveal(): ThreadGenerator;
  /** Стопка получает имена — те же семь, что стояли полкой в `[04_04]`. */
  label(): ThreadGenerator;
  /** Уходят, оставляя один заполненный паспорт. */
  dismiss(): ThreadGenerator;
}

/** Шесть пустых паспортов за спиной у заполненного. */
export function deck({y, bottom}: {y: number; bottom: number}): Deck {
  const ghosts = range(GHOSTS).map(() => createRef<Rect>());
  const caption = createRef<Txt>();
  const names = createRef<Txt>();

  const accent = colors.cyan;

  const node = (
    <Node>
      {range(GHOSTS).map(index => (
        <Rect
          ref={ghosts[index]}
          x={(index + 1) * STEP.x}
          y={y + (index + 1) * STEP.y}
          width={PASSPORT.width * SCALE}
          height={PASSPORT.height * SCALE}
          radius={16}
          fill={colors.surface}
          stroke={withAlpha(accent, 0.35)}
          lineWidth={1.5}
          opacity={0}
        />
      ))}
      <Txt ref={caption} y={bottom} text="ТОТ ЖЕ ШАБЛОН — ЕЩЁ ШЕСТЬ РАЗ" fill={colors.textDim}
        fontSize={18} fontFamily={fonts.mono} letterSpacing={1.5} opacity={0}/>
      <Txt ref={names} y={bottom + 38} text={NAMES} fill={colors.textMuted} fontSize={19}
        fontFamily={fonts.mono} letterSpacing={1.2} opacity={0}/>
    </Node>
  );

  function* reveal(): ThreadGenerator {
    yield* all(
      ...ghosts.map((ghost, index) =>
        delay(index * 0.08, ghost().opacity(0.5 - index * 0.06, 0.45, easeOutCubic)),
      ),
      delay(0.3, caption().opacity(1, 0.45, easeOutCubic)),
    );
  }

  function* label(): ThreadGenerator {
    yield* names().opacity(1, 0.5, easeOutCubic);
  }

  function* dismiss(): ThreadGenerator {
    yield* all(
      ...ghosts.map(ghost => ghost().opacity(0, 0.4)),
      caption().opacity(0, 0.4),
      names().opacity(0, 0.4),
    );
  }

  return {node, reveal, label, dismiss};
}
