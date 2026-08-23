import {Node, Txt} from '@motion-canvas/2d';
import {all, createRef, easeInOutCubic, easeOutCubic} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts} from '@lib';

// Мысль части живёт одной строкой. Пока в кадре только вопрос про дверь — строка крупная и
// стоит в середине; как только появляются плитки, она **не гаснет, а уезжает наверх и
// уменьшается**, освобождая им место. Тот же приём, что в `[04_05]`: заголовок не сменяется
// другим объектом, он на глазах становится шапкой кадра.
const BIG = 52;
const SMALL = 22;
const SMALL_Y = 42;

const DOCK_SCALE = 0.42;
const DOCK_TIME = 0.9;
const SWAP = {out: 0.24, in: 0.34} as const;

export interface Headline {
  readonly node: Node;
  /** Крупная строка + пояснение под ней. */
  set(big: string, small?: string): ThreadGenerator;
  /** Погасить обе строки, не трогая позицию. */
  clear(): ThreadGenerator;
  /** Уехать наверх и уменьшиться — дальше это бегущий комментарий кадра. */
  dock(dockY: number): ThreadGenerator;
  /** Сменить строку, уже будучи шапкой. */
  say(text: string): ThreadGenerator;
}

export interface HeadlineOptions {
  y: number;
}

export function headline({y}: HeadlineOptions): Headline {
  const group = createRef<Node>();
  const big = createRef<Txt>();
  const small = createRef<Txt>();

  const node = (
    <Node ref={group} y={y}>
      <Txt ref={big} text="" fill={colors.text} fontSize={BIG} fontFamily={fonts.mono}
        fontWeight={600} letterSpacing={2} opacity={0}/>
      <Txt ref={small} y={SMALL_Y} text="" fill={colors.textDim} fontSize={SMALL}
        fontFamily={fonts.mono} letterSpacing={1.4} opacity={0}/>
    </Node>
  );

  function* fadeOut(): ThreadGenerator {
    const live = [big, small].filter(item => item().opacity() > 0.01);
    if (live.length === 0) return;
    yield* all(...live.map(item => item().opacity(0, SWAP.out)));
  }

  function* set(bigText: string, smallText = ''): ThreadGenerator {
    yield* fadeOut();
    big().text(bigText);
    small().text(smallText);
    yield* all(
      big().opacity(1, SWAP.in, easeOutCubic),
      smallText ? small().opacity(1, SWAP.in, easeOutCubic) : small().opacity(0, 0.01),
    );
  }

  function* clear(): ThreadGenerator {
    yield* fadeOut();
  }

  function* dock(dockY: number): ThreadGenerator {
    yield* all(
      group().y(dockY, DOCK_TIME, easeInOutCubic),
      group().scale(DOCK_SCALE, DOCK_TIME, easeInOutCubic),
      small().opacity(0, DOCK_TIME * 0.4),
    );
  }

  function* say(text: string): ThreadGenerator {
    yield* set(text);
  }

  return {node, set, clear, dock, say};
}
