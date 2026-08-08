import {makeScene2D} from '@motion-canvas/2d';
import {all, easeInOutCubic, waitUntil} from '@motion-canvas/core';
import {createStage, revealStage, sceneCaption} from '@lib';
import {MAC_TEXT, addressBytes, segmentScope} from '../mac';

// A card-height stage, not a full-height band: the scene is one object plus its labels.
const STAGE_HEIGHT = 680;
const CAPTION_Y = -238;
const ADDRESS_Y = 14;

// Final beat: the address shrinks up out of the way and the scope diagram takes the floor.
const DOCK_Y = -152;
const DOCK_SCALE = 0.6;
const SCOPE_Y = 46;

const FADE_OUT = 0.9;

export default makeScene2D(function* (view) {
  const stage = createStage(view, {height: STAGE_HEIGHT});
  stage.opacity(0);

  const caption = sceneCaption({text: 'ЗАГОЛОВОК КАДРА', y: CAPTION_Y, fontWeight: 500});
  const address = addressBytes({y: ADDRESS_Y});
  const scope = segmentScope({y: SCOPE_Y, address: MAC_TEXT});

  stage.add(caption.node);
  stage.add(address.node);
  stage.add(scope.node);

  // «Первая вещь в самом заголовке — это непосредственно адрес»
  yield* waitUntil('address');
  yield* all(revealStage(stage), caption.appear(), address.appear());

  // «используется такая адресация, как MAC-адреса»
  yield* waitUntil('mac');
  yield* all(caption.retitle('MAC-АДРЕС'), address.unfold());

  // «48 бит… вшиты в твою сетевую карту ещё на заводе»
  yield* waitUntil('bits');
  yield* address.measure();

  // «первые три байта — идентификатор производителя»
  yield* waitUntil('split');
  yield* all(caption.retitle('ИЗ ЧЕГО СОСТОИТ'), address.cut());

  // «вторые три байта производитель раздаёт своим устройствам сам»
  yield* waitUntil('serial');
  yield* address.markSerial();

  // «по MAC-адресу можно определить вендора, посмотрев на первые байты»
  yield* waitUntil('vendor');
  yield* all(caption.retitle('ЧЕЙ ЭТО ВЕНДОР'), address.focusVendor());

  // «например, кто производитель — Intel или Apple»
  yield* waitUntil('brands');
  yield* address.swapVendor();

  // «стоит воспринимать MAC как адрес соседа по кабелю либо эфиру»
  yield* waitUntil('neighbour');
  yield* all(caption.retitle('ГДЕ ОН ДЕЙСТВУЕТ'), address.dock(DOCK_Y, DOCK_SCALE));
  yield* scope.appear();

  // «за пределы своего сегмента данный адрес никуда не уходит»
  yield* waitUntil('segment');
  yield* scope.bound();
  yield scope.keepTrying(); // fork: frames keep dying on the edge until the scene ends

  // Exit is composed by hand instead of `endScene`: the whole group settles back a touch
  // while the panel fades, so the scene leaves on a motion rather than a hard cut.
  yield* waitUntil('end');
  yield* all(
    stage.opacity(0, FADE_OUT, easeInOutCubic),
    stage.scale(0.98, FADE_OUT, easeInOutCubic),
  );
});
