import {defineConfig} from 'vite';
import {createRequire} from 'module';
import {dirname, resolve} from 'path';
import {fileURLToPath} from 'url';

const require = createRequire(import.meta.url);
const motionCanvas = require('@motion-canvas/vite-plugin').default as any;

const dir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(dir, '..');

export default defineConfig({
  root: dir,
  // Shared animation library lives at the repo root, reused by every video.
  resolve: {
    alias: {'@lib': resolve(repoRoot, 'lib')},
  },
  // Apply the Motion Canvas JSX runtime to every file, including imports from
  // outside this project's root (i.e. the `@lib` sources).
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: '@motion-canvas/2d',
  },
  server: {
    fs: {allow: [repoRoot]},
  },
  plugins: [
    motionCanvas({project: `${dir}/src/project.ts`}),
  ],
});
