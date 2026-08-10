import {makeScene2D} from '@motion-canvas/2d';
import {all, easeInOutCubic, waitUntil} from '@motion-canvas/core';
import {createStage, revealStage, sceneCaption} from '@lib';
import {reverseTimeline, runningNote} from '../tl';

const STAGE_HEIGHT = 700;
const CAPTION_Y = -304;
const TIMELINE_Y = 12;
const NOTE_Y = 292;

const FADE_OUT = 0.9;

export default makeScene2D(function* (view) {
  const stage = createStage(view, {height: STAGE_HEIGHT});
  stage.opacity(0);

  const caption = sceneCaption({text: 'ИЗ ПРАКТИКИ В СТАНДАРТ', y: CAPTION_Y, fontWeight: 500});
  const line = reverseTimeline({y: TIMELINE_Y});
  const note = runningNote({y: NOTE_Y});

  stage.add(line.node);
  stage.add(note.node);
  stage.add(caption.node);

  // «QUIC появился не из стандартов, а из практики»
  yield* waitUntil('notstd');
  yield* all(revealStage(stage), caption.appear(), line.appear());
  yield* line.order();

  // «Google выкатывает QUIC как эксперимент для снижения задержек HTTPS»
  yield* waitUntil('exp');
  yield* all(line.milestone(0), note.say('сначала — эксперимент для снижения задержек'));

  yield* waitUntil('code');
  yield* note.say('не черновик и не документ, а сразу код в браузере');

  // «больше половины соединений Chrome с сервисами Google уже ездили по QUIC»
  yield* waitUntil('half');
  yield* all(line.milestone(1), note.say('половина трафика Chrome с сервисами Google'));

  yield* waitUntil('billions');
  yield* note.say('обкатка на миллиардах пользователей — до первой строчки стандарта');

  // «Дальше стандарт 6 лет работал в IETF»
  yield* waitUntil('ietf');
  yield* all(line.milestone(2), note.say('и только потом — шесть лет в IETF'));

  // «стандартом стала 35-я версия черновика — 35 итераций публичной шлифовки»
  yield* waitUntil('draft35');
  yield* all(line.drafts(6.2), note.say('35 итераций публичной шлифовки'));

  // «В 2021 выходит RFC 9000 и с ним целая свита документов»
  yield* waitUntil('rfc');
  yield* all(line.milestone(3), note.say('и только в конце — сам стандарт со свитой документов'));
  yield* line.satellites();
  yield line.pulse(); // fork: последняя веха дышит до самой шторки

  // «Редакторы документа — инженеры Fastly и Mozilla, вообще даже не Google»
  yield* waitUntil('editors');
  yield* all(line.editors(), note.say('корпоративный эксперимент стал общим через консенсус'));

  // Exit is composed by hand instead of `endScene`, matching the other video-03 parts.
  yield* waitUntil('end');
  yield* all(
    stage.opacity(0, FADE_OUT, easeInOutCubic),
    stage.scale(0.98, FADE_OUT, easeInOutCubic),
  );
});
