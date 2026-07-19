import {makeScene2D} from '@motion-canvas/2d';
import {all, waitUntil} from '@motion-canvas/core';
import {createStage, endScene, revealStage, sceneCaption} from '@lib';
import {committeesRow} from '../std';

export default makeScene2D(function* (view) {
  const stage = createStage(view);
  stage.opacity(0);

  const row = committeesRow({y: 20});
  const caption = sceneCaption({text: 'стандарты держат несколько больших комитетов', y: -400, fontSize: 27});

  stage.add(row.node);
  stage.add(caption.node);

  // "мир комитетов большой и запутанный — несколько больших комитетов"
  yield* waitUntil('intro');
  yield* all(revealStage(stage), caption.appear());

  // "первый — ITU: телеком, существует с 1865"
  yield* waitUntil('itu');
  yield* row.reveal(0);

  // "ISO — тот самый комитет, который делал OSI"
  yield* waitUntil('iso');
  yield* row.reveal(1);

  // "IEEE — централизовал Ethernet и Wi-Fi"
  yield* waitUntil('ieee');
  yield* row.reveal(2);

  // "IETF — отдельный мир интернет-стандартов, культурно другой"
  yield* waitUntil('ietf');
  yield* all(row.reveal(3), caption.retitle('…IETF — культурно совсем другой'));

  // "аналогия: ISO и ITU приходят в костюмах, а IETF — в джинсах"
  yield* waitUntil('suits');
  yield* all(row.dress(), caption.retitle('аналогия: костюмы vs джинсы'));

  // "но всем надо консенсус и рабочий код — минимум две независимые реализации"
  yield* waitUntil('rule');
  yield* all(row.rule(), caption.retitle('но правило для всех одно'));

  yield* endScene(stage);
});
