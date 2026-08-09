import {makeScene2D} from '@motion-canvas/2d';
import {all, easeInOutCubic, waitUntil} from '@motion-canvas/core';
import {createStage, revealStage, sceneCaption} from '@lib';
import {isnPanel, netMemory, runningNote, threeWay} from '../handshake';

const STAGE_HEIGHT = 800;
const CAPTION_Y = -344;
const MEMORY_Y = -60;
const HANDSHAKE_Y = 100;
const HANDSHAKE_RAISED_Y = 0;
const ISN_Y = 168;
const NOTE_Y = 332;

const FADE_OUT = 0.9;

export default makeScene2D(function* (view) {
  const stage = createStage(view, {height: STAGE_HEIGHT});
  stage.opacity(0);

  const caption = sceneCaption({
    text: 'ПОЧЕМУ НЕЛЬЗЯ ПРОСТО СЛАТЬ БАЙТЫ',
    y: CAPTION_Y,
    fontWeight: 500,
  });
  const memory = netMemory({y: MEMORY_Y});
  const hands = threeWay({y: HANDSHAKE_Y, raisedY: HANDSHAKE_RAISED_Y});
  const isn = isnPanel({y: ISN_Y});
  const note = runningNote({y: NOTE_Y});

  stage.add(memory.node);
  stage.add(hands.node);
  stage.add(isn.node);
  stage.add(note.node);
  stage.add(caption.node);

  // «Почему нельзя просто слать байты? Зачем эти церемонии с соединениями?»
  yield* waitUntil('why');
  yield* all(revealStage(stage), caption.appear(), memory.appear());
  yield* memory.plainSend();

  // «У сети есть память»
  yield* waitUntil('memory');
  yield* all(memory.showRouter(), note.say('у сети есть память'));

  // «пакет может застрять, уйти странным маршрутом…»
  yield* waitUntil('stuck');
  yield* memory.stall();

  // «…и всплыть позже, уже после пакетов, отправленных сильно позднее него»
  yield* waitUntil('later');
  yield* memory.surface();

  // «нужно как-то отличать пакеты свежие от пакетов мёртвых»
  yield* waitUntil('tell');
  yield* all(memory.question(), note.say('какой пакет свежий, а какой — мёртвый?'));

  yield* waitUntil('zombie');
  yield* memory.markDead();

  // «у этого есть решение» — картинка меняется под рукопожатие
  yield* waitUntil('solve');
  yield* all(memory.dismiss(), note.say('решение придумали полвека назад'));
  yield* hands.appear();

  yield* waitUntil('hand');
  yield* all(
    caption.retitle('ТРОЙНОЕ РУКОПОЖАТИЕ'),
    note.say('стороны договариваются о начальных номерах'),
  );

  yield* waitUntil('syn');
  yield* hands.step(0);
  yield* waitUntil('synack');
  yield* hands.step(1);
  yield* waitUntil('ack');
  yield* hands.step(2);

  yield* waitUntil('three');
  yield* hands.count();

  // «оба должны заявить свой отсчёт и убедиться, что вторая сторона его увидела»
  yield* waitUntil('why3');
  yield* all(
    hands.explain(),
    note.say('каждая сторона заявляет свой отсчёт и убеждается, что его увидели'),
  );

  yield* waitUntil('two');
  yield* all(hands.onlyTwo(), note.say('двух шагов математически мало'));

  yield* waitUntil('four');
  yield* all(hands.fourth(), note.say('четвёртому шагу уже нечего подтверждать'));

  // «деталь очень важная про начальные номера»
  yield* waitUntil('isn');
  yield* all(hands.clearMatrix(), hands.spotlightSeq(), caption.retitle('НАЧАЛЬНЫЙ НОМЕР'));
  yield* isn.appear();

  yield* waitUntil('guess');
  yield* all(isn.guess(), note.say('следующий номер угадывали — и подделывали чужое соединение'));

  // «поэтому теперь они псевдослучайные»
  yield* waitUntil('random');
  yield isn.randomise(); // fork: номер продолжает прыгать до самого конца
  yield* note.say('поэтому теперь начальные номера псевдослучайные');

  // Exit is composed by hand instead of `endScene`, matching the other video-03 parts.
  yield* waitUntil('end');
  yield* all(
    stage.opacity(0, FADE_OUT, easeInOutCubic),
    stage.scale(0.98, FADE_OUT, easeInOutCubic),
  );
});
