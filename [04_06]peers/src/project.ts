import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0822.m4a';
import peers from './scenes/peers?scene';

// Видео 04 «Прикладной уровень» — пиры: сущности одного уровня на разных машинах думают,
// что говорят напрямую, а байты едут лифтом. Часть покрывает 06:38.4–08:35.0 дорожки.
export default makeProject({
  scenes: [peers],
  audio,
});
