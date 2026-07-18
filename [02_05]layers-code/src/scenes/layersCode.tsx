import {makeScene2D, Txt} from '@motion-canvas/2d';
import {all, createRef, easeInOutCubic, easeOutCubic, waitUntil} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, createStage, endScene, fonts, withAlpha} from '@lib';
import {codeMap} from '../layers';

export default makeScene2D(function* (view) {
  const stage = createStage(view);
  stage.opacity(0); // stays hidden until the "каждый уровень — это код" beat

  const map = codeMap({y: 20});
  const caption = createRef<Txt>();

  stage.add(map.node);
  stage.add(
    <Txt ref={caption} text="каждый уровень — это реальный код" y={-430}
      fill={withAlpha(colors.cyan, 0.85)} fontSize={26} letterSpacing={1}
      fontFamily={fonts.mono} opacity={0}/>,
  );

  function* say(text: string): ThreadGenerator {
    yield* caption().opacity(0, 0.25);
    caption().text(text);
    yield* caption().opacity(1, 0.35, easeOutCubic);
  }

  // "По сути, каждый уровень существует в виде кода" — the scene eases in here.
  yield* waitUntil('code');
  yield* all(stage.opacity(1, 1.0, easeInOutCubic), map.appear(), caption().opacity(1, 0.9));

  // "…написаны в разных частях системы, разными компаниями"
  yield* waitUntil('where');
  yield* all(map.homes(), say('…в разных частях системы, у разных компаний'));

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
  yield* all(map.inject(), say('можно вклиниться на любом уровне'));

  // "реальные куски кода — их писали сотни людей за десятилетия, и они ошибаются"
  yield* waitUntil('humans');
  yield* all(map.humans(), say('тысячи людей · десятилетия · и баги'));

  yield* endScene(stage);
});
