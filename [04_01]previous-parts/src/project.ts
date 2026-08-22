import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0822.m4a';
import previousParts from './scenes/previousParts?scene';

// Видео 04 «Прикладной уровень» — интро: превью двух предыдущих частей серии на словах
// «В первом видео мы разбирали… Во втором видео мы коснулись транспортного уровня».
// Дорожка уже смонтирована, сцена стоит в самом начале → audioOffset = 0.
export default makeProject({
  scenes: [previousParts],
  audio,
});
