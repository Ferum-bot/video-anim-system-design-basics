import {makeScene2D} from '@motion-canvas/2d';
import {waitUntil} from '@motion-canvas/core';
import {backdrop, createStage, endScene} from '@lib';
import type {Beat} from './takeaways/beat';
import {dbBeat} from './takeaways/dbBeat';
import {cacheBeat} from './takeaways/cacheBeat';
import {queueBeat} from './takeaways/queueBeat';
import {appBeat} from './takeaways/appBeat';
import {recap} from './takeaways/recap';

// Each takeaway plays in turn inside its own block, then all four collapse into a
// 2×2 recap grid. The beat factories live in ./takeaways/*; this scene only
// orchestrates the order and the cross-fades.
export default makeScene2D(function* (view) {
  const stage = createStage(view);

  const bg = backdrop();
  stage.add(bg.node); // same semi-transparent scrim as every other part

  const beats: Beat[] = [dbBeat(), cacheBeat(), queueBeat(), appBeat()];
  const cues = ['db', 'cache', 'queue', 'app'];

  let prev: Beat | null = null;
  for (let i = 0; i < beats.length; i++) {
    yield* waitUntil(cues[i]);
    if (i === 0) yield bg.appear(); // fork: dark backing fades in with the first beat
    if (prev) yield* prev.node.opacity(0, 0.5); // fade out the previous block (frame + content)
    const beat = beats[i];
    stage.add(beat.node);
    yield* beat.play();
    if (beat.loop) yield beat.loop(); // fork: keeps running (faded out invisibly later)
    prev = beat;
  }

  // ── Collapse into the 2×2 recap, hold briefly ───────────────────────────────
  yield* waitUntil('recap');
  if (prev) yield* prev.node.opacity(0, 0.5);
  const grid = recap();
  stage.add(grid.node);
  yield* grid.play();

  yield* endScene(stage);
});
