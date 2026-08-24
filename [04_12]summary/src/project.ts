import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0822.m4a';
import summary from './scenes/summary?scene';

// Видео 04 «Прикладной уровень» — итог. Часть ничего не вводит: она возвращает всё,
// что построено с [04_03] по [04_11], и сводит это к одной стопке.
// Покрывает 16:01.4–17:13.9 смонтированной дорожки.
export default makeProject({
  scenes: [summary],
  audio,
});
