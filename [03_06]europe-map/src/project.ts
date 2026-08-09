import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0807.m4a';
import europeMap from './scenes/europeMap?scene';

// Видео 03, сетевой уровень — планета доворачивается до Европы и на неё ложится реальная
// магистральная сеть. audioOffset ставит t=0 сцены на 07:35.1 дорожки.
export default makeProject({
  scenes: [europeMap],
  audio,
});
