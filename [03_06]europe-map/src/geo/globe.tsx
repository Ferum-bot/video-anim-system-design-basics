import {Circle, Line, Node, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  easeInOutCubic,
  easeOutCubic,
  linear,
  sequence,
} from '@motion-canvas/core';
import type {SimpleSignal, ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';
import {COASTLINES} from './coastlines';
import {LINKS, PLACES, PLACE_BY_ID} from './places';
import type {Place} from './places';
import {arc, graticule, project, projectRing} from './projection';
import type {GlobeView} from './projection';

// ── Look ──────────────────────────────────────────────────────────────────────
const GRATICULE_STEP = 20;
const COAST_WIDTH = 1.4;
const LINK_WIDTH = {trunk: 2.4, normal: 1.4} as const;
const NODE_RADIUS: Record<number, number> = {1: 8, 2: 6, 3: 4.5};
const HALO_SCALE = 2.9; // the soft ring around a tier-1 hub

// The limb is built from a few concentric strokes instead of a gradient: a bright rim, two
// fading inward, one soft halo outside for atmosphere.
const RIM = [
  {scale: 1.0, alpha: 0.5, width: 2},
  {scale: 0.985, alpha: 0.2, width: 3},
  {scale: 0.955, alpha: 0.09, width: 5},
] as const;

// Arc sampling: enough for the long Moscow hops, cheap for the short ones.
const ARC_SAMPLES = {min: 6, perDegree: 0.45} as const;

// Labels sit clear of the mesh; offsets are in scene units at the European zoom.
const LABEL_OFFSET: Record<string, [number, number]> = {
  fra: [0, 30],
  ams: [-6, -28],
  lon: [-64, -20],
  par: [-40, 30],
  msk: [-14, 32],
};

// ── Timing ────────────────────────────────────────────────────────────────────
const APPEAR = 1.2;
const WEAVE_STAGGER = 0.028;
const WEAVE_DRAW = 0.75;
const NODES_STAGGER = 0.02;
const NODE_POP = 0.45;
const LABEL_IN = 0.6;

export interface GlobeOptions {
  /** Where the camera starts. */
  start: GlobeView;
}

export interface Globe extends Widget {
  /** Layer inside the limb clip that other components draw onto, sharing the camera. */
  readonly surface: Node;
  /** The live camera, for anything that needs to project onto this globe. */
  camera(): GlobeView;
  /** Push the base backbone back so a route drawn on top of it can be read. */
  dimMesh(alpha: number, duration?: number): ThreadGenerator;
  /** Endless slow spin — fork it with `yield`, cancel before flying anywhere. */
  drift(degreesPerSecond?: number): ThreadGenerator;
  /** Move the camera: turn and zoom are one gesture. */
  flyTo(target: Partial<GlobeView>, duration: number): ThreadGenerator;
  /** Draw the backbone link by link, then light the cities up. */
  weave(): ThreadGenerator;
  /** Name the exchanges that actually carry the continent. */
  nameHubs(): ThreadGenerator;
}

/**
 * The planet, drawn by projecting real coastlines through an orthographic camera every
 * frame, with the European backbone laid over it. Turning and zooming are just the camera
 * signals changing — there's no separate "globe view" and "map view", which is what lets the
 * scene fly from one to the other in a single continuous move.
 */
export function globe({start}: GlobeOptions): Globe {
  const group = createRef<Node>();
  const halo = createRef<Circle>();
  const grid = createRef<Node>();
  const mesh = createRef<Node>();
  const surface = createRef<Node>();
  const cities = createRef<Node>();
  const labels = createRef<Node>();

  const lon = createSignal(start.lon);
  const lat = createSignal(start.lat);
  const radius = createSignal(start.radius);
  const view = (): GlobeView => ({lon: lon(), lat: lat(), radius: radius()});

  const accent = colors.cyan;
  const ocean = withAlpha(colors.surface, 0.75);

  const linkProgress = LINKS.map(() => createSignal(0));
  const nodeScale = PLACES.map(() => createSignal(0));

  const samplesFor = (a: Place, b: Place) =>
    Math.max(
      ARC_SAMPLES.min,
      Math.round(Math.hypot(a.lon - b.lon, a.lat - b.lat) * ARC_SAMPLES.perDegree),
    );

  const node = (
    <Node ref={group} opacity={0}>
      {/* atmosphere, just outside the limb */}
      <Circle ref={halo} size={() => radius() * 2.06} stroke={withAlpha(accent, 0.14)}
        lineWidth={10} shadowColor={withAlpha(accent, 0.35)} shadowBlur={40}/>

      {/* everything that lives on the sphere is cut at the limb by this clip */}
      <Circle size={() => radius() * 2} fill={ocean} clip>
        <Node ref={grid}>
          {graticule(GRATICULE_STEP).map(ring => (
            <Line points={() => projectRing(ring, view())}
              stroke={withAlpha(accent, 0.11)} lineWidth={1}/>
          ))}
        </Node>

        {COASTLINES.map(ring => (
          <Line points={() => projectRing(ring, view())}
            stroke={withAlpha(accent, 0.52)} lineWidth={COAST_WIDTH}/>
        ))}

        <Node ref={mesh}>
          {LINKS.map((link, index) => {
            const from = PLACE_BY_ID.get(link.from)!;
            const to = PLACE_BY_ID.get(link.to)!;
            const samples = samplesFor(from, to);
            return (
              <Line
                points={() => arc([from.lon, from.lat], [to.lon, to.lat], view(), samples)}
                stroke={withAlpha(accent, link.trunk ? 0.9 : 0.52)}
                lineWidth={link.trunk ? LINK_WIDTH.trunk : LINK_WIDTH.normal}
                shadowColor={withAlpha(accent, link.trunk ? 0.5 : 0)}
                shadowBlur={link.trunk ? 12 : 0}
                end={linkProgress[index]}
              />
            );
          })}
        </Node>

        {/* routes and anything else drawn on the sphere by other components */}
        <Node ref={surface}/>

        <Node ref={cities}>
          {PLACES.map((place, index) => (
            <Node position={() => project(place.lon, place.lat, view())}
              scale={nodeScale[index]}>
              {place.tier === 1 && (
                <Circle size={NODE_RADIUS[1] * HALO_SCALE} fill={withAlpha(accent, 0.16)}
                  stroke={withAlpha(accent, 0.45)} lineWidth={1}/>
              )}
              <Circle size={NODE_RADIUS[place.tier]} fill={place.tier === 1 ? colors.text : accent}
                shadowColor={accent} shadowBlur={place.tier === 1 ? 16 : 6}/>
            </Node>
          ))}
        </Node>

        <Node ref={labels} opacity={0}>
          {PLACES.filter(place => place.tier === 1).map(place => {
            const [dx, dy] = LABEL_OFFSET[place.id] ?? [0, -26];
            return (
              <Txt position={() => {
                const [x, y] = project(place.lon, place.lat, view());
                return [x + dx, y + dy];
              }}
                text={place.label} fill={colors.text} fontSize={19} fontFamily={fonts.mono}
                fontWeight={600} letterSpacing={1.4}
                shadowColor={colors.background} shadowBlur={8}/>
            );
          })}
        </Node>
      </Circle>

      {RIM.map(ring => (
        <Circle size={() => radius() * 2 * ring.scale} stroke={withAlpha(accent, ring.alpha)}
          lineWidth={ring.width}/>
      ))}
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* group().opacity(1, APPEAR, easeOutCubic);
  }

  function* drift(degreesPerSecond = 4): ThreadGenerator {
    while (true) {
      const from = lon();
      yield* lon(from + 360, 360 / degreesPerSecond, linear);
      lon(from); // a whole turn later the projection is identical, so this never shows
    }
  }

  function* flyTo(target: Partial<GlobeView>, duration: number): ThreadGenerator {
    const moves: ThreadGenerator[] = [];
    const tween = (signal: SimpleSignal<number>, value: number | undefined) => {
      if (value !== undefined) moves.push(signal(value, duration, easeInOutCubic));
    };
    tween(lon, target.lon);
    tween(lat, target.lat);
    tween(radius, target.radius);
    yield* all(...moves);
  }

  function* weave(): ThreadGenerator {
    yield* all(
      grid().opacity(0.35, 0.8, easeInOutCubic), // the graticule steps back for the mesh
      sequence(
        WEAVE_STAGGER,
        ...linkProgress.map(progress => progress(1, WEAVE_DRAW, easeOutCubic)),
      ),
      sequence(NODES_STAGGER, ...nodeScale.map(scale => scale(1, NODE_POP, easeOutCubic))),
    );
  }

  function* dimMesh(alpha: number, duration = 0.7): ThreadGenerator {
    yield* mesh().opacity(alpha, duration, easeInOutCubic);
  }

  function* nameHubs(): ThreadGenerator {
    yield* labels().opacity(1, LABEL_IN, easeOutCubic);
  }

  return {
    node,
    get surface() {
      return surface();
    },
    camera: view,
    appear,
    drift,
    flyTo,
    weave,
    dimMesh,
    nameHubs,
  };
}
