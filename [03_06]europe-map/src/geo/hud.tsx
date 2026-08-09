import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, createSignal, easeInOutCubic, easeOutCubic, range} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';

// The readouts live on top of the map, in the corners geography leaves empty: the Atlantic
// top-left, North Africa bottom-left, the eastern Mediterranean bottom-right.
const CARD = {x: -424, y: -298, width: 336, height: 132, radius: 12} as const;
const REASONS_X = -424;
const REASONS_Y = 176;
const REASON_GAP = 44;
const TAIL = {x: 128, y: 174, width: 300, height: 116, radius: 12} as const;

const REASONS = [
  'договорённости провайдеров',
  'политики разных стран',
  'загруженность канала',
] as const;

// A flat run of fast requests with one spike near the end — the p99 the narration points at.
const SPARK = {samples: 44, spikeAt: 0.74, width: 250, height: 44} as const;

const IN = 0.55;
const SWAP = 0.3;

export interface Hud {
  readonly node: Node;
  /** The question card, before any number is on it. */
  ask(): ThreadGenerator;
  /** Run the route counter up. */
  count(to: number, duration: number): ThreadGenerator;
  /** The counter gives up: the number becomes a shrug. */
  giveUp(): ThreadGenerator;
  /** Swap the card body for the short-vs-chosen legend. */
  toLegend(): ThreadGenerator;
  /** Reveal one reason chip. */
  reason(index: number): ThreadGenerator;
  /** The latency strip with its single spike. */
  showTail(): ThreadGenerator;
}

/** Readouts laid over the map: the route counter, the route legend, the reasons, the p99. */
export function hud(): Hud {
  const card = createRef<Rect>();
  const cardTitle = createRef<Txt>();
  const counterBody = createRef<Node>();
  const countText = createRef<Txt>();
  const countNote = createRef<Txt>();
  const legendBody = createRef<Node>();
  const chips = REASONS.map(() => createRef<Rect>());
  const tail = createRef<Rect>();
  const spark = createRef<Line>();

  const value = createSignal(0);

  const accent = colors.cyan;
  const plate = withAlpha(colors.background, 0.82);

  const chip = (index: number, text: string) => (
    <Rect ref={chips[index]} offset={[-1, 0]} x={REASONS_X} y={REASONS_Y + index * REASON_GAP}
      layout padding={[9, 18]} radius={999} fill={plate}
      stroke={withAlpha(accent, 0.4)} lineWidth={1.5} opacity={0}>
      <Txt text={text} fill={colors.textDim} fontSize={19} fontFamily={fonts.display}/>
    </Rect>
  );

  const legendRow = (y: number, swatch: Node, text: string, tone: string) => (
    <Node y={y}>
      {swatch}
      <Txt offset={[-1, 0]} x={-96} text={text} fill={tone} fontSize={19}
        fontFamily={fonts.mono} letterSpacing={1.2}/>
    </Node>
  );

  const sparkPoints = range(SPARK.samples).map(i => {
    const t = i / (SPARK.samples - 1);
    const noise = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
    const spike = Math.exp(-(((t - SPARK.spikeAt) / 0.022) ** 2));
    const level = 0.12 + noise * 0.16 + spike * 0.95;
    return [
      -SPARK.width / 2 + t * SPARK.width,
      SPARK.height / 2 - level * SPARK.height,
    ] as [number, number];
  });

  const node = (
    <Node>
      <Rect ref={card} offset={[-1, -1]} x={CARD.x} y={CARD.y} width={CARD.width}
        height={CARD.height} radius={CARD.radius} fill={plate}
        stroke={withAlpha(accent, 0.45)} lineWidth={1.5} opacity={0}>
        <Txt ref={cardTitle} y={-CARD.height / 2 + 26} text="МОСКВА → ФРАНКФУРТ" fill={accent}
          fontSize={19} fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.3}/>

        <Node ref={counterBody} y={22}>
          <Txt ref={countText} text={() => Math.round(value()).toLocaleString('ru-RU')}
            fill={colors.text} fontSize={46} fontFamily={fonts.mono} fontWeight={600}/>
          <Txt ref={countNote} y={36} text="маршрутов" fill={colors.textMuted} fontSize={18}
            fontFamily={fonts.display}/>
        </Node>

        <Node ref={legendBody} y={20} opacity={0}>
          {legendRow(
            -18,
            <Line points={[[-140, 0], [-104, 0]]} stroke={colors.textDim} lineWidth={2.6}
              lineDash={[8, 6]}/>,
            'КРАТЧАЙШИЙ',
            colors.textDim,
          )}
          {legendRow(
            22,
            <Line points={[[-140, 0], [-104, 0]]} stroke={colors.orange} lineWidth={3.4}/>,
            'ВЫБРАННЫЙ',
            colors.orange,
          )}
        </Node>
      </Rect>

      {REASONS.map((text, index) => chip(index, text))}

      <Rect ref={tail} offset={[-1, -1]} x={TAIL.x} y={TAIL.y} width={TAIL.width}
        height={TAIL.height} radius={TAIL.radius} fill={plate}
        stroke={withAlpha(colors.orange, 0.4)} lineWidth={1.5} opacity={0}>
        <Txt y={-TAIL.height / 2 + 22} text="ЗАДЕРЖКА ЗАПРОСОВ" fill={colors.textMuted}
          fontSize={16} fontFamily={fonts.mono} letterSpacing={1.2}/>
        <Line ref={spark} y={10} points={sparkPoints} stroke={colors.orange} lineWidth={2}
          end={0}/>
        <Txt y={TAIL.height / 2 - 18} text="видно только в 99-м перцентиле"
          fill={colors.textDim} fontSize={16} fontFamily={fonts.display}/>
      </Rect>
    </Node>
  );

  function* ask(): ThreadGenerator {
    yield* card().opacity(1, IN, easeOutCubic);
  }

  function* count(to: number, duration: number): ThreadGenerator {
    yield* value(to, duration, easeInOutCubic);
  }

  function* giveUp(): ThreadGenerator {
    yield* all(countText().opacity(0, SWAP), countNote().opacity(0, SWAP));
    countText().text('?');
    countNote().text('посчитать невозможно');
    yield* all(countText().opacity(1, SWAP, easeOutCubic), countNote().opacity(1, SWAP, easeOutCubic));
  }

  function* toLegend(): ThreadGenerator {
    yield* all(counterBody().opacity(0, SWAP, easeInOutCubic), cardTitle().opacity(0, SWAP));
    cardTitle().text('ПУТЬ ПАКЕТА');
    yield* all(
      cardTitle().opacity(1, SWAP, easeOutCubic),
      legendBody().opacity(1, IN, easeOutCubic),
    );
  }

  function* reason(index: number): ThreadGenerator {
    yield* all(
      chips[index]().opacity(1, IN, easeOutCubic),
      chips[index]().x(REASONS_X + 14, IN, easeOutCubic),
    );
  }

  function* showTail(): ThreadGenerator {
    yield* tail().opacity(1, IN, easeOutCubic);
    yield* spark().end(1, 1.4, easeOutCubic);
  }

  return {node, ask, count, giveUp, toLegend, reason, showTail};
}
