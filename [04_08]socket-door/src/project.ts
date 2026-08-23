import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0822.m4a';
import socketDoor from './scenes/socketDoor?scene';

// Видео 04 «Прикладной уровень» — сокет: что на самом деле нужно приложению от транспорта,
// откуда взялась эта абстракция и что она честно не прячет.
// Часть покрывает 09:53.3–11:42.4 смонтированной дорожки.
export default makeProject({
  scenes: [socketDoor],
  audio,
});
