import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0807.m4a';
import frameBudget from './scenes/frameBudget?scene';

// Видео 03, канальный уровень — бюджет Ethernet-кадра: что такое системные байты, из чего
// они складываются и сколько стоят. audioOffset ставит t=0 сцены на 05:00.5 дорожки.
export default makeProject({
  scenes: [frameBudget],
  audio,
});
