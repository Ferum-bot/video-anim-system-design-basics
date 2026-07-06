/**
 * Applies video 02's "Blueprint Signal" theme for this part. Imported **first** in
 * project.ts so the theme is active before any scene module reads palette tokens at
 * import time.
 */
import {applyTheme} from '@lib';
import {blueprint} from '@lib/themes/blueprint';

applyTheme(blueprint);
