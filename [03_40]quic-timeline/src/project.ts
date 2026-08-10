import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0807.m4a';
import quicTimeline from './scenes/quicTimeline?scene';

// Видео 03, QUIC — путь протокола наоборот: код, трафик, черновики и только потом RFC.
// audioOffset ставит t=0 сцены на 42:46.8 дорожки.
export default makeProject({
  scenes: [quicTimeline],
  audio,
});
