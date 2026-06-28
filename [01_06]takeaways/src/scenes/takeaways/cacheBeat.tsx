import {Circle, Layout, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, easeInOutCubic, easeOutBack, sequence, waitFor} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, redisIcon} from '@lib';
import {beatBlock, showBlock} from './beat';
import type {Beat} from './beat';

const GRID_X = 70;
const CLIENT_X = -330;

// A cache holds the whole dataset in memory — and answers a client in 1–2 ms.
export function cacheBeat(): Beat {
  const block = createRef<Rect>();
  const icon = createRef<Node>();
  const text = createRef<Txt>();
  const memBadge = createRef<Txt>();
  const fastBadge = createRef<Node>();
  const client = createRef<Rect>();
  const ping = createRef<Circle>();
  const cells = Array.from({length: 15}, () => createRef<Rect>());

  const node = beatBlock({
    block, accent: colors.red, caption: text, captionText: 'Кэш держит весь датасет в памяти',
    content: (
      <Node>
        <Node ref={icon} y={-190} scale={0} opacity={0}>{redisIcon()}</Node>
        <Rect ref={client} x={CLIENT_X} y={-20} width={92} height={56} radius={8}
          fill={colors.surface} stroke={colors.textMuted} lineWidth={2} opacity={0}>
          <Txt text="client" fill={colors.textMuted} fontSize={15} fontFamily={fonts.mono}/>
        </Rect>
        <Layout layout wrap="wrap" gap={12} width={5 * 44 + 4 * 12} x={GRID_X} y={-20}>
          {cells.map(ref => (
            <Rect ref={ref} width={44} height={30} radius={5}
              fill={colors.surface} stroke={colors.border} lineWidth={1} opacity={0}/>
          ))}
        </Layout>
        <Circle ref={ping} width={16} height={16} x={CLIENT_X} y={-20} fill={colors.green}
          shadowColor={colors.green} shadowBlur={10} opacity={0}/>
        <Txt ref={memBadge} text="100% in-memory" y={100} fill={colors.red}
          fontSize={26} fontWeight={700} fontFamily={fonts.mono} opacity={0}/>
        <Node ref={fastBadge} y={145} opacity={0}>
          <Txt text="⚡ ответ за 1–2 ms" fill={colors.green}
            fontSize={26} fontWeight={700} fontFamily={fonts.mono}/>
        </Node>
      </Node>
    ),
  });

  function* play(): ThreadGenerator {
    yield* showBlock(block());
    yield* all(icon().scale(1.2, 0.6, easeOutBack), icon().opacity(1, 0.5),
      client().opacity(1, 0.5));
    yield* sequence(0.04, ...cells.map(ref => ref().opacity(1, 0.25)));
    yield* all(...cells.map(ref => ref().fill(colors.red, 0.45))); // ignite
    yield* all(memBadge().opacity(1, 0.4), text().opacity(1, 0.5));

    yield* fastBadge().opacity(1, 0.4);
    for (let i = 0; i < 3; i++) {
      ping().position([CLIENT_X, -20]);
      yield* ping().opacity(1, 0.08);
      yield* ping().position([GRID_X, -20], 0.16, easeInOutCubic);
      yield* ping().position([CLIENT_X, -20], 0.16, easeInOutCubic);
      yield* all(ping().opacity(0, 0.08), fastBadge().scale(1.12, 0.1).to(1, 0.1));
      yield* waitFor(0.12);
    }
  }

  return {node, play};
}
