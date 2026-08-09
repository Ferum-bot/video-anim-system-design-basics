import {makeScene2D} from '@motion-canvas/2d';
import {all, easeInOutCubic, waitUntil} from '@motion-canvas/core';
import {createStage, revealStage, sceneCaption} from '@lib';
import {overheadStack, portsPoint, udpHeader} from '../udp';

const STAGE_HEIGHT = 760;
const CAPTION_Y = -318;

// The header owns the frame first, then shrinks to the top and stays there as the subject
// of everything that follows.
const HEADER_Y = 10;
const HEADER_DOCK_Y = -186;
const STACK_Y = 30;
const PORTS_Y = 22;

const FADE_OUT = 0.9;

export default makeScene2D(function* (view) {
  const stage = createStage(view, {height: STAGE_HEIGHT});
  stage.opacity(0);

  const caption = sceneCaption({text: 'КАК УСТРОЕН UDP', y: CAPTION_Y, fontWeight: 500});
  const header = udpHeader({y: HEADER_Y});
  const stack = overheadStack();
  const ports = portsPoint();
  stack.node.y(STACK_Y);
  ports.node.y(PORTS_Y);

  stage.add(header.node);
  stage.add(stack.node);
  stage.add(ports.node);
  stage.add(caption.node);

  // «Как UDP устроен?»
  yield* waitUntil('how');
  yield* all(revealStage(stage), caption.appear(), header.appear());

  // «Весь заголовок UDP — это всего лишь 8 байт»
  yield* waitUntil('eight');
  yield* header.count();

  // «Четыре поля по два»
  yield* waitUntil('four');
  yield* header.split();

  // «Порт отправителя… порт получателя… длина и контрольная сумма»
  yield* waitUntil('src');
  yield* header.light('src');
  yield* waitUntil('dst');
  yield* header.light('dst');
  yield* waitUntil('rest');
  yield* header.light('len', 'sum');

  // «И это вообще всё»
  yield* waitUntil('all');
  yield* header.thatsAll();

  // «Мы до этого разбирали системные байты канального уровня» — the header steps aside and
  // the three overheads line up on one scale.
  yield* waitUntil('recall');
  yield* all(caption.retitle('СКОЛЬКО СТОИТ ТРАНСПОРТ'), header.dock(HEADER_DOCK_Y));

  yield* waitUntil('eth');
  yield* stack.show('eth');
  yield* waitUntil('ip');
  yield* stack.show('ip');
  yield* waitUntil('udp');
  yield* stack.show('udp');

  // «Это самый дешёвый по накладным ресурсам транспорт из возможных»
  yield* waitUntil('cheapest');
  yield* stack.crownUdp();

  // «Весь смысл UDP относительно чистого IP — это порты»
  yield* waitUntil('ports');
  yield* all(caption.retitle('ВЕСЬ СМЫСЛ — ЭТО ПОРТЫ'), stack.dismiss());
  yield* ports.toMachine();

  // «IP доставляет до машины, UDP добавляет одно — какому процессу отдать»
  yield* waitUntil('process');
  yield* ports.toProcess();

  // «Соответственно, это единственная его задача»
  yield* waitUntil('only');
  yield* ports.verdict();

  // Exit is composed by hand instead of `endScene`, matching the other video-03 parts.
  yield* waitUntil('end');
  yield* all(
    stage.opacity(0, FADE_OUT, easeInOutCubic),
    stage.scale(0.98, FADE_OUT, easeInOutCubic),
  );
});
