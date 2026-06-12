import {makeProject} from '@motion-canvas/core';

import computeScene from './scenes/[01]hardware/compute?scene';
import storageScene from './scenes/[01]hardware/storage?scene';
import networkScene from './scenes/[01]hardware/network?scene';

export default makeProject({
  scenes: [computeScene, storageScene, networkScene],
});
