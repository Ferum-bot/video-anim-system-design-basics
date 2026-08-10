import {Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, createSignal, easeInOutCubic, easeOutCubic, linear, range, waitFor} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// Практическая половина: страница из десятков объектов. В одну TCP-трубу одна потеря
// останавливает всю загрузку; в QUIC не грузится ровно один объект.
const TILE = {width: 104, height: 48, radius: 8, stepX: 114, stepY: 58, cols: 6, rows: 4} as const;
const TILES = TILE.cols * TILE.rows;
const LOST = 8; // объект, который потерялся
const LABEL_Y = -158;
const CHIP_Y = 158;

const IN = 0.6;
const LIGHT = 0.45;
const PULSE_HALF = 0.85;

const tileX = (index: number) =>
  ((index % TILE.cols) - (TILE.cols - 1) / 2) * TILE.stepX;
const tileY = (index: number) =>
  (Math.floor(index / TILE.cols) - (TILE.rows - 1) / 2) * TILE.stepY;

export interface PageGrid extends Widget {
  /** Через одну TCP-трубу: доехали первые, дальше всё встало. */
  throughTcp(): ThreadGenerator;
  /** Endless: ожидающие объекты дышат — **fork** it. */
  waiting(): ThreadGenerator;
  /** Через QUIC: догружается всё, кроме одного. */
  throughQuic(): ThreadGenerator;
}

/** Страница из десятков объектов на одном сервере. */
export function pageGrid({y}: {y: number}): PageGrid {
  const group = createRef<Node>();
  const chip = createRef<Rect>();
  const chipLabel = createRef<Txt>();

  const accent = colors.cyan;
  const filled = createSignal(0); // сколько объектов уже отдано
  const breath = createSignal(0);

  const done = (index: number) => (index === LOST ? 0 : filled() > index ? 1 : 0);

  const node = (
    <Node ref={group} y={y} opacity={0}>
      <Txt y={LABEL_Y} text="СТРАНИЦА — ДЕСЯТКИ ОБЪЕКТОВ С ОДНОГО СЕРВЕРА"
        fill={colors.textMuted} fontSize={17} fontFamily={fonts.mono} letterSpacing={1.3}/>

      {range(TILES).map(index => (
        <Rect x={tileX(index)} y={tileY(index)} width={TILE.width} height={TILE.height}
          radius={TILE.radius}
          fill={() => withAlpha(
            index === LOST ? colors.red : accent,
            index === LOST ? 0.08 : 0.05 + done(index) * 0.17,
          )}
          stroke={() => withAlpha(
            index === LOST ? colors.red : accent,
            index === LOST ? 0.85 : 0.3 + done(index) * 0.55,
          )}
          lineWidth={() => (index === LOST ? 1.8 : 1.4)}
          lineDash={index === LOST ? [7, 6] : []}
          opacity={() => (index === LOST || done(index) > 0.5 ? 1 : 0.35 + breath() * 0.25)}/>
      ))}

      <Rect ref={chip} y={CHIP_Y} width={646} height={50} radius={11}
        fill={withAlpha(colors.red, 0.12)} stroke={withAlpha(colors.red, 0.8)} lineWidth={1.6}
        opacity={0}>
        <Txt ref={chipLabel} text="" fill={colors.red} fontSize={19} fontFamily={fonts.mono}
          fontWeight={600} letterSpacing={1.2}/>
      </Rect>
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* group().opacity(1, IN, easeOutCubic);
  }

  function* say(text: string, tone: string): ThreadGenerator {
    if (chip().opacity() > 0) yield* chipLabel().opacity(0, 0.2, easeInOutCubic);
    chipLabel().text(text).fill(tone);
    yield* all(
      chip().opacity(1, LIGHT, easeOutCubic),
      chip().stroke(withAlpha(tone, 0.8), LIGHT),
      chip().fill(withAlpha(tone, 0.12), LIGHT),
      chipLabel().opacity(1, 0.35, easeOutCubic),
    );
  }

  function* throughTcp(): ThreadGenerator {
    yield* filled(LOST, 1.3, linear);
    yield* say('ОДНА ПОТЕРЯ — И СТОИТ ВСЯ СТРАНИЦА', colors.red);
  }

  function* waiting(): ThreadGenerator {
    while (true) {
      yield* breath(1, PULSE_HALF, easeInOutCubic);
      yield* breath(0, PULSE_HALF, easeInOutCubic);
    }
  }

  function* throughQuic(): ThreadGenerator {
    yield* all(
      say('В QUIC ЖДЁТ ТОЛЬКО ОДИН ОБЪЕКТ', accent),
      filled(TILES, 1.8, linear),
    );
    yield* waitFor(0);
  }

  return {node, appear, throughTcp, waiting, throughQuic};
}
