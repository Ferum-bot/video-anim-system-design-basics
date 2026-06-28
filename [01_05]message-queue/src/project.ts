import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0626.m4a';
import numbersScene from './scenes/numbers?scene';
import scalingScene from './scenes/scaling?scene';

export default makeProject({
  scenes: [numbersScene, scalingScene],
  // Full-video narration. audioOffset in project.meta is set to the message-queue segment.
  audio,
});
