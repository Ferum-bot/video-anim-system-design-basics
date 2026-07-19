import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0718.m4a';
import tcpip from './scenes/tcpip?scene';

// Video 02 "Всё про сети" — "модель TCP/IP" (стек снизу вверх). audioOffset puts the scene's
// t=0 at ~16:53 of the track.
export default makeProject({
  scenes: [tcpip],
  audio,
});
