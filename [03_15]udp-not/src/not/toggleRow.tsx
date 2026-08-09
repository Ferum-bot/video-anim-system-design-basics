import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, createSignal, delay, easeInOutCubic, easeOutCubic} from '@motion-canvas/core';
import type {SimpleSignal, ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// Four guarantees, all switched off. They start as a stacked list while he enumerates them,
// then collapse into a strip along the top so the mechanisms below get the floor — the two
// that get explained stay switchable, so the strip keeps saying which one we're on.
const LIST = {width: 460, height: 70, radius: 12, step: 88} as const;
const STRIP = {width: 216, height: 54, gap: 12} as const;
const FONT = {list: 19, strip: 14} as const;

const SWITCH = 0.5;
const COLLAPSE = 0.8;
const FOCUS = 0.4;

interface Toggle {
  key: string;
  label: string;
}

const TOGGLES: readonly Toggle[] = [
  {key: 'flow', label: 'УПРАВЛЕНИЕ ПОТОКОМ'},
  {key: 'cong', label: 'КОНТРОЛЬ ПЕРЕГРУЗКИ'},
  {key: 'retry', label: 'ПОВТОР ПЕРЕДАЧИ'},
  {key: 'order', label: 'ПОРЯДОК ДАННЫХ'},
];

export interface ToggleRowOptions {
  /** Where the stacked list sits while it's being read out. */
  y: number;
  /** Where the collapsed strip parks afterwards. */
  stripY: number;
}

export interface ToggleRow extends Widget {
  /** Flip one guarantee off. */
  off(key: string): ThreadGenerator;
  /** Collapse the list into the top strip. */
  collapse(): ThreadGenerator;
  /** Say which of the four the scene is explaining right now — an unknown key clears it. */
  focus(key: string): ThreadGenerator;
}

/** «Чего UDP вообще не делает» — четыре выключателя. */
export function toggleRow({y, stripY}: ToggleRowOptions): ToggleRow {
  const group = createRef<Node>();
  const cards = TOGGLES.map(() => createRef<Rect>());
  const marks = TOGGLES.map(() => createRef<Line>());

  const collapsed = createSignal(0); // 0 = stacked list, 1 = strip along the top
  const dead: SimpleSignal<number>[] = TOGGLES.map(() => createSignal(0));
  const focused: SimpleSignal<number>[] = TOGGLES.map(() => createSignal(0));

  const accent = colors.cyan;
  const stripSpan = TOGGLES.length * STRIP.width + (TOGGLES.length - 1) * STRIP.gap;

  const cardX = (index: number) => () =>
    collapsed() * (-stripSpan / 2 + STRIP.width / 2 + index * (STRIP.width + STRIP.gap));
  const cardY = (index: number) => () =>
    (1 - collapsed()) * ((index - (TOGGLES.length - 1) / 2) * LIST.step);
  const cardWidth = () => LIST.width + (STRIP.width - LIST.width) * collapsed();
  const cardHeight = () => LIST.height + (STRIP.height - LIST.height) * collapsed();

  const node = (
    <Node ref={group} y={y}>
      {TOGGLES.map((toggle, index) => (
        <Rect ref={cards[index]} x={cardX(index)} y={cardY(index)} width={cardWidth}
          height={cardHeight} radius={LIST.radius}
          fill={() => withAlpha(colors.surface, 0.92)}
          stroke={() =>
            withAlpha(
              dead[index]() > 0.5 ? colors.red : accent,
              0.3 + focused[index]() * 0.6 + dead[index]() * 0.25,
            )
          }
          lineWidth={1.6}
          shadowColor={() => withAlpha(accent, 0.45 * focused[index]())}
          shadowBlur={() => 20 * focused[index]()}
          opacity={0}>
          <Txt text={toggle.label}
            fill={() => withAlpha(colors.textDim, 0.5 + focused[index]() * 0.5)}
            fontSize={() => FONT.list + (FONT.strip - FONT.list) * collapsed()}
            fontFamily={fonts.mono} letterSpacing={1.1}/>
          {/* Opacity rides along so the round cap doesn't leave a dot while `end` is 0. */}
          <Line ref={marks[index]}
            points={() => [[-cardWidth() / 2 + 10, 0], [cardWidth() / 2 - 10, 0]]}
            stroke={colors.red} lineWidth={2.2} lineCap="round" end={0}
            opacity={dead[index]}/>
        </Rect>
      ))}
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* all(
      ...cards.map((card, index) => delay(index * 0.08, card().opacity(1, 0.55, easeOutCubic))),
    );
  }

  function* off(key: string): ThreadGenerator {
    const index = TOGGLES.findIndex(toggle => toggle.key === key);
    yield* all(dead[index](1, SWITCH, easeOutCubic), marks[index]().end(1, SWITCH, easeOutCubic));
  }

  function* collapse(): ThreadGenerator {
    yield* all(collapsed(1, COLLAPSE, easeInOutCubic), group().y(stripY, COLLAPSE, easeInOutCubic));
  }

  function* focus(key: string): ThreadGenerator {
    const index = TOGGLES.findIndex(toggle => toggle.key === key);
    yield* all(
      ...focused.map((signal, i) => signal(i === index ? 1 : 0, FOCUS, easeInOutCubic)),
    );
  }

  return {node, appear, off, collapse, focus};
}
