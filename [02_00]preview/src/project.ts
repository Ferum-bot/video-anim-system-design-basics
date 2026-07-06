import './theme'; // applies the Blueprint Signal theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import osi from './scenes/osi?scene';
import handshake from './scenes/handshake?scene';
import protocols from './scenes/protocols?scene';

// Design-preview project for video 02 "Всё про сети" — the "Blueprint Signal" language.
// Three example scenes; no narration wired yet (these are style previews, not final cuts).
export default makeProject({
  scenes: [osi, handshake, protocols],
});
