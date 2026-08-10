import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  easeInCubic,
  easeInOutCubic,
  easeOutCubic,
  waitFor,
} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// Два способа потерять пакет, рядом. По проводу помехи его почти не убивают — значит, если он
// пропал, он умер в переполненной очереди. Отсюда и весь алгоритм.
const PANEL = {width: 404, height: 236, radius: 14, x: 222} as const;
const TITLE_Y = -94;
const VERDICT_Y = 88;
const TANK = {width: 148, height: 128, radius: 10, x: 62} as const;
const PACKET = {size: 30, radius: 7} as const;
const STRIP_Y = 158;

const IN = 0.6;
const LIGHT = 0.45;

export interface WhyLoss extends Widget {
  /** Пакет спокойно проходит по проводу. */
  wire(): ThreadGenerator;
  /** Пакет упирается в полную очередь и умирает там. */
  queue(): ThreadGenerator;
  /** Вывод: значит, надо притормозить. */
  slowDown(): ThreadGenerator;
  dismiss(): ThreadGenerator;
}

/** «В проводах пакет от помех почти не умирает — значит, он умер в очереди». */
export function whyLoss({y}: {y: number}): WhyLoss {
  const group = createRef<Node>();
  const wirePacket = createRef<Rect>();
  const queuePacket = createRef<Rect>();
  const noiseStrike = createRef<Line>();
  const wireVerdict = createRef<Txt>();
  const queueVerdict = createRef<Txt>();
  const strip = createRef<Rect>();
  const stripLabel = createRef<Txt>();

  const accent = colors.cyan;

  const panel = (x: number, title: string, tone: string) => (
    <Rect x={x} width={PANEL.width} height={PANEL.height} radius={PANEL.radius}
      fill={withAlpha(colors.surface, 0.9)} stroke={withAlpha(tone, 0.5)} lineWidth={1.6}>
      <Txt y={TITLE_Y} text={title} fill={colors.textMuted} fontSize={17} fontFamily={fonts.mono}
        letterSpacing={1.3}/>
    </Rect>
  );

  const packet = (ref: typeof wirePacket) => (
    <Rect ref={ref} width={PACKET.size} height={PACKET.size} radius={PACKET.radius}
      fill={withAlpha(accent, 0.3)} stroke={accent} lineWidth={1.6}
      shadowColor={withAlpha(accent, 0.5)} shadowBlur={10} opacity={0}/>
  );

  const node = (
    <Node ref={group} y={y} opacity={0}>
      {panel(-PANEL.x, 'ПО ПРОВОДУ', accent)}
      {panel(PANEL.x, 'ОЧЕРЕДЬ РОУТЕРА', colors.red)}

      {/* Левая половина: провод, по которому всё доезжает. */}
      <Line points={[[-PANEL.x - 150, -16], [-PANEL.x + 150, -16]]}
        stroke={withAlpha(accent, 0.35)} lineWidth={2.4}/>
      <Txt x={-PANEL.x} y={34} text="ПОМЕХИ" fill={colors.textMuted} fontSize={18}
        fontFamily={fonts.mono} letterSpacing={1.2}/>
      <Line ref={noiseStrike} x={-PANEL.x} y={34} points={[[-52, 0], [52, 0]]}
        stroke={colors.textMuted} lineWidth={2} lineCap="round" end={0}/>
      <Txt ref={wireVerdict} x={-PANEL.x} y={VERDICT_Y} text="ПОЧТИ НЕ УМИРАЮТ"
        fill={colors.textDim} fontSize={19} fontFamily={fonts.mono} fontWeight={500}
        letterSpacing={1.2} opacity={0}/>

      {/* Правая половина: путь до очереди, которая уже под завязку. */}
      <Line points={[[PANEL.x - 160, -16], [PANEL.x + TANK.x - TANK.width / 2 - 8, -16]]}
        stroke={withAlpha(colors.red, 0.28)} lineWidth={2} lineDash={[9, 8]}/>
      <Rect x={PANEL.x + TANK.x} y={-6} width={TANK.width} height={TANK.height}
        radius={TANK.radius} fill={withAlpha(colors.surface, 0.9)}
        stroke={withAlpha(colors.red, 0.7)} lineWidth={1.6} clip>
        <Rect width={TANK.width} height={TANK.height - 16} radius={6}
          fill={withAlpha(colors.red, 0.28)}/>
      </Rect>
      <Txt ref={queueVerdict} x={PANEL.x} y={VERDICT_Y} text="ВОТ ГДЕ УМИРАЮТ" fill={colors.red}
        fontSize={19} fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.2} opacity={0}/>

      {packet(wirePacket)}
      {packet(queuePacket)}

      <Rect ref={strip} y={STRIP_Y} width={468} height={54} radius={12}
        fill={withAlpha(colors.orange, 0.12)} stroke={withAlpha(colors.orange, 0.8)}
        lineWidth={1.6} opacity={0}>
        <Txt ref={stripLabel} text="ПОТЕРЯ = СИГНАЛ ПЕРЕГРУЗКИ" fill={colors.orange}
          fontSize={20} fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.3}/>
      </Rect>
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* group().opacity(1, IN, easeOutCubic);
  }

  function* wire(): ThreadGenerator {
    wirePacket().position([-PANEL.x - 150, -16]).opacity(0);
    yield* all(
      wirePacket().opacity(1, 0.2, easeOutCubic),
      noiseStrike().end(1, 0.5, easeOutCubic),
    );
    yield* wirePacket().position([-PANEL.x + 150, -16], 1.5, easeInOutCubic);
    yield* all(
      wirePacket().opacity(0, 0.25),
      wireVerdict().opacity(1, LIGHT, easeOutCubic),
    );
  }

  function* queue(): ThreadGenerator {
    queuePacket().position([PANEL.x - 150, -16]).opacity(0).scale(1)
      .fill(withAlpha(accent, 0.3)).stroke(accent);
    yield* queuePacket().opacity(1, 0.2, easeOutCubic);
    yield* queuePacket().position([PANEL.x - 24, -16], 1.0, easeInOutCubic);
    // Отвергают его у самой очереди — там, где она переполнена.
    queuePacket().fill(withAlpha(colors.red, 0.3)).stroke(colors.red);
    yield* all(
      queuePacket().position([PANEL.x - 52, 96], 0.8, easeInCubic),
      queuePacket().opacity(0, 0.8, easeInCubic),
      queuePacket().scale(0.7, 0.8),
      queueVerdict().opacity(1, LIGHT, easeOutCubic),
    );
    yield* strip().opacity(1, LIGHT, easeOutCubic);
  }

  function* slowDown(): ThreadGenerator {
    yield* stripLabel().opacity(0, 0.2, easeInOutCubic);
    stripLabel().text('ЗНАЧИТ, НАДО ПРИТОРМОЗИТЬ');
    yield* stripLabel().opacity(1, 0.35, easeOutCubic);
    yield* waitFor(0);
  }

  function* dismiss(): ThreadGenerator {
    yield* all(
      group().opacity(0, 0.55, easeInOutCubic),
      group().y(group().y() - 26, 0.55, easeInOutCubic),
    );
  }

  return {node, appear, wire, queue, slowDown, dismiss};
}
