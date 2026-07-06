import './theme'; // applies this part's theme — must precede scene imports
import {makeProject} from '@motion-canvas/core';

import audio from '../audio/0626.m4a';
import takeawaysScene from './scenes/takeaways?scene';

export default makeProject({
  scenes: [takeawaysScene],
  // Full-video narration. Set audioOffset in project.meta to the closing-takeaways segment.
  audio,
});
