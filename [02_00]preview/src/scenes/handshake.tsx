import {makeScene2D} from '@motion-canvas/2d';
import {waitFor, waitUntil} from '@motion-canvas/core';
import {colors, createStage, endScene} from '@lib';
import {handshake, sceneHeading} from '../net';
import type {HandshakeStep} from '../net';

// The three-way handshake, colour-coded by direction.
const STEPS: HandshakeStep[] = [
  {label: 'SYN', dir: 1, color: colors.cyan},
  {label: 'SYN-ACK', dir: -1, color: colors.blue},
  {label: 'ACK', dir: 1, color: colors.green},
];

export default makeScene2D(function* (view) {
  const stage = createStage(view);

  const heading = sceneHeading({
    caption: 'TRANSPORT // TCP',
    title: 'Рукопожатие',
    accent: colors.cyan,
    y: -300,
  });
  stage.add(heading.node);
  yield* heading.appear();

  yield* waitUntil('nodes');
  const hs = handshake({client: 'CLI', server: 'SRV', steps: STEPS, y: 60});
  stage.add(hs.node);
  yield* hs.appear();

  yield* waitUntil('exchange');
  yield* hs.play();

  yield* waitFor(0.5);
  yield* endScene(stage);
});
