import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0822.m4a';
import howMany from './scenes/howMany?scene';

// Видео 04 «Прикладной уровень» — служебные протоколы и масштаб: DNS обслуживает других
// жильцов этажа, единого списка протоколов нет, а из тысяч RFC и портов пользуемся горсткой.
// Часть покрывает 03:00.8–04:26.0 смонтированной дорожки.
export default makeProject({
  scenes: [howMany],
  audio,
});
