import {Circle, Line, Node, Rect, Txt} from '@motion-canvas/2d';
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

// Итог держит один объект: та же пятиэтажка, что прошла через всё видео. Каждый бит части
// навешивает на неё свою пометку — дверь, импульс лифта, машинерию за дверью, расщепление
// верхнего этажа на три уровня OSI, — поэтому 24 бита за 72 секунды не рассыпаются.
export const PLATE = {width: 340, height: 88, radius: 12} as const;
export const GAP = 16;
export const STEP = PLATE.height + GAP;

const LAYERS = ['ПРИКЛАДНОЙ', 'ТРАНСПОРТНЫЙ', 'СЕТЕВОЙ', 'КАНАЛЬНЫЙ', 'ФИЗИЧЕСКИЙ'] as const;
const COUNT = LAYERS.length;

/** Три уровня OSI, которые прикладной закрывает на себе. */
const OSI = ['ПРИКЛАДНОЙ', 'ПРЕДСТАВЛЕНИЯ', 'СЕАНСОВЫЙ'] as const;

export const plateY = (index: number) => (index - (COUNT - 1) / 2) * STEP;
/** Стык прикладного и транспортного — тут и дверь. */
export const SEAM_Y = plateY(0) + PLATE.height / 2 + GAP / 2;
export const STACK_TOP = plateY(0) - PLATE.height / 2;
export const STACK_BOTTOM = plateY(COUNT - 1) + PLATE.height / 2;

const DOOR_W = 96;
const JAMB = 18;
const STUB = 56; // намёк на собеседника справа от верхней плиты

const IN = 0.6;
const STAGGER = 0.07;
const TONE = 0.45;
const SWAP = {out: 0.22, in: 0.32} as const;

export interface RecapStack extends Widget {
  /** Пунктирный обрубок вправо: у этого этажа есть собеседник. */
  peerStub(): ThreadGenerator;
  /** Импульс проезжает лифтом вниз и обратно вверх. */
  pulse(): ThreadGenerator;
  /** Проём в нижней кромке верхней плиты. */
  openDoor(): ThreadGenerator;
  /** Яркость этажа. */
  light(index: number, level: number): ThreadGenerator;
  /** Всё, что ниже двери, притухает разом. */
  dimBelow(): ThreadGenerator;
  /** У двери появляется имя. */
  nameDoor(text: string): ThreadGenerator;
  /** За дверью, в транспортной плите, проступает машинерия. */
  machinery(): ThreadGenerator;
  /** Бесконечное шевеление машинерии — форкать через `yield`. */
  gears(): ThreadGenerator;
  /** Над дверью — то, что абстракция не прячет. */
  guarantee(): ThreadGenerator;
  /** Убрать пометки сокета: дальше верхнюю плиту занимают три уровня OSI. */
  clearMarks(): ThreadGenerator;
  /** Верхняя плита расщепляется на три уровня OSI. */
  split(): ThreadGenerator;
  /** …и снова сливается в один. */
  merge(): ThreadGenerator;
  dismiss(): ThreadGenerator;
}

export interface RecapStackOptions {
  x: number;
  /** Собеседник справа: та же стопка, только приглушённая и без пометок. */
  ghost?: boolean;
}

export function recapStack({x, ghost = false}: RecapStackOptions): RecapStack {
  const group = createRef<Node>();
  const plates = range(COUNT).map(() => createRef<Rect>());
  const titles = range(COUNT).map(() => createRef<Txt>());
  const stub = createRef<Line>();
  const rider = createRef<Circle>();
  const namePill = createRef<Rect>();
  const nameText = createRef<Txt>();
  const gearBox = createRef<Node>();
  const guard = createRef<Rect>();
  const osiGroup = createRef<Node>();

  const accent = colors.cyan;
  const half = PLATE.width / 2;
  const bottomEdge = plateY(0) + PLATE.height / 2;

  const glow = range(COUNT).map(() => createSignal(ghost ? 0.15 : 0.5));
  const door = createSignal(0);
  const ride = createSignal(-1); // -1 — вне кадра, 0…1 вниз, 1…2 вверх
  const beat = createSignal(0);
  const scroll = createSignal(0);
  const osi = createSignal(0); // 0 — один этаж, 1 — три

  const jambX = () => (door() * DOOR_W) / 2;
  const edgeTone = () => withAlpha(accent, 0.3 + glow[0]() * 0.6);

  const riderY = () => {
    const p = ride();
    const span = STACK_BOTTOM - STACK_TOP - 30;
    return p <= 1
      ? STACK_TOP + 15 + span * p
      : STACK_BOTTOM - 15 - span * (p - 1);
  };

  const node = (
    <Node ref={group} x={x} opacity={0}>
      {range(COUNT).map(index => (
        <Rect ref={plates[index]} y={plateY(index)} width={PLATE.width} height={PLATE.height}
          radius={PLATE.radius} fill={colors.track}
          stroke={() => withAlpha(accent, 0.25 + glow[index]() * 0.55)} lineWidth={1.5}
          shadowColor={withAlpha(accent, 0.5)} shadowBlur={() => glow[index]() * 20}
          opacity={0} clip>
          <Txt ref={titles[index]} x={-half + 24} offsetX={-1} text={LAYERS[index]}
            fill={() => withAlpha(colors.text, 0.35 + glow[index]() * 0.6)} fontSize={19}
            fontFamily={fonts.mono} fontWeight={500} letterSpacing={1.3}
            opacity={() => (index === 0 ? 1 - osi() : 1)}/>

          {index === 0 && (
            // Три уровня OSI живут внутри той же плиты: прикладной их не надстраивает,
            // он их собой закрывает.
            <Node ref={osiGroup} opacity={() => osi()}>
              {range(OSI.length).map(step => (
                <Txt x={-half + 24} offsetX={-1} y={(step - 1) * 27} text={OSI[step]}
                  fill={withAlpha(colors.text, 0.9)} fontSize={15} fontFamily={fonts.mono}
                  fontWeight={500} letterSpacing={1.1}/>
              ))}
              {[-1, 1].map(side => (
                <Line points={[[-half + 14, side * 13.5], [half - 14, side * 13.5]]}
                  stroke={withAlpha(accent, 0.5)} lineWidth={1.2}/>
              ))}
            </Node>
          )}

          {index === 1 && (
            // «Прячет, как транспорт работает» — то, что за дверью, продолжает шевелиться.
            <Node ref={gearBox} x={half - 130} y={16} opacity={0}>
              <Rect y={-14} width={180} height={20} radius={5}
                stroke={withAlpha(colors.green, 0.7)} lineWidth={1.3}>
                <Rect x={() => -90 + 44 * beat()} width={() => 60 + 44 * beat()} height={15}
                  radius={4} fill={withAlpha(colors.green, 0.42)} offsetX={-1}/>
              </Rect>
              <Line y={16}
                points={() => range(16).map(step => [
                  -90 + step * 12,
                  10 - ((step * 7 + scroll() * 24) % 24),
                ])}
                stroke={withAlpha(colors.orange, 0.7)} lineWidth={1.5}/>
            </Node>
          )}
        </Rect>
      ))}

      {/* Нижняя кромка верхней плиты — два отрезка, между ними растёт дверь. */}
      {!ghost && (
        <Node>
          <Line points={() => [[-half + 8, bottomEdge], [-jambX(), bottomEdge]] as [number, number][]}
            stroke={edgeTone} lineWidth={2.4}/>
          <Line points={() => [[jambX(), bottomEdge], [half - 8, bottomEdge]] as [number, number][]}
            stroke={edgeTone} lineWidth={2.4}/>
          {[-1, 1].map(side => (
            <Line
              points={() => [[side * jambX(), bottomEdge], [side * jambX(), bottomEdge - JAMB]] as [number, number][]}
              stroke={edgeTone} lineWidth={2} opacity={() => door()}/>
          ))}

          <Line ref={stub} points={[[half, plateY(0)], [half + STUB, plateY(0)]]}
            stroke={withAlpha(accent, 0.45)} lineWidth={1.6} lineDash={[7, 7]} end={0}/>

          <Circle ref={rider} width={14} height={14} fill={accent}
            shadowColor={withAlpha(accent, 0.85)} shadowBlur={14}
            x={-half + 46} y={riderY} opacity={() => (ride() < 0 ? 0 : 1)}/>

          {/* У двери две пометки, и обе живут в зазоре: имя и то, что она не прячет. */}
          <Rect ref={guard} x={-68} y={SEAM_Y} radius={999} padding={[5, 14]} layout
            fill={withAlpha(colors.orange, 0.14)} stroke={withAlpha(colors.orange, 0.8)}
            lineWidth={1.2} opacity={0}>
            <Txt text="ПОТОК ИЛИ СООБЩЕНИЯ" fill={colors.orange} fontSize={13}
              fontFamily={fonts.mono} fontWeight={600} letterSpacing={1}/>
          </Rect>

          <Rect ref={namePill} x={110} y={SEAM_Y} radius={999} padding={[6, 16]} layout
            fill={colors.surface} stroke={withAlpha(colors.orange, 0.85)} lineWidth={1.5}
            opacity={0}>
            <Txt ref={nameText} text="" fill={colors.orange} fontSize={16}
              fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.4}/>
          </Rect>
        </Node>
      )}
    </Node>
  );

  function* appear(): ThreadGenerator {
    group().opacity(1);
    yield* all(
      ...plates.map((item, index) =>
        delay(index * STAGGER, item().opacity(ghost ? 0.5 : 1, IN, easeOutCubic))),
    );
  }

  function* peerStub(): ThreadGenerator {
    yield* stub().end(1, 0.5, easeOutCubic);
  }

  function* pulse(): ThreadGenerator {
    ride(0);
    yield* ride(1, 0.8, easeInOutCubic);
    yield* waitFor(0.15);
    yield* ride(2, 0.8, easeInOutCubic);
    ride(-1);
  }

  function* openDoor(): ThreadGenerator {
    yield* door(1, 0.7, easeInOutCubic);
  }

  function* light(index: number, level: number): ThreadGenerator {
    yield* glow[index](level, TONE, easeInOutCubic);
  }

  function* dimBelow(): ThreadGenerator {
    yield* all(...range(COUNT).slice(1).map(index => glow[index](0.14, 0.6, easeInOutCubic)));
  }

  function* nameDoor(text: string): ThreadGenerator {
    nameText().text(text);
    namePill().scale(0.8);
    yield* all(
      namePill().opacity(1, TONE, easeOutCubic),
      namePill().scale(1, TONE, easeOutCubic),
    );
  }

  function* machinery(): ThreadGenerator {
    yield* all(
      gearBox().opacity(0.9, TONE, easeOutCubic),
      glow[1](0.45, TONE, easeInOutCubic),
    );
  }

  function* gears(): ThreadGenerator {
    yield* all(
      (function* () {
        while (true) {
          yield* beat(1, 1.2, easeInOutSine);
          yield* beat(0, 1.2, easeInOutSine);
        }
      })(),
      (function* () {
        while (true) {
          scroll(0);
          yield* scroll(1, 2, linear);
        }
      })(),
    );
  }

  function* guarantee(): ThreadGenerator {
    yield* guard().opacity(1, TONE, easeOutCubic);
  }

  function* clearMarks(): ThreadGenerator {
    yield* all(
      guard().opacity(0, 0.4, easeInOutCubic),
      namePill().opacity(0, 0.4, easeInOutCubic),
    );
  }

  function* split(): ThreadGenerator {
    yield* osi(1, 0.8, easeInOutCubic);
  }

  function* merge(): ThreadGenerator {
    yield* osi(0, 0.7, easeInOutCubic);
  }

  function* dismiss(): ThreadGenerator {
    yield* group().opacity(0, SWAP.out * 2.5, easeInOutCubic);
  }

  return {
    node, appear, peerStub, pulse, openDoor, light, dimBelow, nameDoor, machinery, gears,
    guarantee, clearMarks, split, merge, dismiss,
  };
}
