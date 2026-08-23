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
import {SLOT} from './jobs';

// Та же пятиэтажка, что и в `[04_02]`, но здесь она — единственный объект всей части.
// Правый слот каждой плиты последовательно держит три разных содержания: что этаж делает →
// сколько от этого полезной работы → одно общее слово «ДОСТАВКА». Слот не меняет габарит,
// поэтому композиция остаётся центрированной на всех трёх состояниях.
const PLATE = {width: 800, height: 138, radius: 14, gap: 22} as const;

/** Сверху вниз — та же пятиэтажка, что и во всей серии. */
const LAYERS = ['ПРИКЛАДНОЙ', 'ТРАНСПОРТНЫЙ', 'СЕТЕВОЙ', 'КАНАЛЬНЫЙ', 'ФИЗИЧЕСКИЙ'] as const;
const COUNT = LAYERS.length;
const STEP = PLATE.height + PLATE.gap;
const TOP_Y = -((COUNT - 1) / 2) * STEP;

const NAME_X = -PLATE.width / 2 + 32;
// Вторая колонка начинается там, где кончается самое длинное имя («ТРАНСПОРТНЫЙ», 211
// единиц от левого края плиты), и не доезжает до слота — оба чипа делят одно место.
const VITAL_X = -34;
const SLOT_X = PLATE.width / 2 - SLOT.width / 2 - 30;

const IN = 0.7;
const STAGGER = 0.1;
const TONE = 0.45;
const SWAP = {out: 0.28, in: 0.38} as const;

/** Индексы нижних этажей — всё, что не прикладной. */
const LOWER = range(COUNT).slice(1);

export interface FloorStack extends Widget {
  /** «Все уровни ниже прикладного» — верхний отступает, разговор идёт про остальные. */
  focusLower(): ThreadGenerator;
  /** Этаж загорается, и в его слоте заводится схема того, что он делает. */
  wake(index: number): ThreadGenerator;
  /** «Каждый из них сам по себе незаменим». */
  vital(): ThreadGenerator;
  /** «И ни один не делает ничего полезного» — слот показывает ноль. */
  zeroWork(): ThreadGenerator;
  /** «Всё, что они делают, — транспортируют данные». */
  oneJob(): ThreadGenerator;
  /** «Полезная работа начинается именно тут». */
  lightTop(): ThreadGenerator;
  /** «Этот уровень полностью принадлежит тебе» — низ уходит в серое. */
  ownership(): ThreadGenerator;
  /** «Какие сообщения, как и кому доходят» — три слова в слоте верхней плиты. */
  limits(): ThreadGenerator;
  /** «По ту сторону — только выбор транспорта»: у транспортного остаётся один живой контрол. */
  otherSide(): ThreadGenerator;
  /** «Не пользуешься готовыми чужими решениями» — штамп на четырёх нижних. */
  readOnly(): ThreadGenerator;
  /** «А можешь создавать свои» — пустое поле с мигающим курсором. */
  createOwn(): ThreadGenerator;
  /** Мигание курсора — форкать через `yield` после {@link createOwn}. */
  blink(): ThreadGenerator;
  /** Мировая координата центра плиты — по ней сцена целится иконками. */
  plateY(index: number): number;
  /** Центр правого слота — сцена сажает туда иконки. */
  readonly slotX: number;
}

export interface FloorStackOptions {
  /** Схемы работы для этажей 1…4 в том же порядке, что и {@link LAYERS}. */
  jobs: Node[];
}

/** Пять этажей: верхний — прикладной, четыре нижних — вся машинерия доставки. */
export function floorStack({jobs}: FloorStackOptions): FloorStack {
  const group = createRef<Node>();
  const plates = range(COUNT).map(() => createRef<Rect>());
  const jobSlots = range(COUNT).map(() => createRef<Node>());
  const zeroSlots = range(COUNT).map(() => createRef<Node>());
  const deliverySlots = range(COUNT).map(() => createRef<Txt>());
  const vitalChips = range(COUNT).map(() => createRef<Rect>());
  const locks = range(COUNT).map(() => createRef<Rect>());
  const limitWords = range(3).map(() => createRef<Txt>());
  const transportPick = createRef<Node>();
  const ownField = createRef<Node>();
  const caret = createRef<Rect>();

  // Один сигнал на этаж: 0 — спит, 1 — горит своим делом.
  const awake = range(COUNT).map(() => createSignal(0));
  // Серость нижних этажей на бите про владение.
  const grey = createSignal(0);
  const topHot = createSignal(0);

  const accent = colors.cyan;
  const plateY = (index: number) => TOP_Y + index * STEP;

  const nameFill = (index: number) => () => {
    if (index === 0) return withAlpha(colors.text, 0.5 + topHot() * 0.5);
    return withAlpha(colors.text, (0.4 + awake[index]() * 0.5) * (1 - grey() * 0.55));
  };

  const plateStroke = (index: number) => () => {
    if (index === 0) return withAlpha(accent, 0.4 + topHot() * 0.55);
    const lit = 0.35 + awake[index]() * 0.45;
    return withAlpha(grey() > 0.5 ? colors.border : accent, lit * (1 - grey() * 0.4));
  };

  const node = (
    <Node ref={group}>
      {range(COUNT).map(index => (
        <Rect
          ref={plates[index]}
          y={plateY(index)}
          width={PLATE.width}
          height={PLATE.height}
          radius={PLATE.radius}
          fill={colors.track}
          stroke={plateStroke(index)}
          lineWidth={index === 0 ? 2 : 1.5}
          shadowColor={withAlpha(accent, 0.5)}
          shadowBlur={() => (index === 0 ? topHot() * 30 : awake[index]() * 14)}
          opacity={0}
        >
          <Txt
            x={NAME_X}
            offsetX={-1}
            text={LAYERS[index]}
            fill={nameFill(index)}
            fontSize={27}
            fontFamily={fonts.mono}
            fontWeight={500}
            letterSpacing={1.4}
          />

          {/* «Незаменим» и «полезной работы 0» стоят на одной строке — в этом вся шутка. */}
          <Rect
            ref={vitalChips[index]}
            x={VITAL_X}
            radius={999}
            padding={[8, 16]}
            layout
            fill={withAlpha(colors.green, 0.12)}
            stroke={withAlpha(colors.green, 0.7)}
            lineWidth={1.3}
            opacity={0}
          >
            <Txt text="НЕЗАМЕНИМ" fill={colors.green} fontSize={15} fontFamily={fonts.mono}
              fontWeight={500} letterSpacing={1.1}/>
          </Rect>

          {/* Тот же слот, что и у «НЕЗАМЕНИМ»: строка читается как «было → стало». */}
          <Rect
            ref={locks[index]}
            x={VITAL_X}
            radius={999}
            padding={[8, 16]}
            layout
            fill={withAlpha(colors.textMuted, 0.1)}
            stroke={withAlpha(colors.textMuted, 0.6)}
            lineWidth={1.3}
            opacity={0}
          >
            <Txt text="ЧУЖОЕ · ГОТОВОЕ" fill={colors.textMuted} fontSize={15}
              fontFamily={fonts.mono} fontWeight={500} letterSpacing={1.1}/>
          </Rect>

          {/* Три содержания одного слота, по очереди. */}
          <Node ref={jobSlots[index]} x={SLOT_X} opacity={0}>
            {index > 0 ? jobs[index - 1] : <Node/>}
          </Node>
          <Node ref={zeroSlots[index]} x={SLOT_X} opacity={0}>
            <Txt text="ПОЛЕЗНОЙ РАБОТЫ" fill={colors.textMuted} fontSize={16}
              fontFamily={fonts.mono} letterSpacing={1.2} y={-20}/>
            <Txt text="0" fill={colors.orange} fontSize={46} fontFamily={fonts.mono}
              fontWeight={600} y={16}/>
          </Node>
          <Txt ref={deliverySlots[index]} x={SLOT_X} text="ДОСТАВКА" fill={colors.textDim}
            fontSize={26} fontFamily={fonts.mono} fontWeight={500} letterSpacing={2}
            opacity={0}/>

          {/* Единственное, что остаётся живым по ту сторону границы владения. */}
          {index === 1 && (
            <Node ref={transportPick} x={SLOT_X} opacity={0}>
              <Txt text="TCP · UDP · QUIC" fill={colors.textDim} fontSize={22}
                fontFamily={fonts.mono} fontWeight={500} letterSpacing={1.6} y={-16}/>
              <Txt text="ВЫБОР ТРАНСПОРТА" fill={colors.textMuted} fontSize={14}
                fontFamily={fonts.mono} letterSpacing={1.2} y={18}/>
            </Node>
          )}

          {/* Верхний этаж: сначала что тебе можно, потом пустое поле под своё. */}
          {index === 0 && (
            <Node x={SLOT_X}>
              {['КАКИЕ', 'КАК', 'КОМУ'].map((word, wordIndex) => (
                <Txt
                  ref={limitWords[wordIndex]}
                  x={(wordIndex - 1) * 108}
                  text={word}
                  fill={colors.text}
                  fontSize={22}
                  fontFamily={fonts.mono}
                  fontWeight={500}
                  letterSpacing={1.4}
                  opacity={0}
                />
              ))}
              <Node ref={ownField} opacity={0}>
                <Txt y={-28} text="СВОЙ ПРОТОКОЛ" fill={colors.textMuted} fontSize={14}
                  fontFamily={fonts.mono} letterSpacing={1.2}/>
                <Rect y={12} width={250} height={46} radius={8}
                  stroke={withAlpha(accent, 0.6)} lineWidth={1.5} lineDash={[8, 7]}>
                  <Rect ref={caret} x={-100} width={3} height={24} fill={accent}/>
                </Rect>
              </Node>
            </Node>
          )}
        </Rect>
      ))}

    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* all(
      ...range(COUNT).map(index =>
        delay((COUNT - 1 - index) * STAGGER, plates[index]().opacity(1, IN, easeOutCubic)),
      ),
    );
  }

  function* focusLower(): ThreadGenerator {
    yield* plates[0]().opacity(0.35, 0.6, easeInOutCubic);
  }

  function* wake(index: number): ThreadGenerator {
    yield* all(
      awake[index](1, TONE, easeOutCubic),
      jobSlots[index]().opacity(1, TONE, easeOutCubic),
    );
  }

  function* vital(): ThreadGenerator {
    yield* all(
      ...LOWER.map(index =>
        delay((COUNT - 1 - index) * 0.1, vitalChips[index]().opacity(1, 0.4, easeOutCubic)),
      ),
    );
  }

  /** Схема работы уступает место счёту этой работы — в том же слоте, без сдвигов. */
  function* zeroWork(): ThreadGenerator {
    yield* all(...LOWER.map(index => jobSlots[index]().opacity(0, SWAP.out)));
    yield* all(
      ...LOWER.map(index =>
        delay((COUNT - 1 - index) * 0.12, zeroSlots[index]().opacity(1, SWAP.in, easeOutCubic)),
      ),
    );
  }

  function* oneJob(): ThreadGenerator {
    yield* all(...LOWER.map(index => zeroSlots[index]().opacity(0, SWAP.out)));
    yield* all(
      ...LOWER.map(index => deliverySlots[index]().opacity(1, SWAP.in, easeOutCubic)),
    );
  }

  function* lightTop(): ThreadGenerator {
    yield* all(
      plates[0]().opacity(1, 0.5, easeOutCubic),
      topHot(1, 0.6, easeOutCubic),
    );
  }

  function* ownership(): ThreadGenerator {
    yield* all(
      grey(1, 0.7, easeInOutCubic),
      ...LOWER.map(index => vitalChips[index]().opacity(0, 0.4)),
    );
  }

  function* limits(): ThreadGenerator {
    yield* all(
      ...limitWords.map((word, index) =>
        delay(index * 0.45, word().opacity(1, 0.35, easeOutCubic)),
      ),
    );
  }

  /** Три нижних этажа гасят своё слово, транспортный получает единственный контрол. */
  function* otherSide(): ThreadGenerator {
    yield* all(
      ...LOWER.filter(index => index !== 1)
        .map(index => deliverySlots[index]().opacity(0.25, 0.4, easeInOutCubic)),
      deliverySlots[1]().opacity(0, SWAP.out),
    );
    yield* transportPick().opacity(1, SWAP.in, easeOutCubic);
  }

  function* readOnly(): ThreadGenerator {
    yield* all(
      ...LOWER.map(index =>
        delay((index - 1) * 0.1, locks[index]().opacity(1, 0.4, easeOutCubic)),
      ),
    );
  }

  function* createOwn(): ThreadGenerator {
    yield* all(
      ...limitWords.map(word => word().opacity(0, SWAP.out)),
    );
    yield* ownField().opacity(1, SWAP.in, easeOutCubic);
  }

  /** Курсор мигает бесконечно — «сюда можно печатать своё». */
  function* blink(): ThreadGenerator {
    while (true) {
      yield* caret().opacity(0, 0.01);
      yield* caret().opacity(0, 0.45);
      yield* caret().opacity(1, 0.01);
      yield* caret().opacity(1, 0.45);
    }
  }

  return {
    node,
    appear,
    focusLower,
    wake,
    vital,
    zeroWork,
    oneJob,
    lightTop,
    ownership,
    limits,
    otherSide,
    readOnly,
    createOwn,
    blink,
    plateY,
    slotX: SLOT_X,
  };
}
