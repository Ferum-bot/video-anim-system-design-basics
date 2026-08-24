import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, createSignal, delay, easeInOutCubic, easeOutCubic, range} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// То, что возвращает `accept`, — та же плитка, что родилась в `[04_09]`: тот же ряд
// `open · read · write · close` и та же зелёная бирка дескриптора. Кольцо секции замыкается
// внутри одного кадра: сеть притворяется файлом до самого конца.
export const HANDLE = {width: 600, height: 170, radius: 14} as const;

const CALLS = ['open', 'read', 'write', 'close'] as const;
const HOT = [1, 2]; // read и write — те, «как с файлом»
const PILL = {width: 108, height: 38, radius: 8, pitch: 122} as const;

const TITLE_Y = -50;
const ROW_Y = 30;

const IN = 0.7;
const TONE = 0.4;

export interface FileHandle extends Widget {
  /** `read` и `write` загораются: дальше всё как с файлом. */
  highlight(): ThreadGenerator;
  dismiss(): ThreadGenerator;
}

export interface FileHandleOptions {
  y: number;
  anchorX: number;
  /** Ряд ездит по кадру, поэтому начало поводка — функция, а не число. */
  anchorY: () => number;
}

export function fileHandle({y, anchorX, anchorY}: FileHandleOptions): FileHandle {
  const group = createRef<Node>();
  const shell = createRef<Rect>();
  const leader = createRef<Line>();
  const fd = createRef<Rect>();

  const accent = colors.cyan;
  const hot = createSignal(0);
  const pillX = (index: number) => (index - (CALLS.length - 1) / 2) * PILL.pitch;
  const heat = (index: number) => (HOT.includes(index) ? hot() : 0);

  const node = (
    <Node ref={group} opacity={0}>
      <Line ref={leader}
        points={() => [[anchorX, anchorY()], [anchorX, y - HANDLE.height / 2]] as [number, number][]}
        stroke={withAlpha(accent, 0.5)} lineWidth={1.4} lineDash={[7, 7]} end={0}/>

      <Rect ref={shell} y={y} width={HANDLE.width} height={HANDLE.height} radius={HANDLE.radius}
        fill={colors.surface} stroke={withAlpha(accent, 0.7)} lineWidth={1.7}>
        <Txt x={-HANDLE.width / 2 + 24} y={TITLE_Y} offsetX={-1} text="СЕТЕВОЕ СОЕДИНЕНИЕ"
          fill={withAlpha(colors.text, 0.95)} fontSize={18} fontFamily={fonts.mono}
          fontWeight={600} letterSpacing={1.2}/>

        <Rect ref={fd} x={HANDLE.width / 2 - 24} y={TITLE_Y} offsetX={1} radius={999}
          padding={[4, 12]} layout fill={withAlpha(colors.green, 0.14)}
          stroke={withAlpha(colors.green, 0.7)} lineWidth={1.2} opacity={0}>
          <Txt text="fd 4" fill={colors.green} fontSize={15} fontFamily={fonts.mono}
            fontWeight={600} letterSpacing={1.1}/>
        </Rect>

        {range(CALLS.length).map(index => (
          <Rect x={pillX(index)} y={ROW_Y} width={PILL.width} height={PILL.height}
            radius={PILL.radius}
            fill={() => withAlpha(accent, 0.08 + heat(index) * 0.26)}
            stroke={() => withAlpha(accent, 0.45 + heat(index) * 0.5)} lineWidth={1.3}
            shadowColor={withAlpha(accent, 0.7)} shadowBlur={() => heat(index) * 16}>
            <Txt text={CALLS[index]}
              fill={() => withAlpha(colors.text, 0.7 + heat(index) * 0.3)} fontSize={15}
              fontFamily={fonts.mono} letterSpacing={0.9}/>
          </Rect>
        ))}
      </Rect>
    </Node>
  );

  function* appear(): ThreadGenerator {
    shell().scale(0.94);
    yield* all(
      group().opacity(1, 0.01),
      leader().end(1, 0.5, easeOutCubic),
      shell().opacity(1, IN, easeOutCubic),
      shell().scale(1, IN, easeOutCubic),
      delay(0.45, fd().opacity(1, TONE, easeOutCubic)),
    );
  }

  function* highlight(): ThreadGenerator {
    yield* hot(1, TONE, easeOutCubic);
  }

  function* dismiss(): ThreadGenerator {
    yield* all(
      group().opacity(0, 0.6, easeInOutCubic),
      shell().scale(0.96, 0.6, easeInOutCubic),
    );
  }

  return {node, appear, highlight, dismiss};
}
