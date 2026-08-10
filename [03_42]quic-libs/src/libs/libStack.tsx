import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, createSignal, delay, easeInOutCubic, easeOutCubic} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// Продолжение кадра из части про заголовок TCP: там, чтобы поменять протокол, надо было
// поменять оба ядра. Здесь ядро вообще не трогают — реализация приезжает в твой процесс.
const STACK = {x: -232, width: 428, radius: 12} as const;
const APP = {y: -74, height: 122} as const;
const KERNEL = {y: 70, height: 104} as const;
const LIB = {width: 300, height: 54, radius: 10, y: 12} as const;
const CHIP = {x: 252, width: 306, height: 44, radius: 9, step: 52} as const;
const CHIPS_TOP = -132;
const FLAGS_TOP = 92; // отбито от списка реализаций — это уже про «где включено»
const STRIP_Y = 218;

const IN = 0.7;
const LIGHT = 0.45;

const LIBS = ['quiche · CLOUDFLARE', 'msquic · MICROSOFT', 'quic-go · GO', 'CHROMIUM'];
const FLAGS = ['NGINX — ФЛАГОМ', 'ОБЛАЧНЫЙ БАЛАНСИРОВЩИК'];

export interface LibStack extends Widget {
  /** В ядре QUIC нет — надпись перечёркивается. */
  notInKernel(): ThreadGenerator;
  /** Он живёт в библиотеке, прямо в твоём процессе. */
  library(): ThreadGenerator;
  /** Готовые реализации, из которых выбирают. */
  names(): ThreadGenerator;
  /** «Приносишь библиотеку с собой». */
  bring(): ThreadGenerator;
  /** В Nginx и балансировщиках — просто флагом. */
  flags(): ThreadGenerator;
  /** Итоговый контраст с TCP. */
  contrast(): ThreadGenerator;
  /** Endless: итоговая плашка дышит — **fork** it. */
  pulse(): ThreadGenerator;
}

/** «В ядре ОС QUIC нет — он живёт в библиотеках». */
export function libStack({y}: {y: number}): LibStack {
  const group = createRef<Node>();
  const quicInKernel = createRef<Txt>();
  const kernelStrike = createRef<Line>();
  const lib = createRef<Rect>();
  const chips = LIBS.map(() => createRef<Rect>());
  const arrow = createRef<Line>();
  const flagChips = FLAGS.map(() => createRef<Rect>());
  const strip = createRef<Rect>();

  const accent = colors.cyan;
  const glow = createSignal(0);

  const chipRow = (
    ref: typeof chips[number],
    text: string,
    top: number,
    index: number,
    tone: string,
  ) => (
    <Rect ref={ref} x={CHIP.x} y={top + index * CHIP.step} width={CHIP.width} height={CHIP.height}
      radius={CHIP.radius} fill={withAlpha(tone, 0.1)} stroke={withAlpha(tone, 0.6)}
      lineWidth={1.4} opacity={0}>
      <Txt text={text} fill={withAlpha(tone, 0.95)} fontSize={17} fontFamily={fonts.mono}
        letterSpacing={1.1}/>
    </Rect>
  );

  const node = (
    <Node ref={group} y={y} opacity={0}>
      <Rect x={STACK.x} y={APP.y} width={STACK.width} height={APP.height} radius={STACK.radius}
        fill={withAlpha(colors.surface, 0.9)} stroke={withAlpha(accent, 0.5)} lineWidth={1.6}>
        <Txt y={-APP.height / 2 + 26} text="ТВОЙ ПРОЦЕСС" fill={colors.textDim} fontSize={19}
          fontFamily={fonts.mono} letterSpacing={1.1}/>
      </Rect>

      <Rect ref={lib} x={STACK.x} y={APP.y + LIB.y} width={LIB.width} height={LIB.height}
        radius={LIB.radius} fill={withAlpha(accent, 0.16)} stroke={accent} lineWidth={1.8}
        scale={0.92} opacity={0}>
        <Txt text="БИБЛИОТЕКА QUIC" fill={accent} fontSize={19} fontFamily={fonts.mono}
          fontWeight={600} letterSpacing={1.2}/>
      </Rect>

      <Rect x={STACK.x} y={KERNEL.y} width={STACK.width} height={KERNEL.height}
        radius={STACK.radius} fill={withAlpha(colors.surface, 0.9)}
        stroke={withAlpha(colors.textMuted, 0.55)} lineWidth={1.6}>
        <Txt y={-22} text="ЯДРО ОС" fill={colors.textDim} fontSize={19} fontFamily={fonts.mono}
          letterSpacing={1.1}/>
        <Txt x={-70} y={22} text="TCP" fill={colors.textMuted} fontSize={18}
          fontFamily={fonts.mono} letterSpacing={1.2}/>
        <Txt ref={quicInKernel} x={62} y={22} text="QUIC" fill={colors.textMuted} fontSize={18}
          fontFamily={fonts.mono} letterSpacing={1.2}/>
      </Rect>
      <Line ref={kernelStrike} x={STACK.x + 62} y={KERNEL.y + 22} points={[[-34, 0], [34, 0]]}
        stroke={colors.red} lineWidth={2.4} lineCap="round" end={0}/>

      {LIBS.map((text, index) => chipRow(chips[index], text, CHIPS_TOP, index, accent))}
      {FLAGS.map((text, index) =>
        chipRow(flagChips[index], text, FLAGS_TOP, index, colors.textMuted),
      )}

      <Line ref={arrow} points={[[CHIP.x - CHIP.width / 2 - 14, APP.y + LIB.y],
        [STACK.x + LIB.width / 2 + 14, APP.y + LIB.y]]} stroke={withAlpha(accent, 0.6)}
        lineWidth={2.2} lineDash={[9, 8]} endArrow arrowSize={10} end={0}/>

      <Rect ref={strip} y={STRIP_Y} width={860} height={54} radius={12}
        fill={withAlpha(colors.orange, 0.12)} stroke={withAlpha(colors.orange, 0.8)}
        lineWidth={1.6} opacity={0}
        shadowColor={() => withAlpha(colors.orange, 0.5 * glow())}
        shadowBlur={() => 22 * glow()}>
        <Txt text="TCP — ОБНОВИ ЯДРА ПЛАНЕТЫ · QUIC — ОБНОВИ ДЕПЛОЙ" fill={colors.orange}
          fontSize={20} fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.2}/>
      </Rect>
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* group().opacity(1, IN, easeOutCubic);
  }

  function* notInKernel(): ThreadGenerator {
    yield* all(
      kernelStrike().end(1, 0.5, easeOutCubic),
      quicInKernel().opacity(0.45, 0.5, easeInOutCubic),
    );
  }

  function* library(): ThreadGenerator {
    yield* all(
      lib().opacity(1, LIGHT, easeOutCubic),
      lib().scale(1, LIGHT, easeOutCubic),
    );
  }

  function* names(): ThreadGenerator {
    yield* all(
      ...chips.map((chip, index) => delay(index * 0.28, chip().opacity(1, 0.4, easeOutCubic))),
    );
  }

  function* bring(): ThreadGenerator {
    yield* arrow().end(1, 0.7, easeInOutCubic);
  }

  function* flags(): ThreadGenerator {
    yield* all(
      ...flagChips.map((chip, index) =>
        delay(index * 0.3, chip().opacity(1, 0.4, easeOutCubic)),
      ),
    );
  }

  function* contrast(): ThreadGenerator {
    yield* strip().opacity(1, LIGHT, easeOutCubic);
  }

  function* pulse(): ThreadGenerator {
    while (true) {
      yield* glow(1, 1.0, easeInOutCubic);
      yield* glow(0.2, 1.0, easeInOutCubic);
    }
  }

  return {node, appear, notInKernel, library, names, bring, flags, contrast, pulse};
}
