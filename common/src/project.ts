import {makeProject} from '@motion-canvas/core';
import subscribe from './scenes/subscribe?scene';

// Reusable call-to-action / base overlays, rendered standalone and composited in
// CapCut wherever needed (no narration track — each scene is self-timed).
export default makeProject({
  scenes: [subscribe],
});
