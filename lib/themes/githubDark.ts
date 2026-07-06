/**
 * Theme preset — "GitHub-dark" (video 01 "You don't need sharding").
 *
 * A dark, code-editor palette: solid `#0d1117` backdrop, monospace type, one accent per
 * concept. Register it in a project with `applyTheme(githubDark)` (see CLAUDE.md).
 */
import {defineTheme} from '../theme';
import type {ThemePalette, ThemeFonts, StageStyle} from '../theme';

const palette: ThemePalette = {
  // surfaces
  background: '#0d1117',
  surface: '#161b22',
  track: '#21262d',
  border: '#30363d',
  borderStrong: '#30363d', // no separate emphasised border in this language
  scrim: '#06080c', // soft dark plate behind content (overlay readability)
  // text
  text: '#e6edf3',
  textDim: '#cdd9e5',
  textMuted: '#8b949e',
  // accents
  primary: '#388bfd', // = blue
  blue: '#388bfd',
  cyan: '#56d4dd',
  green: '#3fb950',
  red: '#f85149',
  purple: '#bc8cff',
  orange: '#ffa657',
};

const fonts: ThemeFonts = {
  // Titles and body are monospace in this language; `display` is only used by the
  // shared CTA overlay (YouTube-style), which wants a clean sans.
  display: 'Roboto, "Helvetica Neue", Arial, sans-serif',
  mono: 'JetBrains Mono, monospace',
};

const stage: StageStyle = {
  fill: palette.background,
  scrimAlpha: 1, // solid backdrop; export uses a transparent frame + backdrop() plate
  // Flip to `false` for comfortable editing (dark editor backdrop). `true` renders a
  // transparent PNG sequence for compositing over footage in CapCut.
  transparent: true,
};

export const githubDark = defineTheme({palette, fonts, stage});
