// Turns Natural Earth 50m land polygons into a compact set of coastline rings for the
// globe. Two fidelities: fine inside the European viewport, coarse everywhere else, so the
// zoom-in stays crisp without paying for the whole planet at that resolution.
const fs = require('fs');

const EUROPE = {west: -28, east: 62, south: 30, north: 75};
const FINE = 0.09; // degrees of Douglas-Peucker tolerance inside Europe
const COARSE = 0.75; // …and outside it
const MIN_EXTENT_EU = 0.5; // drop islands smaller than this (degrees) inside Europe
const MIN_EXTENT_WORLD = 4;

function perpendicular(p, a, b) {
  const [px, py] = p, [ax, ay] = a, [bx, by] = b;
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function simplify(points, tolerance) {
  if (points.length < 3) return points;
  const keep = new Array(points.length).fill(false);
  keep[0] = keep[points.length - 1] = true;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop();
    let worst = 0, index = -1;
    for (let i = first + 1; i < last; i++) {
      const d = perpendicular(points[i], points[first], points[last]);
      if (d > worst) { worst = d; index = i; }
    }
    if (worst > tolerance && index > 0) {
      keep[index] = true;
      stack.push([first, index], [index, last]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

const bboxOf = ring => {
  let w = 180, e = -180, s = 90, n = -90;
  for (const [lon, lat] of ring) {
    if (lon < w) w = lon;
    if (lon > e) e = lon;
    if (lat < s) s = lat;
    if (lat > n) n = lat;
  }
  return {w, e, s, n};
};

const inEurope = b =>
  b.e >= EUROPE.west && b.w <= EUROPE.east && b.n >= EUROPE.south && b.s <= EUROPE.north;

const geo = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const rings = [];
for (const feature of geo.features) {
  const geometry = feature.geometry;
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  for (const polygon of polygons) {
    for (const ring of polygon) {
      const box = bboxOf(ring);
      const european = inEurope(box);
      const extent = Math.max(box.e - box.w, box.n - box.s);
      if (extent < (european ? MIN_EXTENT_EU : MIN_EXTENT_WORLD)) continue;
      const simplified = simplify(ring, european ? FINE : COARSE);
      if (simplified.length < 4) continue;
      rings.push(simplified.map(([lon, lat]) => [
        Math.round(lon * 100) / 100,
        Math.round(lat * 100) / 100,
      ]));
    }
  }
}

rings.sort((a, b) => b.length - a.length);
const total = rings.reduce((sum, r) => sum + r.length, 0);
process.stderr.write(`rings ${rings.length}  points ${total}\n`);

const body = rings.map(r => '  [' + r.map(([a, b]) => `${a},${b}`).join(', ') + '],').join('\n');
fs.writeFileSync(process.argv[3], `/**
 * Coastline rings as flat [lon, lat, lon, lat, …] degree pairs, ready for the orthographic
 * projection. Derived from Natural Earth 1:50m land (public domain, naturalearthdata.com),
 * simplified with Douglas-Peucker — finer inside the European viewport, coarse elsewhere.
 * Generated data: don't hand-edit, regenerate with tools/build-land.js.
 */
export const COASTLINES: readonly (readonly number[])[] = [
${body}
];
`);
