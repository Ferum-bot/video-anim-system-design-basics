import {makeScene2D} from '@motion-canvas/2d';
import {all, easeInOutCubic, waitUntil} from '@motion-canvas/core';
import {createStage, revealStage, sceneCaption} from '@lib';
import {holBelt, runningNote} from '../hol';

const STAGE_HEIGHT = 620;
const CAPTION_Y = -268;
const BELT_Y = -40;
const NOTE_Y = 252;

const FADE_OUT = 0.9;

export default makeScene2D(function* (view) {
  const stage = createStage(view, {height: STAGE_HEIGHT});
  stage.opacity(0);

  const caption = sceneCaption({text: 'ЦЕНА СТРОГОГО ПОРЯДКА', y: CAPTION_Y, fontWeight: 500});
  const belt = holBelt({y: BELT_Y});
  const note = runningNote({y: NOTE_Y});

  stage.add(belt.node);
  stage.add(note.node);
  stage.add(caption.node);

  // «Кроме того, у нас есть ожидание получения всех сегментов»
  yield* waitUntil('wait');
  yield* all(revealStage(stage), caption.appear(), belt.appear());
  yield* all(belt.send(), note.say('данные отдаются приложению только по порядку'));

  // «потерялся пакет пятый»
  yield* waitUntil('lost5');
  yield* belt.lose();

  // «а шестой, седьмой, восьмой, девятый, даже десятый уже пришли»
  yield* waitUntil('arrived');
  yield* belt.fill();

  // «и приложение ни один из этих пакетов не получит, пока не придёт пятый»
  yield* waitUntil('none');
  yield* all(belt.block(), note.say('ни один не уйдёт наверх, пока не придёт пятый'));

  yield* waitUntil('buffer');
  yield* belt.spotBuffer();

  // «они все лежат готовые, целые, полученные сразу»
  yield* waitUntil('ready');
  yield* all(belt.intact(), note.say('они целые и уже здесь'));

  // «но порядок есть порядок»
  yield* waitUntil('order');
  yield* all(belt.orderRules(), note.say('но порядок есть порядок'));

  // «поток приложения будет заблокирован и будет ждать»
  yield* waitUntil('blocked');
  yield belt.waiting(); // fork: приложение продолжает ждать до самого конца

  // «это называется head-of-line blocking»
  yield* waitUntil('name');
  yield* belt.name();

  yield* waitUntil('price');
  yield* note.say('это плата за строгий порядок');

  yield* waitUntil('later');
  yield* note.say('другие протоколы будут пытаться это решить');

  // «очень важная оговорка, которую забывают даже очень опытные инженеры»
  yield* waitUntil('caveat');
  yield* all(
    caption.retitle('ACK — ЭТО НЕ «ПРИЛОЖЕНИЕ ПОЛУЧИЛО»'),
    note.say('оговорка, о которой забывают даже опытные инженеры'),
  );

  // «подтверждение TCP означает, что байты доехали до машины»
  yield* waitUntil('ack');
  yield* all(belt.ackBack(), note.say('байты доехали до машины'));

  // «но оно не означает, что приложение их получило»
  yield* waitUntil('notapp');
  yield* all(belt.notRead(), note.say('но это не значит, что приложение их получило'));

  yield* waitUntil('depends');
  yield* all(belt.depends(), note.say('дальше всё зависит от ОС, языка и библиотеки'));

  // Exit is composed by hand instead of `endScene`, matching the other video-03 parts.
  yield* waitUntil('end');
  yield* all(
    stage.opacity(0, FADE_OUT, easeInOutCubic),
    stage.scale(0.98, FADE_OUT, easeInOutCubic),
  );
});
