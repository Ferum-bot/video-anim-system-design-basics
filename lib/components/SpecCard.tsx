import {Circle, Layout, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, createSignal, easeOutCubic} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '../theme';
import {CARD_WIDTH} from '../stage';
import {counter} from '../counter';
import {formatThousands} from '../format';
import type {Widget} from '../widget';

const CARD_HEIGHT = 156;
const CONTENT_WIDTH = CARD_WIDTH - 60; // inner width, inside the horizontal padding
const SLIDE_OFFSET = 70; // how far below its resting spot the card starts

// Reveal timings (seconds) — deliberately slow so they read over narration.
const FADE_IN = 1.4;
const SLIDE_IN = 1.6;
const COUNT_UP = 2.8;

/** A small server-rack glyph that takes on the card's accent colour. */
function DeviceIcon({color}: {color: string}) {
  return (
    <Rect layout direction="column" gap={6} padding={[10, 8]}
      width={48} height={92} radius={5}
      fill={colors.surface} stroke={colors.border} lineWidth={1.5}>
      {[0, 1, 2, 3].map(i => (
        <Rect width={32} height={6} radius={2}
          fill={i < 2 ? color : colors.border} opacity={i < 2 ? 0.95 : 0.45}/>
      ))}
      <Circle width={9} height={9} fill={color} opacity={0.8}/>
    </Rect>
  );
}

export interface SpecCardMeter {
  label: string;
  /** Bar fill fraction, 0–1. */
  fill: number;
  /** Number → counts up; string → shown as-is (e.g. `'∞'`). */
  value: number | string;
  format?: (value: number) => string;
}

export interface SpecCardCost {
  /** Number → counts up; string → shown as-is (e.g. `'$0.023'`). */
  value: number | string;
  prefix?: string; // '$' | '~$' — default '$'
  note?: string; // small line under the price — default '/ мес'
}

export interface SpecCardOptions {
  name: string;
  tag: string;
  spec: string; // secondary line under the name
  accent: string;
  /** Resting vertical position; the card slides up into it on appear. */
  y: number;
  meter: SpecCardMeter;
  /** Omit to hide the price block entirely (e.g. bandwidth cards). */
  cost?: SpecCardCost;
  /** Multiplier on the reveal durations; `1.5` makes `appear()` 1.5× slower. */
  pace?: number;
}

/**
 * The headline card used across compute / storage / network scenes: an icon, a
 * name + tag, a spec line, an optional counting price, and a labelled meter bar.
 */
export function specCard(options: SpecCardOptions): Widget {
  const {name, tag, spec, accent, y, meter, cost, pace = 1} = options;

  const card = createRef<Rect>();
  const fill = createSignal(0);
  const meterValue = counter(meter.value, meter.format);
  const costValue = cost
    ? counter(cost.value, value => `${cost.prefix ?? '$'}${formatThousands(value)}`)
    : undefined;

  const node = (
    <Rect
      ref={card}
      layout
      direction="column"
      gap={16}
      padding={[22, 30]}
      width={CARD_WIDTH}
      height={CARD_HEIGHT}
      radius={12}
      fill={colors.surface}
      stroke={accent}
      lineWidth={2}
      shadowColor={withAlpha(accent, 0.33)}
      shadowBlur={22}
      y={y + SLIDE_OFFSET}
      opacity={0}
    >
      {/* Header: icon + name/tag/spec … optional price */}
      <Layout direction="row" gap={20} alignItems="center" width="100%">
        <DeviceIcon color={accent}/>
        <Layout direction="column" gap={7} grow={1}>
          <Layout direction="row" gap={14} alignItems="center">
            <Txt text={name} fill={colors.text} fontSize={30} fontWeight={700} fontFamily={fonts.mono}/>
            <Rect layout radius={5} fill={withAlpha(accent, 0.15)} padding={[4, 10]}>
              <Txt text={tag} fill={accent} fontSize={17} fontFamily={fonts.mono}/>
            </Rect>
          </Layout>
          <Txt text={spec} fill={colors.textMuted} fontSize={19} fontFamily={fonts.mono}/>
        </Layout>
        {costValue && (
          <Layout direction="column" gap={2} alignItems="end">
            <Txt text={costValue.text} fill={colors.green} fontSize={32} fontWeight={700} fontFamily={fonts.mono}/>
            <Txt text={cost?.note ?? '/ мес'} fill={colors.textMuted} fontSize={17} fontFamily={fonts.mono}/>
          </Layout>
        )}
      </Layout>

      {/* Meter: label + value + progress bar */}
      <Layout direction="column" gap={8} width="100%">
        <Layout direction="row" justifyContent="space-between" alignItems="center" width="100%">
          <Txt text={meter.label} fill={colors.textMuted} fontSize={18} fontFamily={fonts.mono}/>
          <Txt text={meterValue.text} fill={accent} fontSize={24} fontWeight={700} fontFamily={fonts.mono}/>
        </Layout>
        <Rect layout direction="row" alignItems="center"
          width={CONTENT_WIDTH} height={14} radius={7} fill={colors.track}>
          <Rect height={14} radius={7} fill={accent}
            width={() => fill() * CONTENT_WIDTH}
            shadowColor={accent} shadowBlur={10}/>
        </Rect>
      </Layout>
    </Rect>
  );

  function* appear(): ThreadGenerator {
    yield* all(
      card().opacity(1, FADE_IN * pace, easeOutCubic),
      card().y(y, SLIDE_IN * pace, easeOutCubic),
    );

    const counts: ThreadGenerator[] = [
      fill(meter.fill, COUNT_UP * pace, easeOutCubic),
      meterValue.count(COUNT_UP * pace),
    ];
    if (costValue) counts.push(costValue.count(COUNT_UP * pace));
    yield* all(...counts);
  }

  return {node, appear};
}
