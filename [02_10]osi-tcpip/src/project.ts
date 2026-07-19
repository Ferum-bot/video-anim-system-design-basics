import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0718.m4a';
import collapse from './scenes/collapse?scene';

// Video 02 "Всё про сети" — "OSI → TCP/IP: схлопывание слоёв". audioOffset puts the scene's
// t=0 at ~21:36 of the track.
export default makeProject({
  scenes: [collapse],
  audio,
});
