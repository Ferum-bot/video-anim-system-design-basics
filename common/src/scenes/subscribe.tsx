import {makeScene2D} from '@motion-canvas/2d';
import {all, waitFor} from '@motion-canvas/core';
import {createStage, endScene} from '@lib';
import {subscribeButton} from '../components/subscribeButton';
import {cursor} from '../components/cursor';

// "Подпишитесь на канал" call-to-action: a cursor glides in and clicks the YouTube
// subscribe button, which morphs to the subscribed state. A standalone overlay —
// timed with waitFor (no narration markers), drop it anywhere.
const BUTTON_Y = 0;
const CLICK_AT: [number, number] = [70, 20]; // ripple origin, relative to the button centre

export default makeScene2D(function* (view) {
  const stage = createStage(view);

  const button = subscribeButton();
  button.node.y(BUTTON_Y);
  stage.add(button.node);

  const pointer = cursor();
  stage.add(pointer.node);

  // Button pops in, then the cursor glides in from the lower-right and taps it.
  yield* button.appear();
  yield* waitFor(0.4);

  yield* pointer.appearAt([260, 210]);
  yield* pointer.moveTo([CLICK_AT[0], CLICK_AT[1] + BUTTON_Y], 0.95);
  yield* waitFor(0.12);
  yield* all(pointer.click(), button.subscribe(CLICK_AT)); // button reacts to the tap

  // Cursor leaves; hold the subscribed state so it reads on screen.
  yield* waitFor(0.2);
  yield* pointer.fadeOut();
  yield* waitFor(1.4);

  yield* endScene(stage);
});
