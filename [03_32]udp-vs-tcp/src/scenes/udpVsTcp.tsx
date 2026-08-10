import {makeScene2D} from '@motion-canvas/2d';
import {all, easeInOutCubic, waitUntil} from '@motion-canvas/core';
import {createStage, revealStage, sceneCaption} from '@lib';
import {compareTable} from '../table';

const STAGE_HEIGHT = 740;
const CAPTION_Y = -322;
const TABLE_Y = 0;

const FADE_OUT = 0.9;

export default makeScene2D(function* (view) {
  const stage = createStage(view, {height: STAGE_HEIGHT});
  stage.opacity(0);

  const caption = sceneCaption({text: 'UDP ПРОТИВ TCP', y: CAPTION_Y, fontWeight: 500});
  const table = compareTable({y: TABLE_Y});

  stage.add(table.node);
  stage.add(caption.node);

  // «Давай соединим это всё в одну общую таблицу» — сначала пустой каркас
  yield* waitUntil('table');
  yield* all(revealStage(stage), caption.appear(), table.appear());

  // «…где сравним UDP и TCP»
  yield* waitUntil('compare');
  yield* table.columns();

  // Дальше он просто перечисляет строки — каждая приезжает на своём слове
  yield* waitUntil('model');
  yield* table.row(0);
  yield* waitUntil('conn');
  yield* table.row(1);
  yield* waitUntil('deliver');
  yield* table.row(2);
  yield* waitUntil('order');
  yield* table.row(3);
  yield* waitUntil('flowcong');
  yield* table.row(4);
  yield* waitUntil('header');
  yield* table.row(5);
  yield* waitUntil('state');
  yield* table.row(6);
  yield* waitUntil('spec');
  yield* table.row(7);

  // «Эту таблицу ты видишь на экране»
  yield* waitUntil('onscreen');
  yield* table.settle();

  // «Глобально можно определить ещё и характер»
  yield* waitUntil('char');
  yield* table.row(8);

  // «UDP ничего не обещает и ничего не берёт взамен»
  yield* waitUntil('udpchar');
  yield* table.cell(8, 0);

  // «TCP обещает много чего, но и взамен ты платишь очень много»
  yield* waitUntil('tcpchar');
  yield* table.cell(8, 1);

  // Exit is composed by hand instead of `endScene`, matching the other video-03 parts.
  yield* waitUntil('end');
  yield* all(
    stage.opacity(0, FADE_OUT, easeInOutCubic),
    stage.scale(0.98, FADE_OUT, easeInOutCubic),
  );
});
