// components/viz/nycTaxi/constants.js
//
// Shared geometry and palette for the NYC taxi figure. The frame here and the
// frame baked into public/data/nyc-boroughs-102718.json by
// scripts/build-nyc-basemap.mjs must stay in sync — the basemap is pre-clipped
// and pre-projected to exactly this box.

// Served from this site, not a third party. scripts/build-trips-parquet.py
// pre-projects the coordinates so the browser needs neither the upstream host
// nor DuckDB's spatial extension -- both of which corporate networks block.
export const RIDES_URL = '/data/nyc-trips.parquet';
export const RIDES_LABEL = '16 MB';
export const BASEMAP_URL = '/data/nyc-boroughs-102718.json';
/** Cache Storage bucket holding the parquet; bump the suffix to invalidate. */
export const DATA_CACHE = 'nyc-taxi-data-v2';
/** Virtual filename the parquet is registered under inside DuckDB-WASM. */
export const RIDES_FILE = 'nyc-trips.parquet';

/** ESRI:102718 — NY State Plane Long Island, US survey feet. */
export const FRAME = { xmin: 970000, xmax: 1010000, ymin: 188000, ymax: 238000 };

// Equal feet-per-pixel on both axes: 40,000 × 50,000 ft at 522 × 653 px.
// Two maps plus the gap come to 1056px, which is the article's full content
// width, so the figure fills the page rather than sitting in a narrow column.
export const MAP_W = 522;
export const MAP_H = 653;
export const GAP = 12;

export const HIST_H = 124;
// Explicit histogram margins so the play-through overlay can align to the
// plotting area rather than guessing at Plot's defaults.
export const HIST_ML = 44;
export const HIST_MR = 8;
export const HIST_MT = 6;
export const HIST_MB = 26;

export const LOGICAL_W = MAP_W * 2 + GAP;
export const LOGICAL_H = MAP_H + GAP + HIST_H;

/** Play-through: a two-hour window stepped across the day. */
export const PLAY_WINDOW = 2;
export const PLAY_STEP = 0.5;
export const PLAY_TICK_MS = 260;

/** Stable clause identity for the animation's selection updates. */
export const ANIM_SOURCE = { id: 'nyc-taxi-play' };

// A color *scheme* paints every raster bin, including the empty ones over
// water, with the extreme end of its ramp — which tints the whole panel.
// Instead each raster gets one ink color and lets density drive opacity, so a
// bin with no trips is transparent and the plain panel shows through.
export const INK = {
  pickups: { light: '#1d4ed8', dark: '#38bdf8' },
  dropoffs: { light: '#c2410c', dark: '#fb923c' },
};

export const BRUSH_STYLE = {
  fill: 'rgba(34, 211, 238, 0.16)',
  stroke: '#22d3ee',
  strokeWidth: 2,
  strokeDasharray: null,
};

/** Orientation labels, projected with the same transform as the basemap. */
export const LANDMARKS = [
  { name: 'Harlem', x: 999060, y: 234969 },
  { name: 'Central Park', x: 993528, y: 223891 },
  { name: 'Times Sq', x: 988267, y: 215437 },
  { name: 'Chelsea', x: 983862, y: 211247 },
  { name: 'East Village', x: 989378, y: 203961 },
  { name: 'Wall St', x: 981117, y: 197038 },
  { name: 'Williamsburg', x: 994951, y: 199518 },
  { name: 'Long Island City', x: 998520, y: 210595 },
  { name: 'Downtown BK', x: 986940, y: 191682 },
];

export const STAGE_TEXT = {
  engine: 'Starting DuckDB in your browser…',
  load: 'Loading trips into DuckDB…',
  download: `Streaming ${RIDES_LABEL} of trip records (first visit — cached after this)…`,
  cached: 'Reading trips from your browser cache…',
  project: 'Building the trips table…',
  render: 'Binning the first frame…',
};

export function formatHour(h) {
  const whole = Math.floor(h) % 24;
  const minutes = Math.round((h % 1) * 60);
  const ampm = whole < 12 ? 'AM' : 'PM';
  const h12 = whole % 12 === 0 ? 12 : whole % 12;
  return `${h12}:${String(minutes).padStart(2, '0')} ${ampm}`;
}
