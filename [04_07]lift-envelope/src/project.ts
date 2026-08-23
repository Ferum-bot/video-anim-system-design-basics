import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0822.m4a';
import liftEnvelope from './scenes/liftEnvelope?scene';

// Видео 04 «Прикладной уровень» — что физически происходит с сообщением по дороге вниз и
// обратно вверх: заголовки, разрез на куски, инкапсуляция.
// Часть покрывает 08:35.0–09:51.2 смонтированной дорожки.
export default makeProject({
  scenes: [liftEnvelope],
  audio,
});
