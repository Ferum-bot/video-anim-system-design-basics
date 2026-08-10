import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0807.m4a';
import quicStreams from './scenes/quicStreams?scene';

// Видео 03, QUIC — потоки и закрытие head-of-line. audioOffset ставит t=0 сцены на 39:34.5.
export default makeProject({
  scenes: [quicStreams],
  audio,
});
