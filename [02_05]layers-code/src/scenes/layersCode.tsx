import {makeScene2D} from '@motion-canvas/2d';
import {all, waitUntil} from '@motion-canvas/core';
import {createStage, endScene, revealStage, sceneCaption} from '@lib';
import {codeMap} from '../layers';

export default makeScene2D(function* (view) {
  const stage = createStage(view);
  stage.opacity(0); // stays hidden until the "каждый уровень — это код" beat

  const map = codeMap({y: 20});
  const caption = sceneCaption({text: 'каждый уровень — это реальный код', y: -430, fontSize: 26});

  stage.add(map.node);
  stage.add(caption.node);

  // "По сути, каждый уровень существует в виде кода" — the scene eases in here.
  yield* waitUntil('code');
  yield* all(revealStage(stage), map.appear(), caption.appear());

  // "…написаны в разных частях системы, разными компаниями"
  yield* waitUntil('where');
  yield* all(map.homes(), caption.retitle('…в разных частях системы, у разных компаний'));

  // "канальный уровень — на C в сетевой карте / коммутаторе"
  yield* waitUntil('link');
  yield* map.link(2);

  // "сетевой и транспортный — в коде вашей ОС"
  yield* waitUntil('os');
  yield* map.link(1);

  // "прикладной (HTTP, DNS) — в библиотеках языка"
  yield* waitUntil('libs');
  yield* map.link(0);

  // "можно вклиниться на любом уровне и реализовать свой протокол"
  yield* waitUntil('inject');
  yield* all(map.inject(), caption.retitle('можно вклиниться на любом уровне'));

  // "реальные куски кода — их писали сотни людей за десятилетия, и они ошибаются"
  yield* waitUntil('humans');
  yield* all(map.humans(), caption.retitle('тысячи людей · десятилетия · и баги'));

  yield* endScene(stage);
});
