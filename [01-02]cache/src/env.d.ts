/// <reference types="@motion-canvas/core/types" />

declare module '*?scene' {
  import type {FullSceneDescription} from '@motion-canvas/core';
  const scene: FullSceneDescription;
  export default scene;
}

// Audio assets (resolved to a URL by Vite) — used as the project narration track.
declare module '*.m4a' { const src: string; export default src; }
declare module '*.mp3' { const src: string; export default src; }
declare module '*.wav' { const src: string; export default src; }
