/**
 * The theme *system* for the video series.
 *
 * `@lib` is the shared **framework** (stage, components, utilities); it carries no
 * palette of its own. Each video picks a **theme preset** (see `lib/themes/`) and
 * registers it with {@link applyTheme} in its `project.ts`. Shared components read the
 * active theme through the live {@link colors} / {@link fonts} proxies, so the same
 * component renders in whatever style is active.
 */

/**
 * The token contract every theme fills. Structural tokens (surfaces, text) plus a shared
 * accent vocabulary — each theme renders the same slot in its own hue, so a scene that
 * asks for `colors.blue` gets that theme's blue.
 */
export interface ThemePalette {
  // surfaces
  background: string;
  surface: string;
  track: string; // subtle raised fill (meter tracks, translucent rows)
  border: string;
  borderStrong: string; // emphasised border
  scrim: string; // dark plate base behind content (readability over footage)
  // text
  text: string;
  textDim: string;
  textMuted: string;
  // the theme's signature accent (used where a component needs "the" accent)
  primary: string;
  // shared accent vocabulary — one hue per slot, per theme
  blue: string;
  cyan: string;
  green: string;
  red: string;
  purple: string;
  orange: string;
}

export interface ThemeFonts {
  /** Natural-language text — titles, prose. */
  display: string;
  /** Technical tokens — data, labels, tags. */
  mono: string;
}

/**
 * How {@link createStage} paints the frame. Expresses both a solid backdrop (video 01)
 * and a translucent scrim + blueprint grid (video 02).
 */
export interface StageStyle {
  /** Base colour of the backdrop / scrim. */
  fill: string;
  /** Panel translucency: `1` = solid fill; `<1` = translucent scrim over footage. */
  scrimAlpha: number;
  /** Export mode — leave the frame transparent so the overlay composites over footage. */
  transparent: boolean;
  /** Editing-only grey stand-in for footage, so a translucent scrim reads on the dark editor. */
  footageSim?: string;
  /** Optional blueprint grid drawn inside the panel. */
  grid?: {pitch: number; minor: string; major: string};
  /**
   * Optional explicit frame around the content: insets the panel from the column edges and
   * gives it rounded corners + a visible border, so the overlay reads as a contained card.
   */
  frame?: {inset: number; radius: number; stroke: string; lineWidth: number};
}

export interface Theme {
  palette: ThemePalette;
  fonts: ThemeFonts;
  stage: StageStyle;
}

/** Identity helper: gives a preset object the `Theme` type without widening it. */
export function defineTheme(theme: Theme): Theme {
  return theme;
}

let active: Theme | null = null;

/** Register the theme for this project. Call once in `project.ts` before scenes render. */
export function applyTheme(theme: Theme): void {
  active = theme;
}

/** The theme currently applied. Throws if a project forgot to call {@link applyTheme}. */
export function activeTheme(): Theme {
  if (!active) {
    throw new Error(
      'No theme applied. Import a side-effecting theme module (which calls applyTheme) ' +
        'as the first import in your project.ts — see lib/themes/README or CLAUDE.md.',
    );
  }
  return active;
}

/**
 * Live palette proxy: shared components keep writing `colors.surface` and it resolves to
 * the active theme at render time. Do **not** read this at module top level (no theme is
 * applied yet) — scenes that need palette values at import time should import a concrete
 * preset palette instead.
 */
export const colors: ThemePalette = new Proxy({} as ThemePalette, {
  get: (_target, prop) => activeTheme().palette[prop as keyof ThemePalette],
});

/** Live fonts proxy, mirroring {@link colors}. */
export const fonts: ThemeFonts = new Proxy({} as ThemeFonts, {
  get: (_target, prop) => activeTheme().fonts[prop as keyof ThemeFonts],
});

/**
 * Append an alpha channel to a `#rrggbb` colour, e.g. `withAlpha(colors.blue, 0.2)`.
 * Clearer than hand-writing hex suffixes like `'#388bfd33'`.
 */
export function withAlpha(hex: string, alpha: number): string {
  const clamped = Math.max(0, Math.min(1, alpha));
  const channel = Math.round(clamped * 255).toString(16).padStart(2, '0');
  return `${hex}${channel}`;
}
