import {makeScene2D} from '@motion-canvas/2d';
import {all, cancel, easeInOutCubic, waitUntil} from '@motion-canvas/core';
import {createStage, revealStage, sceneCaption} from '@lib';
import {pageGrid, runningNote, streamLanes} from '../streams';

const STAGE_HEIGHT = 700;
const CAPTION_Y = -304;
const LANES_Y = 50;
const GRID_Y = -14;
const NOTE_Y = 292;

const FADE_OUT = 0.9;

export default makeScene2D(function* (view) {
  const stage = createStage(view, {height: STAGE_HEIGHT});
  stage.opacity(0);

  const caption = sceneCaption({text: 'КАК РАБОТАЕТ QUIC', y: CAPTION_Y, fontWeight: 500});
  const lanes = streamLanes({y: LANES_Y});
  const grid = pageGrid({y: GRID_Y});
  const note = runningNote({y: NOTE_Y});

  stage.add(lanes.node);
  stage.add(grid.node);
  stage.add(note.node);
  stage.add(caption.node);

  // «Как работает QUIC? Есть три больших отличия»
  yield* waitUntil('how');
  yield* all(revealStage(stage), caption.appear(), lanes.appear());

  yield* waitUntil('streams');
  yield* caption.retitle('ОТЛИЧИЕ ПЕРВОЕ — ПОТОКИ');

  // «Вместо одной большой трубы внутри одного QUIC-соединения живёт много потоков»
  yield* waitUntil('many');
  yield* all(lanes.split(), note.say('внутри одного соединения живёт много независимых потоков'));
  // fork: каждый поток едет сам по себе, поэтому потом видно, кто именно встал
  const flow0 = yield lanes.feed(0);
  const flow1 = yield lanes.feed(1);
  const flow2 = yield lanes.feed(2);

  // «Каждый поток — это своя упорядоченная надёжная труба»
  yield* waitUntil('each');
  yield* lanes.say('У КАЖДОГО ПОТОКА СВОЙ ПОРЯДОК И СВОЯ НАДЁЖНОСТЬ');

  // «Если потерялся пакет А из потока 1, то ждёт только поток 1»
  yield* waitUntil('lost');
  cancel(flow0); // первый поток встаёт ровно там, где его застала дырка
  yield* all(lanes.block(0), note.say('потерялся пакет из первого потока'));

  yield* waitUntil('others');
  yield* note.say('потоки 2 и 3 идут дальше как ни в чём не бывало');

  yield* waitUntil('solves');
  yield* lanes.say('HEAD-OF-LINE ОСТАЁТСЯ ВНУТРИ СВОЕГО ПОТОКА');

  // «Каждая страница — это десятки, если не сотни объектов на одном сервере»
  yield* waitUntil('page');
  cancel(flow1, flow2);
  yield* all(lanes.dismiss(), note.say('веб-страница — это десятки объектов с одного сервера'));
  yield* grid.appear();
  yield grid.waiting(); // fork: недогруженные объекты дышат, пока их ждут

  // «Гнать всё в один TCP — одна потеря, и тормозится вся загрузка сайта»
  yield* waitUntil('oneTcp');
  yield* all(grid.throughTcp(), note.say('всё в одну трубу — и вся страница ждёт один объект'));

  // «В QUIC это мультиплексируется — задержка одного объекта не трогает всё остальное»
  yield* waitUntil('mux');
  yield* all(grid.throughQuic(), note.say('задержка одного объекта не трогает всё остальное'));

  // Exit is composed by hand instead of `endScene`, matching the other video-03 parts.
  yield* waitUntil('end');
  yield* all(
    stage.opacity(0, FADE_OUT, easeInOutCubic),
    stage.scale(0.98, FADE_OUT, easeInOutCubic),
  );
});
