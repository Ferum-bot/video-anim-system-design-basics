import {makeScene2D} from '@motion-canvas/2d';
import {all, cancel, easeInOutCubic, waitUntil} from '@motion-canvas/core';
import {createStage, revealStage, sceneCaption} from '@lib';
import {hintChip, partCard} from '../part1';

// A shorter column than the default full-height stage, so the panel reads as a card with air
// above and below it and its frame is visible all the way round. Everything below is laid out
// inside it: 748 usable units after the theme's frame inset.
const STAGE_HEIGHT = 780;
const CAPTION_Y = -310;
const CARD_Y = -15;
const CHIP_Y = 296;

const FADE_OUT = 0.9;

export default makeScene2D(function* (view) {
  const stage = createStage(view, {height: STAGE_HEIGHT});
  stage.opacity(0);

  const caption = sceneCaption({text: 'ЧАСТЬ 1 · ФУНДАМЕНТ СЕТЕЙ', y: CAPTION_Y, fontWeight: 500});
  const card = partCard({y: CARD_Y});
  const chip = hintChip({text: 'СМОТРИ ПЕРВУЮ ЧАСТЬ', y: CHIP_Y});

  stage.add(caption.node);
  stage.add(card.node);
  stage.add(chip.node);

  // «В первой части мы разбирали то, как устроена компьютерная сеть фундаментально»
  yield* waitUntil('card');
  yield* all(revealStage(stage), caption.appear(), card.appear());
  const idle = yield card.idle(); // fork: a barely-there breath through the quiet hold

  // «обязательно переходи по подсказкам и смотри» — the YouTube card lands here. The idle
  // breath hands over to the livelier pulse; both loops drive the same properties, so the
  // first has to be cancelled before the second starts.
  yield* waitUntil('hint');
  cancel(idle);
  yield* all(card.nudge(), chip.appear());
  yield card.pulse(); // forked on the same frame as the chip's, so they stay in step
  yield chip.pulse();

  // Exit is composed by hand instead of `endScene`: the card drifts up and shrinks while the
  // panel fades, which reads better than a flat opacity drop on a still image.
  yield* waitUntil('end');
  yield* all(card.dismiss(), stage.opacity(0, FADE_OUT, easeInOutCubic));
});
