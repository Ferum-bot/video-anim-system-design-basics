import {Circle, Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  delay,
  easeInOutCubic,
  easeOutCubic,
  linear,
  range,
} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {CHIP, colors, fonts, protocolChip, withAlpha} from '@lib';
import type {ProtocolChip, Widget} from '@lib';

// «Мы пользуемся ими каждый день» → «работают как минимум три из них». Список имён
// перестраивается в монитор: три протокола, которые обслуживают именно этот просмотр,
// расходятся вниз и тянут линии к узлу «ЭТО ВИДЕО», по которым идёт трафик. «Работают
// прямо сейчас» не написано словами — оно едет по экрану.

// Имена сразу встают в верхний ряд, а узел «ЭТО ВИДЕО» появляется вместе с ними: пустота
// между ними — не дыра, а обещанное место под провода, которые придут на «работают три».
const ROW = {y: -286, step: 212} as const;
const IDLE_STEP = 212; // двое незанятых остаются в том же ряду и сдвигаются к центру
const LIVE = {y: -100, step: 300} as const;
const CAPTION_Y = -44;
const HUB = {y: 274, width: 340, height: 80, radius: 14} as const;

const HUB_RESTING = 0.4; // узел ждёт вполсилы, пока к нему не потянутся провода

// Линии от рабочих чипов к узлу веером, чтобы не сходиться в одну точку. Начинаются под
// подписью, а не под чипом, — иначе провод пришлось бы прятать за текстом.
const LINK_TOP = CAPTION_Y + 22;
const LINK_BOTTOM = HUB.y - HUB.height / 2;
const FAN = 92;
const PACKET = {radius: 6, periods: [1.7, 1.15, 2.2]} as const;

const IN = 0.55;
const OUT = 0.5;

/** Имена в порядке, в котором автор их произносит. */
const NAMES = ['HTTP', 'gRPC', 'DNS', 'WEBSOCKET'] as const;

/**
 * Кто из них работает прямо сейчас, пока зритель смотрит ролик. Порядок слева направо
 * выбран так, чтобы траектории перестроения не пересекались: HTTP уже слева, DNS справа.
 * TLS приезжает пятым — в озвучке он не назван, но это третий из «как минимум трёх»
 * (и заранее сажает мысль, которую автор оплачивает на `16:59`: прикладной уровень
 * закрывает три уровня OSI, и шифрование — один из них).
 */
const LIVE_CHIPS = [
  {label: 'HTTP', caption: 'ТЯНЕТ ЭТОТ КАДР'},
  {label: 'TLS', caption: 'ШИФРУЕТ'},
  {label: 'DNS', caption: 'НАШЁЛ ЭТОТ СЕРВЕР'},
] as const;

export interface LiveMonitor extends Widget {
  /** Перестроение в монитор: узел, линии, подписи. */
  goLive(): ThreadGenerator;
  /** Бесконечный трафик по линиям — форкать через `yield`. */
  run(): ThreadGenerator;
  /** Уход всей группы перед следующим тезисом. */
  dismiss(): ThreadGenerator;
}

/** Четыре знакомых имени, три из которых обслуживают этот самый просмотр. */
export function liveMonitor(): LiveMonitor {
  const group = createRef<Node>();
  const hub = createRef<Rect>();
  const wires = LIVE_CHIPS.map(() => createRef<Node>()); // линия + подпись + пакет
  const lines = LIVE_CHIPS.map(() => createRef<Line>());
  const captions = LIVE_CHIPS.map(() => createRef<Txt>());
  const travel = LIVE_CHIPS.map(() => createSignal(0)); // 0 → 1 гонит пакет по линии

  const accent = colors.cyan;

  /** Центр `index`-го слота в ряду из `count` штук с шагом `step`. */
  const slot = (index: number, count: number, step: number) => (index - (count - 1) / 2) * step;

  const chips: Record<string, ProtocolChip> = {};
  NAMES.forEach((label, index) => {
    chips[label] = protocolChip({label, x: slot(index, NAMES.length, ROW.step), y: ROW.y});
  });
  chips.TLS = protocolChip({label: 'TLS', x: 0, y: LIVE.y});

  const liveX = LIVE_CHIPS.map((_, index) => slot(index, LIVE_CHIPS.length, LIVE.step));
  const hubX = LIVE_CHIPS.map((_, index) => slot(index, LIVE_CHIPS.length, FAN));

  const node = (
    <Node ref={group}>
      {/* Провода мертвы до `goLive`, иначе проступят под списком имён. */}
      {LIVE_CHIPS.map((entry, index) => (
        <Node ref={wires[index]} opacity={0}>
          <Line
            ref={lines[index]}
            points={[[liveX[index], LINK_TOP], [hubX[index], LINK_BOTTOM]]}
            stroke={withAlpha(accent, 0.35)}
            lineWidth={1.6}
            lineDash={[7, 7]}
            end={0}
          />
          <Circle
            width={PACKET.radius * 2}
            height={PACKET.radius * 2}
            fill={accent}
            shadowColor={withAlpha(accent, 0.7)}
            shadowBlur={12}
            x={() => liveX[index] + (hubX[index] - liveX[index]) * travel[index]()}
            y={() => LINK_TOP + (LINK_BOTTOM - LINK_TOP) * travel[index]()}
            opacity={() => Math.sin(Math.PI * travel[index]())}
          />
          <Txt
            ref={captions[index]}
            x={liveX[index]}
            y={CAPTION_Y}
            text={entry.caption}
            fill={colors.textMuted}
            fontSize={17}
            fontFamily={fonts.mono}
            letterSpacing={1.2}
            opacity={0}
          />
        </Node>
      ))}

      <Rect
        ref={hub}
        y={HUB.y}
        width={HUB.width}
        height={HUB.height}
        radius={HUB.radius}
        fill={colors.track}
        stroke={withAlpha(accent, 0.65)}
        lineWidth={1.8}
        opacity={0}
      >
        <Txt text="ЭТО ВИДЕО" fill={colors.text} fontSize={23} fontFamily={fonts.mono}
          fontWeight={500} letterSpacing={1.4}/>
      </Rect>

      {NAMES.map(label => chips[label].node)}
      {chips.TLS.node}
    </Node>
  );

  /** Имена приземляются по одному — ровно как он их перечисляет; узел ждёт под ними. */
  function* appear(): ThreadGenerator {
    yield* all(
      hub().opacity(HUB_RESTING, IN, easeOutCubic),
      ...NAMES.map((label, index) => delay(index * 0.5, chips[label].appear())),
    );
  }

  function* goLive(): ThreadGenerator {
    // Рабочие спускаются к узлу и расходятся, незанятые остаются наверху и притухают.
    yield* all(
      chips.gRPC.moveTo(slot(0, 2, IDLE_STEP), ROW.y),
      chips.WEBSOCKET.moveTo(slot(1, 2, IDLE_STEP), ROW.y),
      delay(0.2, chips.gRPC.dim()),
      delay(0.2, chips.WEBSOCKET.dim()),
      chips.HTTP.moveTo(liveX[0], LIVE.y),
      chips.DNS.moveTo(liveX[2], LIVE.y),
      delay(0.35, chips.TLS.appear()),
    );

    // Узел, провода, подписи — и все три имени зажигаются как одна группа.
    yield* all(
      hub().opacity(1, IN, easeOutCubic),
      ...wires.map(wire => wire().opacity(1, IN, easeOutCubic)),
      delay(0.2, all(...lines.map(line => line().end(1, IN, easeOutCubic)))),
      delay(0.4, all(...captions.map(caption => caption().opacity(1, IN, easeOutCubic)))),
      chips.HTTP.light(),
      chips.TLS.light(),
      chips.DNS.light(),
    );
  }

  /** Пакеты идут по всем трём проводам одновременно, каждый со своим периодом. */
  function* run(): ThreadGenerator {
    yield* all(
      ...range(LIVE_CHIPS.length).map(function* (index): ThreadGenerator {
        while (true) {
          travel[index](0);
          yield* travel[index](1, PACKET.periods[index], linear);
        }
      }),
    );
  }

  function* dismiss(): ThreadGenerator {
    yield* group().opacity(0, OUT, easeInOutCubic);
  }

  return {node, appear, goLive, run, dismiss};
}
