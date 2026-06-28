/**
 * Shared visual language for every system-design video.
 * Colours follow the GitHub "dark" palette so animations sit comfortably next to
 * code and terminals.
 */

export const colors = {
  // surfaces
  background: '#0d1117',
  surface: '#161b22',
  border: '#30363d',
  track: '#21262d',
  backdrop: '#06080c', // soft dark scrim behind content (overlay readability)

  // text
  text: '#e6edf3',
  textDim: '#cdd9e5',
  textMuted: '#8b949e',

  // accents (one per concept — keep usage consistent across scenes)
  blue: '#388bfd',
  green: '#3fb950',
  purple: '#bc8cff',
  orange: '#ffa657',
  cyan: '#56d4dd',
  red: '#f85149',

  // brand (exact brand colours for call-to-action overlays — outside the palette)
  youtube: '#ff0033',
} as const;

export const fonts = {
  mono: 'JetBrains Mono, monospace',
} as const;

/**
 * Append an alpha channel to a `#rrggbb` colour, e.g. `withAlpha('#388bfd', 0.2)`.
 * Clearer than hand-writing hex suffixes like `'#388bfd33'`.
 */
export function withAlpha(hex: string, alpha: number): string {
  const clamped = Math.max(0, Math.min(1, alpha));
  const channel = Math.round(clamped * 255).toString(16).padStart(2, '0');
  return `${hex}${channel}`;
}
