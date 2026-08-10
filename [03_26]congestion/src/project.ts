import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0807.m4a';
import congestion from './scenes/congestion?scene';

// Видео 03, TCP — контроль перегрузки: сигнал, медленный старт, пила AIMD и её тысячи копий.
// audioOffset ставит t=0 сцены на 30:11.0 дорожки.
export default makeProject({
  scenes: [congestion],
  audio,
});
