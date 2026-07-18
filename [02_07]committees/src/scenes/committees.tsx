import {makeScene2D, Txt} from '@motion-canvas/2d';
import {all, createRef, easeInOutCubic, easeOutCubic, waitUntil} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, createStage, endScene, fonts, withAlpha} from '@lib';
import {committeesRow} from '../std';

export default makeScene2D(function* (view) {
  const stage = createStage(view);
  stage.opacity(0);

  const row = committeesRow({y: 20});
  const caption = createRef<Txt>();

  stage.add(row.node);
  stage.add(
    <Txt ref={caption} y={-400} text="стандарты держат несколько больших комитетов"
      fill={withAlpha(colors.cyan, 0.85)} fontSize={27} letterSpacing={1}
      fontFamily={fonts.mono} opacity={0}/>,
  );

  function* say(text: string): ThreadGenerator {
    yield* caption().opacity(0, 0.25);
    caption().text(text);
    yield* caption().opacity(1, 0.35, easeOutCubic);
  }

  // "мир комитетов большой и запутанный — несколько больших комитетов"
  yield* waitUntil('intro');
  yield* all(stage.opacity(1, 1.0, easeInOutCubic), caption().opacity(1, 0.9));

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
  yield* all(row.reveal(3), say('…IETF — культурно совсем другой'));

  // "аналогия: ISO и ITU приходят в костюмах, а IETF — в джинсах"
  yield* waitUntil('suits');
  yield* all(row.dress(), say('аналогия: костюмы vs джинсы'));

  // "но всем надо консенсус и рабочий код — минимум две независимые реализации"
  yield* waitUntil('rule');
  yield* all(row.rule(), say('но правило для всех одно'));

  yield* endScene(stage);
});
