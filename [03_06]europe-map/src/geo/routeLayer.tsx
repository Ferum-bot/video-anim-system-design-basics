import {Circle, Line, Node} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  easeInQuad,
  easeInOutSine,
  easeOutCubic,
  sequence,
  waitFor,
} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, withAlpha} from '@lib';
import {PLACE_BY_ID} from './places';
import {CHOSEN_ROUTE, SHORT_ROUTE, findPaths, spread} from './routes';
import {arc} from './projection';
import type {GlobeView} from './projection';

// How many of the real Moscow→Frankfurt walks get drawn. Enough to read as "a lot", few
// enough that every one of them is still a separate line rather than a smear.
const FLARE_PATHS = 36;
const MAX_HOPS = 7;
const SEGMENT_SAMPLES = 8;

const FLARE_IN = 0.55;
const FLARE_FIRST_GAP = 0.34; // the first few land one at a time…
const FLARE_LAST_GAP = 0.035; // …by the end they're firing over each other
const ROUTE_DRAW = 1.5;
const PACKET_PERIOD = 2.6;

export interface RouteLayerOptions {
  /** Live camera from the globe, so routes sit on the same projection as everything else. */
  camera: () => GlobeView;
}

export interface RouteLayer {
  readonly node: Node;
  /** The real walks from Moscow to Frankfurt, lighting up faster and faster. */
  flare(): ThreadGenerator;
  /** Put the fan away so a single route can be read. */
  clearFlare(): ThreadGenerator;
  /** The route a straight-line thinker would pick — drawn as a ghost, never taken. */
  showShort(): ThreadGenerator;
  /** The route traffic actually takes, plus a packet that keeps running it. */
  showChosen(): ThreadGenerator;
  /** Endless: the packet loops along the chosen route. Fork it with `yield`. */
  runPacket(): ThreadGenerator;
}

/** Scene-space polyline through a list of place ids. */
function pathPoints(ids: readonly string[], view: GlobeView): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i < ids.length - 1; i++) {
    const from = PLACE_BY_ID.get(ids[i])!;
    const to = PLACE_BY_ID.get(ids[i + 1])!;
    const segment = arc([from.lon, from.lat], [to.lon, to.lat], view, SEGMENT_SAMPLES);
    points.push(...(i === 0 ? segment : segment.slice(1)));
  }
  return points;
}

/** Point at `t` (0…1) along a polyline, by arc length. */
function along(points: readonly [number, number][], t: number): [number, number] {
  if (points.length < 2) return points[0] ?? [0, 0];
  const lengths: number[] = [0];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
    lengths.push(total);
  }
  const target = Math.max(0, Math.min(1, t)) * total;
  let i = 1;
  while (i < lengths.length - 1 && lengths[i] < target) i++;
  const span = lengths[i] - lengths[i - 1] || 1;
  const k = (target - lengths[i - 1]) / span;
  return [
    points[i - 1][0] + (points[i][0] - points[i - 1][0]) * k,
    points[i - 1][1] + (points[i][1] - points[i - 1][1]) * k,
  ];
}

/**
 * Everything drawn *between* Moscow and Frankfurt: the fan of real alternative walks, the
 * short route nobody takes, and the long one traffic actually goes down.
 */
export function routeLayer({camera}: RouteLayerOptions): RouteLayer {
  const group = createRef<Node>();
  const fan = createRef<Node>();
  const short = createRef<Line>();
  const chosen = createRef<Line>();
  const packet = createRef<Circle>();

  const accent = colors.cyan;
  const paths = spread(findPaths('msk', 'fra', MAX_HOPS, 600), FLARE_PATHS);
  const fanProgress = paths.map(() => createSignal(0));
  const shortProgress = createSignal(0);
  const chosenProgress = createSignal(0);
  const packetAt = createSignal(0);

  const chosenPoints = () => pathPoints(CHOSEN_ROUTE, camera());

  const node = (
    <Node ref={group}>
      <Node ref={fan}>
        {paths.map((ids, index) => (
          <Line points={() => pathPoints(ids, camera())} stroke={withAlpha(accent, 0.5)}
            lineWidth={1.6} end={fanProgress[index]} opacity={() => fanProgress[index]() * 0.8}/>
        ))}
      </Node>

      <Line ref={short} points={() => pathPoints(SHORT_ROUTE, camera())}
        stroke={colors.textDim} lineWidth={2.6} lineDash={[11, 8]}
        shadowColor={withAlpha(colors.text, 0.35)} shadowBlur={10}
        end={shortProgress} opacity={shortProgress}/>

      <Line ref={chosen} points={chosenPoints} stroke={colors.orange} lineWidth={3.4}
        shadowColor={withAlpha(colors.orange, 0.75)} shadowBlur={18}
        end={chosenProgress} opacity={chosenProgress}/>

      <Circle ref={packet} size={13} fill={colors.text} shadowColor={colors.orange}
        shadowBlur={22} opacity={0}
        position={() => along(chosenPoints(), packetAt())}/>
    </Node>
  );

  function* flare(): ThreadGenerator {
    // The gap shrinks as it goes, so the fan reads as "and another, and another, and — ok,
    // too many" rather than as a metronome.
    const draws = fanProgress.map((progress, index) => {
      const t = index / Math.max(1, fanProgress.length - 1);
      const gap = FLARE_FIRST_GAP + (FLARE_LAST_GAP - FLARE_FIRST_GAP) * easeInQuad(t);
      return {progress, gap};
    });
    for (const {progress, gap} of draws) {
      yield progress(1, FLARE_IN, easeOutCubic);
      yield* waitFor(gap);
    }
  }

  function* clearFlare(): ThreadGenerator {
    yield* all(...fanProgress.map(progress => progress(0, 0.7, easeInOutSine)));
  }

  function* showShort(): ThreadGenerator {
    yield* shortProgress(1, ROUTE_DRAW, easeOutCubic);
  }

  function* showChosen(): ThreadGenerator {
    yield* all(
      chosenProgress(1, ROUTE_DRAW, easeOutCubic),
      short().opacity(0.6, 0.6, easeInOutSine), // still readable: it's half the argument
      packet().opacity(1, 0.5, easeOutCubic),
    );
  }

  function* runPacket(): ThreadGenerator {
    while (true) {
      packetAt(0);
      yield* packetAt(1, PACKET_PERIOD, easeInOutSine);
      yield* waitFor(0.35);
    }
  }

  return {node, flare, clearFlare, showShort, showChosen, runPacket};
}
