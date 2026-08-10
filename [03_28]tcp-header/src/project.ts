import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0807.m4a';
import tcpHeader from './scenes/tcpHeader?scene';

// Видео 03, TCP — заголовок в 20 байт и ядро, в котором он живёт. audioOffset ставит t=0
// сцены на 33:24.5 дорожки.
export default makeProject({
  scenes: [tcpHeader],
  audio,
});
