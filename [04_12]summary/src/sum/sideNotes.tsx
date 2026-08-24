import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, easeInOutCubic, easeOutCubic, range} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';

// Правая колонка: три строки, рейка со сводкой и чип под ними. Одна и та же колонка
// обслуживает четыре движения части — она трижды полностью сменяется, а её слоты стоят
// на месте, поэтому кадр не прыгает.
const LINE_Y = [-150, -90, -30];
const RAIL_X = 19;
const TEXT_X = 39;
const CAPTION_Y = 26;
const CHIP_Y = 84;

const IN = 0.4;
const OUT = 0.28;

export interface SideNotes {
  readonly node: Node;
  /** Поставить или сменить одну из трёх строк. */
  line(index: number, text: string): ThreadGenerator;
  /** Рейка слева и подпись под группой: то, чем эти строки являются вместе. */
  rail(caption: string): ThreadGenerator;
  /** Чип под колонкой. Повторный вызов дописывает вторую половину. */
  chip(text: string): ThreadGenerator;
  /** Погасить всё: движение кончилось. */
  clear(): ThreadGenerator;
}

export interface SideNotesOptions {
  x: number;
}

export function sideNotes({x}: SideNotesOptions): SideNotes {
  const group = createRef<Node>();
  const texts = range(LINE_Y.length).map(() => createRef<Txt>());
  const railLine = createRef<Line>();
  const caption = createRef<Txt>();
  const chipBox = createRef<Rect>();
  const chipText = createRef<Txt>();

  const node = (
    <Node ref={group} x={x}>
      <Line ref={railLine} points={[[RAIL_X, LINE_Y[0] - 22], [RAIL_X, LINE_Y[2] + 22]]}
        stroke={withAlpha(colors.cyan, 0.75)} lineWidth={2.4} end={0}/>

      {range(LINE_Y.length).map(index => (
        <Txt ref={texts[index]} x={TEXT_X} offsetX={-1} y={LINE_Y[index]} text=""
          fill={colors.text} fontSize={19} fontFamily={fonts.mono} fontWeight={500}
          letterSpacing={1.3} opacity={0}/>
      ))}

      <Txt ref={caption} x={TEXT_X} offsetX={-1} y={CAPTION_Y} text=""
        fill={colors.textMuted} fontSize={16} fontFamily={fonts.mono} letterSpacing={1.6}
        opacity={0}/>

      <Rect ref={chipBox} x={TEXT_X} offsetX={-1} y={CHIP_Y} radius={999} padding={[7, 18]}
        layout fill={colors.surface} stroke={withAlpha(colors.orange, 0.75)} lineWidth={1.4}
        opacity={0}>
        <Txt ref={chipText} text="" fill={colors.orange} fontSize={16} fontFamily={fonts.mono}
          fontWeight={600} letterSpacing={1.2}/>
      </Rect>
    </Node>
  );

  function* line(index: number, text: string): ThreadGenerator {
    const item = texts[index]();
    if (item.opacity() > 0) yield* item.opacity(0, OUT);
    item.text(text);
    item.x(TEXT_X - 18);
    yield* all(
      item.opacity(1, IN, easeOutCubic),
      item.x(TEXT_X, IN, easeOutCubic),
    );
  }

  function* rail(text: string): ThreadGenerator {
    caption().text(text);
    yield* all(
      railLine().end(1, 0.6, easeOutCubic),
      caption().opacity(1, IN, easeOutCubic),
    );
  }

  function* chip(text: string): ThreadGenerator {
    if (chipBox().opacity() > 0) yield* chipText().opacity(0, OUT);
    chipText().text(text);
    yield* all(
      chipBox().opacity(1, IN, easeOutCubic),
      chipText().opacity(1, IN, easeOutCubic),
    );
  }

  function* clear(): ThreadGenerator {
    yield* all(
      ...texts.map(item => item().opacity(0, OUT, easeInOutCubic)),
      railLine().end(0, OUT, easeInOutCubic),
      caption().opacity(0, OUT),
      chipBox().opacity(0, OUT),
    );
  }

  return {node, line, rail, chip, clear};
}
