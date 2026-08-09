import {makeScene2D} from '@motion-canvas/2d';
import {all, easeInOutCubic, waitUntil} from '@motion-canvas/core';
import {banner, colors, createStage, revealStage, sceneCaption} from '@lib';
import {costCompare, frameBar} from '../frame';

// A card-height stage, matching the other video-03 parts.
const STAGE_HEIGHT = 680;
const CAPTION_Y = -238;
const BAR_Y = -46;

// Final beat: the bar shrinks up and the cost comparison takes the floor.
const DOCK_Y = -170;
const DOCK_SCALE = 0.58;
const COST_Y = 40;

// Wrap-up: the comparison clears and the frame settles back under the closing line.
const CLOSE_BAR_Y = -40;
const CLOSE_BAR_SCALE = 0.92;
const BANNER_Y = 110;

// A small send, so the same 26 bytes stop being a rounding error.
const SMALL_PAYLOAD = 50;

const FADE_OUT = 0.9;

export default makeScene2D(function* (view) {
  const stage = createStage(view, {height: STAGE_HEIGHT});
  stage.opacity(0);

  const caption = sceneCaption({text: 'СИСТЕМНЫЕ БАЙТЫ', y: CAPTION_Y, fontWeight: 500});
  const bar = frameBar({y: BAR_Y});
  const cost = costCompare({y: COST_Y});
  const closing = banner({
    text: 'канальный уровень просто передаёт кадры между соседями',
    accent: colors.cyan,
    y: BANNER_Y,
  });

  stage.add(caption.node);
  stage.add(bar.node);
  stage.add(cost.node);
  stage.add(closing.node);

  // «Тут появляется особенная штука — это системные байты»
  yield* waitUntil('overhead');
  yield* all(revealStage(stage), caption.appear(), bar.appear());

  // «данные, которые не несут никакой полезной информации»
  yield* waitUntil('define');
  yield* bar.define();

  // «давай посмотрим, как это всё выглядит в цифрах»
  yield* waitUntil('numbers');
  yield* all(caption.retitle('ETHERNET-КАДР'), bar.concrete());

  // «Ethernet-кадр несёт 26 системных байт»
  yield* waitUntil('total');
  yield* bar.countTotal();

  // «8 байт преамбулы»
  yield* waitUntil('fields');
  yield* bar.revealFields(0, 0);

  // «2 MAC-адреса по 6 байт, тип, а также контрольная сумма»
  yield* waitUntil('addresses');
  yield* bar.revealFields(1, 5);

  // «при полном кадре это около 2%» — the bar redraws to true scale and proves it
  yield* waitUntil('full');
  yield* all(caption.retitle('СКОЛЬКО ЭТО В ДОЛЯХ'), bar.toScale());

  // «но если ты начинаешь слать мелкие данные…»
  yield* waitUntil('small');
  yield* bar.shrinkPayload(SMALL_PAYLOAD);

  // «в разных каналах это ещё может сильнее отличаться»
  yield* waitUntil('varies');
  yield* bar.note('у каждого канала — свой оверхед');

  // «это оплата за то, чтобы физический уровень не потерял наши данные»
  yield* waitUntil('price');
  yield* all(caption.retitle('ЗА ЧТО ЭТО ПЛАТА'), bar.dock(DOCK_Y, DOCK_SCALE), cost.appear());

  // «передавать второй раз дороже, чем потратить избыточные байты»
  yield* waitUntil('cheaper');
  yield* cost.compare();

  // «с канальным уровнем всё понятно — он просто передаёт кадры между соседями»
  yield* waitUntil('close');
  yield* all(
    cost.dismiss(),
    bar.dock(CLOSE_BAR_Y, CLOSE_BAR_SCALE), // the frame comes back as the subject of the line
    caption.retitle('КАНАЛЬНЫЙ УРОВЕНЬ'),
  );
  yield* closing.appear();

  // Exit is composed by hand instead of `endScene`: the panel settles back a touch as it
  // fades, so the scene leaves on a motion rather than a hard cut.
  yield* waitUntil('end');
  yield* all(
    stage.opacity(0, FADE_OUT, easeInOutCubic),
    stage.scale(0.98, FADE_OUT, easeInOutCubic),
  );
});
