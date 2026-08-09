import {makeScene2D} from '@motion-canvas/2d';
import {all, easeInOutCubic, waitUntil} from '@motion-canvas/core';
import {createStage, revealStage, sceneCaption} from '@lib';
import {byteBar} from '../stream';

const STAGE_HEIGHT = 720;
const CAPTION_Y = -308;
const BAR_Y = 2;

const FADE_OUT = 0.9;

export default makeScene2D(function* (view) {
  const stage = createStage(view, {height: STAGE_HEIGHT});
  stage.opacity(0);

  const caption = sceneCaption({text: 'ПОТОК БАЙТОВ, А НЕ СООБЩЕНИЙ', y: CAPTION_Y, fontWeight: 500});
  const bar = byteBar({y: BAR_Y});

  stage.add(bar.node);
  stage.add(caption.node);

  // «TCP — это поток байтов, а не поток сообщений»
  yield* waitUntil('claim');
  yield* all(revealStage(stage), caption.appear(), bar.appear());

  // «Границы сообщения в рамках TCP не существует» — швы, которых нет, и исчезают
  yield* waitUntil('nowhere');
  yield* all(bar.dissolveSeams(), bar.note('границы сообщения в потоке не существует'));

  // «Пример, который часто приводят»
  yield* waitUntil('writes');
  yield* bar.nameSides();

  yield* waitUntil('four');
  yield* bar.write();

  yield* waitUntil('pour');
  yield* bar.pour();

  // «получатель может получить их одним куском в 2048…»
  yield* waitUntil('one');
  yield* bar.read([]);
  // «…или 4 по 512…»
  yield* waitUntil('split4');
  yield* bar.read([512, 1024, 1536]);
  // «…или как угодно ещё»
  yield* waitUntil('any');
  yield* bar.read([300, 1450]);

  // «Восстановить, как именно данные записывались, невозможно в принципе»
  yield* waitUntil('never');
  yield* all(bar.forgetSeams(), bar.note('восстановить, как писали, невозможно в принципе'));

  yield* waitUntil('noinfo');
  yield* bar.noInfo();

  // «В случае UDP там коробки: одна отправка — одна коробка»
  yield* waitUntil('udp');
  yield* all(bar.ghostUdp(), bar.note('в UDP одна отправка — одна коробка'));

  // «Так вот, TCP — это просто труба с водой либо же с байтами»
  yield* waitUntil('tcp');
  yield bar.flow(); // fork: поток больше не останавливается
  yield* all(
    caption.retitle('ПРОСТО ТРУБА С БАЙТАМИ'),
    bar.dropGhost(),
    bar.note('в TCP — просто труба с байтами'),
  );

  // «сколько ты налил — мне вообще непонятно, на входе может получиться по-другому»
  yield* waitUntil('poured');
  yield bar.reroll(); // fork: резы получателя продолжают прыгать до самого конца
  yield* bar.note('сколько налил — на выходе может быть как угодно');

  // Exit is composed by hand instead of `endScene`, matching the other video-03 parts.
  yield* waitUntil('end');
  yield* all(
    stage.opacity(0, FADE_OUT, easeInOutCubic),
    stage.scale(0.98, FADE_OUT, easeInOutCubic),
  );
});
