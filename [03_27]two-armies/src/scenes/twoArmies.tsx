import {makeScene2D} from '@motion-canvas/2d';
import {all, easeInOutCubic, waitUntil} from '@motion-canvas/core';
import {createStage, revealStage, sceneCaption} from '@lib';
import {messengerLadder, runningNote} from '../armies';

const STAGE_HEIGHT = 740;
const CAPTION_Y = -322;
const LADDER_Y = -10;
const NOTE_Y = 306;

const FADE_OUT = 0.9;

export default makeScene2D(function* (view) {
  const stage = createStage(view, {height: STAGE_HEIGHT});
  stage.opacity(0);

  const caption = sceneCaption({text: 'РАЗРЫВ СОЕДИНЕНИЯ', y: CAPTION_Y, fontWeight: 500});
  const ladder = messengerLadder({y: LADDER_Y});
  const note = runningNote({y: NOTE_Y});

  stage.add(ladder.node);
  stage.add(note.node);
  stage.add(caption.node);

  // «Поговорим уже про разрыв соединения»
  yield* waitUntil('close');
  yield* all(revealStage(stage), caption.appear(), ladder.appear());

  // «Просто так перестать писать сообщения нельзя»
  yield* waitUntil('cant');
  yield* all(ladder.first(), note.say('просто так перестать писать нельзя'));

  // «Закрыть соединение согласованно — это математически нерешаемая задача»
  yield* waitUntil('unsolvable');
  yield* note.say('закрыть согласованно — математически нерешаемая задача');

  yield* waitUntil('armies');
  yield* caption.retitle('ПРОБЛЕМА ДВУХ АРМИЙ');

  // «Договориться через ненадёжного гонца со стопроцентной уверенностью невозможно»
  yield* waitUntil('messenger');
  yield* all(ladder.second(), note.say('гонец ненадёжен — и это не чинится'));

  // «Гонец с подтверждением может пропасть»
  yield* waitUntil('lost1');
  yield* ladder.lose(1);

  // «Гонец с подтверждением подтверждения — тоже»
  yield* waitUntil('lost2');
  yield* ladder.third();
  yield* ladder.lose(2);

  // «И так до бесконечности»
  yield* waitUntil('forever');
  yield* all(ladder.forever(), note.say('и так до бесконечности'));

  // «Доказуемо не существует протокола, который даст обеим сторонам уверенность»
  yield* waitUntil('proven');
  yield* ladder.proven();

  // Exit is composed by hand instead of `endScene`, matching the other video-03 parts.
  yield* waitUntil('end');
  yield* all(
    stage.opacity(0, FADE_OUT, easeInOutCubic),
    stage.scale(0.98, FADE_OUT, easeInOutCubic),
  );
});
