import {Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, easeOutCubic} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '../theme';
import {CARD_WIDTH} from '../stage';
import type {Widget} from '../widget';

export interface BannerOptions {
  text: string;
  accent: string;
  /** Resting vertical position; the banner rises into it on appear. */
  y: number;
}

/** A full-width takeaway line that closes a scene. */
export function banner({text, accent, y}: BannerOptions): Widget {
  const ref = createRef<Rect>();

  const node = (
    <Rect
      ref={ref}
      layout
      alignItems="center"
      justifyContent="center"
      padding={[16, 30]}
      width={CARD_WIDTH}
      height={64}
      radius={12}
      fill={withAlpha(accent, 0.12)}
      stroke={accent}
      lineWidth={1.5}
      y={y + 15}
      opacity={0}
    >
      <Txt text={text} fill={colors.textDim} fontSize={23} fontFamily={fonts.mono}/>
    </Rect>
  );

  function* appear(): ThreadGenerator {
    yield* all(
      ref().opacity(1, 0.7, easeOutCubic),
      ref().y(y, 0.7, easeOutCubic),
    );
  }

  return {node, appear};
}
