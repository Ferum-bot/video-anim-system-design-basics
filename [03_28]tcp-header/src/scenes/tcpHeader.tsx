import {makeScene2D} from '@motion-canvas/2d';
import {all, easeInOutCubic, waitUntil} from '@motion-canvas/core';
import {createStage, revealStage, sceneCaption} from '@lib';
import {headerBytes, kernelStacks, runningNote} from '../hdr';

const STAGE_HEIGHT = 700;
const CAPTION_Y = -304;
const HEADER_Y = -6;
const STACKS_Y = 10;
const NOTE_Y = 292;

const FADE_OUT = 0.9;

export default makeScene2D(function* (view) {
  const stage = createStage(view, {height: STAGE_HEIGHT});
  stage.opacity(0);

  const caption = sceneCaption({text: 'КАК УСТРОЕН TCP', y: CAPTION_Y, fontWeight: 500});
  const header = headerBytes({y: HEADER_Y});
  const stacks = kernelStacks({y: STACKS_Y});
  const note = runningNote({y: NOTE_Y});

  stage.add(header.node);
  stage.add(stacks.node);
  stage.add(note.node);
  stage.add(caption.node);

  // «В целом, как устроен TCP, где он живёт»
  yield* waitUntil('how');
  yield* all(revealStage(stage), caption.appear(), header.appear());

  // «Заголовок TCP — это минимум 20 байт против 8 у UDP»
  yield* waitUntil('twenty');
  yield* all(header.compare(), note.say('минимум 20 байт против восьми у UDP'));

  // «Порты — те же, что и у UDP»
  yield* waitUntil('ports');
  yield* header.light('ports');

  // «Два 32-битных номера, sequence и acknowledgment — счётчики байтов, сердце надёжности»
  yield* waitUntil('seq');
  yield* all(header.light('seq', 'ack'), note.say('счётчики байтов — сердце надёжности'));

  // «Флаги SYN, ACK, FIN — язык рукопожатий и прощаний»
  yield* waitUntil('flags');
  yield* header.light('flags');

  // «И окно управления потоком»
  yield* waitUntil('window');
  yield* header.light('win');

  // «Каждая группа полей — это гарантии, отлитые в байты»
  yield* waitUntil('groups');
  yield* all(header.allBought(), note.say('каждая группа полей — это гарантии, отлитые в байты'));

  // «TCP живёт там же, где и UDP, — в ядре операционной системы»
  yield* waitUntil('kernel');
  yield* all(header.dismiss(), caption.retitle('ГДЕ ЖИВЁТ TCP'));
  yield* stacks.appear();
  yield* all(stacks.lightKernel(), note.say('рукопожатия, повторы и окна исполняет ядро'));

  // «пока твой код обычно ждёт вызова на системном методе»
  yield* waitUntil('waits');
  yield* all(stacks.appWaits(), note.say('твой код в это время просто ждёт вызова'));

  // «Поменять TCP означает поменять ядра операционных систем на обеих сторонах»
  yield* waitUntil('change');
  yield* all(stacks.change(), note.say('и это надо сделать на обеих сторонах сразу'));

  // «и очень много молиться, чтобы на сетевом пути ничего не сломалось»
  yield* waitUntil('pray');
  yield* all(stacks.pray(), note.say('а по пути ещё чужие железки, которые не должны сломаться'));

  // Exit is composed by hand instead of `endScene`, matching the other video-03 parts.
  yield* waitUntil('end');
  yield* all(
    stage.opacity(0, FADE_OUT, easeInOutCubic),
    stage.scale(0.98, FADE_OUT, easeInOutCubic),
  );
});
