import {Img, Rect} from '@motion-canvas/2d';
import {colors} from '../theme';
import redisUrl from '../assets/icons/redis.svg';
import postgresUrl from '../assets/icons/postgresql.svg';
import kubernetesUrl from '../assets/icons/kubernetes.svg';
import kafkaUrl from '../assets/icons/kafka.svg';

// Tech logos shown in a SpecCard's icon slot. To add one: drop its SVG in
// `lib/assets/icons/`, import it, and export a `<tech>Icon` factory below.

const TILE = 64;
const GLYPH = 42;

/** A rounded surface tile holding a logo, sized to match the card's icon slot. */
function techIcon(src: string) {
  // Explicit flex-centre so the logo is centred whether the tile sits in a layout
  // parent (recap grid) or a plain Node (beat). Without `layout`, a layout parent
  // makes the tile inherit flex and shove the Img to the top-left (offset ~11px).
  return (
    <Rect layout justifyContent="center" alignItems="center"
      width={TILE} height={TILE} radius={12}
      fill={colors.surface} stroke={colors.border} lineWidth={1.5}>
      <Img src={src} width={GLYPH} height={GLYPH}/>
    </Rect>
  );
}

export const redisIcon = () => techIcon(redisUrl);
export const postgresIcon = () => techIcon(postgresUrl);
export const podIcon = () => techIcon(kubernetesUrl);
export const kafkaIcon = () => techIcon(kafkaUrl);
// Future: mysqlIcon — add svg + a line here.
