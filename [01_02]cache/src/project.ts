import './theme'; // applies this part's theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0626.m4a';
import numbersScene from './scenes/numbers?scene';
import scalingScene from './scenes/scaling?scene';

export default makeProject({
  scenes: [numbersScene, scalingScene],
  // Full-video narration. Set audioOffset in project.meta to the cache segment so the
  // waveform under the timeline lines up with this part.
  audio,
});
