import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0822.m4a';
import protocolDefined from './scenes/protocolDefined?scene';

// Видео 04 «Прикладной уровень» — что такое протокол: договорённость, три слова, и паспорт
// из четырёх ячеек, по которому дальше разбирается каждый протокол сезона.
// Часть покрывает 04:48.9–06:35.5 смонтированной дорожки.
export default makeProject({
  scenes: [protocolDefined],
  audio,
});
