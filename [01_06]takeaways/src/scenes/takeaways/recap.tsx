import {Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, easeOutBack, easeOutCubic, sequence} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, kafkaIcon, podIcon, postgresIcon, redisIcon} from '@lib';

const TILES = [
  {icon: postgresIcon, name: 'База данных', sub: 'терабайты данных', accent: colors.blue, x: -222, y: -115},
  {icon: redisIcon, name: 'Кэш', sub: 'весь датасет в RAM', accent: colors.red, x: 222, y: -115},
  {icon: kafkaIcon, name: 'Очередь', sub: 'быстра для sync', accent: colors.orange, x: -222, y: 115},
  {icon: podIcon, name: 'App-сервер', sub: 'локальная память', accent: colors.cyan, x: 222, y: 115},
];

// The four takeaways collapse into a 2×2 grid of tiles for the closing hold.
export function recap(): {node: Node; play(): ThreadGenerator} {
  const refs = TILES.map(() => createRef<Rect>());

  const node = (
    <Node y={24}>
      {TILES.map((t, i) => (
        <Rect ref={refs[i]} x={t.x} y={t.y} width={420} height={210} radius={14}
          fill={colors.surface} stroke={t.accent} lineWidth={2} opacity={0} scale={0.9}
          layout direction="column" gap={12} alignItems="center" justifyContent="center" padding={20}>
          {t.icon()}
          <Txt text={t.name} fill={colors.text} fontSize={26} fontWeight={700} fontFamily={fonts.mono}/>
          <Txt text={t.sub} fill={colors.textMuted} fontSize={18} fontFamily={fonts.mono}/>
        </Rect>
      ))}
    </Node>
  );

  function* play(): ThreadGenerator {
    yield* sequence(0.12, ...refs.map(ref =>
      all(ref().opacity(1, 0.5, easeOutCubic), ref().scale(1, 0.5, easeOutBack)),
    ));
  }

  return {node, play};
}
