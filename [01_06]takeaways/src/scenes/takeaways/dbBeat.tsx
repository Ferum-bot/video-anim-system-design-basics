import {Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, easeOutBack, sequence} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, counter, fonts, formatThousands, postgresIcon, withAlpha} from '@lib';
import {beatBlock, showBlock} from './beat';
import type {Beat} from './beat';

const W = 380; // table width
const ROW_DATA = [
  '1024   alice    $42', '1025   bob      $17',
  '1026   carol    $88', '1027   dave     $30',
];

// A single database swallows terabytes — shown with a live table + an INSERT.
export function dbBeat(): Beat {
  const block = createRef<Rect>();
  const icon = createRef<Node>();
  const sql = createRef<Txt>();
  const table = createRef<Node>();
  const rows = Array.from({length: 4}, () => createRef<Rect>());
  const count = createRef<Txt>();
  const text = createRef<Txt>();
  const tb = counter(42, v => `${formatThousands(v)} TB`);

  const node = beatBlock({
    block, accent: colors.blue, caption: text, captionText: 'Одна БД — терабайты данных',
    content: (
      <Node>
        <Node ref={icon} y={-200} scale={0} opacity={0}>{postgresIcon()}</Node>
        <Txt ref={sql} y={-115} text="" fill={colors.green} fontSize={22}
          fontFamily={fonts.mono} opacity={0}/>
        <Node ref={table} y={35} opacity={0}>
          <Rect width={W} height={34} y={-68} radius={6}
            fill={withAlpha(colors.blue, 0.28)} stroke={colors.blue} lineWidth={1}/>
          <Txt text="id      name      amount" y={-68} fill={colors.textDim}
            fontSize={16} fontWeight={600} fontFamily={fonts.mono}/>
          {rows.map((ref, i) => (
            <Rect ref={ref} width={W} height={30} y={-30 + i * 34} radius={4}
              fill={colors.surface} stroke={colors.border} lineWidth={1} opacity={0}>
              <Txt text={ROW_DATA[i]} fill={colors.textMuted} fontSize={15} fontFamily={fonts.mono}/>
            </Rect>
          ))}
        </Node>
        <Txt ref={count} text={tb.text} y={165} fill={colors.green}
          fontSize={36} fontWeight={700} fontFamily={fonts.mono} opacity={0}/>
      </Node>
    ),
  });

  function* play(): ThreadGenerator {
    yield* showBlock(block());
    yield* all(icon().scale(1.3, 0.6, easeOutBack), icon().opacity(1, 0.5));
    yield* sql().opacity(1, 0.2);
    yield* sql().text('INSERT INTO orders …', 0.9); // typewriter
    yield* table().opacity(1, 0.3);
    yield* sequence(0.18, ...rows.map(ref => (function* () {
      yield* all(ref().opacity(1, 0.3), ref().scale(1.04, 0.15).to(1, 0.15)); // insert flash
    })()));
    yield* count().opacity(1, 0.4);
    yield* all(tb.count(1.4), text().opacity(1, 0.5));
  }

  return {node, play};
}
