import {makeScene2D} from '@motion-canvas/2d';
import {all, easeInOutCubic, waitUntil} from '@motion-canvas/core';
import {createStage, revealStage, sceneCaption} from '@lib';
import {guardRows, runningNote, sawGraph, whyLoss} from '../cong';

const STAGE_HEIGHT = 700;
const CAPTION_Y = -300;
const CARD_Y = -40;
const PLOT_Y = 20;
const GRID_Y = -48;
const NOTE_Y = 292;

const FADE_OUT = 0.9;

export default makeScene2D(function* (view) {
  const stage = createStage(view, {height: STAGE_HEIGHT});
  stage.opacity(0);

  const caption = sceneCaption({text: 'КОНТРОЛЬ ПЕРЕГРУЗКИ', y: CAPTION_Y, fontWeight: 500});
  const guards = guardRows({y: CARD_Y});
  const why = whyLoss({y: CARD_Y});
  const saw = sawGraph({y: PLOT_Y});
  const note = runningNote({y: NOTE_Y});

  stage.add(guards.node);
  stage.add(why.node);
  stage.add(saw.node);
  stage.add(note.node);
  stage.add(caption.node);

  // «Также у протокола есть контроль перегрузки, либо же защита сети»
  yield* waitUntil('cong');
  yield* all(revealStage(stage), caption.appear(), guards.appear());

  // «Управление потоком бережёт получателя, но есть второй общий ресурс — это сама сеть»
  yield* waitUntil('shared');
  yield* all(guards.highlight(), note.say('второй общий ресурс — сама сеть'));

  yield* waitUntil('alg');
  yield* guards.credit();

  // «Потеря пакета — это сигнал перегрузки»
  yield* waitUntil('signal');
  yield* all(guards.dismiss(), note.say('потеря пакета — это сигнал перегрузки'));
  yield* why.appear();

  // «В проводах пакет от помех почти не умирает»
  yield* waitUntil('wire');
  yield* why.wire();

  // «Значит, он умер в переполненной очереди внутри маршрутизатора»
  yield* waitUntil('queue');
  yield* why.queue();

  yield* waitUntil('slow');
  yield* all(why.slowDown(), note.say('и это уже сигнал, что надо притормозить'));

  // «Алгоритм начинается с медленного старта»
  yield* waitUntil('start');
  yield* why.dismiss();
  yield* saw.appear();

  yield* waitUntil('ramp');
  yield* all(saw.draw(0, 3.4), note.say('начинаем аккуратно и разгоняем нагрузку'));

  // «Дальше есть специальный режим, он называется AIMD»
  yield* waitUntil('aimd');
  yield* saw.retitle('AIMD · РАСТЁМ ПОНЕМНОГУ');
  yield* saw.draw(1, 3.2);

  // «а на каждой потере режем скорость пополам»
  yield* waitUntil('half');
  yield* all(saw.draw(2, 3.2), note.say('на каждой потере режем скорость пополам'));

  yield* waitUntil('saw');
  yield* saw.retitle('ЗНАМЕНИТАЯ ПИЛА');

  // «разгон — потеря — сброс — разгон — потеря»
  yield* waitUntil('cycle');
  yield* all(saw.draw(7, 10.5), note.say('разгон — потеря — сброс — разгон'));

  // «Справедливое разделение общего ресурса»
  yield* waitUntil('fair');
  yield saw.run(); // fork: пилы едут до самой шторки
  yield* all(
    caption.retitle('СПРАВЕДЛИВОЕ РАЗДЕЛЕНИЕ ПОЛОСЫ'),
    saw.toGrid(GRID_Y),
    note.say('полосу делят все сразу'),
  );

  // «может торговаться за полосу с тысячей других чужих соединений»
  yield* waitUntil('thousand');
  yield* all(saw.crowd(), note.say('с тысячей чужих соединений незнакомых тебе людей'));

  yield* waitUntil('nodisp');
  yield* saw.say('ЦЕНТРАЛЬНОГО ДИСПЕТЧЕРА НЕТ');

  yield* waitUntil('billions');
  yield* all(
    saw.say('ВСЕ ДОБРОВОЛЬНО ИГРАЮТ ПО AIMD'),
    note.say('миллиарды узлов сами уступают полосу на потерях'),
  );

  yield* waitUntil('stands');
  yield* saw.say('ПОЭТОМУ ИНТЕРНЕТ НЕ ПАДАЕТ КАЖДЫЙ ДЕНЬ');

  // Exit is composed by hand instead of `endScene`, matching the other video-03 parts.
  yield* waitUntil('end');
  yield* all(
    stage.opacity(0, FADE_OUT, easeInOutCubic),
    stage.scale(0.98, FADE_OUT, easeInOutCubic),
  );
});
