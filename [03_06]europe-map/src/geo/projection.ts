/**
 * Orthographic projection — the planet as seen from infinitely far away, which is what
 * makes the globe read as a globe rather than a flat map. Pure maths, no scene graph: the
 * component feeds it live signals and gets scene coordinates back every frame.
 */

/** Where the camera is looking and how big the planet is drawn. */
export interface GlobeView {
  /** Longitude at the centre of the disc, degrees east. */
  lon: number;
  /** Latitude at the centre of the disc, degrees north. */
  lat: number;
  /** Radius of the disc in scene units. Growing it is the zoom. */
  radius: number;
}

const RAD = Math.PI / 180;

/**
 * Points on the far side are pushed out past the limb by this factor instead of being
 * dropped. A segment running from a visible point to a pushed one then crosses the limb and
 * is cut there by the clip — which is exactly how a coastline should disappear round the
 * edge, and it keeps every ring a single polyline with a fixed point count.
 */
const BEYOND = 1.7;

/** Project one degree pair to scene coordinates (y grows downward, as on canvas). */
export function project(lon: number, lat: number, view: GlobeView): [number, number] {
  const dLon = (lon - view.lon) * RAD;
  const phi = lat * RAD;
  const phi0 = view.lat * RAD;

  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const cosPhi0 = Math.cos(phi0);
  const sinPhi0 = Math.sin(phi0);
  const cosDLon = Math.cos(dLon);

  let x = cosPhi * Math.sin(dLon);
  let y = cosPhi0 * sinPhi - sinPhi0 * cosPhi * cosDLon;

  // cos of the angular distance from the centre: positive means the near hemisphere.
  if (sinPhi0 * sinPhi + cosPhi0 * cosPhi * cosDLon <= 0) {
    const length = Math.hypot(x, y) || 1e-6;
    x = (x / length) * BEYOND;
    y = (y / length) * BEYOND;
  }

  return [x * view.radius, -y * view.radius];
}

/** Project a flat `[lon, lat, lon, lat, …]` ring into the point list a `Line` wants. */
export function projectRing(ring: readonly number[], view: GlobeView): [number, number][] {
  const points: [number, number][] = new Array(ring.length / 2);
  for (let i = 0; i < ring.length; i += 2) {
    points[i / 2] = project(ring[i], ring[i + 1], view);
  }
  return points;
}

/**
 * A great-circle arc between two places, sampled into a polyline. Straight lines look wrong
 * on a globe — over Europe the difference is small, but the arc is what makes the long
 * Moscow-side hops sit properly on the curve.
 */
export function arc(
  from: readonly [number, number],
  to: readonly [number, number],
  view: GlobeView,
  samples = 24,
): [number, number][] {
  const [lon1, lat1] = from;
  const [lon2, lat2] = to;
  const points: [number, number][] = new Array(samples + 1);

  const φ1 = lat1 * RAD, λ1 = lon1 * RAD;
  const φ2 = lat2 * RAD, λ2 = lon2 * RAD;
  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((φ2 - φ1) / 2) ** 2 +
          Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2,
      ),
    );

  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    if (d < 1e-9) {
      points[i] = project(lon1, lat1, view);
      continue;
    }
    const a = Math.sin((1 - t) * d) / Math.sin(d);
    const b = Math.sin(t * d) / Math.sin(d);
    const x = a * Math.cos(φ1) * Math.cos(λ1) + b * Math.cos(φ2) * Math.cos(λ2);
    const y = a * Math.cos(φ1) * Math.sin(λ1) + b * Math.cos(φ2) * Math.sin(λ2);
    const z = a * Math.sin(φ1) + b * Math.sin(φ2);
    points[i] = project(
      Math.atan2(y, x) / RAD,
      Math.atan2(z, Math.hypot(x, y)) / RAD,
      view,
    );
  }
  return points;
}

/** Meridians and parallels, as flat rings the projection can chew on. */
export function graticule(step = 20): number[][] {
  const lines: number[][] = [];
  for (let lon = -180; lon < 180; lon += step) {
    const ring: number[] = [];
    for (let lat = -80; lat <= 80; lat += 5) ring.push(lon, lat);
    lines.push(ring);
  }
  for (let lat = -60; lat <= 60; lat += step) {
    const ring: number[] = [];
    for (let lon = -180; lon <= 180; lon += 5) ring.push(lon, lat);
    lines.push(ring);
  }
  return lines;
}
