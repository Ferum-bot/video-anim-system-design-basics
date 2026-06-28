import {Circle, Layout, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, easeOutBack, easeOutCubic} from '@motion-canvas/core';
import type {PossibleVector2, ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';

// ── Button geometry ───────────────────────────────────────────────────────────
const W = 420;
const H = 92;
const RADIUS = 20;

// ── Reveal / interaction timing ───────────────────────────────────────────────
const POP_IN = 0.5; // scale-in when the button first appears
const PRESS = 0.09; // depth dip while "clicked"
const MORPH = 0.35; // crossfade from unsubscribed → subscribed
const RIPPLE = 0.55; // click ripple expand + fade

export interface SubscribeButton {
  readonly node: Node;
  /** Pop the button in (hidden until then). */
  appear(): ThreadGenerator;
  /** Press, ripple from `clickAt`, then morph to the subscribed state + ring the bell. */
  subscribe(clickAt?: PossibleVector2): ThreadGenerator;
}

/**
 * A YouTube-style subscribe button. Starts as the red "ПОДПИСАТЬСЯ" pill and, on
 * {@link SubscribeButton.subscribe}, ripples under the click and crossfades into the
 * muted "ВЫ ПОДПИСАНЫ" state with a ringing bell.
 */
export function subscribeButton(): SubscribeButton {
  const group = createRef<Node>();
  const pill = createRef<Rect>();
  const unsub = createRef<Txt>();
  const sub = createRef<Layout>();
  const bell = createRef<Txt>();
  const ripple = createRef<Circle>();

  const node = (
    <Node ref={group} scale={0.6} opacity={0}>
      <Rect ref={pill} width={W} height={H} radius={RADIUS} clip
        fill={colors.youtube} stroke={withAlpha(colors.youtube, 0)} lineWidth={2}>
        <Circle ref={ripple} width={W * 1.4} height={W * 1.4}
          fill={colors.text} opacity={0} scale={0}/>
        <Txt ref={unsub} text="ПОДПИСАТЬСЯ" fill={colors.text}
          fontSize={30} fontWeight={800} fontFamily={fonts.sans}/>
        <Layout ref={sub} layout gap={14} alignItems="center" opacity={0}>
          <Txt ref={bell} text="🔔" fontSize={32} fontFamily={fonts.sans}/>
          <Txt text="ВЫ ПОДПИСАНЫ" fill={colors.textMuted}
            fontSize={28} fontWeight={700} fontFamily={fonts.sans}/>
        </Layout>
      </Rect>
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* all(
      group().scale(1, POP_IN, easeOutBack),
      group().opacity(1, POP_IN * 0.8),
    );
  }

  function* subscribe(clickAt: PossibleVector2 = [0, 0]): ThreadGenerator {
    ripple().position(clickAt).scale(0).opacity(0.45);
    yield* group().scale(0.93, PRESS); // press down

    yield* all(
      ripple().scale(1, RIPPLE, easeOutCubic),
      ripple().opacity(0, RIPPLE),
      group().scale(1, 0.22, easeOutBack), // spring back up
      pill().fill(colors.surface, MORPH),
      pill().stroke(colors.border, MORPH),
      unsub().opacity(0, MORPH * 0.6),
      sub().opacity(1, MORPH),
    );

    // bell rings to confirm the subscription
    yield* bell().rotation(-18, 0.08).to(16, 0.12).to(-12, 0.1).to(0, 0.1);
  }

  return {node, appear, subscribe};
}
