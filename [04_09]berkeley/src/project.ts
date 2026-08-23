import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0822.m4a';
import berkeley from './scenes/berkeley?scene';

// Видео 04 «Прикладной уровень», секция «Сокеты» — откуда они взялись: Berkeley 1983,
// «всё есть файл», 4.2BSD, Winsock и независимость от того, что снизу.
// Часть покрывает 11:45.0–13:09.9 смонтированной дорожки.
export default makeProject({
  scenes: [berkeley],
  audio,
});
