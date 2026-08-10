import {makeScene2D} from '@motion-canvas/2d';
import {all, easeInOutCubic, waitUntil} from '@motion-canvas/core';
import {createStage, revealStage, sceneCaption} from '@lib';
import {libStack, runningNote} from '../libs';

const STAGE_HEIGHT = 640;
const CAPTION_Y = -276;
const STACK_Y = -30;
const NOTE_Y = 268;

const FADE_OUT = 0.9;

export default makeScene2D(function* (view) {
  const stage = createStage(view, {height: STAGE_HEIGHT});
  stage.opacity(0);

  const caption = sceneCaption({text: 'ГДЕ ЖИВЁТ QUIC', y: CAPTION_Y, fontWeight: 500});
  const stack = libStack({y: STACK_Y});
  const note = runningNote({y: NOTE_Y});

  stage.add(stack.node);
  stage.add(note.node);
  stage.add(caption.node);

  // «Где вообще живёт QUIC?»
  yield* waitUntil('where');
  yield* all(revealStage(stage), caption.appear(), stack.appear());

  // «В ядре операционной системы QUIC нет»
  yield* waitUntil('notkernel');
  yield* all(stack.notInKernel(), note.say('в ядре его нет — в отличие от TCP'));

  // «Он живёт в библиотеках»
  yield* waitUntil('libs');
  yield* all(stack.library(), note.say('он живёт в библиотеке, прямо в твоём процессе'));

  yield* waitUntil('names');
  yield* stack.names();

  // «Хочешь реализацию QUIC в сервисе — приносишь библиотеку с собой»
  yield* waitUntil('bring');
  yield* all(stack.bring(), note.say('приносишь библиотеку с собой'));

  // «В Nginx и облачных балансировщиках включается с помощью флагов»
  yield* waitUntil('flags');
  yield* all(stack.flags(), note.say('а где-то он уже есть и включается флагом'));
  yield* stack.contrast();
  yield stack.pulse(); // fork: итоговая плашка дышит до самой шторки

  // Exit is composed by hand instead of `endScene`, matching the other video-03 parts.
  yield* waitUntil('end');
  yield* all(
    stage.opacity(0, FADE_OUT, easeInOutCubic),
    stage.scale(0.98, FADE_OUT, easeInOutCubic),
  );
});
