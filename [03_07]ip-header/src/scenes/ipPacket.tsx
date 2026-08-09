import {makeScene2D} from '@motion-canvas/2d';
import {all, cancel, createSignal, easeInOutCubic, waitUntil} from '@motion-canvas/core';
import {createStage, revealStage, sceneCaption} from '@lib';
import {headerBar, hopChain} from '../ip';

const STAGE_HEIGHT = 800;
const CAPTION_Y = -338;
const HEADER_Y = -6;

// Where the TTL cell parks once the hop chain takes the floor.
const BADGE_AT: [number, number] = [-352, -244];
const CHAIN_Y = 40;

// Small enough to die on screen; the aside says what it really is in the wild.
const DEMO_TTL = 4;

const FADE_OUT = 0.9;

export default makeScene2D(function* (view) {
  const stage = createStage(view, {height: STAGE_HEIGHT});
  stage.opacity(0);

  // One number shared by the header cell and the packet badge — that identity is the point.
  const ttl = createSignal(DEMO_TTL);

  const caption = sceneCaption({text: 'ЗАГОЛОВОК IP', y: CAPTION_Y, fontWeight: 500});
  const header = headerBar({y: HEADER_Y, ttl});
  const chain = hopChain({y: CHAIN_Y, ttl});

  stage.add(header.node);
  stage.add(chain.node);
  stage.add(caption.node);

  // «Давай коротко поговорим про сам IP — как устроен сетевой пакет»
  yield* waitUntil('intro');
  yield* all(revealStage(stage), caption.appear(), header.appear());

  // «У пакета есть заголовок. Это 20 байт фиксированной части»
  yield* waitUntil('twenty');
  yield* header.count();

  // «Внутри есть версия — благодаря ней IPv4 и IPv6 сосуществуют десятилетиями»
  yield* waitUntil('version');
  yield* header.light('version');

  // «После чего полная длина — максимум 65 535 байт на пакет»
  yield* waitUntil('length');
  yield* header.light('length');

  // «Поле протокол — кому наверху отдать содержимое: TCP либо UDP»
  yield* waitUntil('protocol');
  yield* header.light('protocol');

  // «Ну и адрес отправителя и получателя»
  yield* waitUntil('addresses');
  yield* header.light('src');

  // «Кроме того, у IP есть очень важное поле — TTL» — the highlight jumps back, then the
  // cell leaves the diagram and becomes the packet's hop budget.
  yield* waitUntil('ttl');
  yield* all(caption.retitle('TTL · ВРЕМЯ ЖИЗНИ'), header.light('ttl'));
  yield* header.focusTtl(BADGE_AT);
  yield* chain.appear();

  // «Каждый маршрутизатор уменьшает его на единицу»
  yield* waitUntil('hops');
  yield* chain.hop(1);
  yield* chain.hop(2);
  yield* chain.hop(3);

  // «…и когда счётчик доходит до нуля, пакет просто выбрасывается»
  yield* waitUntil('dies');
  yield* chain.hop(4);
  yield* chain.die();

  // «Отправителю летит специальное системное предупреждение»
  yield* waitUntil('warning');
  yield* chain.warn();

  // «Это нужно, чтобы пакеты не странствовали по сети бесконечно»
  yield* waitUntil('why');
  yield* all(caption.retitle('ЗАЧЕМ ЭТО НУЖНО'), chain.showLoop());
  const orbit = yield chain.spinLoop(); // fork: it never stops, that's the joke

  // «Именно по этому механизму работает traceroute: TTL 1, 2, 3…»
  yield* waitUntil('trace');
  cancel(orbit);
  yield* all(caption.retitle('ТАК РАБОТАЕТ TRACEROUTE'), chain.hideLoop(), header.hideTtl());
  yield* chain.reset(1);
  yield* chain.hop(1);
  yield* all(chain.die(), chain.traceLine(0));
  yield* chain.reset(2);
  yield* chain.hop(1);
  yield* chain.hop(2);
  yield* all(chain.die(), chain.traceLine(1));
  yield* chain.reset(3);
  yield* chain.hop(1);
  yield* chain.hop(2);
  yield* chain.hop(3);
  yield* all(chain.die(), chain.traceLine(2));

  // «…тем самым ты можешь посмотреть весь сетевой путь у себя локально»
  yield* waitUntil('path');
  yield* chain.warn();

  // Exit is composed by hand instead of `endScene`, matching the other video-03 parts.
  yield* waitUntil('end');
  yield* all(
    stage.opacity(0, FADE_OUT, easeInOutCubic),
    stage.scale(0.98, FADE_OUT, easeInOutCubic),
  );
});
