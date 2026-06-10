import {makeProject} from '@motion-canvas/core';
import httpRequests from './scenes/httpRequests?scene';

export default makeProject({
  scenes: [httpRequests],
});
