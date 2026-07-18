import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0718.m4a';
import twoElephants from './scenes/twoElephants?scene';

// Video 02 "Всё про сети" — "апокалипсис двух слонов" (Tanenbaum). audioOffset puts the
// scene's t=0 at ~15:36 of the track.
export default makeProject({
  scenes: [twoElephants],
  audio,
});
