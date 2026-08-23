import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0822.m4a';
import deliveryOnly from './scenes/deliveryOnly?scene';

// Видео 04 «Прикладной уровень» — «всё ниже прикладного только доставляет»: каждый этаж
// оживает своим делом, и ни у одного из них не набегает полезной работы.
// Часть покрывает 01:42.1–03:00.8 смонтированной дорожки.
export default makeProject({
  scenes: [deliveryOnly],
  audio,
});
