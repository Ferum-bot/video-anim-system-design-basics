import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0807.m4a';
import ipPacket from './scenes/ipPacket?scene';

// Видео 03, сетевой уровень — заголовок IP, TTL и traceroute.
// audioOffset ставит t=0 сцены на 08:33.0 дорожки.
export default makeProject({
  scenes: [ipPacket],
  audio,
});
