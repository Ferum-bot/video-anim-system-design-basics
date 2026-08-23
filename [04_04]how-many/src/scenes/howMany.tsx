import {makeScene2D} from '@motion-canvas/2d';
import {all, cancel, easeInOutCubic, waitUntil} from '@motion-canvas/core';
import {createStage, revealStage} from '@lib';
import {appRoom, protocolField} from '../many';

// Два движения подряд: сначала прикладной этаж крупным планом — оказывается, в нём живут
// и служебные протоколы для самих же прикладных, — потом масштаб: единого списка нет,
// тысячи RFC и портов, и горстка имён, которой пользуются все.
const STAGE_HEIGHT = 820;

const FADE_OUT = 0.9;

export default makeScene2D(function* (view) {
  const stage = createStage(view, {height: STAGE_HEIGHT});
  stage.opacity(0);

  const room = appRoom();
  const field = protocolField();

  stage.add(room.node);
  stage.add(field.node);

  // «На этом уровне есть одна тонкость, которую часто упускают»
  yield* waitUntil('catch');
  yield* all(revealStage(stage), room.appear());

  // «Прикладной уровень содержит не только протоколы для приложений»
  yield* waitUntil('notonly');
  yield* room.tenants();

  // «…он также содержит и некоторые системные протоколы»
  yield* waitUntil('system');
  yield* room.service();

  // «Лучший пример — это протокол DNS»
  yield* waitUntil('dns');
  yield* room.dns();

  // «Это прикладной протокол, который обслуживает другие протоколы прикладного уровня» —
  // стрелки к DNS идут горизонтально, не покидая этаж, и только потом вниз по лифту.
  yield* waitUntil('serves');
  yield* room.serves();
  const traffic = yield room.traffic();

  // «Без него не работает ни веб, ни почта» — DNS гаснет вместе со всем, что от него зависит
  yield* waitUntil('dead');
  yield* room.dead();

  // «Сколько вообще существует протоколов прикладного уровня?»
  yield* waitUntil('howmany');
  cancel(traffic);
  yield* room.dismiss();

  // «Единого списка не существует»
  yield* waitUntil('nolist');
  yield* field.noList();

  // «Каждый из нас может придумать свой собственный протокол»
  yield* waitUntil('own');
  yield* field.ownChip();
  const caret = yield field.blink();

  // «Первое — это документы RFC»
  yield* waitUntil('rfc');
  cancel(caret);
  yield* field.plate(0);
  yield* waitUntil('rfcnum');
  yield* field.count(0);

  // «А в реестре портов IANA…»
  yield* waitUntil('iana');
  yield* field.plate(1);
  yield* waitUntil('iananum');
  yield* field.count(1);

  // «И среди всего этого разнообразия» — поле, которое не сосчитать
  yield* waitUntil('variety');
  yield* field.swarm();

  // «…есть лишь горстка очень популярных протоколов»
  yield* waitUntil('handful');
  yield* field.clear();

  // Имена всплывают из поля ровно на своих репликах.
  yield* waitUntil('http');
  yield* field.rise(0);
  yield* waitUntil('graphql');
  yield* field.rise(1);
  yield* waitUntil('grpc');
  yield* all(field.rise(2), field.overHttp());
  yield* waitUntil('dnschip');
  yield* field.rise(3);
  yield* waitUntil('ws');
  yield* all(field.rise(4), field.rise(5));
  yield* waitUntil('webrtc');
  yield* field.rise(6);

  // «По каждому из них будет отдельное видео» — горстка становится полкой эпизодов
  yield* waitUntil('each');
  yield* field.shelf();

  yield* waitUntil('end');
  yield* stage.opacity(0, FADE_OUT, easeInOutCubic);
});
