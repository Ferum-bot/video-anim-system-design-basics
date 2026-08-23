import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  delay,
  easeInOutCubic,
  easeInOutSine,
  easeOutCubic,
  range,
} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// Ядро как стена под пользовательским кодом. Дверь — не картинка поверх стены, а **разрыв в
// её верхней кромке**: кромка нарисована двумя отрезками, между которыми сигнал `door`
// раздвигает проём. Поэтому «двери ещё нет» и «дверь есть» — одно и то же ребро.
export const WALL = {width: 864, height: 200, radius: 12} as const;

const DOOR_W = 120;
const JAMB = 22;

// Развилка внутри стены: одна дверь наверху, две семьи протоколов под ней.
const CAPTION_Y = -74;
const PILL_Y = -24;
const STEM_TOP = -9;
const BRANCH_Y = 14;
const FAMILY_X = 165;
const FAMILY_Y = 52;
const FAMILY = {width: 300, height: 28, radius: 999} as const;
// Пока развилки нет, тот же слот занимает то, что под ядром вообще лежит.
const LAYERS_Y = 70;
const LAYERS = 'ТРАНСПОРТНЫЙ · СЕТЕВОЙ · КАНАЛЬНЫЙ · ФИЗИЧЕСКИЙ';

const IN = 0.7;
const TONE = 0.45;
const SWAP = {out: 0.22, in: 0.3} as const;
const DOOR_TIME = 0.8;

export interface KernelWall extends Widget {
  /** Свежий стек въезжает в ядро. */
  stack(text: string): ThreadGenerator;
  /** Подменить то, что лежит снизу: сверху от этого ничего не шевелится. */
  swap(text: string): ThreadGenerator;
  /** Проём наконец прорезан — форма двери выбрана. */
  openDoor(): ThreadGenerator;
  /** Провод снаружи доведён внутрь стены, до самой развилки. */
  plug(): ThreadGenerator;
  /** Из двери вниз расходятся две семьи протоколов. */
  fork(): ThreadGenerator;
  /** Развилку называют: одна и та же дверь для обеих семей. */
  oneApi(): ThreadGenerator;
  /** Обе ветки дышат — форкать через `yield`. */
  breathe(): ThreadGenerator;
}

export interface KernelWallOptions {
  y: number;
}

/** Всё, что ниже прикладного уровня, одной плитой. */
export function kernelWall({y}: KernelWallOptions): KernelWall {
  const group = createRef<Node>();
  const chip = createRef<Rect>();
  const chipText = createRef<Txt>();
  const pill = createRef<Rect>();
  const stem = createRef<Line>();
  const strata = createRef<Txt>();
  const branches = range(2).map(() => createRef<Line>());
  const families = range(2).map(() => createRef<Rect>());

  const accent = colors.cyan;
  const edge = withAlpha(accent, 0.75);
  const door = createSignal(0); // 0 — глухая кромка, 1 — проём
  const glow = createSignal(0);

  const half = WALL.width / 2;
  const top = -WALL.height / 2;
  const jambX = () => (door() * DOOR_W) / 2;

  const branchPoints = (side: number) => () =>
    [
      [0, STEM_TOP],
      [0, BRANCH_Y],
      [side * FAMILY_X, BRANCH_Y],
      [side * FAMILY_X, FAMILY_Y - FAMILY.height / 2],
    ] as [number, number][];

  const node = (
    <Node ref={group} y={y} opacity={0}>
      <Rect width={WALL.width} height={WALL.height} radius={WALL.radius}
        fill={colors.track} stroke={withAlpha(colors.border, 0.9)} lineWidth={1.4}/>

      {/* Верхняя кромка — два отрезка, между ними растёт проём. */}
      <Line points={() => [[-half + 6, top], [-jambX(), top]] as [number, number][]}
        stroke={edge} lineWidth={2.6}/>
      <Line points={() => [[jambX(), top], [half - 6, top]] as [number, number][]}
        stroke={edge} lineWidth={2.6}/>
      {[-1, 1].map(side => (
        <Line points={() => [[side * jambX(), top], [side * jambX(), top + JAMB]] as [number, number][]}
          stroke={edge} lineWidth={2.2} opacity={() => door()}/>
      ))}

      <Txt x={-half + 24} y={CAPTION_Y} offsetX={-1} text="ЯДРО ОС" fill={colors.textMuted}
        fontSize={17} fontFamily={fonts.mono} letterSpacing={1.6}/>

      {/* Что вообще лежит под дверью — тот же слот, который потом займут семьи протоколов. */}
      <Txt ref={strata} y={LAYERS_Y} text={LAYERS} fill={withAlpha(colors.textMuted, 0.7)}
        fontSize={14} fontFamily={fonts.mono} letterSpacing={1.5}/>

      <Rect ref={chip} x={half - 24} y={CAPTION_Y} offsetX={1} radius={999} padding={[6, 16]} layout
        fill={withAlpha(colors.blue, 0.14)} stroke={withAlpha(colors.blue, 0.7)}
        lineWidth={1.3} opacity={0}>
        <Txt ref={chipText} text="TCP/IP" fill={colors.blue} fontSize={16}
          fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.2}/>
      </Rect>

      {/* Продолжение провода внутри стены: снаружи он доходит только до кромки. */}
      <Line ref={stem} points={[[0, top], [0, STEM_TOP]]} stroke={withAlpha(accent, 0.75)}
        lineWidth={2} end={0}/>

      {/* Развилка. Ветки объявлены раньше таблички — она их и закрывает собой. */}
      {[-1, 1].map((side, index) => (
        <Line ref={branches[index]} points={branchPoints(side)} stroke={withAlpha(accent, 0.7)}
          lineWidth={1.8} radius={8} end={0} opacity={0}/>
      ))}

      {[-1, 1].map((side, index) => (
        <Rect ref={families[index]} x={side * FAMILY_X} y={FAMILY_Y}
          width={FAMILY.width} height={FAMILY.height} radius={FAMILY.radius}
          fill={withAlpha(accent, 0.1)} stroke={withAlpha(accent, 0.6)} lineWidth={1.3}
          shadowColor={withAlpha(accent, 0.6)} shadowBlur={() => glow() * 16} opacity={0}>
          <Txt text={index === 0 ? 'ИНТЕРНЕТ' : 'ЛОКАЛЬНЫЙ ОБМЕН'} fill={withAlpha(colors.text, 0.9)}
            fontSize={16} fontFamily={fonts.mono} letterSpacing={1.3}/>
        </Rect>
      ))}

      <Rect ref={pill} y={PILL_Y} radius={999} padding={[7, 18]} layout
        fill={colors.surface} stroke={withAlpha(colors.orange, 0.85)} lineWidth={1.6}
        opacity={0}>
        <Txt text="ОДИН И ТОТ ЖЕ API" fill={colors.orange} fontSize={16}
          fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.3}/>
      </Rect>
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* group().opacity(1, IN, easeOutCubic);
  }

  function* stack(text: string): ThreadGenerator {
    chipText().text(text);
    chip().x(half + 60);
    yield* all(
      chip().opacity(1, TONE, easeOutCubic),
      chip().x(half - 24, 0.8, easeOutCubic),
    );
  }

  function* swap(text: string): ThreadGenerator {
    yield* chipText().opacity(0, SWAP.out);
    chipText().text(text);
    yield* chipText().opacity(1, SWAP.in, easeOutCubic);
  }

  function* openDoor(): ThreadGenerator {
    yield* door(1, DOOR_TIME, easeInOutCubic);
  }

  function* plug(): ThreadGenerator {
    yield* stem().end(1, 0.45, easeOutCubic);
  }

  function* fork(): ThreadGenerator {
    yield* strata().opacity(0, 0.3);
    yield* all(...branches.map(item => item().opacity(1, 0.2)));
    yield* all(...branches.map(item => item().end(1, 0.9, easeOutCubic)));
    yield* all(...families.map((item, index) =>
      delay(index * 0.12, item().opacity(1, TONE, easeOutCubic))));
  }

  function* oneApi(): ThreadGenerator {
    yield* pill().opacity(1, TONE, easeOutCubic);
  }

  function* breathe(): ThreadGenerator {
    while (true) {
      yield* glow(1, 1.1, easeInOutSine);
      yield* glow(0, 1.1, easeInOutSine);
    }
  }

  return {node, appear, stack, swap, openDoor, plug, fork, oneApi, breathe};
}
