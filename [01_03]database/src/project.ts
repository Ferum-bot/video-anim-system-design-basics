import './theme'; // applies this part's theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0626.m4a';
import numbersScene from './scenes/numbers?scene';
import shardingScene from './scenes/sharding?scene';

export default makeProject({
  scenes: [numbersScene, shardingScene],
  // Full-video narration. Set audioOffset in project.meta to the database segment so the
  // waveform under the timeline lines up with this part.
  audio,
});
