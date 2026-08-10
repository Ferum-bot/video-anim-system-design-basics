import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0807.m4a';
import twoArmies from './scenes/twoArmies?scene';

// Видео 03, TCP — разрыв соединения и проблема двух армий (без секции TIME_WAIT).
// audioOffset ставит t=0 сцены на 32:13.0 дорожки.
export default makeProject({
  scenes: [twoArmies],
  audio,
});
