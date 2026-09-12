// scripts/build-nyc-basemap.mjs
//
// Builds the basemap that sits under the taxi rasters in the NYC rides post.
//
// The trip data is projected to ESRI:102718 (NAD83 / New York Long Island,
// US survey feet) inside DuckDB. For borough outlines to line up with it, the
// same projection has to be applied to the boundary geometry -- so this script
// reprojects WGS84 lon/lat borough polygons with a Lambert Conformal Conic
// forward transform, clips them to the plot frame, simplifies below one pixel,
// and writes a compact integer-coordinate JSON the browser can draw as SVG.
//
// Run:  npm run basemap
//
// Source: five-borough boundaries, WGS84, from the click_that_hood dataset
// (originally NYC Department of City Planning).
import fs from 'node:fs';
import path from 'node:path';

const SOURCE =
  'https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/new-york-city-boroughs.geojson';

const OUT = path.join(process.cwd(), 'public', 'data', 'nyc-boroughs-102718.json');

// Plot frame, in ESRI:102718 feet. Must match the component's domains.
const FRAME = { xmin: 970000, xmax: 1010000, ymin: 188000, ymax: 238000 };

// Clip a little wider than the frame so the artificial edges Sutherland-Hodgman
// introduces along the clip box land outside the visible area.
const PAD = 2500;

// ~91 ft per pixel at the rendered size, so 40 ft of error is invisible.
const SIMPLIFY_TOLERANCE = 40;

// Drop rings smaller than this (bbox diagonal, feet) -- specks of rock.
const MIN_RING_SIZE = 600;

// --- ESRI:102718 == EPSG:2263, Lambert Conformal Conic 2SP on GRS80 --------

const D2R = Math.PI / 180;
const A = 6378137; // GRS80 semi-major axis, metres
const F = 1 / 298.257222101; // GRS80 flattening
const E = Math.sqrt(2 * F - F * F); // first eccentricity
const US_FOOT = 0.3048006096012192; // metres per US survey foot

const LAT_0 = 40.16666666666666 * D2R;
const LON_0 = -74 * D2R;
const LAT_1 = 41.03333333333333 * D2R;
const LAT_2 = 40.66666666666666 * D2R;
const FALSE_EASTING = 300000; // metres
const FALSE_NORTHING = 0; // metres

const m = (phi) => Math.cos(phi) / Math.sqrt(1 - E * E * Math.sin(phi) ** 2);

const t = (phi) => {
  const s = E * Math.sin(phi);
  return Math.tan(Math.PI / 4 - phi / 2) / ((1 - s) / (1 + s)) ** (E / 2);
};

const m1 = m(LAT_1);
const m2 = m(LAT_2);
const t1 = t(LAT_1);
const t2 = t(LAT_2);
const N = (Math.log(m1) - Math.log(m2)) / (Math.log(t1) - Math.log(t2));
const BIG_F = m1 / (N * t1 ** N);
const RHO_0 = A * BIG_F * t(LAT_0) ** N;

/** WGS84 [lon, lat] degrees -> ESRI:102718 [x, y] US survey feet. */
function project([lon, lat]) {
  const rho = A * BIG_F * t(lat * D2R) ** N;
  const theta = N * (lon * D2R - LON_0);
  const xm = FALSE_EASTING + rho * Math.sin(theta);
  const ym = FALSE_NORTHING + RHO_0 - rho * Math.cos(theta);
  return [xm / US_FOOT, ym / US_FOOT];
}

// --- geometry helpers ------------------------------------------------------

/** Sutherland-Hodgman: clip a polygon ring against one edge of the box. */
function clipEdge(ring, inside, intersect) {
  const out = [];
  for (let i = 0; i < ring.length; i++) {
    const cur = ring[i];
    const prev = ring[(i + ring.length - 1) % ring.length];
    const curIn = inside(cur);
    const prevIn = inside(prev);
    if (curIn) {
      if (!prevIn) out.push(intersect(prev, cur));
      out.push(cur);
    } else if (prevIn) {
      out.push(intersect(prev, cur));
    }
  }
  return out;
}

function clipToBox(ring, box) {
  const lerpX = (a, b, x) => [x, a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0])];
  const lerpY = (a, b, y) => [a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]), y];

  let r = ring;
  r = clipEdge(r, (p) => p[0] >= box.xmin, (a, b) => lerpX(a, b, box.xmin));
  if (!r.length) return r;
  r = clipEdge(r, (p) => p[0] <= box.xmax, (a, b) => lerpX(a, b, box.xmax));
  if (!r.length) return r;
  r = clipEdge(r, (p) => p[1] >= box.ymin, (a, b) => lerpY(a, b, box.ymin));
  if (!r.length) return r;
  r = clipEdge(r, (p) => p[1] <= box.ymax, (a, b) => lerpY(a, b, box.ymax));
  return r;
}

/** Douglas-Peucker. */
function simplify(points, tolerance) {
  if (points.length < 3) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];

  while (stack.length) {
    const [first, last] = stack.pop();
    let maxDist = 0;
    let index = -1;
    const [x1, y1] = points[first];
    const [x2, y2] = points[last];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;

    // A closed ring can start and end on the same point, which makes the
    // baseline degenerate -- fall back to radial distance so the far side of
    // the ring still gets split instead of collapsing to two points.
    const closed = dx === 0 && dy === 0;

    for (let i = first + 1; i < last; i++) {
      const [px, py] = points[i];
      const dist = closed
        ? Math.hypot(px - x1, py - y1)
        : Math.abs(dy * px - dx * py + x2 * y1 - y2 * x1) / len;
      if (dist > maxDist) {
        maxDist = dist;
        index = i;
      }
    }

    if (maxDist > tolerance && index > 0) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }

  return points.filter((_, i) => keep[i]);
}

function ringSize(ring) {
  let xmin = Infinity;
  let ymin = Infinity;
  let xmax = -Infinity;
  let ymax = -Infinity;
  for (const [x, y] of ring) {
    if (x < xmin) xmin = x;
    if (x > xmax) xmax = x;
    if (y < ymin) ymin = y;
    if (y > ymax) ymax = y;
  }
  return Math.hypot(xmax - xmin, ymax - ymin);
}

// --- build -----------------------------------------------------------------

const box = {
  xmin: FRAME.xmin - PAD,
  xmax: FRAME.xmax + PAD,
  ymin: FRAME.ymin - PAD,
  ymax: FRAME.ymax + PAD,
};

console.log(`fetching ${SOURCE}`);
const geojson = await fetch(SOURCE).then((r) => {
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
});

const boroughs = [];
let ringCount = 0;
let pointCount = 0;

for (const feature of geojson.features) {
  const { type, coordinates } = feature.geometry;
  const polygons = type === 'Polygon' ? [coordinates] : coordinates;
  const rings = [];

  for (const polygon of polygons) {
    for (const ring of polygon) {
      const clipped = clipToBox(ring.map(project), box);
      if (clipped.length < 4) continue;
      if (ringSize(clipped) < MIN_RING_SIZE) continue;

      const simplified = simplify(clipped, SIMPLIFY_TOLERANCE);
      if (simplified.length < 4) continue;

      const flat = [];
      for (const [x, y] of simplified) flat.push(Math.round(x), Math.round(y));
      rings.push(flat);
      ringCount++;
      pointCount += simplified.length;
    }
  }

  if (rings.length) boroughs.push({ name: feature.properties.name, rings });
}

const output = {
  crs: 'ESRI:102718',
  units: 'us-ft',
  frame: FRAME,
  source: SOURCE,
  boroughs,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(output));

const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
console.log(
  `wrote ${path.relative(process.cwd(), OUT)} — ` +
    `${boroughs.length} boroughs, ${ringCount} rings, ${pointCount} points, ${kb} kB`,
);
for (const b of boroughs) console.log(`  ${b.name.padEnd(14)} ${b.rings.length} rings`);
