import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0718.m4a';
import osiModel from './scenes/osiModel?scene';

// Video 02 "Всё про сети" — part 04 "Модель OSI". audioOffset in project.meta puts the
// scene's t=0 at ~06:22 of the track (where the OSI model is introduced).
export default makeProject({
  scenes: [osiModel],
  audio,
});
