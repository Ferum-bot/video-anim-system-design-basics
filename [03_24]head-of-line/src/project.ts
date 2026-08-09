import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0807.m4a';
import headOfLine from './scenes/headOfLine?scene';

// Видео 03, TCP — блокировка головой очереди и «ACK ≠ приложение получило». audioOffset
// ставит t=0 сцены на 28:07.0 дорожки.
export default makeProject({
  scenes: [headOfLine],
  audio,
});
