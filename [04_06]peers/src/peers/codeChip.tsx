import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, easeOutCubic} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// Строка кода, которую пишет разработчик, — над своей стопкой. Голым текстом она читается
// как случайная надпись и липнет к кромке плиты, поэтому это чип с короткой привязкой вниз:
// сразу видно, что код принадлежит именно прикладному этажу.
const CHIP = {radius: 9, padding: [10, 18] as [number, number]} as const;
const TICK = 14; // хвостик от чипа к верхней плите

const IN = 0.5;
const RISE = 10;

export interface CodeChipOptions {
  text: string;
  x: number;
  y: number;
  /** Верх плиты, к которой чип привязан. */
  anchorY: number;
}

/** `http.post(…)` над стопкой клиента, `http.listen(…)` над стопкой сервера. */
export function codeChip({text, x, y, anchorY}: CodeChipOptions): Widget {
  const group = createRef<Node>();
  const accent = colors.cyan;

  const node = (
    <Node ref={group} x={x} y={y + RISE} opacity={0}>
      <Rect
        radius={CHIP.radius}
        padding={CHIP.padding}
        layout
        fill={withAlpha(accent, 0.09)}
        stroke={withAlpha(accent, 0.5)}
        lineWidth={1.5}
      >
        <Txt text={text} fill={withAlpha(accent, 0.95)} fontSize={19} fontFamily={fonts.mono}
          letterSpacing={1.1}/>
      </Rect>
      <Line points={[[0, TICK + 8], [0, anchorY - y - 4]]} stroke={withAlpha(accent, 0.35)}
        lineWidth={1.5} lineDash={[5, 5]}/>
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* all(
      group().opacity(1, IN, easeOutCubic),
      group().y(y, IN, easeOutCubic),
    );
  }

  return {node, appear};
}
