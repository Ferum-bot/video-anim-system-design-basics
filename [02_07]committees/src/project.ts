import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0718.m4a';
import committees from './scenes/committees?scene';

// Video 02 "Всё про сети" — "мир комитетов" (ITU / ISO / IEEE / IETF). audioOffset puts the
// scene's t=0 at ~13:30 of the track.
export default makeProject({
  scenes: [committees],
  audio,
});
