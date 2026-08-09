import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0807.m4a';
import udpPacket from './scenes/udpPacket?scene';

// Видео 03, UDP — устройство пакета: 8 байт заголовка, стопка накладных 26/20/8 и вывод,
// что весь смысл протокола в портах. audioOffset ставит t=0 сцены на 15:59.9 дорожки.
export default makeProject({
  scenes: [udpPacket],
  audio,
});
