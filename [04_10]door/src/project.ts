import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0822.m4a';
import doorScene from './scenes/ownership?scene';

// Видео 04 «Прикладной уровень», секция «Сокеты» — сокет как единственный стык, который
// разработчик трогает руками, граница владения по нему и то, что за ней остаётся видно.
// Часть покрывает 13:13.2–14:38.3 смонтированной дорожки.
export default makeProject({
  scenes: [doorScene],
  audio,
});
