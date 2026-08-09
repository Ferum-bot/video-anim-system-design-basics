import {Node, makeScene2D} from '@motion-canvas/2d';
import {all, cancel, easeInOutCubic, waitUntil} from '@motion-canvas/core';
import {createStage, revealStage, sceneCaption} from '@lib';
import {globe, hud, routeLayer} from '../geo';
import type {GlobeView} from '../geo';

// This scene is read, not glanced at: coastlines, city dots and the readouts all have to
// survive on a phone screen. So the card breaks out of the series' 960-wide column and
// everything inside is scaled by the same factor — same composition, just bigger.
const STAGE_WIDTH = 1400;
const STAGE_HEIGHT = 970;
const SCALE = 1.35;

const CAPTION_Y = -318;
const GLOBE_Y = 26;

// Two camera positions. The first is the planet from far off, turned away from Europe so
// there's somewhere to fly from; the second frames the continent from Madrid to Moscow.
const WORLD: GlobeView = {lon: -55, lat: 25, radius: 290};
const EUROPE: GlobeView = {lon: 15.5, lat: 50.5, radius: 1620};

const FLIGHT = 4.2;
const MESH_DIM = 0.3; // how far the base backbone steps back once routes sit on top of it
const ROUTES_GUESS = 24000; // where the counter is heading when it gives up
const COUNT_TIME = 5.2;
const FADE_OUT = 0.9;

export default makeScene2D(function* (view) {
  const stage = createStage(view, {width: STAGE_WIDTH, height: STAGE_HEIGHT});
  stage.opacity(0);

  // One wrapper carries the scale, so every distance, stroke and font below stays in the
  // proportions the layout was tuned in.
  const content = <Node scale={SCALE}/>;
  stage.add(content);

  const caption = sceneCaption({text: 'КАК ЭТО ВЫГЛЯДИТ В РЕАЛЬНОМ МИРЕ', y: CAPTION_Y, fontWeight: 500});
  const planet = globe({start: WORLD});
  planet.node.y(GLOBE_Y);
  const routes = routeLayer({camera: planet.camera});
  const readout = hud();
  readout.node.y(GLOBE_Y);

  content.add(planet.node);
  planet.surface.add(routes.node); // routes live inside the limb clip, on the same camera
  content.add(readout.node);
  content.add(caption.node);

  // «Давай посмотрим, как это вообще выглядит в реальном мире»
  yield* waitUntil('world');
  yield* all(revealStage(stage), caption.appear(), planet.appear());
  const spin = yield planet.drift(); // fork: the planet is never still

  // «Вот реальная карта Европы…» — the camera takes over from the idle spin
  yield* waitUntil('fly');
  cancel(spin);
  yield* all(caption.retitle('ЕВРОПА · МАГИСТРАЛИ'), planet.flyTo(EUROPE, FLIGHT));

  // «…со всеми актуальными сетевыми путями. И это выглядит как сеть, буквально»
  yield* waitUntil('mesh');
  yield* planet.weave();

  yield* waitUntil('hubs');
  yield* planet.nameHubs();

  // «Сколько есть сетевых маршрутов от Москвы до Франкфурта?»
  yield* waitUntil('question');
  yield* all(caption.retitle('СКОЛЬКО ЕСТЬ МАРШРУТОВ'), readout.ask(), planet.dimMesh(MESH_DIM));

  // «Их, наверное, тысячи, если не десятки тысяч» — real walks over the real graph, lighting
  // up faster and faster. Both forked, so the counter keeps climbing under the fan.
  yield* waitUntil('thousands');
  const fan = yield routes.flare();
  yield readout.count(ROUTES_GUESS, COUNT_TIME);

  // «…а посчитать это за приемлемое время невозможно»
  yield* waitUntil('uncountable');
  yield* readout.giveUp();

  // «И на самом деле сетевой пакет, когда путешествует от одной точки в другую…»
  yield* waitUntil('journey');
  cancel(fan);
  yield* all(caption.retitle('КАКОЙ ПУТЬ ВЫБИРАЕТ ПАКЕТ'), routes.clearFlare(), readout.toLegend());

  // «…он выбирает далеко не самый оптимальный маршрут»
  yield* waitUntil('shortest');
  yield* routes.showShort();

  // «…он выбирает самый экономичный»
  yield* waitUntil('cheapest');
  yield* routes.showChosen();
  yield routes.runPacket(); // fork: traffic keeps flowing the long way round

  // «от этого зависят договорённости провайдеров… политики стран… загруженность»
  yield* waitUntil('reason1');
  yield* readout.reason(0);
  yield* waitUntil('reason2');
  yield* readout.reason(1);
  yield* waitUntil('reason3');
  yield* readout.reason(2);

  // «отсюда задержки, которые видны только лишь в 99-х перцентилях»
  yield* waitUntil('p99');
  yield* readout.showTail();

  // Exit is composed by hand instead of `endScene`, matching the other video-03 parts.
  yield* waitUntil('end');
  yield* all(
    stage.opacity(0, FADE_OUT, easeInOutCubic),
    stage.scale(0.98, FADE_OUT, easeInOutCubic),
  );
});
