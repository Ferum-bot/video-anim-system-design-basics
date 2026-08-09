import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0807.m4a';
import notDoing from './scenes/notDoing?scene';

// Видео 03, UDP — чего он не делает: четыре выключателя, переполненный буфер получателя и
// та же очередь уровнем ниже. audioOffset ставит t=0 сцены на 18:29.7 дорожки.
export default makeProject({
  scenes: [notDoing],
  audio,
});
