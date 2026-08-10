import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0807.m4a';
import quicNumbers from './scenes/quicNumbers?scene';

// Видео 03, QUIC — миф «просто быстрый TCP» против цифр исследования 2024 года.
// audioOffset ставит t=0 сцены на 46:46.5 дорожки.
export default makeProject({
  scenes: [quicNumbers],
  audio,
});
