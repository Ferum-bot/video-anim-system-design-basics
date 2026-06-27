import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0626.m4a';
import computeScene from './scenes/[01]hardware/compute?scene';
import storageScene from './scenes/[01]hardware/storage?scene';
import networkScene from './scenes/[01]hardware/network?scene';

export default makeProject({
  scenes: [computeScene, storageScene, networkScene],
  audio, // full-video narration track — drag scene markers to its waveform
});
