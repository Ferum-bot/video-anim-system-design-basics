import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0718.m4a';
import layersCode from './scenes/layersCode?scene';

// Video 02 "Всё про сети" — "слои = код" (part 04 tail, its own render). audioOffset puts
// the scene's t=0 at ~10:12 of the track (where "каждый уровень существует в виде кода").
export default makeProject({
  scenes: [layersCode],
  audio,
});
