import {makeScene2D} from '@motion-canvas/2d';
import {all, waitUntil} from '@motion-canvas/core';
import {createStage, endScene, revealStage, sceneCaption} from '@lib';
import {tcpipStack} from '../tcp';

export default makeScene2D(function* (view) {
  const stage = createStage(view);
  stage.opacity(0);

  const stack = tcpipStack({y: 20});
  const title = sceneCaption({text: 'Модель TCP/IP · снизу вверх', fontWeight: 600});

  stage.add(stack.node);
  stage.add(title.node);

  // "самый нижний — канальный": the whole scene (frame + title + first layer) eases in
  // together here — no empty card hanging beforehand.
  yield* waitUntil('link');
  yield* all(revealStage(stage), title.appear(), stack.reveal(0));

  // "…обычно реализуется в железе сетевой карты / коммутатора"
  yield* waitUntil('hw');
  yield* stack.hw();

  // "дальше межсетевой (сетевой) — закинуть пакет в любую сеть, тут живёт IP"
  yield* waitUntil('internet');
  yield* stack.reveal(1);

  // "IP сам по себе не гарантирует ничего: дубли, потери, петли, порядок"
  yield* waitUntil('chaos');
  yield* stack.chaos();

  // "следующий — транспортный: связь между конкретными процессами (порты)"
  yield* waitUntil('transport');
  yield* stack.reveal(2);

  // "TCP — надёжный, гарантирует; UDP — без гарантий, но без накладных расходов"
  yield* waitUntil('tcpudp');
  yield* stack.tcpudp();

  // "самый верхний — прикладной: осмысленное общение (HTTP, DNS)"
  yield* waitUntil('app');
  yield* stack.reveal(3);

  yield* endScene(stage);
});
