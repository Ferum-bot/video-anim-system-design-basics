import {Circle, Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  delay,
  easeInOutCubic,
  easeOutCubic,
  range,
  waitFor,
} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// Таймлайн, который идёт против привычного порядка: сначала код и трафик, и только потом
// стандарт. Поэтому наверху сразу две стрелки — обычная, перечёркнутая, и та, что была у QUIC.
const ORDER = {y: -188, step: 46, width: 470, height: 40, radius: 10} as const;
const AXIS_Y = 44;
const CARD = {y: -42, width: 200, height: 86, radius: 12} as const;
const COMB = {y: 88, height: 16, count: 35, from: -54, to: 226} as const;
const STRIP_Y = 152;

const IN = 0.6;
const LIGHT = 0.45;
const PULSE_HALF = 1.0;

interface Milestone {
  x: number;
  title: string;
  sub: string;
}

const MILESTONES: readonly Milestone[] = [
  {x: -318, title: 'КОД В CHROME', sub: 'эксперимент'},
  {x: -106, title: '> 50% ТРАФИКА', sub: 'Chrome ↔ Google'},
  {x: 106, title: '6 ЛЕТ В IETF', sub: '35 черновиков'},
  {x: 318, title: 'RFC 9000', sub: '2021'},
];

const SATELLITES = 5;

export interface ReverseTimeline extends Widget {
  /** «Не из стандартов, а из практики» — обычный порядок перечёркивается. */
  order(): ThreadGenerator;
  /** Веха на оси: точка, карточка и подпись. */
  milestone(index: number): ThreadGenerator;
  /** 35 итераций публичной шлифовки — гребёнка черновиков заполняется. */
  drafts(duration: number): ThreadGenerator;
  /** Свита документов вокруг RFC. */
  satellites(): ThreadGenerator;
  /** Полоса с авторством под таймлайном. */
  editors(): ThreadGenerator;
  /** Endless: последняя веха дышит — **fork** it. */
  pulse(): ThreadGenerator;
}

/** «QUIC появился не из стандартов, а из практики». */
export function reverseTimeline({y}: {y: number}): ReverseTimeline {
  const group = createRef<Node>();
  const orderRows = range(2).map(() => createRef<Rect>());
  const orderStrike = createRef<Line>();
  const cards = MILESTONES.map(() => createRef<Node>());
  const dots = MILESTONES.map(() => createRef<Circle>());
  const combTicks = range(COMB.count).map(() => createRef<Line>());
  const halo = range(SATELLITES).map(() => createRef<Rect>());
  const strip = createRef<Rect>();

  const accent = colors.cyan;
  const glow = createSignal(0);

  const orderRow = (
    index: number,
    text: string,
    tone: string,
    strong: boolean,
  ) => (
    <Rect ref={orderRows[index]} y={ORDER.y + index * ORDER.step} width={ORDER.width}
      height={ORDER.height} radius={ORDER.radius}
      fill={withAlpha(tone, strong ? 0.12 : 0.05)}
      stroke={withAlpha(tone, strong ? 0.8 : 0.4)} lineWidth={1.5} opacity={0}>
      <Txt text={text} fill={withAlpha(tone, strong ? 0.95 : 0.6)} fontSize={18}
        fontFamily={fonts.mono} fontWeight={strong ? 600 : 400} letterSpacing={1.2}/>
    </Rect>
  );

  const node = (
    <Node ref={group} y={y} opacity={0}>
      {orderRow(0, 'КАК ОБЫЧНО:  СТАНДАРТ → КОД', colors.textMuted, false)}
      <Line ref={orderStrike} y={ORDER.y} points={[[-ORDER.width / 2 + 14, 0],
        [ORDER.width / 2 - 14, 0]]} stroke={colors.red} lineWidth={2.2} lineCap="round"
        end={0}/>
      {orderRow(1, 'У QUIC:  КОД → СТАНДАРТ', accent, true)}

      <Line points={[[-410, AXIS_Y], [420, AXIS_Y]]} stroke={withAlpha(colors.textMuted, 0.5)}
        lineWidth={1.8}/>
      <Line points={[[420, AXIS_Y], [458, AXIS_Y]]} stroke={withAlpha(colors.textMuted, 0.35)}
        lineWidth={1.8} lineDash={[7, 6]}/>

      {MILESTONES.map((stone, index) => (
        <Node>
          <Circle ref={dots[index]} x={stone.x} y={AXIS_Y} size={14} fill={accent} opacity={0}/>
          <Node ref={cards[index]} opacity={0}>
            <Line points={[[stone.x, CARD.y + CARD.height / 2], [stone.x, AXIS_Y - 8]]}
              stroke={withAlpha(accent, 0.35)} lineWidth={1.6} lineDash={[6, 5]}/>
            <Rect x={stone.x} y={CARD.y} width={CARD.width} height={CARD.height}
              radius={CARD.radius} fill={withAlpha(colors.surface, 0.92)}
              stroke={withAlpha(accent, 0.7)} lineWidth={1.6}
              shadowColor={() => withAlpha(accent, index === 3 ? 0.5 * glow() : 0)}
              shadowBlur={() => (index === 3 ? 22 * glow() : 0)}>
              <Txt y={-15} text={stone.title} fill={accent} fontSize={19} fontFamily={fonts.mono}
                fontWeight={600} letterSpacing={1.2}/>
              <Txt y={16} text={stone.sub} fill={colors.textDim} fontSize={16}
                fontFamily={fonts.display}/>
            </Rect>
          </Node>
        </Node>
      ))}

      {/* Гребёнка черновиков: 35 засечек, по одной за итерацию. */}
      {range(COMB.count).map(index => (
        <Line ref={combTicks[index]}
          x={COMB.from + ((COMB.to - COMB.from) * index) / (COMB.count - 1)}
          points={[[0, COMB.y], [0, COMB.y + COMB.height]]}
          stroke={withAlpha(accent, 0.75)} lineWidth={1.6} opacity={0}/>
      ))}

      {range(SATELLITES).map(index => (
        <Rect ref={halo[index]} x={MILESTONES[3].x + (index - 2) * 40} y={COMB.y + 6} width={32}
          height={24} radius={5} fill={withAlpha(colors.textMuted, 0.12)}
          stroke={withAlpha(colors.textMuted, 0.6)} lineWidth={1.2} opacity={0}/>
      ))}

      <Rect ref={strip} y={STRIP_Y} width={666} height={52} radius={11}
        fill={withAlpha(colors.orange, 0.12)} stroke={withAlpha(colors.orange, 0.8)}
        lineWidth={1.6} opacity={0}>
        <Txt text="РЕДАКТОРЫ — FASTLY И MOZILLA, ДАЖЕ НЕ GOOGLE" fill={colors.orange}
          fontSize={19} fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.2}/>
      </Rect>
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* group().opacity(1, IN, easeOutCubic);
  }

  function* order(): ThreadGenerator {
    yield* orderRows[0]().opacity(1, LIGHT, easeOutCubic);
    yield* all(
      orderStrike().end(1, 0.5, easeOutCubic),
      delay(0.15, orderRows[1]().opacity(1, LIGHT, easeOutCubic)),
    );
  }

  function* milestone(index: number): ThreadGenerator {
    yield* all(
      dots[index]().opacity(1, 0.35, easeOutCubic),
      cards[index]().opacity(1, LIGHT, easeOutCubic),
    );
  }

  function* drafts(duration: number): ThreadGenerator {
    const step = duration / COMB.count;
    yield* all(
      ...combTicks.map((tick, index) =>
        delay(index * step, tick().opacity(1, 0.25, easeOutCubic)),
      ),
    );
  }

  function* satellites(): ThreadGenerator {
    yield* all(
      ...halo.map((chip, index) => delay(index * 0.35, chip().opacity(1, 0.4, easeOutCubic))),
    );
    yield* waitFor(0);
  }

  function* editors(): ThreadGenerator {
    yield* strip().opacity(1, LIGHT, easeOutCubic);
  }

  function* pulse(): ThreadGenerator {
    while (true) {
      yield* glow(1, PULSE_HALF, easeInOutCubic);
      yield* glow(0.2, PULSE_HALF, easeInOutCubic);
    }
  }

  return {node, appear, order, milestone, drafts, satellites, editors, pulse};
}
