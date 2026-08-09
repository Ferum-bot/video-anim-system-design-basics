import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0807.m4a';
import byteStream from './scenes/byteStream?scene';

// Видео 03, TCP — поток байтов против потока сообщений. audioOffset ставит t=0 сцены на
// 24:30.0 дорожки, где звучит «TCP — это поток байтов, а не поток сообщений».
export default makeProject({
  scenes: [byteStream],
  audio,
});
