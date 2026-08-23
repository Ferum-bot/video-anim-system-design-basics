import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, createSignal, easeInOutCubic, easeOutCubic} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// Плита приложения. Дверь — тот же приём, что у стены ядра в `[04_09]`: не картинка поверх
// кромки, а **разрыв в самой кромке**, который раздвигает сигнал `door`. Здесь кромка нижняя:
// всё, что ниже, уже не твоё.
export const APP_PLATE = {width: 380, height: 84, radius: 10} as const;

const DOOR_W = 110;
const JAMB = 20;
const HANDLE = {width: 16, height: 4} as const;

const IN = 0.7;
const TONE = 0.45;
const MOVE = 0.9;

export interface AppPlate extends Widget {
  /** Прорезать проём в нижней кромке. */
  openDoor(): ThreadGenerator;
  /** У этого стыка есть ручка — его и трогают руками. */
  handle(): ThreadGenerator;
  /** Насколько плита «живая»: 1 — твоя территория, 0.35 — притушена. */
  light(level: number): ThreadGenerator;
  /** Переехать и сменить габарит — одним движением. */
  moveTo(x: number, y: number, width: number, height: number): ThreadGenerator;
  /** Сменить подпись. */
  relabel(text: string): ThreadGenerator;
}

export interface AppPlateOptions {
  x: number;
  y: number;
  label: string;
  /** Стартовая ширина: получатель появляется уже узким. */
  width?: number;
}

/** Верхний этаж — единственное, чем ты владеешь целиком. */
export function appPlate({x, y, label, width = APP_PLATE.width}: AppPlateOptions): AppPlate {
  const group = createRef<Node>();
  const shell = createRef<Rect>();
  const title = createRef<Txt>();
  const grip = createRef<Rect>();

  const accent = colors.cyan;
  const door = createSignal(0);
  const glow = createSignal(1);
  const w = createSignal<number>(width);
  const h = createSignal<number>(APP_PLATE.height);

  const edge = () => h() / 2;
  const half = () => w() / 2;
  const jambX = () => (door() * DOOR_W) / 2;
  const tone = () => withAlpha(accent, 0.3 + glow() * 0.6);

  const node = (
    <Node ref={group} x={x} y={y} opacity={0}>
      <Rect ref={shell} width={w} height={h} radius={APP_PLATE.radius}
        fill={colors.track} stroke={() => withAlpha(accent, 0.25 + glow() * 0.35)}
        lineWidth={1.5} shadowColor={withAlpha(accent, 0.45)}
        shadowBlur={() => glow() * 16}>
        <Txt ref={title} text={label} fill={() => withAlpha(colors.text, 0.45 + glow() * 0.5)}
          fontSize={20} fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.4}/>
      </Rect>

      {/* Нижняя кромка двумя отрезками — между ними и раздвигается дверь. */}
      <Line points={() => [[-half() + 6, edge()], [-jambX(), edge()]] as [number, number][]}
        stroke={tone} lineWidth={2.4}/>
      <Line points={() => [[jambX(), edge()], [half() - 6, edge()]] as [number, number][]}
        stroke={tone} lineWidth={2.4}/>
      {[-1, 1].map(side => (
        <Line
          points={() => [[side * jambX(), edge()], [side * jambX(), edge() - JAMB]] as [number, number][]}
          stroke={tone} lineWidth={2} opacity={() => door()}/>
      ))}

      {/* Ручка: у этого стыка она одна на всю стопку. */}
      <Rect ref={grip} x={() => jambX() - 26} y={() => edge() - JAMB / 2}
        width={HANDLE.width} height={HANDLE.height} radius={2}
        fill={colors.orange} shadowColor={withAlpha(colors.orange, 0.8)} shadowBlur={10}
        opacity={0}/>
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* group().opacity(1, IN, easeOutCubic);
  }

  function* openDoor(): ThreadGenerator {
    yield* door(1, 0.7, easeInOutCubic);
  }

  function* handle(): ThreadGenerator {
    yield* grip().opacity(1, TONE, easeOutCubic);
  }

  function* light(level: number): ThreadGenerator {
    yield* glow(level, TONE, easeInOutCubic);
  }

  function* moveTo(nextX: number, nextY: number, width: number, height: number): ThreadGenerator {
    yield* all(
      group().x(nextX, MOVE, easeInOutCubic),
      group().y(nextY, MOVE, easeInOutCubic),
      w(width, MOVE, easeInOutCubic),
      h(height, MOVE, easeInOutCubic),
    );
  }

  function* relabel(text: string): ThreadGenerator {
    yield* title().opacity(0, 0.22);
    title().text(text);
    yield* title().opacity(1, 0.3, easeOutCubic);
  }

  return {node, appear, openDoor, handle, light, moveTo, relabel};
}
