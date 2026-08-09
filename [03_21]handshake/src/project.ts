import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0807.m4a';
import handshake from './scenes/handshake?scene';

// Видео 03, TCP — память сети, зомби-пакет и тройное рукопожатие. audioOffset ставит t=0
// сцены на 25:16.0 дорожки, где звучит «почему нельзя просто слать байты».
export default makeProject({
  scenes: [handshake],
  audio,
});
