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
  waitFor,
} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {CHIP, colors, fonts, protocolChip, withAlpha} from '@lib';
import type {Widget} from '@lib';

// Прикладной этаж крупным планом: он не только про приложения, в нём живут и служебные
// протоколы для самих же прикладных. Весь смысл — в направлении стрелок. Во всём видео
// они идут вниз, по лифту; здесь HTTP и ПОЧТА тянутся к DNS **горизонтально, не покидая
// этаж**, и только получив ответ уходят вниз. Одна горизонтальная стрелка объясняет
// «протокол, который обслуживает протоколы» быстрее любой подписи.
const ROOM = {width: 880, height: 680, radius: 18} as const;
const TITLE_Y = -ROOM.height / 2 + 38;

// Две полки бок о бок: слева жильцы, справа обслуга. Разделены пунктиром.
const SHELF = {left: -210, right: 250, headerY: -204} as const;

// `liftX` — куда каждый уходит вниз. Верхний обязан отойти в сторону: иначе его линия
// прошивает чип соседа насквозь.
const CLIENTS = [
  {label: 'HTTP', y: -100, liftX: -380},
  {label: 'ПОЧТА', y: 20, liftX: -210},
] as const;
const DNS_Y = -40;

// Лифт вниз рисуется **внутри** комнаты и упирается в её нижнюю кромку: так видно, что
// этаж покидают только после ответа, и композиция не вылезает за габарит одного объекта.
const LIFT_Y = 238;
const FLOOR_Y = 256;

const IN = 0.6;
const TONE = 0.4;

export interface AppRoom extends Widget {
  /** Полка «ДЛЯ ПРИЛОЖЕНИЙ» получает жильцов. */
  tenants(): ThreadGenerator;
  /** Вторая полка получает имя. */
  service(): ThreadGenerator;
  /** На служебную полку садится DNS. */
  dns(): ThreadGenerator;
  /** Стрелки к DNS и вниз по лифту. */
  serves(): ThreadGenerator;
  /** Бесконечный трафик по этим стрелкам — форкать через `yield`. */
  traffic(): ThreadGenerator;
  /** «Без него не работает ни веб, ни почта» — и обратно. */
  dead(): ThreadGenerator;
  dismiss(): ThreadGenerator;
}

/** Прикладной этаж как комната с двумя полками. */
export function appRoom(): AppRoom {
  const group = createRef<Node>();
  const room = createRef<Rect>();
  const divider = createRef<Line>();
  const leftHeader = createRef<Txt>();
  const rightHeader = createRef<Txt>();
  const asks = CLIENTS.map(() => createRef<Line>());
  const lifts = CLIENTS.map(() => createRef<Line>());
  const travel = CLIENTS.map(() => createSignal(0)); // 0…1 запрос, 1…2 ответ, 2…3 лифт
  const alive = createSignal(1); // 1 — DNS отвечает, 0 — его нет

  const accent = colors.cyan;
  const chips = CLIENTS.map(entry =>
    protocolChip({label: entry.label, x: SHELF.left, y: entry.y}),
  );
  const dnsChip = protocolChip({label: 'DNS', x: SHELF.right, y: DNS_Y});

  const askFrom = SHELF.left + CHIP.width / 2 + 10;
  const askTo = SHELF.right - CHIP.width / 2 - 10;

  /** Фаза 0…1 — к DNS, 1…2 — обратно, 2…3 — вниз по лифту. */
  const dot = (index: number) => {
    const t = travel[index];
    const y = CLIENTS[index].y;
    return {
      x: () => {
        const p = t();
        if (p <= 1) return askFrom + (askTo - askFrom) * p;
        if (p <= 2) return askTo - (askTo - askFrom) * (p - 1);
        return SHELF.left + (CLIENTS[index].liftX - SHELF.left) * Math.min(1, (p - 2) * 3);
      },
      y: () => {
        const p = t();
        if (p <= 1) return y + (DNS_Y - y) * p;
        if (p <= 2) return DNS_Y + (y - DNS_Y) * (p - 1);
        return y + (LIFT_Y - y) * (p - 2);
      },
      opacity: () => {
        const p = t();
        const fade = p <= 2 ? Math.sin(Math.PI * (p % 1 || 1)) : 1 - (p - 2);
        return Math.max(0, fade) * alive();
      },
    };
  };

  const node = (
    <Node ref={group} opacity={0}>
      <Rect ref={room} width={ROOM.width} height={ROOM.height} radius={ROOM.radius}
        fill={colors.track} stroke={withAlpha(accent, 0.65)} lineWidth={2}>
        <Txt y={TITLE_Y} x={-ROOM.width / 2 + 34} offsetX={-1} text="ПРИКЛАДНОЙ УРОВЕНЬ"
          fill={withAlpha(colors.text, 0.9)} fontSize={25} fontFamily={fonts.mono}
          fontWeight={500} letterSpacing={1.4}/>

        {/* Нижняя кромка этажа: за неё уходят по лифту, к транспорту. */}
        <Line points={[[-ROOM.width / 2 + 40, FLOOR_Y], [ROOM.width / 2 - 40, FLOOR_Y]]}
          stroke={withAlpha(colors.textMuted, 0.35)} lineWidth={1.6} lineDash={[9, 8]}/>
        <Txt y={FLOOR_Y + 32} text="ВНИЗ, К ТРАНСПОРТУ" fill={colors.textMuted} fontSize={15}
          fontFamily={fonts.mono} letterSpacing={1.3}/>
      </Rect>

      <Line ref={divider} points={[[30, -ROOM.height / 2 + 84], [30, FLOOR_Y - 12]]}
        stroke={withAlpha(accent, 0.25)} lineWidth={1.6} lineDash={[8, 8]} opacity={0}/>

      <Txt ref={leftHeader} x={SHELF.left} y={SHELF.headerY} text="ДЛЯ ПРИЛОЖЕНИЙ"
        fill={colors.textMuted} fontSize={17} fontFamily={fonts.mono} letterSpacing={1.3}
        opacity={0}/>
      <Txt ref={rightHeader} x={SHELF.right} y={SHELF.headerY} text="СЛУЖЕБНЫЕ"
        fill={colors.textMuted} fontSize={17} fontFamily={fonts.mono} letterSpacing={1.3}
        opacity={0}/>

      {/* Горизонтальные — к DNS; вертикальные — вниз, за пределы этажа. */}
      {CLIENTS.map((entry, index) => (
        <Node>
          <Line ref={asks[index]}
            points={[[askFrom, entry.y], [askTo, DNS_Y]]}
            stroke={() => withAlpha(alive() > 0.5 ? accent : colors.red, 0.45)}
            lineWidth={1.6} lineDash={[7, 6]} end={0} opacity={0}/>
          <Line ref={lifts[index]}
            points={[
              [SHELF.left, entry.y + CHIP.height / 2 + 8],
              [entry.liftX, entry.y + CHIP.height / 2 + 42],
              [entry.liftX, LIFT_Y],
            ]}
            stroke={withAlpha(colors.textMuted, 0.4)}
            lineWidth={1.6} lineDash={[7, 6]} end={0} opacity={0}/>
          <Circle width={11} height={11} fill={accent}
            shadowColor={withAlpha(accent, 0.7)} shadowBlur={10}
            x={dot(index).x} y={dot(index).y} opacity={dot(index).opacity}/>
        </Node>
      ))}

      {chips.map(chip => chip.node)}
      {dnsChip.node}
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* group().opacity(1, IN, easeOutCubic);
  }

  function* tenants(): ThreadGenerator {
    yield* all(
      leftHeader().opacity(1, TONE, easeOutCubic),
      divider().opacity(1, TONE, easeOutCubic),
      ...chips.map((chip, index) => delay(index * 0.25, chip.appear())),
    );
  }

  function* service(): ThreadGenerator {
    yield* rightHeader().opacity(1, TONE, easeOutCubic);
  }

  function* dns(): ThreadGenerator {
    yield* dnsChip.appear();
    yield* dnsChip.light();
  }

  function* serves(): ThreadGenerator {
    yield* all(
      ...asks.map((ask, index) => delay(index * 0.2, all(
        ask().opacity(1, TONE),
        ask().end(1, IN, easeOutCubic),
      ))),
    );
    yield* all(
      ...lifts.map(lift => all(lift().opacity(1, TONE), lift().end(1, TONE, easeOutCubic))),
    );
  }

  /** Запрос → ответ → вниз, у каждого клиента со своим периодом. */
  function* traffic(): ThreadGenerator {
    yield* all(
      ...range(CLIENTS.length).map(function* (index): ThreadGenerator {
        yield* waitFor(index * 0.7);
        while (true) {
          travel[index](0);
          yield* travel[index](3, 3.2, linear);
          yield* waitFor(0.5);
        }
      }),
    );
  }

  /** DNS гаснет — и вместе с ним обе стрелки и оба жильца. Потом возвращается. */
  function* dead(): ThreadGenerator {
    yield* all(
      alive(0, 0.35, easeInOutCubic),
      dnsChip.dim(),
      ...chips.map(chip => chip.dim()),
    );
    yield* waitFor(1.4);
    yield* all(
      alive(1, 0.4, easeOutCubic),
      dnsChip.undim(),
      ...chips.map(chip => chip.undim()),
    );
  }

  function* dismiss(): ThreadGenerator {
    yield* group().opacity(0, 0.55, easeInOutCubic);
  }

  return {node, appear, tenants, service, dns, serves, traffic, dead, dismiss};
}
