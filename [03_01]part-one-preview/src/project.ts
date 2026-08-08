import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0807.m4a';
import partOne from './scenes/partOne?scene';

// Видео 03 «Транспортный уровень» — интро: превью первой части на словах «В первой части мы
// разбирали…». Дорожка уже смонтирована, сцена стоит в самом начале → audioOffset = 0.
export default makeProject({
  scenes: [partOne],
  audio,
});
