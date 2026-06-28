import {Img, Rect} from '@motion-canvas/2d';
import {colors} from '../theme';
import redisUrl from '../assets/icons/redis.svg';

// Tech logos shown in a SpecCard's icon slot. To add one: drop its SVG in
// `lib/assets/icons/`, import it, and export a `<tech>Icon` factory below.

const TILE = 64;
const GLYPH = 42;

/** A rounded surface tile holding a logo, sized to match the card's icon slot. */
function techIcon(src: string) {
  return (
    <Rect layout justifyContent="center" alignItems="center"
      width={TILE} height={TILE} radius={12}
      fill={colors.surface} stroke={colors.border} lineWidth={1.5}>
      <Img src={src} width={GLYPH} height={GLYPH}/>
    </Rect>
  );
}

export const redisIcon = () => techIcon(redisUrl);
// Future: postgresIcon, mysqlIcon, podIcon, kafkaIcon — add svg + a line here.
