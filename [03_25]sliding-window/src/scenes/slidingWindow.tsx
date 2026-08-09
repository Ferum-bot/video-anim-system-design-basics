import {makeScene2D} from '@motion-canvas/2d';
import {all, easeInOutCubic, waitUntil} from '@motion-canvas/core';
import {createStage, revealStage, sceneCaption} from '@lib';
import {runningNote, windowPipe} from '../win';

const STAGE_HEIGHT = 600;
const CAPTION_Y = -252;
const PIPE_Y = 5;
const NOTE_Y = 240;

const FADE_OUT = 0.9;

export default makeScene2D(function* (view) {
  const stage = createStage(view, {height: STAGE_HEIGHT});
  stage.opacity(0);

  const caption = sceneCaption({text: 'УПРАВЛЕНИЕ ПОТОКОМ', y: CAPTION_Y, fontWeight: 500});
  const pipe = windowPipe({y: PIPE_Y});
  const note = runningNote({y: NOTE_Y});

  stage.add(pipe.node);
  stage.add(note.node);
  stage.add(caption.node);

  // «Следующая часть — это управление потоком. Как оно сделано, сделано ли вообще?»
  yield* waitUntil('flow');
  yield* all(revealStage(stage), caption.appear(), pipe.appear());

  // «Что происходило с UDP, когда получатель не успевал обрабатывать датаграммы?»
  yield* waitUntil('udp');
  yield pipe.feed(); // fork: отправитель шлёт до самого конца сцены
  yield* all(pipe.flood(), note.say('получатель не успевал за отправителем'));

  // «…а операционная система их просто выбрасывала»
  yield* waitUntil('drop');
  yield* note.say('и всё лишнее операционная система выбрасывала');

  // «TCP так не делает»
  yield* waitUntil('not');
  yield* all(pipe.calm(), note.say('TCP так не делает'));

  // «Получатель в каждом пакете сообщает, сколько он ещё готов принять»
  yield* waitUntil('tell');
  yield* all(pipe.advertise(), note.say('получатель сам говорит, сколько ещё готов принять'));

  // «Это называется окно, скользящее»
  yield* waitUntil('window');
  yield* all(caption.retitle('СКОЛЬЗЯЩЕЕ ОКНО'), pipe.nameWindow());

  // «И отправитель не имеет права слать больше»
  yield* waitUntil('limit');
  yield* all(pipe.throttle(), note.say('отправитель не имеет права слать больше'));

  // «Быстрый сервер не может утопить медленный телефон»
  yield* waitUntil('drown');
  yield* all(pipe.labelSides(), note.say('быстрый сервер не может утопить медленный телефон'));

  // «Окно может уменьшаться, раскрываться в зависимости от скорости»
  yield* waitUntil('resize');
  yield pipe.breathe(); // fork: окно дышит до самой шторки
  yield* note.say('окно сжимается и раскрывается по скорости получателя');

  yield* waitUntil('slowest');
  yield* note.say('передача ограничена самой медленной стороной');

  // Exit is composed by hand instead of `endScene`, matching the other video-03 parts.
  yield* waitUntil('end');
  yield* all(
    stage.opacity(0, FADE_OUT, easeInOutCubic),
    stage.scale(0.98, FADE_OUT, easeInOutCubic),
  );
});
