import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0718.m4a';
import standards from './scenes/standards?scene';

// Video 02 "Всё про сети" — "как рождаются стандарты" (de-facto vs de-jure). audioOffset
// puts the scene's t=0 at ~12:00 of the track.
export default makeProject({
  scenes: [standards],
  audio,
});
