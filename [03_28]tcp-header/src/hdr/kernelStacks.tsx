import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, createSignal, delay, easeInOutCubic, easeOutCubic, range} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// Где живёт TCP и почему его так тяжело менять: два одинаковых стека по краям, ядро посередине
// каждого, и чужая инфраструктура между ними, которая тоже не должна сломаться.
const STACK = {x: 300, width: 300, radius: 12} as const;
const APP = {y: -100, height: 66} as const;
const KERNEL = {y: -8, height: 90} as const;
const PATH_Y = 112;
const BOX = {width: 66, height: 44, radius: 8, step: 104} as const;
const BOXES = 5;
const CHIP_Y = -180;

const IN = 0.7;
const LIGHT = 0.45;

export interface KernelStacks extends Widget {
  /** Рукопожатия, повторы и окна исполняет ядро. */
  lightKernel(): ThreadGenerator;
  /** Твой код в это время ждёт вызова. */
  appWaits(): ThreadGenerator;
  /** Поменять TCP — значит поменять оба ядра. */
  change(): ThreadGenerator;
  /** …и чтобы на сетевом пути между ними ничего не сломалось. */
  pray(): ThreadGenerator;
}

/** «TCP живёт в ядре — на обеих сторонах, и между ними ещё чужая инфраструктура». */
export function kernelStacks({y}: {y: number}): KernelStacks {
  const group = createRef<Node>();
  const kernelSub = range(2).map(() => createRef<Txt>());
  const appSub = range(2).map(() => createRef<Txt>());
  const path = createRef<Node>();
  const marks = range(BOXES).map(() => createRef<Txt>());
  const chip = createRef<Rect>();

  const accent = colors.cyan;
  const hot = createSignal(0); // 0 — ядро своё и спокойное, 1 — его надо менять
  const kernelTone = () => (hot() > 0.5 ? colors.orange : accent);

  const band = (
    side: number,
    slot: {y: number; height: number},
    title: string,
    sub: typeof kernelSub[number],
    tone: () => string,
    strong: boolean,
  ) => (
    <Rect x={side * STACK.x} y={slot.y} width={STACK.width} height={slot.height}
      radius={STACK.radius} fill={() => withAlpha(tone(), strong ? 0.14 : 0.06)}
      stroke={() => withAlpha(tone(), strong ? 0.85 : 0.45)} lineWidth={1.6}>
      <Txt y={-12} text={title} fill={() => withAlpha(tone(), 0.95)} fontSize={20}
        fontFamily={fonts.mono} fontWeight={500} letterSpacing={1.1}/>
      <Txt ref={sub} y={17} text="" fill={colors.textMuted} fontSize={15}
        fontFamily={fonts.mono} letterSpacing={1.1} opacity={0}/>
    </Rect>
  );

  const node = (
    <Node ref={group} y={y} opacity={0}>
      {[-1, 1].map(side => (
        <Node>
          {band(side, APP, 'ТВОЙ КОД', appSub[(side + 1) / 2], () => colors.textDim, false)}
          {band(side, KERNEL, 'ЯДРО ОС', kernelSub[(side + 1) / 2], kernelTone, true)}
          <Line points={[[side * STACK.x, KERNEL.y + KERNEL.height / 2], [side * STACK.x, PATH_Y]]}
            stroke={withAlpha(accent, 0.25)} lineWidth={2} lineDash={[8, 7]}/>
        </Node>
      ))}

      <Node ref={path} opacity={0}>
        <Line points={[[-STACK.x, PATH_Y], [STACK.x, PATH_Y]]}
          stroke={withAlpha(colors.textMuted, 0.4)} lineWidth={2} lineDash={[9, 8]}/>
        {range(BOXES).map(index => (
          <Rect x={(index - (BOXES - 1) / 2) * BOX.step} y={PATH_Y} width={BOX.width}
            height={BOX.height} radius={BOX.radius} fill={withAlpha(colors.surface, 0.92)}
            stroke={withAlpha(colors.textMuted, 0.65)} lineWidth={1.4}>
            <Txt ref={marks[index]} text="?" fill={colors.orange} fontSize={22}
              fontFamily={fonts.mono} fontWeight={600} opacity={0}/>
          </Rect>
        ))}
        <Txt y={PATH_Y + 52} text="ЧУЖАЯ ИНФРАСТРУКТУРА НА ПУТИ" fill={colors.textMuted}
          fontSize={16} fontFamily={fonts.mono} letterSpacing={1.2}/>
      </Node>

      <Rect ref={chip} y={CHIP_Y} width={606} height={54} radius={12}
        fill={withAlpha(colors.orange, 0.12)} stroke={withAlpha(colors.orange, 0.8)}
        lineWidth={1.6} opacity={0}>
        <Txt text="ПОМЕНЯТЬ TCP = ПОМЕНЯТЬ ОБА ЯДРА" fill={colors.orange} fontSize={20}
          fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.2}/>
      </Rect>
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* group().opacity(1, IN, easeOutCubic);
  }

  function* lightKernel(): ThreadGenerator {
    kernelSub.forEach(sub => sub().text('РУКОПОЖАТИЯ · ПОВТОРЫ · ОКНА'));
    yield* all(...kernelSub.map(sub => sub().opacity(1, LIGHT, easeOutCubic)));
  }

  function* appWaits(): ThreadGenerator {
    appSub.forEach(sub => sub().text('ЖДЁТ ВЫЗОВА'));
    yield* all(...appSub.map(sub => sub().opacity(1, LIGHT, easeOutCubic)));
  }

  function* change(): ThreadGenerator {
    yield* all(hot(1, 0.6, easeOutCubic), delay(0.2, chip().opacity(1, LIGHT, easeOutCubic)));
  }

  function* pray(): ThreadGenerator {
    yield* path().opacity(1, 0.6, easeOutCubic);
    yield* all(
      ...marks.map((mark, index) => delay(index * 0.12, mark().opacity(1, 0.35, easeOutCubic))),
    );
  }

  return {node, appear, lightKernel, appWaits, change, pray};
}
