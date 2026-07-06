/**
 * Applies video 01's GitHub-dark theme for this part. Imported **first** in project.ts so
 * the theme is active before any scene module reads palette tokens at import time.
 */
import {applyTheme} from '@lib';
import {githubDark} from '@lib/themes/githubDark';

applyTheme(githubDark);
