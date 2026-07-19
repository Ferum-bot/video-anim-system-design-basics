import {Line, makeScene2D, Node, Txt} from '@motion-canvas/2d';
import {all, createRef, easeOutBack, easeOutCubic, sequence, waitFor, waitUntil} from '@motion-canvas/core';
import {colors, createStage, endScene, fonts, revealStage, withAlpha} from '@lib';
import {hopNode, journeyRoute, worldMap} from '../journey';
import type {HopNodeOptions, RouteSegment} from '../journey';

// ── The hops, in travel order (positions in the centred content column) ──────────
const HOPS: HopNodeOptions[] = [
  {kind: 'phone',  label: 'ТЕЛЕФОН', owner: 'ты',              accent: colors.cyan,   x: -330, y: -210},
  {kind: 'tower',  label: 'ВЫШКА',   owner: 'оператор · RU',   accent: colors.orange, x: -170, y: -250},
  {kind: 'isp',    label: 'ПРОВАЙДЕР', owner: 'ISP · RU',      accent: colors.blue,   x: -280, y: -40},
  {kind: 'router', label: 'ТРАНЗИТ', owner: 'transit · EU',    accent: colors.purple, x: -110, y: -70},
  {kind: 'dc',     label: 'ЦОД',     owner: 'Google · US',     accent: colors.green,  x: 315,  y: -30},
];
const [PHONE, TOWER, ISP, ROUTER, DC] = HOPS.map(h => [h.x, h.y] as [number, number]);

// ── Route segments (each starts where the previous ended); coloured by transport ──
const SEGMENTS: RouteSegment[] = [
  {points: [PHONE, TOWER], style: 'radio', accent: colors.orange},
  {points: [TOWER, ISP], style: 'fiber', accent: colors.cyan},
  {points: [ISP, ROUTER], style: 'link', accent: colors.blue},
  {points: [ROUTER, [30, 210], [200, 225], DC], style: 'subsea', accent: colors.cyan},
];

export default makeScene2D(function* (view) {
  const stage = createStage(view);
  stage.opacity(0); // whole scene (frame + grid + content) fades in below, then endScene fades out

  const map = worldMap();
  const hops = HOPS.map(hopNode);
  const route = journeyRoute(SEGMENTS);

  // Annotations, revealed on their own beats.
  const subseaLabel = createRef<Txt>();
  const oceanFix = createRef<Txt>();
  const altLine = createRef<Line>();
  const altLabel = createRef<Txt>();
  const cheapLabel = createRef<Txt>();
  const controlCaption = createRef<Txt>();
  const annotations = (
    <Node>
      <Txt ref={subseaLabel} text="ПОДВОДНЫЙ КАБЕЛЬ" x={110} y={258} fill={withAlpha(colors.cyan, 0.8)}
        fontSize={15} letterSpacing={2} fontFamily={fonts.mono} opacity={0}/>
      {/* correction for the "на дне интернета" slip of the tongue */}
      <Txt ref={oceanFix} text="дне океана*" x={0} y={378} fill={colors.orange}
        fontSize={56} fontWeight={800} fontFamily={fonts.mono}
        shadowColor={withAlpha(colors.orange, 0.5)} shadowBlur={14} scale={0.8} opacity={0}/>
      <Line ref={altLine} points={[ROUTER, DC]} end={0} lineWidth={2} lineDash={[6, 6]}
        stroke={withAlpha(colors.red, 0.55)}/>
      <Txt ref={altLabel} text="быстрее ✗" x={150} y={-92} fill={withAlpha(colors.red, 0.85)}
        fontSize={16} fontFamily={fonts.mono} opacity={0}/>
      <Txt ref={cheapLabel} text="дешевле ✓" x={235} y={150} fill={colors.green}
        fontSize={17} fontFamily={fonts.mono} opacity={0}/>
      <Txt ref={controlCaption} text="…и всё это ты не контролируешь" y={360} fill={colors.textMuted}
        fontSize={22} fontFamily={fonts.mono} opacity={0}/>
    </Node>
  );

  // Mount everything in a group, nudged up a touch now that there's no heading.
  const content = createRef<Node>();
  stage.add(<Node ref={content} y={-20}/>);
  content().add(map.node); // backdrop
  content().add(route.node); // route sits under the nodes
  hops.forEach(h => content().add(h.node));
  content().add(annotations);

  // t=0 — the whole scene eases in (no abrupt pop), the world appearing with it; then the
  // phone (the question: "что происходит, когда ты скроллишь ленту").
  yield* all(revealStage(stage, 1.2), map.appear());
  yield* hops[0].appear();

  // "…через радиосигнал ближайшей вышки связи"
  yield* waitUntil('tower');
  yield* hops[1].appear();
  yield* all(route.advance(0), hops[1].pulse());

  // "…трансформируется в светосигнал и передаётся по оптоволокну до распредцентра"
  yield* waitUntil('fiber');
  yield* hops[2].appear();
  yield* route.advance(1);

  // "…происходит маршрутизация и поиск пути до точки назначения"
  yield* waitUntil('routing');
  yield* hops[3].appear();
  yield* all(route.advance(2), hops[3].pulse());

  // "…запрос пойдёт вообще на другой континент"
  yield* waitUntil('continent');
  yield* all(hops[4].appear(), map.labelFar());

  // "…передавать по кабелям, которые лежат на дне ~интернета~" (оговорка)
  yield* waitUntil('undersea');
  yield* all(route.advance(3), subseaLabel().opacity(1, 0.6, easeOutCubic));

  // Correction pops in when the "дне интернета" slip lands, holds a beat, then fades away.
  yield* waitUntil('ocean-fix');
  yield* all(
    oceanFix().opacity(1, 0.35),
    oceanFix().scale(1, 0.5, easeOutBack),
  );
  yield* waitFor(3.2);
  yield* oceanFix().opacity(0, 0.6, easeOutCubic);

  // "…каждый объект принадлежит разным компаниям, в разных странах"
  yield* waitUntil('foreign');
  yield* sequence(0.18, ...hops.map(h => h.tag()));

  // "…пакет использует не самый быстрый путь, а самый дешёвый"
  yield* waitUntil('cheapest');
  yield* all(
    altLine().end(1, 0.8, easeOutCubic),
    altLabel().opacity(1, 0.6, easeOutCubic),
  );
  yield* cheapLabel().opacity(1, 0.6, easeOutCubic);

  // "…и это всё ты, как инженер, никак не контролируешь"
  yield* waitUntil('nocontrol');
  yield* controlCaption().opacity(1, 0.7, easeOutCubic);

  yield* endScene(stage);
});
