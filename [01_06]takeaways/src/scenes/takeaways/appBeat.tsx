import {Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, createSignal, easeOutBack, easeOutCubic} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, podIcon} from '@lib';
import {beatBlock, showBlock} from './beat';
import type {Beat} from './beat';

const BAR = 180; // utilization-bar width

// App servers carry memory for local optimization (two filling utilization bars).
export function appBeat(): Beat {
  const block = createRef<Rect>();
  const pod = createRef<Rect>();
  const icon = createRef<Node>();
  const text = createRef<Txt>();
  const badge = createRef<Txt>();
  const f1 = createSignal(0);
  const f2 = createSignal(0);

  const node = beatBlock({
    block, accent: colors.cyan, caption: text, captionText: 'Память рядом — локальная оптимизация',
    content: (
      <Node>
        <Rect ref={pod} y={-40} width={320} height={220} radius={18}
          fill={colors.surface} stroke={colors.cyan} lineWidth={2} opacity={0} scale={0.7}>
          <Node ref={icon} y={-58}>{podIcon()}</Node>
          <Rect width={BAR} height={16} radius={8} y={18} fill={colors.track}/>
          <Rect height={16} radius={8} y={18} x={-BAR / 2} offset={[-1, 0]}
            fill={colors.cyan} width={() => f1() * BAR}/>
          <Rect width={BAR} height={16} radius={8} y={48} fill={colors.track}/>
          <Rect height={16} radius={8} y={48} x={-BAR / 2} offset={[-1, 0]}
            fill={colors.cyan} opacity={0.8} width={() => f2() * BAR}/>
        </Rect>
        <Txt ref={badge} text="⟳ обслужено локально" y={110} fill={colors.green}
          fontSize={26} fontWeight={700} fontFamily={fonts.mono} opacity={0}/>
      </Node>
    ),
  });

  function* play(): ThreadGenerator {
    yield* showBlock(block());
    yield* all(pod().scale(1, 0.6, easeOutBack), pod().opacity(1, 0.5));
    yield* all(f1(0.85, 1.0, easeOutCubic), f2(0.6, 1.0, easeOutCubic));
    yield* all(badge().opacity(1, 0.4), text().opacity(1, 0.5));
  }

  return {node, play};
}
