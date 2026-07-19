import {Layout, Line, makeScene2D, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, easeOutBack, easeOutCubic, waitUntil} from '@motion-canvas/core';
import {colors, createStage, endScene, fonts, revealStage, sceneCaption, withAlpha} from '@lib';
import {standardsWays} from '../std';

/** A small implementation box that plugs into the shared interface. */
function Impl({label, accent, x, implRef}: {
  label: string; accent: string; x: number; implRef: ReturnType<typeof createRef<Node>>;
}) {
  return (
    <Node ref={implRef} x={x} y={110} opacity={0}>
      <Line points={[[0, -26], [0, -96]]} lineWidth={1.5} lineDash={[4, 5]} stroke={withAlpha(colors.cyan, 0.5)}/>
      <Rect layout radius={8} padding={[9, 14]} fill={colors.track} stroke={accent} lineWidth={2}>
        <Txt text={label} fill={colors.text} fontSize={18} fontFamily={fonts.mono}/>
      </Rect>
    </Node>
  );
}

export default makeScene2D(function* (view) {
  const stage = createStage(view);
  stage.opacity(0);

  const ways = standardsWays({y: 30});

  // Opener: a standard is about compatibility (one interface, many implementations).
  const opener = createRef<Node>();
  const iface = createRef<Node>();
  const implA = createRef<Node>();
  const implB = createRef<Node>();
  const implC = createRef<Node>();
  const caption = sceneCaption({text: 'стандарт — это не «как сделать хорошо»', y: -380, fontSize: 27});

  stage.add(ways.node);
  stage.add(
    <Node ref={opener}>
      <Node ref={iface} y={-20} opacity={0} scale={0.9}>
        <Rect layout radius={10} padding={[12, 22]} fill={withAlpha(colors.cyan, 0.12)}
          stroke={colors.cyan} lineWidth={2} shadowColor={withAlpha(colors.cyan, 0.4)} shadowBlur={10}>
          <Txt text="совместимый интерфейс" fill={colors.cyan} fontSize={24} fontWeight={600} fontFamily={fonts.mono}/>
        </Rect>
      </Node>
      <Impl label="реализация A" accent={colors.purple} x={-250} implRef={implA}/>
      <Impl label="реализация B" accent={colors.orange} x={0} implRef={implB}/>
      <Impl label="провайдер C" accent={colors.blue} x={250} implRef={implC}/>
    </Node>,
  );
  stage.add(caption.node);

  // "стандарт не описывает, как сделать хорошо — только что нужно для совместимости"
  yield* waitUntil('whatis');
  yield* all(
    revealStage(stage),
    caption.appear(),
    iface().opacity(1, 0.6, easeOutCubic), iface().scale(1, 0.6, easeOutBack),
    implA().opacity(1, 0.6, easeOutCubic), implB().opacity(1, 0.6, easeOutCubic),
  );

  // "…как реализуешь — может отличаться от провайдера/компании"
  yield* waitUntil('impls');
  yield* all(implC().opacity(1, 0.5, easeOutCubic), caption.retitle('…а совместимость — реализации разные'));

  // "глобально стандарты бывают двух видов"
  yield* waitUntil('twokinds');
  yield* all(opener().opacity(0, 0.6, easeOutCubic), caption.node.opacity(0, 0.4), ways.appear());

  // de-facto — "возникли из ниоткуда, приняла индустрия"
  yield* waitUntil('defacto');
  yield* ways.defacto();

  // "классический пример — HTTP: придумал разработчик, тихо распространился сам"
  yield* waitUntil('http');
  yield* ways.http();

  // "де-факто: сначала сделали, потом стандартизировали"
  yield* waitUntil('dfacto');
  yield* ways.dfactoDone();

  // "а OSI — другая история: придумывали изначально комитетом"
  yield* waitUntil('dejure');
  yield* ways.dejure();

  // "де-юре: сначала утвердили, потом требовали к разработке"
  yield* waitUntil('dejure2');
  yield* ways.dejureDone();

  yield* endScene(stage);
});
