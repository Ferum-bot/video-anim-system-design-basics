import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0718.m4a';
import recap from './scenes/recap?scene';

// Video 02 "Всё про сети" — заключение: рекап-сетка 2×2 (сеть-из-сетей · OSI · стандарты ·
// TCP/IP). audioOffset ставит t=0 сцены на ~22:19 дорожки.
export default makeProject({
  scenes: [recap],
  audio,
});
