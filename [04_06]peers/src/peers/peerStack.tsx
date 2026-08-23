import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  delay,
  easeInOutCubic,
  easeOutCubic,
  range,
  waitFor,
} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// Пятиэтажка в четвёртый раз за видео, но здесь их две — «на разных машинах». Подсветка
// живёт в одном сигнале `active`: этаж горит тем ярче, чем он ближе к нему, поэтому
// «пара переезжает по этажам» — это один твин, а не перебор состояний.
const PLATE = {width: 290, height: 70, radius: 10, gap: 11} as const;
const LAYERS = ['ПРИКЛАДНОЙ', 'ТРАНСПОРТНЫЙ', 'СЕТЕВОЙ', 'КАНАЛЬНЫЙ', 'ФИЗИЧЕСКИЙ'] as const;
const COUNT = LAYERS.length;
const STEP = PLATE.height + PLATE.gap;

export const STACK = {
  width: PLATE.width,
  /** Центр верхней плиты — к нему цепляется линия разговора пиров. */
  topY: -((COUNT - 1) / 2) * STEP,
  /** Низ стопки — ниже неё идёт провод. */
  bottomY: ((COUNT - 1) / 2) * STEP + PLATE.height / 2,
  /** Стык прикладного и транспортного: подписи к нему сцена ставит в зазор между стопками. */
  seamY: -((COUNT - 1) / 2) * STEP + STEP / 2,
} as const;

const SEAM_Y = STACK.seamY;
const SEAM_OVERHANG = 18;

const TRANSPORT = 1; // индекс транспортной плиты — её содержимое подменяют

// Двадцать полос должны укладываться ровно в высоту стопки, иначе они из неё вываливаются.
const STACK_HEIGHT = COUNT * PLATE.height + (COUNT - 1) * PLATE.gap;
const LAYER_FLASH = {count: 20, pitch: (STACK_HEIGHT - 16) / 20} as const;

const IN = 0.7;
const STAGGER = 0.08;
const TONE = 0.45;
const WALK = 0.7; // переезд подсветки на другой этаж
const SWAP = {out: 0.22, in: 0.3} as const;
const SHAKE = {amount: 7, beat: 0.06} as const;

export interface PeerStack extends Widget {
  /** Подсветить этаж — подсветка переезжает, а не переключается. */
  light(index: number): ThreadGenerator;
  /** Стык прикладного и транспортного загорается: это и есть интерфейс. */
  seam(): ThreadGenerator;
  /** Подменить протокол на транспортной плите. */
  swap(text: string): ThreadGenerator;
  /** Тряхнуть всё, что ниже интерфейса: верх при этом стоит намертво. */
  shakeLower(): ThreadGenerator;
  /** «Не 20 слоёв под собой» — они проступают на полторы секунды и гаснут. */
  flashLayers(): ThreadGenerator;
}

export interface PeerStackOptions {
  x: number;
  /** Подпись над стопкой: чья это машина. */
  caption: string;
  captionY: number;
}

/** Одна машина как пятиэтажка. */
export function peerStack({x, caption, captionY}: PeerStackOptions): PeerStack {
  const group = createRef<Node>();
  const lower = createRef<Node>();
  const plates = range(COUNT).map(() => createRef<Rect>());
  const seamLine = createRef<Line>();
  const protocol = createRef<Rect>();
  const protocolText = createRef<Txt>();
  const layers = createRef<Node>();

  const accent = colors.cyan;
  // -1 — никто не горит; иначе этаж тем ярче, чем ближе к `active`.
  const active = createSignal(-1);
  const lit = (index: number) => () => Math.max(0, 1 - Math.abs(index - active()));

  const plateY = (index: number) => STACK.topY + index * STEP;

  const plate = (index: number) => (
    <Rect
      ref={plates[index]}
      y={plateY(index)}
      width={PLATE.width}
      height={PLATE.height}
      radius={PLATE.radius}
      fill={colors.track}
      stroke={() => withAlpha(accent, 0.3 + lit(index)() * 0.6)}
      lineWidth={1.5}
      shadowColor={withAlpha(accent, 0.5)}
      shadowBlur={() => lit(index)() * 22}
      opacity={0}
    >
      <Txt
        x={-PLATE.width / 2 + 22}
        offsetX={-1}
        text={LAYERS[index]}
        fill={() => withAlpha(colors.text, 0.4 + lit(index)() * 0.55)}
        fontSize={18}
        fontFamily={fonts.mono}
        fontWeight={500}
        letterSpacing={1.2}
      />
      {index === TRANSPORT && (
        <Rect
          ref={protocol}
          x={PLATE.width / 2 - 22}
          offsetX={1}
          radius={999}
          padding={[6, 14]}
          layout
          fill={withAlpha(accent, 0.14)}
          stroke={withAlpha(accent, 0.7)}
          lineWidth={1.3}
          opacity={0}
        >
          <Txt ref={protocolText} text="TCP" fill={accent} fontSize={16}
            fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.2}/>
        </Rect>
      )}
    </Rect>
  );

  const node = (
    <Node ref={group} x={x}>
      <Txt y={captionY} text={caption} fill={colors.textMuted} fontSize={16}
        fontFamily={fonts.mono} letterSpacing={1.3}/>

      {plate(0)}
      {/* Всё ниже интерфейса — отдельной группой: её и трясёт на подмене транспорта. */}
      <Node ref={lower}>
        {range(COUNT).slice(1).map(index => plate(index))}
      </Node>

      <Line ref={seamLine}
        points={[[-PLATE.width / 2 - SEAM_OVERHANG, SEAM_Y], [PLATE.width / 2 + SEAM_OVERHANG, SEAM_Y]]}
        stroke={withAlpha(colors.orange, 0.9)} lineWidth={2.2} end={0} opacity={0}/>

      {/* «Не 20 слоёв под собой» — двадцать полос ровно по высоте стопки. */}
      <Node ref={layers} opacity={0}>
        {range(LAYER_FLASH.count).map(index => (
          <Rect
            y={STACK.topY - PLATE.height / 2 + 8 + index * LAYER_FLASH.pitch}
            width={PLATE.width - 20}
            height={7}
            radius={3}
            fill={withAlpha(accent, 0.35)}
          />
        ))}
      </Node>
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* all(
      ...range(COUNT).map(index =>
        delay(index * STAGGER, plates[index]().opacity(1, IN, easeOutCubic)),
      ),
    );
  }

  function* light(index: number): ThreadGenerator {
    yield* active(index, active() < 0 ? TONE : WALK, easeInOutCubic);
  }

  function* seam(): ThreadGenerator {
    yield* all(
      seamLine().opacity(1, 0.2),
      seamLine().end(1, TONE, easeOutCubic),
    );
  }

  function* swap(text: string): ThreadGenerator {
    if (protocol().opacity() < 1) {
      protocolText().text(text);
      yield* protocol().opacity(1, SWAP.in, easeOutCubic);
      return;
    }
    yield* protocolText().opacity(0, SWAP.out);
    protocolText().text(text);
    yield* protocolText().opacity(1, SWAP.in, easeOutCubic);
  }

  function* shakeLower(): ThreadGenerator {
    for (const offset of [SHAKE.amount, -SHAKE.amount, SHAKE.amount * 0.6, 0]) {
      yield* lower().x(offset, SHAKE.beat, easeInOutCubic);
    }
  }

  function* flashLayers(): ThreadGenerator {
    yield* layers().opacity(0.85, 0.25, easeOutCubic);
    yield* waitFor(0.9);
    yield* layers().opacity(0, 0.45, easeInOutCubic);
  }

  return {node, appear, light, seam, swap, shakeLower, flashLayers};
}
