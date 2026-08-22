/**
 * Theme preset — "Blueprint Signal" (video 02 "Всё про сети").
 *
 * A deep-navy engineering schematic: thin outlines on a faint grid, glowing signal
 * accents, SF Pro for prose + SF Mono for technical tokens. The panel is a translucent
 * dark scrim so it darkens footage rather than hiding it. Register with
 * `applyTheme(blueprint)`.
 */
import {defineTheme, withAlpha} from '../theme';
import type {ThemePalette, ThemeFonts, StageStyle} from '../theme';

const palette: ThemePalette = {
  // surfaces
  background: '#061523', // ink — the drafting-table base
  surface: '#0a2036', // raised panel
  track: '#0920348c', // translucent row fill over the grid
  border: '#1c4560', // hairline edge
  borderStrong: '#2f6d8f', // emphasised edge
  scrim: '#061523', // scrim plate = ink
  // text
  text: '#dff3fb',
  textDim: '#9fc4d8',
  textMuted: '#5f8398',
  // accents (one hue per shared slot)
  primary: '#38e0d0', // = cyan — the signal accent
  blue: '#4d9fff',
  cyan: '#38e0d0',
  green: '#3fb950',
  red: '#f87171',
  purple: '#a78bfa', // rendered violet in this language
  orange: '#ffb84d', // rendered amber in this language
};

const fonts: ThemeFonts = {
  display: '"SF Pro Display", -apple-system, system-ui, "Helvetica Neue", Arial, sans-serif',
  mono: 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
};

const stage: StageStyle = {
  fill: palette.background,
  // 0.9 dark backing — matches video 01's plate opacity; footage stays faintly visible.
  scrimAlpha: 0.9,
  // Transparent overlay for compositing over footage in CapCut. Flip to `false` for
  // comfortable editing (a grey footage stand-in shows behind the scrim).
  transparent: true,
  footageSim: '#4a5058',
  grid: {pitch: 40, minor: withAlpha(palette.cyan, 0.05), major: withAlpha(palette.cyan, 0.1)},
  // Explicit framed card around the content.
  frame: {inset: 16, radius: 22, stroke: withAlpha(palette.cyan, 0.55), lineWidth: 2.5},
};

export const blueprint = defineTheme({palette, fonts, stage});
