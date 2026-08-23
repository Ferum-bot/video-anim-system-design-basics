import {makeScene2D} from '@motion-canvas/2d';
import {all, easeInOutCubic, waitUntil} from '@motion-canvas/core';
import {createStage, protocolPassport, revealStage} from '@lib';
import {deck, definition, httpRules, httpSemantics, httpSyntax, httpTypes} from '../passport';

// Определение сворачивается в три слова, три слова становятся шапкой карточки, карточка
// раскладывается на четыре ячейки — и уже в них въезжает HTTP. Паспорт живёт в `@lib`:
// это форма на весь сезон, её предстоит инстанцировать ещё шесть раз.
const STAGE_HEIGHT = 720;
const CARD_Y = 32;
const RECEDE = 0.72;
// Стопка веером уходит вправо-вверх и тянет композицию за собой: сдвигаем карточку со
// стопкой на половину выноса, иначе кадр уезжает вправо ровно на 40 единиц.
const DECK_SHIFT = 20;

const FADE_OUT = 0.9;

export default makeScene2D(function* (view) {
  const stage = createStage(view, {height: STAGE_HEIGHT});
  stage.opacity(0);

  const intro = definition();
  const card = protocolPassport({
    y: CARD_Y,
    cells: [
      {label: 'ТИПЫ', hint: 'КАКИЕ БЫВАЮТ СООБЩЕНИЯ', content: httpTypes()},
      {label: 'СИНТАКСИС', hint: 'КАКИЕ ПОЛЯ И КАК РАЗДЕЛЕНЫ', content: httpSyntax()},
      {label: 'СЕМАНТИКА', hint: 'ЧТО ОЗНАЧАЮТ ЗНАЧЕНИЯ', content: httpSemantics()},
      {label: 'ПРАВИЛА', hint: 'КТО И КОГДА ГОВОРИТ', content: httpRules()},
    ],
  });
  const stack = deck({y: CARD_Y, bottom: CARD_Y + 236});

  stage.add(stack.node);
  stage.add(card.node);
  stage.add(intro.node);

  // «Протокол — это соглашение о том, как должно происходить взаимодействие»
  yield* waitUntil('agreement');
  yield* all(revealStage(stage), intro.appear());

  // «Обрати внимание на слово» — в цвете остаётся только «СОГЛАШЕНИЕ»
  yield* waitUntil('word');
  yield* intro.highlight();

  // «Это не технология, не формат»
  yield* waitUntil('nottech');
  yield* intro.refute();

  // «Протокол определяет три вещи»
  yield* waitUntil('three');
  yield* intro.slots();

  yield* waitUntil('format');
  yield* intro.word(0);
  yield* waitUntil('order');
  yield* intro.word(1);
  yield* waitUntil('actions');
  yield* intro.word(2);

  // «Три слова, и это полностью описывает понятие протокола» — они не гаснут, а
  // поднимаются наверх и становятся шапкой того, что сейчас раскроется.
  yield* waitUntil('threewords');
  yield* intro.toHeader();

  // «Если разложить на прикладной уровень, преобразуется в четыре компонента»
  yield* waitUntil('four');
  yield* card.appear();

  // «Это самая полезная штука, которая будет во всей этой части»
  yield* waitUntil('useful');
  yield* card.name('ПАСПОРТ ПРОТОКОЛА · ЗАБЕРИ СЕБЕ');

  // Сначала ячейки объясняют, что в них вообще пишут.
  yield* waitUntil('types');
  yield* card.explain(0);
  yield* waitUntil('syntax');
  yield* card.explain(1);
  yield* waitUntil('semantics');
  yield* card.explain(2);
  yield* waitUntil('rules');
  yield* card.explain(3);

  // «Давай разберём на примере самого популярного протокола — HTTP»
  yield* waitUntil('http');
  yield* card.name('HTTP');

  // …и те же четыре ячейки получают значения.
  yield* waitUntil('htypes');
  yield* card.fill(0);
  yield* waitUntil('hsyntax');
  yield* card.fill(1);
  yield* waitUntil('hsemantics');
  yield* card.fill(2);
  yield* waitUntil('hrules');
  yield* card.fill(3);

  // «Только что мы описали HTTP по этим четырём пунктам»
  yield* waitUntil('stamp');
  yield* card.stamp('ОПИСАН');

  // «В рамках этого шаблона можно описать любой протокол прикладного уровня»
  yield* waitUntil('template');
  yield* all(
    card.recede(RECEDE),
    stack.reveal(),
    card.node.x(-DECK_SHIFT, 0.7, easeInOutCubic),
    stack.node.x(-DECK_SHIFT, 0.7, easeInOutCubic),
  );

  // «В каждом из видео я буду это так и делать»
  yield* waitUntil('everyvideo');
  yield* stack.label();

  // «Протокол — это договорённость из четырёх частей»
  yield* waitUntil('recap');
  yield* all(stack.dismiss(), card.restore(), card.node.x(0, 0.6, easeInOutCubic));

  yield* waitUntil('end');
  yield* stage.opacity(0, FADE_OUT, easeInOutCubic);
});
