import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0718.m4a';
import requestJourney from './scenes/requestJourney?scene';

// Video 02 "Всё про сети" — part 03 "Сеть из сетей" (network of networks).
// audioOffset in project.meta lines the narration up so the scene's t=0 sits at ~04:42
// of the track (the request-journey beat).
export default makeProject({
  scenes: [requestJourney],
  audio,
});
