import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0807.m4a';
import quicLibs from './scenes/quicLibs?scene';

// Видео 03, QUIC — он живёт не в ядре, а в библиотеке в твоём процессе.
// audioOffset ставит t=0 сцены на 44:35.0 дорожки.
export default makeProject({
  scenes: [quicLibs],
  audio,
});
