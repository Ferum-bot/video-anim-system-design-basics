import {Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, createSignal, easeInOutCubic, easeOutCubic} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '../theme';
import type {Widget} from '../widget';

// One named protocol as a pill. The season shows the same set again and again — the four
// names in the intro, the shelf of episodes, the row of popular protocols — so the shape
// lives here rather than being redrawn per video.
//
// Every chip is the same width whatever its name: a row of them then reads as one set, and
// callers can lay them out arithmetically instead of measuring glyphs.
export const CHIP = {width: 190, height: 56, radius: 999} as const;

const APPEAR = 0.55;
const RISE = 14;
const MOVE = 0.7;
const TONE = 0.3; // brighten / fade timings
const DIM_OPACITY = 0.32;

export interface ProtocolChipOptions {
  /** The protocol's name, e.g. `HTTP`. Uppercase reads best in the mono face. */
  label: string;
  x: number;
  y: number;
  /** Defaults to the theme's signal accent. Pass another to mark a chip as special. */
  accent?: string;
}

export interface ProtocolChip extends Widget {
  /** Travel to another slot — used when a row re-groups mid-scene. */
  moveTo(x: number, y: number): ThreadGenerator;
  /** Full-strength edge and text: this one is being talked about. */
  light(): ThreadGenerator;
  /** Step back so a lit neighbour reads as the subject. */
  dim(): ThreadGenerator;
  /** Return to resting presence. */
  undim(): ThreadGenerator;
  /** Fade out and sink — the row is done. */
  dismiss(): ThreadGenerator;
}

/** A protocol name as a blueprint pill: fixed width, mono label, accent edge. */
export function protocolChip({label, x, y, accent}: ProtocolChipOptions): ProtocolChip {
  const group = createRef<Node>();
  const hot = createSignal(0); // 0 → 1 brightens the edge, fill and label

  const tone = accent ?? colors.cyan;

  const node = (
    <Node ref={group} x={x} y={y + RISE} opacity={0}>
      <Rect
        width={CHIP.width}
        height={CHIP.height}
        radius={CHIP.radius}
        fill={() => withAlpha(tone, 0.07 + hot() * 0.1)}
        stroke={() => withAlpha(tone, 0.45 + hot() * 0.5)}
        lineWidth={1.6}
        shadowColor={withAlpha(tone, 0.45)}
        shadowBlur={() => hot() * 26}
      >
        <Txt
          text={label}
          fill={() => withAlpha(colors.text, 0.75 + hot() * 0.25)}
          fontSize={23}
          fontFamily={fonts.mono}
          fontWeight={500}
          letterSpacing={1.2}
        />
      </Rect>
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* all(
      group().opacity(1, APPEAR, easeOutCubic),
      group().y(group().y() - RISE, APPEAR, easeOutCubic),
    );
  }

  function* moveTo(nextX: number, nextY: number): ThreadGenerator {
    yield* all(
      group().x(nextX, MOVE, easeInOutCubic),
      group().y(nextY, MOVE, easeInOutCubic),
    );
  }

  function* light(): ThreadGenerator {
    yield* hot(1, TONE, easeOutCubic);
  }

  function* dim(): ThreadGenerator {
    yield* group().opacity(DIM_OPACITY, TONE, easeInOutCubic);
  }

  function* undim(): ThreadGenerator {
    yield* group().opacity(1, TONE, easeInOutCubic);
  }

  function* dismiss(): ThreadGenerator {
    yield* all(
      group().opacity(0, TONE, easeInOutCubic),
      group().y(group().y() + RISE, TONE, easeInOutCubic),
    );
  }

  return {node, appear, moveTo, light, dim, undim, dismiss};
}
