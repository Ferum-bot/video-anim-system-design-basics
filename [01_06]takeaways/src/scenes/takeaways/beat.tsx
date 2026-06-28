import {Node, Rect, Txt} from '@motion-canvas/2d';
import {all, easeOutBack} from '@motion-canvas/core';
import type {Reference, ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts} from '@lib';

/**
 * One takeaway beat: its node tree, the reveal animation, and an optional endless
 * background loop (forked by the scene so it outlives `play()`).
 */
export interface Beat {
  node: Node;
  play(): ThreadGenerator;
  loop?(): ThreadGenerator;
}

// Each beat lives inside one compact bordered block; the metaphor visual is scaled
// down to fit, with the takeaway sentence pinned near the block's bottom.
const BW = 860; // block width
const BH = 520; // block height
const CONTENT_Y = -30; // vertical offset of the scaled visual inside the block
const CONTENT_S = 0.78; // visual scale inside the block
const SENT_Y = 200; // sentence position inside the block

/** The takeaway sentence pinned near the bottom of a beat's block. */
function sentence(ref: Reference<Txt>, text: string) {
  return (
    <Txt ref={ref} text={text} y={SENT_Y} fill={colors.textDim}
      fontSize={28} fontWeight={600} fontFamily={fonts.mono} opacity={0}/>
  );
}

export interface BeatBlockOptions {
  /** Captures the frame so `play()` can pop it in via {@link showBlock}. */
  block: Reference<Rect>;
  /** One accent colour per concept — also the frame's border. */
  accent: string;
  /** Caption ref + text, revealed at the end of `play()`. */
  caption: Reference<Txt>;
  captionText: string;
  /** The metaphor visual, scaled down to sit inside the frame. */
  content: Node;
}

/**
 * The shell every beat shares: an accent-bordered, transparent-fill frame holding
 * the scaled metaphor visual plus the takeaway sentence. Build the visual once as
 * `content`; the beat's `play()` then animates the refs it captured inside it.
 */
export function beatBlock({block, accent, caption, captionText, content}: BeatBlockOptions): Node {
  return (
    <Node>
      <Rect ref={block} width={BW} height={BH} radius={22} y={24} fill={null}
        stroke={accent} lineWidth={2} opacity={0} scale={0.92}>
        <Node y={CONTENT_Y} scale={CONTENT_S}>{content}</Node>
        {sentence(caption, captionText)}
      </Rect>
    </Node>
  );
}

/** Reveal a beat's frame: pop the scale and fade in together. */
export function* showBlock(block: Rect): ThreadGenerator {
  yield* all(block.scale(1, 0.5, easeOutBack), block.opacity(1, 0.5));
}
