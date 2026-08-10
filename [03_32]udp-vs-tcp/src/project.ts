import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0807.m4a';
import udpVsTcp from './scenes/udpVsTcp?scene';

// Видео 03 — сравнительная таблица UDP и TCP, про которую он говорит «ты видишь её на
// экране». audioOffset ставит t=0 сцены на 38:12.9 дорожки.
export default makeProject({
  scenes: [udpVsTcp],
  audio,
});
