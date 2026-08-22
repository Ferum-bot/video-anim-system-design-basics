import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0822.m4a';
import protocolsAround from './scenes/protocolsAround?scene';

// Видео 04 «Прикладной уровень» — «протоколы вокруг тебя»: четыре знакомых имени, три из
// которых работают прямо сейчас, и тезис о единственном уровне с полезной работой.
// Часть покрывает 00:29.6–00:57.9 смонтированной дорожки.
export default makeProject({
  scenes: [protocolsAround],
  audio,
});
