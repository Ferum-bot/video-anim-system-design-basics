import {Circle, Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, createSignal, delay, easeInOutCubic, easeOutCubic, linear, range} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// Мелкие врезки: рекап-триптих из уже показанного, ось «1983 → сегодня» и два флэшбека
// в видео 2. Все три живут по одному биту и не претендуют на кадр целиком.

// Ширина упёрлась в колонку: три карточки с зазорами — это уже 852 из 928.
// Поэтому растём только в высоту.
const CARD = {width: 268, height: 232, radius: 14} as const;
const CARD_X = [-292, 0, 292] as const;

export interface RecapRow extends Widget {
  /** Очередная карточка сводки. */
  show(index: number): ThreadGenerator;
  /** Подпись под третьей — про что именно договор. */
  contract(): ThreadGenerator;
  /** Две первые уходят, третья укрупняется: вопрос будет про неё. */
  focusInterface(): ThreadGenerator;
  dismiss(): ThreadGenerator;
}

/** Три миниатюры того, что уже было: паспорт, пиры, стык. */
export function recapRow({y}: {y: number}): RecapRow {
  const cards = range(3).map(() => createRef<Rect>());
  const caption = createRef<Txt>();
  const group = createRef<Node>();
  const accent = colors.cyan;

  const titles = ['ДОГОВОРЁННОСТЬ', 'ПИРЫ И ЛИФТ', 'ИНТЕРФЕЙС'] as const;

  /** Миниатюра внутри карточки — узнаваемый силуэт, а не схема. */
  const glyph = (index: number) => {
    if (index === 0) {
      return (
        <Node y={6}>
          {range(4).map(cell => (
            <Rect x={(cell % 2 - 0.5) * 104} y={(Math.floor(cell / 2) - 0.5) * 64}
              width={96} height={56} radius={6} stroke={withAlpha(accent, 0.6)} lineWidth={1.3}/>
          ))}
        </Node>
      );
    }
    if (index === 1) {
      return (
        <Node y={6}>
          {[-1, 1].map(side => (
            <Rect x={side * 78} width={64} height={104} radius={6}
              stroke={withAlpha(accent, 0.5)} lineWidth={1.3}/>
          ))}
          <Line points={[[-78, -34], [78, -34]]} stroke={withAlpha(accent, 0.7)}
            lineWidth={1.4} lineDash={[6, 5]}/>
          <Line points={[[-78, -34], [-78, 58], [78, 58], [78, -34]]}
            stroke={withAlpha(accent, 0.55)} lineWidth={1.4}/>
        </Node>
      );
    }
    return (
      <Node y={6}>
        {[-1, 1].map(side => (
          <Rect y={side * 42} width={190} height={58} radius={6}
            stroke={withAlpha(accent, 0.5)} lineWidth={1.3}/>
        ))}
        <Line points={[[-108, 0], [108, 0]]} stroke={withAlpha(colors.orange, 0.9)} lineWidth={2}/>
      </Node>
    );
  };

  const node = (
    <Node ref={group} y={y}>
      {range(3).map(index => (
        <Rect ref={cards[index]} x={CARD_X[index]} width={CARD.width} height={CARD.height}
          radius={CARD.radius} fill={colors.track} stroke={withAlpha(accent, 0.45)}
          lineWidth={1.6} opacity={0}>
          <Txt y={-CARD.height / 2 + 22} text={titles[index]} fill={colors.textMuted}
            fontSize={14} fontFamily={fonts.mono} letterSpacing={1.2}/>
          {glyph(index)}
        </Rect>
      ))}
      <Txt ref={caption} x={CARD_X[2]} y={CARD.height / 2 + 26} text="ЧТО НИЖНИЙ ОБЕЩАЕТ ВЕРХНЕМУ"
        fill={colors.textMuted} fontSize={14} fontFamily={fonts.mono} letterSpacing={1.1}
        opacity={0}/>
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* cards[0]().opacity(1, 0.5, easeOutCubic);
  }

  function* show(index: number): ThreadGenerator {
    yield* cards[index]().opacity(1, 0.5, easeOutCubic);
  }

  function* contract(): ThreadGenerator {
    yield* caption().opacity(1, 0.4, easeOutCubic);
  }

  function* focusInterface(): ThreadGenerator {
    yield* all(
      cards[0]().opacity(0, 0.45),
      cards[1]().opacity(0, 0.45),
      caption().opacity(0, 0.45),
      cards[2]().x(0, 0.7, easeInOutCubic),
      cards[2]().scale(1.25, 0.7, easeInOutCubic),
    );
  }

  function* dismiss(): ThreadGenerator {
    yield* group().opacity(0, 0.5, easeInOutCubic);
  }

  return {node, appear, show, contract, focusInterface, dismiss};
}

// ── Ось «1983 → сегодня» ─────────────────────────────────────────────────────
const AXIS = {half: 340} as const;

export interface Timeline extends Widget {
  /** Ось дотягивается до сегодня — почти без засечек. */
  stretch(): ThreadGenerator;
  dismiss(): ThreadGenerator;
}

/**
 * Зеркало таймлайна из `[03_40]quic-timeline`: там та же ось была частоколом из 35
 * черновиков, здесь — прямая, на которой ставить нечего.
 */
export function timeline({y}: {y: number}): Timeline {
  const group = createRef<Node>();
  const axis = createRef<Line>();
  const today = createRef<Node>();
  const caption = createRef<Txt>();
  const accent = colors.cyan;

  const node = (
    <Node ref={group} y={y} opacity={0}>
      <Line ref={axis} points={[[-AXIS.half, 0], [AXIS.half, 0]]}
        stroke={withAlpha(accent, 0.55)} lineWidth={2} end={0}/>
      <Circle x={-AXIS.half} width={14} height={14} fill={accent}/>
      <Txt x={-AXIS.half} y={-30} text="1983 · BERKELEY" fill={withAlpha(colors.text, 0.9)}
        fontSize={19} fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.3}/>
      <Node ref={today} opacity={0}>
        <Circle x={AXIS.half} width={14} height={14} fill={accent}/>
        <Txt x={AXIS.half} y={-30} text="СЕГОДНЯ" fill={withAlpha(colors.text, 0.9)}
          fontSize={19} fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.3}/>
      </Node>
      <Txt ref={caption} y={34} text="" fill={colors.textDim} fontSize={17}
        fontFamily={fonts.mono} letterSpacing={1.3} opacity={0}/>
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* all(group().opacity(1, 0.5, easeOutCubic), axis().end(0.12, 0.5, easeOutCubic));
  }

  function* stretch(): ThreadGenerator {
    yield* axis().end(1, 1.1, easeInOutCubic);
    caption().text('40 ЛЕТ · ПОЧТИ БЕЗ ИЗМЕНЕНИЙ');
    yield* all(
      today().opacity(1, 0.4, easeOutCubic),
      caption().opacity(1, 0.4, easeOutCubic),
    );
  }

  function* dismiss(): ThreadGenerator {
    yield* group().opacity(0, 0.5, easeInOutCubic);
  }

  return {node, appear, stretch, dismiss};
}

// ── Флэшбек в видео 2: труба против коробок ──────────────────────────────────
export interface VideoTwoHint extends Widget {
  /** Бесконечное движение в обеих миниатюрах — форкать через `yield`. */
  run(): ThreadGenerator;
  dismiss(): ThreadGenerator;
}

/** Слева поток без границ, справа отдельные сообщения — та самая развилка из видео 2. */
export function videoTwoHint({y}: {y: number}): VideoTwoHint {
  const group = createRef<Node>();
  const flow = createSignal(0);
  const accent = colors.cyan;

  const node = (
    <Node ref={group} y={y} opacity={0}>
      <Txt x={-275} offsetX={-1} text="ВИДЕО 2" fill={colors.textMuted} fontSize={14}
        fontFamily={fonts.mono} letterSpacing={1.2}/>

      <Rect x={-95} width={210} height={34} radius={999} clip
        stroke={withAlpha(colors.green, 0.7)} lineWidth={1.4}>
        {range(6).map(index => (
          <Rect width={18} height={26} radius={4} fill={withAlpha(colors.green, 0.5)}
            x={() => -105 + ((index * 35 + flow() * 35) % 210)}/>
        ))}
      </Rect>
      <Txt x={-95} y={30} text="ПОТОК" fill={colors.textMuted} fontSize={13}
        fontFamily={fonts.mono} letterSpacing={1.1}/>

      {range(3).map(index => (
        <Rect x={185 + (index - 1) * 62} width={50} height={34} radius={6}
          fill={withAlpha(colors.orange, 0.18)} stroke={withAlpha(colors.orange, 0.7)}
          lineWidth={1.4}
          opacity={() => 0.55 + 0.45 * Math.sin(Math.PI * ((flow() + index / 3) % 1))}/>
      ))}
      <Txt x={185} y={30} text="СООБЩЕНИЯ" fill={colors.textMuted} fontSize={13}
        fontFamily={fonts.mono} letterSpacing={1.1}/>
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* group().opacity(1, 0.5, easeOutCubic);
  }

  function* run(): ThreadGenerator {
    while (true) {
      flow(0);
      yield* flow(1, 1.8, linear);
    }
  }

  function* dismiss(): ThreadGenerator {
    yield* group().opacity(0, 0.4, easeInOutCubic);
  }

  return {node, appear, run, dismiss};
}
