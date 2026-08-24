import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0822.m4a';
import primitives from './scenes/primitives?scene';

// Видео 04 «Прикладной уровень», секция «Сокеты» — восемь примитивов и асимметрия клиента
// и сервера, которая видна прямо в порядке их вызова.
// Часть покрывает 14:40.4–15:59.3 смонтированной дорожки.
export default makeProject({
  scenes: [primitives],
  audio,
});
