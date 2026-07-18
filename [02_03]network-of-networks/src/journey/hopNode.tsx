import {Circle, Layout, Node, Txt} from '@motion-canvas/2d';
import {all, createRef, easeOutBack, easeOutCubic} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import {HopGlyph, type HopKind} from './glyphs';

const TILE = 58;
const REVEAL = 0.6;

export interface HopNodeOptions {
  kind: HopKind;
  label: string;
  /** Company / country tag, revealed later by {@link HopNode.tag}. */
  owner: string;
  accent: string;
  x: number;
  y: number;
}

export interface HopNode {
  node: Node;
  /** Centre position, so the route can wire segments to it. */
  pos: [number, number];
  appear(): ThreadGenerator;
  /** Fade in the owner (company · country) tag. */
  tag(): ThreadGenerator;
  /** A ripple ring — radio signal / path-finding emphasis. */
  pulse(): ThreadGenerator;
}

/** A labelled hop on the request's route: a blueprint tile with a schematic glyph. */
export function hopNode(options: HopNodeOptions): HopNode {
  const {kind, label, owner, accent, x, y} = options;

  const tile = createRef<Circle>();
  const glyph = createRef<Node>();
  const labelRef = createRef<Txt>();
  const ownerRef = createRef<Txt>();
  const ripple = createRef<Circle>();

  const node = (
    <Node x={x} y={y}>
      <Circle ref={ripple} size={TILE} stroke={accent} lineWidth={2} opacity={0}/>
      <Circle ref={tile} size={TILE} fill={withAlpha(colors.surface, 0.9)}
        stroke={accent} lineWidth={2} shadowColor={withAlpha(accent, 0.5)} shadowBlur={12}
        scale={0.6} opacity={0}>
        <Node ref={glyph}><HopGlyph kind={kind} color={accent}/></Node>
      </Circle>
      <Txt ref={labelRef} text={label} y={TILE / 2 + 20} fill={colors.text}
        fontSize={19} fontWeight={600} fontFamily={fonts.mono} opacity={0}/>
      <Txt ref={ownerRef} text={owner} y={TILE / 2 + 44} fill={colors.textMuted}
        fontSize={15} fontFamily={fonts.mono} opacity={0}/>
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* all(
      tile().opacity(1, REVEAL, easeOutCubic),
      tile().scale(1, REVEAL, easeOutBack),
      labelRef().opacity(1, REVEAL, easeOutCubic),
    );
  }

  function* tag(): ThreadGenerator {
    yield* ownerRef().opacity(1, 0.5, easeOutCubic);
  }

  function* pulse(): ThreadGenerator {
    ripple().size(TILE).opacity(0.7).scale(1);
    yield* all(
      ripple().scale(2.4, 1.0, easeOutCubic),
      ripple().opacity(0, 1.0, easeOutCubic),
    );
  }

  return {node, pos: [x, y], appear, tag, pulse};
}
