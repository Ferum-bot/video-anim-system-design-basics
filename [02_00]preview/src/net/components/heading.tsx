import {Layout, Line, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, easeOutCubic} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';
import {PANEL_WIDTH} from '../metrics';

const RULE_WIDTH = PANEL_WIDTH;
const FADE_IN = 0.9;
const DRAW = 0.8;

export interface HeadingOptions {
  /** Small mono eyebrow above the title, e.g. `MODEL // OSI`. */
  caption: string;
  title: string;
  accent?: string;
  y: number;
}

/**
 * The scene heading in the blueprint language: a mono eyebrow with a leading tick, a
 * title, and a thin accent rule that draws in beneath it.
 */
export function sceneHeading(options: HeadingOptions): Widget {
  const {caption, title, accent = colors.primary, y} = options;

  const group = createRef<Layout>();
  const rule = createRef<Line>();

  const node = (
    <Layout ref={group} layout direction="column" gap={14} y={y} opacity={0}>
      <Layout layout direction="row" gap={10} alignItems="center">
        <Rect width={9} height={9} fill={accent} shadowColor={accent} shadowBlur={12}/>
        <Txt text={caption} fill={accent} fontSize={20}
          letterSpacing={4} fontFamily={fonts.mono}/>
      </Layout>
      <Txt text={title} fill={colors.text} fontSize={48} fontWeight={600}
        letterSpacing={-0.5} fontFamily={fonts.display}/>
      <Line ref={rule} points={[[0, 0], [RULE_WIDTH, 0]]} lineWidth={2}
        stroke={withAlpha(accent, 0.6)} end={0}/>
    </Layout>
  );

  function* appear(): ThreadGenerator {
    yield* all(
      group().opacity(1, FADE_IN, easeOutCubic),
      rule().end(1, DRAW, easeOutCubic),
    );
  }

  return {node, appear};
}
