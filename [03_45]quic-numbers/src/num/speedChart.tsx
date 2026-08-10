import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  delay,
  easeInOutCubic,
  easeOutCubic,
  range,
} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, counter, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// График из исследования 2024-го: до ~600 Мбит/с протоколы идут вровень, дальше QUIC отстаёт,
// и разрыв растёт вместе с полосой. Обе кривые считаются формулой, а не рисуются на глаз.
const PLOT = {width: 760, height: 254} as const;
const SPLIT = 0.3; // доля оси, на которой кривые расходятся — это и есть ~600 Мбит/с
const TOP = 0.95; // куда доходит TCP на правом краю
const RATIO = 0.55; // и какую долю от него набирает QUIC — те самые «до −45%»
const SAMPLES = 40;
const BADGE_Y = -186;
const AXIS_LABEL_Y = 150;
const CHIP_Y = 196;

const IN = 0.6;
const DRAW = 2.4;
const LIGHT = 0.45;

const left = -PLOT.width / 2;
const rateY = (value: number) => PLOT.height / 2 - value * PLOT.height;
const tcpAt = (u: number) => TOP * Math.pow(u, 0.85);
const quicAt = (u: number) =>
  u <= SPLIT
    ? tcpAt(u)
    : tcpAt(SPLIT) + ((TOP * RATIO - tcpAt(SPLIT)) * (u - SPLIT)) / (1 - SPLIT);

const curve = (fn: (u: number) => number): [number, number][] =>
  range(SAMPLES + 1).map(index => {
    const u = index / SAMPLES;
    return [left + PLOT.width * u, rateY(fn(u))];
  });

const TCP_POINTS = curve(tcpAt);
const QUIC_POINTS = curve(quicAt);
/** Заливка между кривыми — только справа от точки расхождения. */
const GAP_POINTS: [number, number][] = [
  ...TCP_POINTS.filter((_, index) => index / SAMPLES >= SPLIT),
  ...QUIC_POINTS.filter((_, index) => index / SAMPLES >= SPLIT).reverse(),
];

export interface SpeedChart extends Widget {
  /** Плашка с источником цифр. */
  study(): ThreadGenerator;
  /** Кривая TCP + TLS + HTTP/2. */
  drawTcp(): ThreadGenerator;
  /** Кривая QUIC + HTTP/3 и заголовочная цифра. */
  drawQuic(): ThreadGenerator;
  /** Отметка «примерно до 600 Мбит/с идут вровень». */
  mark(): ThreadGenerator;
  /** Разрыв заливается, и число досчитывается до −45%. */
  gap(): ThreadGenerator;
  /** Где это воспроизводится. */
  chips(index: number): ThreadGenerator;
  dismiss(): ThreadGenerator;
}

/** «На быстрых каналах QUIC + HTTP/3 теряет до 45% против TCP + TLS + HTTP/2». */
export function speedChart({y}: {y: number}): SpeedChart {
  const group = createRef<Node>();
  const badge = createRef<Rect>();
  const tcpLine = createRef<Line>();
  const quicLine = createRef<Line>();
  const tcpLabel = createRef<Txt>();
  const quicLabel = createRef<Txt>();
  const splitMark = createRef<Node>();
  const gapFill = createRef<Line>();
  const readout = createRef<Rect>();
  const chipRefs = range(2).map(() => createRef<Rect>());

  const accent = colors.cyan;
  const other = colors.orange;
  const loss = counter(45, value => `ДО −${Math.round(value)}%`);
  const splitX = left + PLOT.width * SPLIT;

  const node = (
    <Node ref={group} y={y} opacity={0}>
      <Rect ref={badge} y={BADGE_Y} width={686} height={48} radius={11}
        fill={withAlpha(colors.textMuted, 0.1)} stroke={withAlpha(colors.textMuted, 0.6)}
        lineWidth={1.4} opacity={0}>
        <Txt text="ИССЛЕДОВАНИЕ 2024 · ГЛАВНАЯ КОНФЕРЕНЦИЯ ВЕБ-МИРА" fill={colors.textDim}
          fontSize={18} fontFamily={fonts.mono} letterSpacing={1.2}/>
      </Rect>

      <Line points={[[left, rateY(0)], [PLOT.width / 2, rateY(0)]]}
        stroke={withAlpha(colors.textMuted, 0.5)} lineWidth={1.6}/>
      <Line points={[[left, rateY(0)], [left, rateY(1.05)]]}
        stroke={withAlpha(colors.textMuted, 0.5)} lineWidth={1.6}/>
      <Txt offset={[-1, 0]} x={left} y={-PLOT.height / 2 - 22} text="ДОСТИГНУТАЯ СКОРОСТЬ"
        fill={colors.textMuted} fontSize={16} fontFamily={fonts.mono} letterSpacing={1.2}/>
      <Txt offset={[1, 0]} x={PLOT.width / 2} y={AXIS_LABEL_Y} text="ПОЛОСА КАНАЛА"
        fill={colors.textMuted} fontSize={16} fontFamily={fonts.mono} letterSpacing={1.2}/>

      <Line ref={gapFill} points={GAP_POINTS} closed fill={withAlpha(other, 0.14)}
        stroke={withAlpha(other, 0.3)} lineWidth={1} opacity={0}/>

      <Node ref={splitMark} opacity={0}>
        <Line points={[[splitX, rateY(0)], [splitX, rateY(0.78)]]}
          stroke={withAlpha(colors.textMuted, 0.55)} lineWidth={1.6} lineDash={[8, 7]}/>
        <Txt x={splitX} y={rateY(0.86)} text="~600 Мбит/с" fill={colors.textDim} fontSize={17}
          fontFamily={fonts.mono} letterSpacing={1.1}/>
      </Node>

      <Line ref={tcpLine} points={TCP_POINTS} stroke={accent} lineWidth={3} lineJoin="round"
        end={0}/>
      <Line ref={quicLine} points={QUIC_POINTS} stroke={other} lineWidth={3} lineJoin="round"
        end={0}/>

      <Txt ref={tcpLabel} offset={[1, 0]} x={PLOT.width / 2 - 6} y={rateY(TOP) - 24}
        text="TCP + TLS + HTTP/2" fill={accent} fontSize={17} fontFamily={fonts.mono}
        fontWeight={500} letterSpacing={1.1} opacity={0}/>
      <Txt ref={quicLabel} offset={[1, 0]} x={PLOT.width / 2 - 6} y={rateY(TOP * RATIO) + 26}
        text="QUIC + HTTP/3" fill={other} fontSize={17} fontFamily={fonts.mono} fontWeight={500}
        letterSpacing={1.1} opacity={0}/>

      <Rect ref={readout} x={176} y={rateY((tcpAt(0.75) + quicAt(0.75)) / 2)} width={188} height={52}
        radius={11} fill={withAlpha(other, 0.16)} stroke={other} lineWidth={1.8} opacity={0}>
        <Txt text={loss.text} fill={other} fontSize={24} fontFamily={fonts.mono} fontWeight={600}
          letterSpacing={1.3}/>
      </Rect>

      {['ВСЕ БРАУЗЕРЫ · ДЕСКТОП · МОБИЛЬНЫЕ', '−10% БИТРЕЙТА ВИДЕО'].map((text, index) => (
        <Rect ref={chipRefs[index]} x={index === 0 ? -196 : 268} y={CHIP_Y}
          width={index === 0 ? 456 : 372} height={46} radius={10}
          fill={withAlpha(colors.textMuted, 0.1)} stroke={withAlpha(colors.textMuted, 0.6)}
          lineWidth={1.4} opacity={0}>
          <Txt text={text} fill={colors.textDim} fontSize={17} fontFamily={fonts.mono}
            letterSpacing={1.2}/>
        </Rect>
      ))}
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* group().opacity(1, IN, easeOutCubic);
  }

  function* study(): ThreadGenerator {
    yield* badge().opacity(1, LIGHT, easeOutCubic);
  }

  function* drawTcp(): ThreadGenerator {
    yield* all(
      tcpLine().end(1, DRAW, easeInOutCubic),
      delay(DRAW - 0.5, tcpLabel().opacity(1, LIGHT, easeOutCubic)),
    );
  }

  function* drawQuic(): ThreadGenerator {
    yield* all(
      quicLine().end(1, DRAW, easeInOutCubic),
      delay(DRAW - 0.5, quicLabel().opacity(1, LIGHT, easeOutCubic)),
    );
  }

  function* mark(): ThreadGenerator {
    yield* splitMark().opacity(1, LIGHT, easeOutCubic);
  }

  function* gap(): ThreadGenerator {
    yield* all(
      gapFill().opacity(1, 0.7, easeOutCubic),
      delay(0.25, all(readout().opacity(1, LIGHT, easeOutCubic), loss.count(1.4))),
    );
  }

  function* chips(index: number): ThreadGenerator {
    yield* chipRefs[index]().opacity(1, LIGHT, easeOutCubic);
  }

  function* dismiss(): ThreadGenerator {
    yield* all(
      group().opacity(0, 0.55, easeInOutCubic),
      group().y(group().y() - 26, 0.55, easeInOutCubic),
    );
  }

  return {node, appear, study, drawTcp, drawQuic, mark, gap, chips, dismiss};
}
