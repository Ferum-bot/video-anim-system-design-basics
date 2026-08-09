import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0807.m4a';
import boundaries from './scenes/boundaries?scene';

// Видео 03, UDP — границы сообщений: одна отправка = одна датаграмма = одно получение.
// audioOffset ставит t=0 сцены на 15:25.7 дорожки.
export default makeProject({
  scenes: [boundaries],
  audio,
});
