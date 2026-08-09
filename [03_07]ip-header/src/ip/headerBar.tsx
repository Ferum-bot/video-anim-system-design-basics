import {Node, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  delay,
  easeInOutCubic,
  easeOutCubic,
  sequence,
} from '@motion-canvas/core';
import type {SimpleSignal, ThreadGenerator} from '@motion-canvas/core';
import {colors, counter, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// The header drawn the way every RFC diagram draws it: five rows of four bytes. At 4 bytes
// per row even a one-byte field is wide enough to hold its own name, which a single 20-byte
// strip never manages.
const BYTE = 208;
const ROW = {height: 62, gap: 8, count: 5} as const;
const ROW_STEP = ROW.height + ROW.gap;
const BLOCK_TOP = -((ROW.count - 1) * ROW_STEP) / 2;

const TOTAL_Y = BLOCK_TOP - 74;
const ASIDE_Y = BLOCK_TOP + (ROW.count - 1) * ROW_STEP + 88;

// Where the TTL cell parks once the hop chain takes over the floor.
const BADGE_SCALE = 1.1;

const APPEAR = 0.8;
const COUNT_UP = 1.1;
const LIGHT = 0.5;
const ASIDE_IN = 0.5;
const FOCUS = 0.9;

/**
 * Real IPv4 layout. Everything is here so the twenty bytes add up; the fields the narration
 * never names stay unlabelled plates, which is also honest — they exist, they're just not
 * this video's subject.
 */
interface Field {
  key: string;
  row: number;
  start: number;
  size: number;
  label?: string;
  value?: string;
}

const FIELDS: readonly Field[] = [
  {key: 'version', row: 0, start: 0, size: 1, label: 'ВЕРСИЯ', value: '4'},
  {key: 'dscp', row: 0, start: 1, size: 1},
  {key: 'length', row: 0, start: 2, size: 2, label: 'ПОЛНАЯ ДЛИНА', value: '1 500'},
  {key: 'id', row: 1, start: 0, size: 2},
  {key: 'flags', row: 1, start: 2, size: 2},
  {key: 'ttl', row: 2, start: 0, size: 1, label: 'TTL'},
  {key: 'protocol', row: 2, start: 1, size: 1, label: 'ПРОТОКОЛ', value: 'TCP'},
  {key: 'checksum', row: 2, start: 2, size: 2},
  {key: 'src', row: 3, start: 0, size: 4, label: 'АДРЕС ОТПРАВИТЕЛЯ', value: '192.168.0.14'},
  {key: 'dst', row: 4, start: 0, size: 4, label: 'АДРЕС ПОЛУЧАТЕЛЯ', value: '93.184.216.34'},
];

/** The extra line each named field earns when the narration reaches it. */
const ASIDES: Record<string, string> = {
  version: 'IPv4 и IPv6 живут рядом десятилетиями',
  length: 'до 65 535 байт на пакет',
  protocol: 'кому наверху отдать содержимое',
  src: 'откуда и куда — по 4 байта',
  ttl: 'time to live — счётчик прыжков',
};

export interface HeaderBarOptions {
  y: number;
  /** Shared with the hop chain: the header cell and the packet badge are one number. */
  ttl: SimpleSignal<number>;
}

export interface HeaderBar extends Widget {
  /** Count the fixed part up to 20 bytes. */
  count(): ThreadGenerator;
  /** Light a field and bring up the line that goes with it. */
  light(key: string): ThreadGenerator;
  /** Everything but TTL fades; the TTL cell flies out to `to` and keeps ticking. */
  focusTtl(to: [number, number]): ThreadGenerator;
  /**
   * Retire the parked TTL cell. From traceroute on, the budget is written on the probe
   * itself, so the corner copy is just a second number saying the same thing.
   */
  hideTtl(): ThreadGenerator;
}

/** The IPv4 header as the classic five-by-four diagram, lit field by field. */
export function headerBar({y, ttl}: HeaderBarOptions): HeaderBar {
  const group = createRef<Node>();
  const grid = createRef<Node>();
  const totalLabel = createRef<Txt>();
  const aside = createRef<Txt>();

  const cells = new Map<string, Node>();
  const plates = new Map<string, Rect>();
  const lit = new Map<string, SimpleSignal<number>>();
  for (const field of FIELDS) lit.set(field.key, createSignal(0));

  const total = counter(20, value => `${Math.round(value)} БАЙТ ФИКСИРОВАННОЙ ЧАСТИ`);

  const accent = colors.cyan;
  const named = (field: Field) => field.label !== undefined;

  const cellNode = (field: Field) => {
    const on = lit.get(field.key)!;
    const width = field.size * BYTE - 8;
    const cellRef = createRef<Node>();
    const plateRef = createRef<Rect>();
    const node = (
      <Node ref={cellRef}
        x={-2 * BYTE + field.start * BYTE + (field.size * BYTE) / 2}
        y={BLOCK_TOP + field.row * ROW_STEP}>
        <Rect ref={plateRef} width={width} height={ROW.height} radius={8}
          fill={() => withAlpha(accent, 0.06 + on() * 0.2)}
          stroke={() => withAlpha(accent, named(field) ? 0.35 + on() * 0.6 : 0.2)}
          lineWidth={1.5}/>
        {field.label && (
          <Txt y={field.value || field.key === 'ttl' ? -13 : 0} text={field.label}
            fill={() => withAlpha(accent, 0.5 + on() * 0.5)} fontSize={17}
            fontFamily={fonts.mono} letterSpacing={1.2}/>
        )}
        {field.key === 'ttl' ? (
          <Txt y={14} text={() => String(Math.round(ttl()))} fill={colors.text} fontSize={24}
            fontFamily={fonts.mono} fontWeight={600}/>
        ) : field.value ? (
          <Txt y={14} text={field.value} fill={colors.text} fontSize={22}
            fontFamily={fonts.mono} fontWeight={500}/>
        ) : (
          !field.label && <Txt text="···" fill={colors.textMuted} fontSize={20}
            fontFamily={fonts.mono}/>
        )}
        <Txt y={-ROW.height / 2 - 13} text={`${field.size}`} fill={colors.textMuted}
          fontSize={14} fontFamily={fonts.mono} opacity={() => 0.5 + on() * 0.5}/>
      </Node>
    );
    cells.set(field.key, cellRef());
    plates.set(field.key, plateRef());
    return node;
  };

  const node = (
    <Node ref={group} y={y} opacity={0}>
      <Txt ref={totalLabel} y={TOTAL_Y} text={total.text} fill={accent} fontSize={24}
        fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.4} opacity={0}/>

      <Node ref={grid}>{FIELDS.map(cellNode)}</Node>

      <Txt ref={aside} y={ASIDE_Y} text="" fill={colors.textDim} fontSize={23}
        fontFamily={fonts.display} opacity={0}/>
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* group().opacity(1, APPEAR, easeOutCubic);
  }

  function* count(): ThreadGenerator {
    yield* all(totalLabel().opacity(1, LIGHT, easeOutCubic), total.count(COUNT_UP));
  }

  function* light(key: string): ThreadGenerator {
    const text = ASIDES[key];
    const extras: ThreadGenerator[] = [];
    if (key === 'src') extras.push(lit.get('dst')!(1, LIGHT, easeOutCubic));

    yield* all(
      lit.get(key)!(1, LIGHT, easeOutCubic),
      ...extras,
      text ? swapAside(text) : aside().opacity(aside().opacity(), 0),
    );
  }

  function* swapAside(text: string): ThreadGenerator {
    if (aside().opacity() > 0) yield* aside().opacity(0, 0.22, easeInOutCubic);
    aside().text(text);
    yield* aside().opacity(1, ASIDE_IN, easeOutCubic);
  }

  function* focusTtl(to: [number, number]): ThreadGenerator {
    const ttlCell = cells.get('ttl')!;
    const others = FIELDS.filter(field => field.key !== 'ttl').map(field => cells.get(field.key)!);
    yield* all(
      sequence(0.02, ...others.map(cell => cell.opacity(0, 0.5, easeInOutCubic))),
      totalLabel().opacity(0, 0.4, easeInOutCubic),
      aside().opacity(0, 0.4, easeInOutCubic),
      delay(0.25, all(
        ttlCell.position(to, FOCUS, easeInOutCubic),
        ttlCell.scale(BADGE_SCALE, FOCUS, easeInOutCubic),
      )),
    );
  }

  function* hideTtl(): ThreadGenerator {
    yield* cells.get('ttl')!.opacity(0, 0.45, easeInOutCubic);
  }

  return {node, appear, count, light, focusTtl, hideTtl};
}
