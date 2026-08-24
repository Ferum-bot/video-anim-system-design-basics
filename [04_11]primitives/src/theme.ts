/**
 * Video 04 continues the networking series, so it keeps the "Blueprint Signal" theme of
 * videos 02–03. Imported **first** in project.ts so the theme is active before any scene
 * module reads palette tokens.
 */
import {applyTheme} from '@lib';
import {blueprint} from '@lib/themes/blueprint';

applyTheme(blueprint);
