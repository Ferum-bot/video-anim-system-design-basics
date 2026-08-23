import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  delay,
  easeInOutCubic,
  easeInOutSine,
  easeOutCubic,
  linear,
  range,
  waitFor,
} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// Четыре нижних этажа, которые перестают быть этажами. На «всё, что ниже — территория ядра»
// они сливаются в одну плиту и та растягивается на весь кадр: снизу нет лестницы, снизу
// чужая земля. В третьем движении та же плита **схлопывается в трубу** — это не другая
// картинка, а тот же прямоугольник с другими габаритами.
const FLOORS = ['ТРАНСПОРТНЫЙ', 'СЕТЕВОЙ', 'КАНАЛЬНЫЙ', 'ФИЗИЧЕСКИЙ'] as const;

const SLAB_NARROW = 300;
const SLAB_WIDE = 860;
const PIPE = {width: 760, height: 230, y: 35} as const;

const BOX = {count: 7, width: 68, height: 42, gap: 28} as const;
// Имена этажей никуда не делись — они просто перестали быть твоими. Тот же приём, что у
// стены ядра в `[04_09]`: одна муторная строка по низу плиты.
const STRATA = 'ТРАНСПОРТНЫЙ · СЕТЕВОЙ · КАНАЛЬНЫЙ · ФИЗИЧЕСКИЙ';

const IN = 0.7;
const STAGGER = 0.08;
const TONE = 0.45;
const FUSE = 0.55;
const SPREAD = 1.0;
const COLLAPSE = 1.3;

export interface Territory extends Widget {
  /** Этажи сливаются в одну плиту и та занимает весь кадр. */
  fuse(): ThreadGenerator;
  /** Подпись на плите. */
  label(text: string): ThreadGenerator;
  /** Чужое железо на пути — по нему и поедет конверт. */
  infra(): ThreadGenerator;
  /** Верхняя кромка плиты становится границей владения. */
  boundary(text: string): ThreadGenerator;
  /** Единственный живой контрол по ту сторону. */
  control(): ThreadGenerator;
  /** Плита схлопывается в байтовый канал. */
  collapse(): ThreadGenerator;
  /** Канал на полторы секунды становится прозрачным. */
  xray(): ThreadGenerator;
  /** Машинерия за стеклом — форкать через `yield`. */
  machinery(): ThreadGenerator;
}

export interface TerritoryOptions {
  /** Центры четырёх плит. */
  floorY: number[];
  plateWidth: number;
  plateHeight: number;
  radius: number;
  /** Габарит плиты, пока она ещё «четыре этажа». */
  slabY: number;
  slabHeight: number;
  /** Уровень провода, по которому идёт конверт (абсолютный Y). */
  wireY: number;
}

export function territory(options: TerritoryOptions): Territory {
  const {floorY, plateWidth, plateHeight, radius, slabY, slabHeight, wireY} = options;

  const group = createRef<Node>();
  const plates = range(FLOORS.length).map(() => createRef<Rect>());
  const slab = createRef<Rect>();
  const slabText = createRef<Txt>();
  const boundLine = createRef<Line>();
  const boundText = createRef<Txt>();
  const controlChip = createRef<Rect>();
  const boxes = createRef<Node>();
  const strata = createRef<Txt>();
  const gears = createRef<Node>();
  const pipeText = createRef<Txt>();

  const accent = colors.cyan;
  const w = createSignal<number>(SLAB_NARROW);
  const h = createSignal(slabHeight);
  const cy = createSignal(slabY);
  const beat = createSignal(0);
  const scroll = createSignal(0);

  // Провод и подпись живут в долях плиты, поэтому переживают и растягивание, и схлопывание.
  const wireLocal = wireY - slabY;
  const boxX = (index: number) =>
    (index - (BOX.count - 1) / 2) * (BOX.width + BOX.gap);

  const node = (
    <Node ref={group}>
      {range(FLOORS.length).map(index => (
        <Rect ref={plates[index]} y={floorY[index]} width={plateWidth} height={plateHeight}
          radius={radius} fill={colors.track} stroke={withAlpha(colors.border, 0.9)}
          lineWidth={1.4} opacity={0}>
          <Txt text={FLOORS[index]} fill={withAlpha(colors.text, 0.55)} fontSize={19}
            fontFamily={fonts.mono} letterSpacing={1.2}/>
        </Rect>
      ))}

      <Rect ref={slab} y={cy} width={w} height={h} radius={radius}
        fill={colors.track} stroke={withAlpha(colors.border, 0.9)} lineWidth={1.4}
        opacity={0} clip>
        <Txt ref={slabText} y={() => -h() / 2 + 34} text="" fill={colors.textMuted}
          fontSize={17} fontFamily={fonts.mono} letterSpacing={1.5} opacity={0}/>

        {/* Единственное, что ты выбираешь по ту сторону. */}
        <Rect ref={controlChip} y={() => -h() / 2 + 96} radius={999} padding={[7, 18]} layout
          fill={withAlpha(colors.orange, 0.14)} stroke={withAlpha(colors.orange, 0.85)}
          lineWidth={1.5} opacity={0}>
          <Txt text="TCP · UDP · QUIC  +  ПАРА ПАРАМЕТРОВ" fill={colors.orange} fontSize={16}
            fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.2}/>
        </Rect>

        <Txt ref={strata} y={() => h() / 2 - 40} text={STRATA}
          fill={withAlpha(colors.textMuted, 0.75)} fontSize={15} fontFamily={fonts.mono}
          letterSpacing={1.5} opacity={0}/>

        <Node ref={boxes} y={wireLocal} opacity={0}>
          <Line points={[[-SLAB_WIDE / 2, 0], [SLAB_WIDE / 2, 0]]}
            stroke={withAlpha(colors.textMuted, 0.35)} lineWidth={1.2} lineDash={[7, 8]}/>
          {range(BOX.count).map(index => (
            <Rect x={boxX(index)} width={BOX.width} height={BOX.height} radius={6}
              fill={colors.surface} stroke={withAlpha(colors.textMuted, 0.55)} lineWidth={1.2}/>
          ))}
        </Node>

        {/* Третье движение: то, что канал прячет, и матовое стекло поверх. */}
        <Node ref={gears} y={22} opacity={0}>
          <Rect y={0} width={300} height={30} radius={7}
            stroke={withAlpha(colors.green, 0.7)} lineWidth={1.5}>
            <Rect x={() => -150 + 76 * beat()} width={() => 100 + 74 * beat()} height={23}
              radius={5} fill={withAlpha(colors.green, 0.4)} offsetX={-1}/>
          </Rect>
          <Line y={44}
            points={() => range(25).map(index => [
              -168 + index * 14,
              18 - ((index * 9 + scroll() * 36) % 36),
            ])}
            stroke={withAlpha(colors.orange, 0.75)} lineWidth={1.8}/>
        </Node>

        <Txt ref={pipeText} y={() => -h() / 2 + 32} text="БАЙТОВЫЙ КАНАЛ"
          fill={withAlpha(colors.text, 0.92)} fontSize={24} fontFamily={fonts.mono}
          fontWeight={600} letterSpacing={2} opacity={0}/>
      </Rect>

      {/* Граница владения идёт по верхней кромке плиты и растёт вместе с ней. */}
      <Line ref={boundLine}
        points={() => [[-w() / 2, cy() - h() / 2], [w() / 2, cy() - h() / 2]] as [number, number][]}
        stroke={withAlpha(colors.orange, 0.9)} lineWidth={2.4} end={0} opacity={0}/>
      <Txt ref={boundText} y={() => cy() - h() / 2 - 12} text="" fill={colors.orange}
        fontSize={13} fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.5} opacity={0}/>
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* all(...plates.map((item, index) =>
      delay(index * STAGGER, item().opacity(1, IN, easeOutCubic))));
  }

  function* fuse(): ThreadGenerator {
    yield* all(
      ...plates.map(item => item().opacity(0, FUSE, easeInOutCubic)),
      slab().opacity(1, FUSE, easeOutCubic),
    );
    yield* w(SLAB_WIDE, SPREAD, easeInOutCubic);
  }

  function* label(text: string): ThreadGenerator {
    if (slabText().opacity() > 0) yield* slabText().opacity(0, 0.22);
    slabText().text(text);
    yield* slabText().opacity(1, 0.32, easeOutCubic);
  }

  function* infra(): ThreadGenerator {
    yield* all(
      boxes().opacity(1, TONE, easeOutCubic),
      delay(0.2, strata().opacity(1, TONE, easeOutCubic)),
    );
  }

  function* boundary(text: string): ThreadGenerator {
    boundText().text(text);
    yield* all(
      boundLine().opacity(1, 0.2),
      boundLine().end(1, 0.8, easeOutCubic),
      delay(0.3, boundText().opacity(1, TONE, easeOutCubic)),
    );
  }

  function* control(): ThreadGenerator {
    yield* controlChip().opacity(1, TONE, easeOutCubic);
  }

  function* collapse(): ThreadGenerator {
    yield* all(
      slabText().opacity(0, 0.4),
      controlChip().opacity(0, 0.4),
      boxes().opacity(0, 0.4),
      strata().opacity(0, 0.4),
      boundLine().opacity(0, 0.4),
      boundText().opacity(0, 0.4),
    );
    yield* all(
      w(PIPE.width, COLLAPSE, easeInOutCubic),
      h(PIPE.height, COLLAPSE, easeInOutCubic),
      cy(PIPE.y, COLLAPSE, easeInOutCubic),
      slab().stroke(withAlpha(accent, 0.7), COLLAPSE),
      delay(COLLAPSE * 0.55, pipeText().opacity(1, TONE, easeOutCubic)),
    );
  }

  function* xray(): ThreadGenerator {
    yield* gears().opacity(0.95, 0.6, easeOutCubic);
    yield* waitFor(1.5);
    yield* gears().opacity(0, 0.6, easeInOutCubic);
  }

  function* machinery(): ThreadGenerator {
    yield* all(
      (function* () {
        while (true) {
          yield* beat(1, 1.3, easeInOutSine);
          yield* beat(0, 1.3, easeInOutSine);
        }
      })(),
      (function* () {
        while (true) {
          scroll(0);
          yield* scroll(1, 2.1, linear);
        }
      })(),
    );
  }

  return {node, appear, fuse, label, infra, boundary, control, collapse, xray, machinery};
}
