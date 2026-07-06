/**
 * Shared CTA overlays render standalone, so they still need a theme applied. They use a
 * neutral dark palette + a clean sans (`fonts.display`); reuse video 01's GitHub-dark
 * preset. Imported **first** in project.ts so the theme is active before scenes build.
 */
import {applyTheme} from '@lib';
import {githubDark} from '@lib/themes/githubDark';

applyTheme(githubDark);
