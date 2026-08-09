import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0807.m4a';
import slidingWindow from './scenes/slidingWindow?scene';

// Видео 03, TCP — скользящее окно. audioOffset ставит t=0 сцены на 29:21.0 дорожки.
export default makeProject({
  scenes: [slidingWindow],
  audio,
});
