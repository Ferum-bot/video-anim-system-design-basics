/// <reference types="@motion-canvas/core/types" />

declare module '*?scene' {
  import type {FullSceneDescription} from '@motion-canvas/core';
  const scene: FullSceneDescription;
  export default scene;
}

declare module '*.m4a' { const src: string; export default src; }
declare module '*.mp3' { const src: string; export default src; }
declare module '*.wav' { const src: string; export default src; }
declare module '*.svg' { const src: string; export default src; }
declare module '*.png' { const src: string; export default src; }
