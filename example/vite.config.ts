import {defineConfig} from 'vite';
import {createRequire} from 'module';
import {dirname} from 'path';
import {fileURLToPath} from 'url';

const require = createRequire(import.meta.url);
const motionCanvas = require('@motion-canvas/vite-plugin').default as any;

const dir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: dir,
  plugins: [
    motionCanvas({project: `${dir}/src/project.ts`}),
  ],
});
