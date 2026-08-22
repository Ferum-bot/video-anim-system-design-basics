import {makeScene2D} from '@motion-canvas/2d';
import {all, cancel, easeInOutCubic, waitUntil} from '@motion-canvas/core';
import {createStage, revealStage} from '@lib';
import {layerStack, liveMonitor} from '../around';

// Два виджета делят кадр последовательно: список имён превращается в монитор, монитор
// уходит, и на его место встаёт стопка уровней. Обе композиции центрированы сами по себе —
// проверено `tools/check-centering.py` на каждом бите.
const STAGE_HEIGHT = 760;

const FADE_OUT = 0.9;

export default makeScene2D(function* (view) {
  const stage = createStage(view, {height: STAGE_HEIGHT});
  stage.opacity(0);

  const monitor = liveMonitor();
  const stack = layerStack();

  stage.add(monitor.node);
  stage.add(stack.node);

  // «С протоколом прикладного уровня знаком каждый»
  yield* waitUntil('known');
  yield* revealStage(stage);

  // «HTTP, gRPC, DNS, вебсокеты» — имена приземляются по одному
  yield* waitUntil('names');
  yield* monitor.appear();

  // «Пока ты смотришь это видео, работают как минимум три из них» — список становится
  // монитором, и по проводам к «ЭТОМУ ВИДЕО» идёт трафик на форкнутом бесконечном цикле.
  yield* waitUntil('now');
  yield* monitor.goLive();
  const traffic = yield monitor.run();

  // «Что стоит понимать с самого начала?» — монитор уходит, освобождая кадр под тезис
  yield* waitUntil('start');
  cancel(traffic);
  yield* monitor.dismiss();

  // «Прикладной уровень — это первый и единственный уровень»
  yield* waitUntil('only');
  yield* stack.appear();

  // «…который выполняет какую-то полезную работу относительно твоего приложения»
  yield* waitUntil('useful');
  yield* stack.lightTop();

  // «Всё, что мы разбирали до этого» — четыре нижние плиты берутся в одну скобку
  yield* waitUntil('before');
  yield* stack.explain('ДВА ПРЕДЫДУЩИХ ВИДЕО');

  // «…обеспечивает лишь транспорт и некоторые гарантии доставки» — та же скобка, следующий смысл
  yield* waitUntil('delivery');
  yield* stack.relabel('ТРАНСПОРТ + ГАРАНТИИ ДОСТАВКИ');

  yield* waitUntil('end');
  yield* stage.opacity(0, FADE_OUT, easeInOutCubic);
});
