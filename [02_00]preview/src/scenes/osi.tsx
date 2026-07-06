import {makeScene2D} from '@motion-canvas/2d';
import {waitFor, waitUntil} from '@motion-canvas/core';
import {colors, createStage, endScene} from '@lib';
import {osiStack, sceneHeading} from '../net';
import type {OsiLayer} from '../net';

// The seven OSI layers, top (Application) to bottom (Physical). One accent per layer,
// reused wherever that layer appears across the video.
const LAYERS: OsiLayer[] = [
  {n: 7, name: 'Application', protos: ['HTTP', 'DNS'], accent: colors.purple},
  {n: 6, name: 'Presentation', protos: ['TLS', 'UTF-8'], accent: colors.purple},
  {n: 5, name: 'Session', protos: ['Sockets'], accent: colors.blue},
  {n: 4, name: 'Transport', protos: ['TCP', 'UDP'], accent: colors.cyan},
  {n: 3, name: 'Network', protos: ['IP', 'ICMP'], accent: colors.blue},
  {n: 2, name: 'Data Link', protos: ['Ethernet', 'ARP'], accent: colors.orange},
  {n: 1, name: 'Physical', protos: ['Cable', 'RF'], accent: colors.red},
];

export default makeScene2D(function* (view) {
  const stage = createStage(view);

  const heading = sceneHeading({
    caption: 'MODEL // OSI',
    title: 'Семь уровней',
    accent: colors.cyan,
    y: -430,
  });
  stage.add(heading.node);
  yield* heading.appear();

  yield* waitUntil('stack');
  const stack = osiStack({layers: LAYERS, y: 40});
  stage.add(stack.node);
  yield* stack.appear();

  yield* waitFor(0.5);
  yield* endScene(stage);
});
