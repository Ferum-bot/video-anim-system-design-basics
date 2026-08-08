import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0807.m4a';
import macAddress from './scenes/macAddress?scene';

// Видео 03, канальный уровень — MAC-адрес: чем он является, из чего состоит и где
// перестаёт действовать. audioOffset ставит t=0 сцены на 03:19.4 дорожки.
export default makeProject({
  scenes: [macAddress],
  audio,
});
