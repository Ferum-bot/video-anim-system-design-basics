import {Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, easeOutCubic} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts} from '../theme';
import type {Widget} from '../widget';

export interface SceneTitleOptions {
  title: string;
  subtitle: string;
  /** Colour of the underline rule. */
  accent: string;
}

/** The heading at the top of every scene: title, subtitle and an accent rule. */
export function sceneTitle({title, subtitle, accent}: SceneTitleOptions): Widget {
  const titleRef = createRef<Txt>();
  const subtitleRef = createRef<Txt>();
  const ruleRef = createRef<Rect>();

  const node = (
    <Node>
      <Txt ref={titleRef} text={title} fill={colors.text}
        fontSize={44} fontWeight={700} fontFamily={fonts.mono} y={-470} opacity={0}/>
      <Txt ref={subtitleRef} text={subtitle} fill={colors.textMuted}
        fontSize={24} fontFamily={fonts.mono} y={-425} opacity={0}/>
      <Rect ref={ruleRef} width={0} height={2} radius={1} fill={accent} y={-400} opacity={0}/>
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* titleRef().opacity(1, 0.7, easeOutCubic);
    yield* all(
      subtitleRef().opacity(1, 0.6, easeOutCubic),
      ruleRef().opacity(1, 0.3),
      ruleRef().width(760, 0.7, easeOutCubic),
    );
  }

  return {node, appear};
}
