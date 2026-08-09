import {makeScene2D} from '@motion-canvas/2d';
import {all, cancel, easeInOutCubic, waitUntil} from '@motion-canvas/core';
import {banner, colors, createStage, revealStage, sceneCaption} from '@lib';
import {overflowPipe, toggleRow} from '../not';

const STAGE_HEIGHT = 720;
const CAPTION_Y = -308;
const TOGGLES_Y = 20;
const TOGGLES_STRIP_Y = -242;
const PIPE_Y = -6;
const BANNER_Y = 70;

const FADE_OUT = 0.9;

export default makeScene2D(function* (view) {
  const stage = createStage(view, {height: STAGE_HEIGHT});
  stage.opacity(0);

  const caption = sceneCaption({text: 'ЧЕГО UDP НЕ ДЕЛАЕТ', y: CAPTION_Y, fontWeight: 500});
  const toggles = toggleRow({y: TOGGLES_Y, stripY: TOGGLES_STRIP_Y});
  const pipe = overflowPipe({y: PIPE_Y});
  const closing = banner({
    text: 'UDP не решает проблемы сети — он даёт к ней доступ',
    accent: colors.cyan,
    y: BANNER_Y,
  });

  stage.add(toggles.node);
  stage.add(pipe.node);
  stage.add(closing.node);
  stage.add(caption.node);

  // «Давай перечислим, чего UDP вообще не делает»
  yield* waitUntil('list');
  yield* all(revealStage(stage), caption.appear(), toggles.appear());

  yield* waitUntil('flow');
  yield* toggles.off('flow');
  yield* waitUntil('cong');
  yield* toggles.off('cong');
  yield* waitUntil('retry');
  yield* toggles.off('retry');
  yield* waitUntil('order');
  yield* toggles.off('order');

  // «Что такое управление потоком? Это защита получателя»
  yield* waitUntil('whatflow');
  yield* all(caption.retitle('УПРАВЛЕНИЕ ПОТОКОМ'), toggles.collapse());
  yield* all(toggles.focus('flow'), pipe.appear());
  yield* pipe.note('защита получателя — не заливать быстрее, чем он читает');

  // «У UDP этого механизма нет вообще» — и датаграммы поехали
  yield* waitUntil('none');
  yield* pipe.note('у UDP этого механизма нет вообще');

  yield* waitUntil('drop');
  const stream = yield pipe.feed(); // fork: the arrivals never stop

  // «ОС кладёт их в буфер, приложение не успевает — датаграммы отбрасываются»
  yield* waitUntil('mech');
  yield* pipe.overflow();

  // «Тут глобальная сеть вообще ни при чём»
  yield* waitUntil('notnet');
  yield* pipe.note('сеть ни при чём — процесс пишет быстрее, чем ты читаешь');

  // «Второе понятие — контроль перегрузки. Это защита самой сети» — та же картина, но
  // уровнем ниже: очередь уже не в твоей ОС, а в чужом маршрутизаторе.
  yield* waitUntil('second');
  yield* all(caption.retitle('КОНТРОЛЬ ПЕРЕГРУЗКИ'), toggles.focus('cong'), pipe.drain());
  yield* all(
    pipe.relabel('ТВОЙ СОКЕТ', 'ОЧЕРЕДЬ РОУТЕРА', 'СЕТЬ'),
    pipe.note('защита самой сети — не заливать общий канал'),
  );

  // «Сокет позволит тебе слать с любой скоростью»
  yield* waitUntil('anyrate');
  yield* pipe.note('сокет позволит слать с любой скоростью');

  // «…а пакеты будут умирать в буферах и очередях маршрутизаторов»
  yield* waitUntil('queues');
  yield* pipe.overflow();

  // «Оно будет влиять не только на твои соединения, но и на чужие»
  yield* waitUntil('others');
  const guests = yield pipe.stranger(); // fork: someone else's traffic drowns with yours
  yield* pipe.note('общий ресурс — тонут и чужие соединения');

  // «UDP не решает ни одну из проблем сети — он просто даёт к ней доступ»
  yield* waitUntil('anchor');
  cancel(stream, guests);
  yield* all(caption.retitle('ЧЕГО UDP НЕ ДЕЛАЕТ'), toggles.focus('all'), pipe.dismiss());
  yield* closing.appear();

  // Exit is composed by hand instead of `endScene`, matching the other video-03 parts.
  yield* waitUntil('end');
  yield* all(
    stage.opacity(0, FADE_OUT, easeInOutCubic),
    stage.scale(0.98, FADE_OUT, easeInOutCubic),
  );
});
