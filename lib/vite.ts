import {defineConfig} from 'vite';
import {createRequire} from 'module';
import {dirname, resolve} from 'path';
import {fileURLToPath} from 'url';

/**
 * Vite config shared by every video-part project. Call it from the project's own
 * `vite.config.ts` with `import.meta.url`:
 *
 *     import {defineVideoProject} from '../lib/vite';
 *     export default defineVideoProject(import.meta.url);
 *
 * It wires the Motion Canvas plugin, the `@lib` alias, the JSX runtime for the
 * cross-root `@lib` sources, and repo-root file access — see CLAUDE.md "Cross-root
 * JSX wiring". Imported by path (not via the `@lib` barrel) to keep heavy runtime
 * deps out of the Vite config.
 */
export function defineVideoProject(metaUrl: string) {
  const require = createRequire(metaUrl);
  const motionCanvas = require('@motion-canvas/vite-plugin').default as any;

  const dir = dirname(fileURLToPath(metaUrl));
  const repoRoot = resolve(dir, '..');

  return defineConfig({
    root: dir,
    resolve: {alias: {'@lib': resolve(repoRoot, 'lib')}},
    esbuild: {jsx: 'automatic', jsxImportSource: '@motion-canvas/2d'},
    server: {fs: {allow: [repoRoot]}},
    plugins: [motionCanvas({project: `${dir}/src/project.ts`})],
  });
}
