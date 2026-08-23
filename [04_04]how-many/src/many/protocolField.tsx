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
import {CHIP, colors, counter, fonts, formatThousands, protocolChip, withAlpha} from '@lib';
import type {Counter, ProtocolChip, Widget} from '@lib';

// «Сколько их вообще?» → единого списка нет → два официальных счётчика → и среди всего
// этого — горстка, которой пользуются все. Поле безымянных точек с сужающимся интервалом
// делает «их слишком много, чтобы считать» видимым; из него же потом всплывают семь имён,
// и четыре из них — те же бирки, что приземлялись в интро на `00:32.5`.
const NOLIST = {width: 560, height: 128, radius: 14, y: -100} as const;
const OWN_CHIP = {width: 300, height: 62, radius: 999, y: 70} as const;

const PLATE = {width: 380, height: 168, radius: 16, y: 0, x: 208} as const;

// Поле «их не сосчитать»: точки сыплются пачками, а зазор между пачками всё короче.
const SWARM = {count: 820, spanX: 890, spanY: 640, bursts: 18} as const;

// Семь популярных, двумя рядами 4 + 3. Ряд из четырёх — это 826 единиц, то есть предел
// колонки: шире бирки не разложить, поэтому блок и остаётся приземистым.
const ROW = {top: -31, bottom: 159} as const;
const SHELF_TITLE_Y = -177;

const IN = 0.55;
const OUT = 0.45;
const TONE = 0.4;

interface Slot {
  label: string;
  x: number;
  y: number;
}

/** Порядок — тот, в котором автор их произносит. */
const POPULAR: Slot[] = [
  {label: 'HTTP', x: -318, y: ROW.top},
  {label: 'GraphQL', x: -106, y: ROW.top},
  {label: 'gRPC', x: 106, y: ROW.top},
  {label: 'DNS', x: 318, y: ROW.top},
  {label: 'WEBSOCKET', x: -212, y: ROW.bottom},
  {label: 'SSE', x: 0, y: ROW.bottom},
  {label: 'WEBRTC', x: 212, y: ROW.bottom},
];

/** GraphQL и gRPC — надстройки поверх HTTP; скобка это и говорит. */
const OVER_HTTP = [1, 2];

export interface ProtocolField extends Widget {
  /** «Единого списка не существует». */
  noList(): ThreadGenerator;
  /** «Каждый может придумать свой» — пустая бирка с курсором. */
  ownChip(): ThreadGenerator;
  /** Мигание курсора — форкать через `yield`. */
  blink(): ThreadGenerator;
  /** Плашка счётчика: 0 — RFC, 1 — IANA. */
  plate(index: number): ThreadGenerator;
  /** Число набегает. */
  count(index: number): ThreadGenerator;
  /** Поле безымянных точек — их не сосчитать. */
  swarm(): ThreadGenerator;
  /** Счётчики уходят, кадр остаётся под имена. */
  clear(): ThreadGenerator;
  /** Очередное имя всплывает из поля. */
  rise(index: number): ThreadGenerator;
  /** Скобка «ПОВЕРХ HTTP» под GraphQL и gRPC. */
  overHttp(): ThreadGenerator;
  /** Семь бирок становятся полкой эпизодов. */
  shelf(): ThreadGenerator;
}

/** Масштаб прикладного уровня — и горстка, которой из него пользуются. */
export function protocolField(): ProtocolField {
  const group = createRef<Node>();
  const noListPlate = createRef<Rect>();
  const own = createRef<Rect>();
  const caret = createRef<Rect>();
  const plates = range(2).map(() => createRef<Rect>());
  const dots = range(SWARM.count).map(() => createRef<Circle>());
  const bracket = createRef<Line>();
  const bracketLabel = createRef<Txt>();
  const numbers = POPULAR.map(() => createRef<Txt>());
  const shelfTitle = createRef<Txt>();

  const accent = colors.cyan;
  const counters = [counter(9700, formatThousands), counter(6000, formatThousands)];
  const plateCopy = [
    {title: 'ВСЕГО RFC', note: 'ДОКУМЕНТЫ СТАНДАРТОВ', suffix: '+'},
    {title: 'РЕЕСТР ПОРТОВ IANA', note: 'ЗАРЕГИСТРИРОВАННЫЕ СЕРВИСЫ', suffix: ''},
  ];

  // `Counter.text` — сигнал: у числового счётчика это функция, у статического строка.
  // Интерполировать его напрямую нельзя, иначе в кадр уезжает исходник функции.
  const read = (item: Counter) => (typeof item.text === 'function' ? item.text() : item.text);

  const chips: ProtocolChip[] = POPULAR.map(slot =>
    protocolChip({label: slot.label, x: slot.x, y: slot.y}),
  );

  // Псевдослучайная, но стабильная от кадра к кадру раскладка точек.
  const scatter = (index: number, salt: number) => {
    const v = Math.sin((index + 1) * (12.9898 + salt) + salt * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };

  const bracketLeft = POPULAR[OVER_HTTP[0]].x - CHIP.width / 2;
  const bracketRight = POPULAR[OVER_HTTP[1]].x + CHIP.width / 2;
  const bracketY = ROW.top + CHIP.height / 2 + 22;

  const node = (
    <Node ref={group}>
      {/* Поле лежит под всем остальным: имена потом всплывают именно из него. */}
      {range(SWARM.count).map(index => (
        <Circle
          ref={dots[index]}
          width={4}
          height={4}
          fill={withAlpha(accent, 0.5)}
          x={(scatter(index, 1) - 0.5) * SWARM.spanX}
          y={(scatter(index, 2) - 0.5) * SWARM.spanY}
          opacity={0}
        />
      ))}

      <Rect ref={noListPlate} y={NOLIST.y} width={NOLIST.width} height={NOLIST.height}
        radius={NOLIST.radius} fill={colors.track} stroke={withAlpha(colors.textMuted, 0.5)}
        lineWidth={1.6} opacity={0}>
        <Txt y={-24} text="ЕДИНЫЙ СПИСОК ПРОТОКОЛОВ" fill={colors.textMuted} fontSize={20}
          fontFamily={fonts.mono} letterSpacing={1.3}/>
        <Line points={[[-NOLIST.width / 2 + 40, -24], [NOLIST.width / 2 - 40, -24]]}
          stroke={colors.red} lineWidth={2.2}/>
        <Txt y={26} text="НЕ СУЩЕСТВУЕТ" fill={colors.red} fontSize={24} fontFamily={fonts.mono}
          fontWeight={600} letterSpacing={1.6}/>
      </Rect>

      {/* «Каждый может придумать свой» — та же пустая строка с курсором, что закрывала [04_03]. */}
      <Rect ref={own} y={OWN_CHIP.y} width={OWN_CHIP.width} height={OWN_CHIP.height}
        radius={OWN_CHIP.radius} stroke={withAlpha(accent, 0.6)} lineWidth={1.6}
        lineDash={[8, 7]} opacity={0}>
        <Rect ref={caret} x={-110} width={3} height={26} fill={accent}/>
        <Txt y={54} text="ТВОЙ ПРОТОКОЛ" fill={colors.textMuted} fontSize={15}
          fontFamily={fonts.mono} letterSpacing={1.2}/>
      </Rect>

      {range(2).map(index => (
        <Rect ref={plates[index]} y={PLATE.y} x={(index * 2 - 1) * PLATE.x}
          width={PLATE.width} height={PLATE.height} radius={PLATE.radius}
          fill={colors.track} stroke={withAlpha(accent, 0.6)} lineWidth={1.8} opacity={0}>
          <Txt y={-52} text={plateCopy[index].title} fill={colors.textDim} fontSize={17}
            fontFamily={fonts.mono} letterSpacing={1.3}/>
          <Txt y={4} text={() => `${read(counters[index])}${plateCopy[index].suffix}`}
            fill={accent} fontSize={52} fontFamily={fonts.mono} fontWeight={600}/>
          <Txt y={52} text={plateCopy[index].note} fill={colors.textMuted} fontSize={14}
            fontFamily={fonts.mono} letterSpacing={1.2}/>
        </Rect>
      ))}

      <Line ref={bracket}
        points={[
          [bracketLeft, bracketY - 12],
          [bracketLeft, bracketY],
          [bracketRight, bracketY],
          [bracketRight, bracketY - 12],
        ]}
        stroke={withAlpha(accent, 0.55)} lineWidth={2} lineCap="round" opacity={0}/>
      <Txt ref={bracketLabel} x={(bracketLeft + bracketRight) / 2} y={bracketY + 20}
        text="ПОВЕРХ HTTP" fill={colors.textMuted} fontSize={15} fontFamily={fonts.mono}
        letterSpacing={1.2} opacity={0}/>

      {chips.map(chip => chip.node)}

      {POPULAR.map((slot, index) => (
        <Txt ref={numbers[index]} x={slot.x} y={slot.y - CHIP.height / 2 - 20}
          text={String(index + 1).padStart(2, '0')} fill={withAlpha(accent, 0.8)}
          fontSize={16} fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.4}
          opacity={0}/>
      ))}

      <Txt ref={shelfTitle} y={SHELF_TITLE_Y} text="СЕЗОН · 7 ВЫПУСКОВ"
        fill={colors.textDim} fontSize={19} fontFamily={fonts.mono} letterSpacing={1.6}
        opacity={0}/>
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* noList();
  }

  function* noList(): ThreadGenerator {
    yield* noListPlate().opacity(1, IN, easeOutCubic);
  }

  function* ownChip(): ThreadGenerator {
    yield* own().opacity(1, IN, easeOutCubic);
  }

  function* blink(): ThreadGenerator {
    while (true) {
      yield* caret().opacity(0, 0.01);
      yield* caret().opacity(0, 0.45);
      yield* caret().opacity(1, 0.01);
      yield* caret().opacity(1, 0.45);
    }
  }

  function* plate(index: number): ThreadGenerator {
    if (index === 0) {
      yield* all(
        noListPlate().opacity(0, OUT),
        own().opacity(0, OUT),
        delay(0.2, plates[0]().opacity(1, IN, easeOutCubic)),
      );
      return;
    }
    yield* plates[index]().opacity(1, IN, easeOutCubic);
  }

  function* count(index: number): ThreadGenerator {
    yield* counters[index].count(2.2);
  }

  /** Точки сыплются пачками, и зазор между пачками всё короче — «и ещё, и ещё». */
  function* swarm(): ThreadGenerator {
    const perBurst = Math.ceil(SWARM.count / SWARM.bursts);
    for (let burst = 0; burst < SWARM.bursts; burst++) {
      const from = burst * perBurst;
      const slice = dots.slice(from, from + perBurst);
      yield* all(...slice.map(dot => dot().opacity(0.55, 0.3, easeOutCubic)));
      yield* waitFor(Math.max(0.015, 0.1 * (1 - burst / SWARM.bursts)));
    }
  }

  function* clear(): ThreadGenerator {
    yield* all(
      ...plates.map(item => item().opacity(0, OUT, easeInOutCubic)),
      ...dots.map(dot => dot().opacity(0.16, OUT, easeInOutCubic)),
    );
  }

  function* rise(index: number): ThreadGenerator {
    yield* chips[index].appear();
    yield* chips[index].light();
  }

  function* overHttp(): ThreadGenerator {
    yield* all(
      bracket().opacity(1, TONE, easeOutCubic),
      delay(0.15, bracketLabel().opacity(1, TONE, easeOutCubic)),
    );
  }

  function* shelf(): ThreadGenerator {
    yield* all(
      bracket().opacity(0, OUT),
      bracketLabel().opacity(0, OUT),
      ...dots.map(dot => dot().opacity(0, OUT)),
    );
    yield* all(
      ...numbers.map((number, index) =>
        delay(index * 0.1, number().opacity(1, 0.35, easeOutCubic)),
      ),
      delay(0.5, shelfTitle().opacity(1, 0.5, easeOutCubic)),
    );
  }

  return {
    node,
    appear,
    noList,
    ownChip,
    blink,
    plate,
    count,
    swarm,
    clear,
    rise,
    overHttp,
    shelf,
  };
}
