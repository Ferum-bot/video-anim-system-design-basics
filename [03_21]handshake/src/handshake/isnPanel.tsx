import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  easeInOutCubic,
  easeOutCubic,
  waitFor,
} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// The initial sequence number, before and after. A number that ticks is a number someone can
// predict — and predicting it used to be enough to open a connection in your name.
const BOX = {width: 262, height: 72, radius: 12, x: 236} as const;
const LABEL_DY = -60;
const CAPTION_DY = 60;
const VERDICT_DY = 112;

const IN = 0.6;
const STEP = 0.55;
const MATCH = 0.5;
const SCRAMBLE_HOLD = 0.32;

const START = 3921;
const TICKS = 3; // enough for the pattern to be obvious
const SCRAMBLE = [58231, 91744, 20486, 76319, 43902, 15678, 88214, 30965];

export interface IsnPanel extends Widget {
  /** Злоумышленник называет следующий номер — и попадает. */
  guess(): ThreadGenerator;
  /** Endless: номер больше не предсказуем — **fork** it. */
  randomise(): ThreadGenerator;
}

/** Начальный номер: от таймера к псевдослучайному. */
export function isnPanel({y}: {y: number}): IsnPanel {
  const group = createRef<Node>();
  const ourBox = createRef<Rect>();
  const theirBox = createRef<Rect>();
  const theirSide = createRef<Node>();
  const arrow = createRef<Line>();
  const ourCaption = createRef<Txt>();
  const verdict = createRef<Txt>();

  const current = createSignal(START);
  const guessed = createSignal(START + TICKS + 1);
  const matched = createSignal(0);

  const accent = colors.cyan;
  const tone = () => (matched() > 0.5 ? colors.red : accent);

  const node = (
    <Node ref={group} y={y} opacity={0}>
      <Txt x={-BOX.x} y={LABEL_DY} text="НОМЕР КЛИЕНТА" fill={colors.textMuted} fontSize={16}
        fontFamily={fonts.mono} letterSpacing={1.2}/>
      <Rect ref={ourBox} x={-BOX.x} width={BOX.width} height={BOX.height} radius={BOX.radius}
        fill={() => withAlpha(tone(), 0.14)} stroke={tone} lineWidth={1.8}>
        <Txt text={() => `${Math.round(current())}`} fill={colors.text} fontSize={32}
          fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.4}/>
      </Rect>
      <Txt ref={ourCaption} x={-BOX.x} y={CAPTION_DY} text="РАНЬШЕ — ПО ТАЙМЕРУ"
        fill={colors.textDim} fontSize={17} fontFamily={fonts.mono} letterSpacing={1.2}/>

      <Node ref={theirSide} opacity={0}>
        <Line ref={arrow} points={[[BOX.x - BOX.width / 2 - 18, 0],
          [-BOX.x + BOX.width / 2 + 18, 0]]} stroke={withAlpha(colors.red, 0.6)} lineWidth={2.2}
          lineDash={[9, 8]} endArrow arrowSize={10}/>
        <Txt x={BOX.x} y={LABEL_DY} text="ЗЛОУМЫШЛЕННИК" fill={colors.textMuted} fontSize={16}
          fontFamily={fonts.mono} letterSpacing={1.2}/>
        <Rect ref={theirBox} x={BOX.x} width={BOX.width} height={BOX.height} radius={BOX.radius}
          fill={withAlpha(colors.red, 0.12)} stroke={withAlpha(colors.red, 0.8)} lineWidth={1.8}>
          <Txt text={() => `${Math.round(guessed())}`} fill={colors.text} fontSize={32}
            fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.4}/>
        </Rect>
        <Txt x={BOX.x} y={CAPTION_DY} text="УГАДЫВАЕТ СЛЕДУЮЩИЙ" fill={colors.textDim}
          fontSize={17} fontFamily={fonts.mono} letterSpacing={1.2}/>
      </Node>

      <Txt ref={verdict} y={VERDICT_DY} text="" fill={colors.red} fontSize={21}
        fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.3} opacity={0}/>
    </Node>
  );

  function* say(text: string, fill: string): ThreadGenerator {
    if (verdict().opacity() > 0) yield* verdict().opacity(0, 0.2, easeInOutCubic);
    verdict().text(text).fill(fill);
    yield* verdict().opacity(1, 0.45, easeOutCubic);
  }

  function* appear(): ThreadGenerator {
    yield* group().opacity(1, IN, easeOutCubic);
    // A timer-based number counts, visibly, in steps anyone can extrapolate.
    for (let i = 1; i <= TICKS; i++) {
      yield* waitFor(STEP);
      current(START + i);
    }
  }

  function* guess(): ThreadGenerator {
    yield* theirSide().opacity(1, IN, easeOutCubic);
    yield* waitFor(0.5);
    current(guessed());
    yield* all(
      matched(1, MATCH, easeOutCubic),
      say('ПОДДЕЛАННОЕ СОЕДИНЕНИЕ ОТ ЧУЖОГО ИМЕНИ', colors.red),
    );
  }

  function* randomise(): ThreadGenerator {
    yield* all(
      matched(0, MATCH, easeInOutCubic),
      arrow().opacity(0.25, MATCH, easeInOutCubic),
      theirBox().opacity(0.35, MATCH, easeInOutCubic),
      say('СЛЕДУЮЩИЙ НОМЕР НЕ УГАДАТЬ', colors.green),
    );
    ourCaption().text('ТЕПЕРЬ — ПСЕВДОСЛУЧАЙНЫЙ');
    let index = 0;
    while (true) {
      current(SCRAMBLE[index % SCRAMBLE.length]);
      index++;
      yield* waitFor(SCRAMBLE_HOLD);
    }
  }

  return {node, appear, guess, randomise};
}
