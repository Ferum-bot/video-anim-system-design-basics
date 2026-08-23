import {makeScene2D} from '@motion-canvas/2d';
import {all, easeInOutCubic, waitUntil} from '@motion-canvas/core';
import {createStage, revealStage} from '@lib';
import {bitsOnWire, floorStack, frameRepair, pathHops, payload, toProcess} from '../floors';

// Вся часть — один объект: пятиэтажка из `[04_02]` возвращается и получает содержание.
// Каждый нижний этаж оживает своим делом на форкнутом бесконечном цикле, поэтому «полезной
// работы 0» читается как приговор работающему механизму, а не как утверждение о статике.
const STAGE_HEIGHT = 910;
const PANEL_HALF = (STAGE_HEIGHT - 32) / 2;
const OFF_SCREEN = PANEL_HALF + 90; // откуда падают и куда проваливаются иконки
// Иконки садятся чуть выше центра плиты: под тайлом ещё подпись, и по нижнему краю
// она иначе ложится ровно на обводку.
const LAND_LIFT = 12;

const FADE_OUT = 0.9;

export default makeScene2D(function* (view) {
  const stage = createStage(view, {height: STAGE_HEIGHT});
  stage.opacity(0);

  // Схемы работы принадлежат сцене (она форкает их циклы), а плиты их только вмещают.
  const physical = bitsOnWire();
  const link = frameRepair();
  const network = pathHops();
  const transport = toProcess();

  const stack = floorStack({jobs: [transport.node, network.node, link.node, physical.node]});
  const cargo = payload({top: -OFF_SCREEN, bottom: OFF_SCREEN});

  stage.add(stack.node);
  stage.add(cargo.node);

  // «Давай начнём с простого утверждения, которое может прозвучать обидно»
  yield* waitUntil('claim');
  yield* all(revealStage(stage), stack.appear());

  // «Все уровни ниже прикладного занимаются доставкой данных» — верхний отступает
  yield* waitUntil('below');
  yield* stack.focusLower();

  // Дальше он перечисляет этажи снизу вверх, и каждый заводит свою схему.
  yield* waitUntil('phys');
  yield* stack.wake(4);
  yield physical.run();

  yield* waitUntil('link');
  yield* stack.wake(3);
  yield link.run();

  yield* waitUntil('net');
  yield* stack.wake(2);
  yield network.run();

  yield* waitUntil('transport');
  yield* stack.wake(1);
  yield transport.run();

  // «…а также при необходимости даёт некоторые дополнительные гарантии доставки»
  yield* waitUntil('guarantees');
  yield* transport.guarantee();

  // «Каждый из них сам по себе незаменим»
  yield* waitUntil('vital');
  yield* stack.vital();

  // «И ни один не делает ничего полезного» — четыре нуля в столбик рядом с «НЕЗАМЕНИМ»
  yield* waitUntil('none');
  yield* stack.zeroWork();

  // «Всё, что они делают, — транспортируют данные»
  yield* waitUntil('justmove');
  yield* stack.oneJob();

  // Три вещи, которых доставка не делает: каждая проваливается сквозь всю стопку.
  yield* waitUntil('page');
  yield* cargo.drop(0);
  yield* waitUntil('kafka');
  yield* cargo.drop(1);
  yield* waitUntil('payment');
  yield* cargo.drop(2);

  // «Полезная работа начинается именно тут, на прикладном уровне» — они возвращаются наверх
  yield* waitUntil('here');
  yield* all(stack.lightTop(), cargo.land(stack.slotX, stack.plateY(0) - LAND_LIFT));

  // «Этот уровень полностью принадлежит тебе» — всё ниже уходит в серое
  yield* waitUntil('yours');
  yield* stack.ownership();

  // «Глобально всё, что тебя ограничивает и всё, что можешь делать» — слот освобождается
  yield* waitUntil('limits');
  yield* cargo.dismiss();

  // «…это какие сообщения, как и кому доходят»
  yield* waitUntil('three');
  yield* stack.limits();

  // «По ту сторону ничего, кроме выбора транспорта и некоторых гарантий»
  yield* waitUntil('otherside');
  yield* stack.otherSide();

  // «Это единственный уровень, где ты не пользуешься уже готовыми чужими решениями»
  yield* waitUntil('only');
  yield* stack.readOnly();

  // «…а можешь создавать свои» — пустое поле с мигающим курсором
  yield* waitUntil('create');
  yield* stack.createOwn();
  yield stack.blink();

  yield* waitUntil('end');
  yield* stage.opacity(0, FADE_OUT, easeInOutCubic);
});
