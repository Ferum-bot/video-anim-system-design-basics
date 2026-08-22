import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  delay,
  easeInOutCubic,
  easeOutCubic,
  range,
} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// Зерно лестницы, которую следующая часть развернёт целиком. Все пять этажей подписаны
// сразу: имена зритель уже знает из первых двух видео, и без них нижние плиты читаются
// как незаполненные заготовки. Часть 3 на `01:55` добавит к именам не название, а работу —
// «физический двигает биты, канальный чинит кадры…». Арка здесь другая: четыре безликих
// этажа → это были два предыдущих видео → это транспорт и гарантии; одна и та же скобка
// получает две подписи подряд.
const PLATE = {width: 700, height: 100, radius: 12, gap: 20} as const;

/** Сверху вниз — та же пятиэтажка, что и во всей серии. */
const LAYERS = ['ПРИКЛАДНОЙ', 'ТРАНСПОРТНЫЙ', 'СЕТЕВОЙ', 'КАНАЛЬНЫЙ', 'ФИЗИЧЕСКИЙ'] as const;
const COUNT = LAYERS.length;
const STEP = PLATE.height + PLATE.gap;

// Стопка центрирована сама по себе; подпись под ней появляется позже, поэтому под неё
// не резервируется место — стопка поднимается ей навстречу (см. `explain`).
const TOP_Y = -((COUNT - 1) / 2) * STEP;

const BRACKET = {x: -(PLATE.width / 2 + 26), arm: 22, lineWidth: 2.2} as const;
const LABEL_GAP = 44;
const LIFT = 28; // ровно половина того, что добавляет подпись, — чтобы кадр остался по центру
// Скобка висит слева и тянет композицию за собой: сдвигаем стопку на половину её выноса,
// иначе кадр уезжает влево ровно на 26 единиц.
const SHIFT_X = 13;

const IN = 0.75;
const STAGGER = 0.12;
const TONE = 0.5;
const MOVE = 0.6;
const RELABEL = {out: 0.25, in: 0.35} as const;

export interface LayerStack extends Widget {
  /** «Первый и единственный уровень» — верхняя плита получает имя и свет. */
  lightTop(): ThreadGenerator;
  /** «Всё, что мы разбирали до этого» — скобка на четыре нижние плиты плюс подпись. */
  explain(text: string): ThreadGenerator;
  /** Та же скобка, следующий смысл. */
  relabel(text: string): ThreadGenerator;
}

/** Пять плит: верхняя — прикладной уровень, четыре нижние — всё, что было до него. */
export function layerStack(): LayerStack {
  const group = createRef<Node>();
  const plates = range(COUNT).map(() => createRef<Rect>());
  const badge = createRef<Rect>();
  const bracket = createRef<Line>();
  const label = createRef<Txt>();
  const hot = createSignal(0); // 0 → 1 поднимает верхнюю плиту над остальными

  const accent = colors.cyan;
  const plateY = (index: number) => TOP_Y + index * STEP;

  // Скобку держим погашенной, а не только `end={0}`: скруглённый колпачок рисует точку
  // даже на нулевой длине, и она весь первый бит висит в кадре.
  const bracketTop = plateY(1) - PLATE.height / 2;
  const bracketBottom = plateY(COUNT - 1) + PLATE.height / 2;

  const node = (
    <Node ref={group}>
      <Line
        ref={bracket}
        points={[
          [BRACKET.x + BRACKET.arm, bracketTop],
          [BRACKET.x, bracketTop],
          [BRACKET.x, bracketBottom],
          [BRACKET.x + BRACKET.arm, bracketBottom],
        ]}
        stroke={withAlpha(accent, 0.6)}
        lineWidth={BRACKET.lineWidth}
        lineCap="round"
        end={0}
        opacity={0}
      />

      {/* Каждый этаж — плита со своим именем слева; бейдж справа получает только верхний. */}
      {range(COUNT).map(index => (
        <Rect
          ref={plates[index]}
          y={plateY(index)}
          width={PLATE.width}
          height={PLATE.height}
          radius={PLATE.radius}
          fill={colors.track}
          stroke={() =>
            withAlpha(index === 0 ? accent : colors.borderStrong, index === 0 ? 0.4 + hot() * 0.5 : 0.5)}
          lineWidth={index === 0 ? 2 : 1.4}
          shadowColor={withAlpha(accent, 0.5)}
          shadowBlur={() => (index === 0 ? hot() * 30 : 0)}
          opacity={0}
        >
          <Txt
            x={-PLATE.width / 2 + 34}
            textAlign="left"
            offsetX={-1}
            text={LAYERS[index]}
            fill={index === 0
              ? () => withAlpha(colors.text, 0.5 + hot() * 0.5)
              : colors.textMuted}
            fontSize={25}
            fontFamily={fonts.mono}
            fontWeight={500}
            letterSpacing={1.4}
          />
        </Rect>
      ))}

      <Node y={plateY(0)}>
        <Rect
          ref={badge}
          x={PLATE.width / 2 - 34}
          offsetX={1}
          radius={999}
          padding={[10, 20]}
          layout
          fill={withAlpha(accent, 0.14)}
          stroke={withAlpha(accent, 0.7)}
          lineWidth={1.4}
          opacity={0}
        >
          <Txt text="ПОЛЕЗНАЯ РАБОТА" fill={accent} fontSize={16} fontFamily={fonts.mono}
            fontWeight={500} letterSpacing={1.2}/>
        </Rect>
      </Node>

      <Txt
        ref={label}
        y={bracketBottom + LABEL_GAP}
        text=""
        fill={colors.textDim}
        fontSize={21}
        fontFamily={fonts.mono}
        letterSpacing={1.3}
        opacity={0}
      />
    </Node>
  );

  /** Плиты проступают снизу вверх — стек собирается под верхним этажом. */
  function* appear(): ThreadGenerator {
    yield* all(
      ...range(COUNT).map(index =>
        delay((COUNT - 1 - index) * STAGGER, plates[index]().opacity(1, IN, easeOutCubic)),
      ),
    );
  }

  function* lightTop(): ThreadGenerator {
    yield* all(
      hot(1, TONE, easeOutCubic),
      delay(0.25, badge().opacity(1, TONE, easeOutCubic)),
    );
  }

  function* explain(text: string): ThreadGenerator {
    label().text(text);
    yield* all(
      group().y(-LIFT, MOVE, easeInOutCubic),
      group().x(SHIFT_X, MOVE, easeInOutCubic),
      bracket().opacity(1, 0.15),
      bracket().end(1, MOVE, easeOutCubic),
      delay(0.25, label().opacity(1, TONE, easeOutCubic)),
    );
  }

  function* relabel(text: string): ThreadGenerator {
    yield* label().opacity(0, RELABEL.out);
    label().text(text);
    yield* label().opacity(1, RELABEL.in, easeOutCubic);
  }

  return {node, appear, lightTop, explain, relabel};
}
