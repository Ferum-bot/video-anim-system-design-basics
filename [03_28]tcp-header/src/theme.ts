/**
 * Video 03 continues the networking series, so it keeps video 02's "Blueprint Signal"
 * theme. Imported **first** in project.ts so the theme is active before any scene module
 * reads palette tokens.
 */
import {applyTheme} from '@lib';
import {blueprint} from '@lib/themes/blueprint';

applyTheme(blueprint);
