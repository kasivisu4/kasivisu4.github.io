// components/viz/chutes/constants.js
//
// Shared geometry, palette, filter and grouping definitions for the Chutes
// crossfilter figure.
//
// Plots live in fixed-width blocks scaled to fit the column, like the taxi
// figure. The filter bar and the breakdown table are ordinary responsive HTML
// between those blocks: form controls and tables should reflow, not shrink.

// DuckDB-WASM in the browser reads the crossfilter table from a static parquet
// and raw rows straight from the public S3 object, which allows CORS range
// requests.
//
// STATIC_BASE may be any CORS-enabled URL -- e.g. an S3 bucket -- so the site
// itself carries no data: set NEXT_PUBLIC_CHUTES_DATA_URL at build time.
export const STATIC_BASE = (process.env.NEXT_PUBLIC_CHUTES_DATA_URL ?? '/data/chutes').replace(/\/$/, '');
export const TRACE_URL =
  'https://harvardsys-datasets.s3.us-east-1.amazonaws.com/2026_chutes_anonymized/chutes_trace.parquet';

/** The trace's footer facts (verified against the file), so no engine has to read them to show them. */
export const TRACE_FACTS = { rows: 6_122_413_756, bytes: 91_044_147_663, row_groups: 6_114 };

/** The crossfilter table, loaded from chutes.parquet. */
export const TABLE = 'chutes';

/** The trace runs from day 0 to day 366.8, so 367 one-day bins cover it. */
export const TRACE_DAYS = 367;

// Plots are drawn at the main column's measured width, so the hero chart uses
// the space it is given. LOGICAL_W is only the first-render guess; below
// MIN_PLOT_W the plots stop shrinking and are scaled down instead, since
// axis text does not survive being squeezed further.
export const LOGICAL_W = 880;
export const MIN_PLOT_W = 640;

/** Wide enough for the sidebar to sit inline; below this it is a drawer. */
export const WIDE_MEDIA = '(min-width: 1280px)';
export const GAP = 12;

// Block A: the stacked daily timeline, full width.
export const TL_H = 260;
export const TL_H_COMPACT = 220;
export const TL_ML = 56;
export const TL_MR = 10;
export const TL_MT = 22;
export const TL_MB = 30;

// Block B: hour of day beside the day x hour heatmap.
export const B_H = 220;
export const B_H_COMPACT = 190;
export const HOUR_W = 330;
export const HEAT_ML = 40;
export const B_MT = 22;
export const B_MB = 30;

// --- the calendar -----------------------------------------------------------
//
// The release normalized every timestamp to a 1970-01-01 origin. The paper
// (arXiv:2608.13573) states the span as 2025-04-11 to 2026-04-12, so day 0 is
// 11 April 2025. Model launches agree independently: of 20 models with
// well-known release dates, 18 first carry traffic on the day that implies
// (14 to the exact day -- e.g. DeepSeek-V3.1, released 21 Aug 2025, first
// appears on day 132); the other two appear weeks *after* release, never before.
//
// Hour of day cannot be recovered the same way: a trace "day" starts at the
// first request's time of day, which is unknown, so hours stay on the trace
// clock.
export const TRACE_START = Date.UTC(2025, 3, 11); // 11 April 2025, day 0
const DAY_MS = 86_400_000;

/** Trace day number -> Date (UTC midnight of that calendar day). */
export const dayToDate = (d) => new Date(TRACE_START + Math.floor(d) * DAY_MS);
/** Calendar date (UTC) -> trace day number. */
export const dateToDay = (y, m, day = 1) => (Date.UTC(y, m, day) - TRACE_START) / DAY_MS;

const fmt = (opts) => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...opts });
const F_DAY = fmt({ month: 'short', day: 'numeric', year: 'numeric' });
const F_DAY_SHORT = fmt({ month: 'short', day: 'numeric' });
const F_WEEKDAY = fmt({ weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
const F_MONTH = fmt({ month: 'short' });

/** "Sep 9, 2025" */
export const formatDate = (d) => F_DAY.format(dayToDate(d));
/** "Sep 9" */
export const formatDateShort = (d) => F_DAY_SHORT.format(dayToDate(d));
/** "Tue, Sep 9, 2025" */
export const formatDateLong = (d) => F_WEEKDAY.format(dayToDate(d));

/**
 * Time windows, as calendar quarters now that the dates are known. The trace
 * covers Q2 2025 from 11 April and ends on 12 April 2026, so the first and
 * last quarters are partial; "All" and the trailing windows cover the rest.
 */
export const PERIODS = [
  { id: 'all', label: 'All', range: null },
  { id: 'q2-25', label: "Q2 '25", range: [0, dateToDay(2025, 6)] },
  { id: 'q3-25', label: "Q3 '25", range: [dateToDay(2025, 6), dateToDay(2025, 9)] },
  { id: 'q4-25', label: "Q4 '25", range: [dateToDay(2025, 9), dateToDay(2026, 0)] },
  { id: 'q1-26', label: "Q1 '26", range: [dateToDay(2026, 0), dateToDay(2026, 3)] },
  { id: 'l90', label: 'Last 90d', range: [277, 367] },
  { id: 'l30', label: 'Last 30d', range: [337, 367] },
];

/** First-of-month ticks inside `domain`, as trace day numbers. */
export function monthTicks([a, b]) {
  const out = [];
  for (let y = 2025, m = 3; y < 2027; m === 11 ? ((m = 0), y++) : m++) {
    const d = dateToDay(y, m);
    if (d > b) break;
    if (d >= a) out.push(d);
  }
  return out;
}

/** "May '25" on the first tick and on January, "Jun" elsewhere. */
export function monthLabel(d, i) {
  const date = dayToDate(d);
  const month = F_MONTH.format(date);
  // Intl renders a 2-digit year as "May 25", which reads as the 25th of May.
  return i === 0 || date.getUTCMonth() === 0 ? `${month} '${String(date.getUTCFullYear()).slice(2)}` : month;
}

/** Week boundaries inside `domain`, for faint gridlines. */
export function weekRules([a, b]) {
  const out = [];
  for (let d = Math.ceil(a / 7) * 7; d <= b; d += 7) out.push(d);
  return out;
}

/** "Last N days vs the N days before" windows for the KPI trend arrows. */
export const COMPARE_WINDOWS = [30, 90];

/** Stable clause sources for filters that are not plot brushes. */
export const SOURCES = {
  period: { id: 'period' },
  hour: { id: 'click-hour' },
  cellDay: { id: 'click-cell-day' },
  cellHour: { id: 'click-cell-hour' },
};

/** Play-through: a two-week window stepped across the year. */
export const PLAY_WINDOW = 14;
export const PLAY_STEP = 3;
export const PLAY_TICK_MS = 260;

/** Stable clause identity for the animation's selection updates. */
export const ANIM_SOURCE = { id: 'chutes-play' };

/**
 * Filter dimensions, in the order the bar shows them. `kind` picks the
 * control: chips for short lists, a searchable picker for long ones. Each
 * control publishes into the same crossfilter selection as the brushes, under
 * its own stable source, so it composes with every other filter.
 */
export const FILTERS = [
  { dim: 'category', label: 'Category', kind: 'chips', hint: 'what the call does' },
  { dim: 'streaming', label: 'Streaming', kind: 'chips', hint: 'TTFT exists only when streaming' },
  { dim: 'mtype', label: 'Model type', kind: 'chips', hint: 'from the model name — heuristic' },
  { dim: 'family', label: 'Model family', kind: 'chips', hint: 'from the model name — heuristic' },
  { dim: 'func', label: 'Function', kind: 'picker', hint: '98 raw function_name values' },
  { dim: 'model', label: 'Model', kind: 'picker', hint: 'top 200 by requests' },
];

export const FILTER_SOURCES = Object.fromEntries(
  FILTERS.map((f) => [f.dim, { id: `filter-${f.dim}` }]),
);

/**
 * Group-by options. `col` is the column charts color by; for the long
 * dimensions it is the top-8-plus-Other version. `dim` is the filter
 * a table row applies when clicked -- the uncapped column.
 */
export const GROUPS = [
  { id: 'category', label: 'Category', col: 'category', dim: 'category' },
  { id: 'func', label: 'Function', col: 'g_func', dim: 'func' },
  { id: 'streaming', label: 'Streaming', col: 'streaming', dim: 'streaming' },
  { id: 'mtype', label: 'Model type', col: 'mtype', dim: 'mtype' },
  { id: 'family', label: 'Model family', col: 'g_family', dim: 'family' },
  { id: 'model', label: 'Model', col: 'g_model', dim: 'model' },
];

/** Buckets that fold the tail together; they cannot be filtered on directly. */
export const OTHER_BUCKETS = new Set(['Other models', 'Other functions', 'Other families']);

// Categorical palette for up to nine groups (Tableau 10 minus its grey), which
// holds its contrast on both the light and the dark panel. The folded "Other"
// bucket is always slate, so it reads as a remainder rather than a peer.
export const PALETTE = [
  '#4e79a7',
  '#f28e2b',
  '#e15759',
  '#76b7b2',
  '#59a14f',
  '#edc948',
  '#b07aa1',
  '#ff9da7',
  '#9c755f',
];
export const OTHER_COLOR = '#94a3b8';

/** Colors in domain order; any folded bucket gets the neutral slate. */
export function colorsFor(keys) {
  let i = 0;
  return keys.map((k) => (OTHER_BUCKETS.has(k) ? OTHER_COLOR : PALETTE[i++ % PALETTE.length]));
}

// Single-ink plots, as in the taxi figure: density as opacity.
export const INK = {
  heat: { light: '#1d4ed8', dark: '#38bdf8' },
};

export const BRUSH_STYLE = {
  fill: 'rgba(34, 211, 238, 0.16)',
  stroke: '#22d3ee',
  strokeWidth: 2,
  strokeDasharray: null,
};

export const STAGE_TEXT = {
  engine: 'Loading Mosaic…',
  wasm: 'Starting DuckDB in your browser…',
  download: 'Downloading the 24 MB hourly table…',
  cached: 'Reading the hourly table from this browser’s cache…',
  load: 'Loading 1.34M rows into DuckDB…',
  render: 'Aggregating the first frame…',
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Model labels. 5% of traffic belongs to top-200 models the paper's name list
 * does not cover; those keep their chute UUID, shortened and marked so they
 * read as "unnamed" rather than as garbage.
 */
export function shortModel(name) {
  const s = String(name ?? '');
  if (UUID.test(s)) return `unnamed · ${s.slice(0, 8)}`;
  const tail = s.includes('/') ? s.slice(s.indexOf('/') + 1) : s;
  return tail.length > 34 ? `${tail.slice(0, 33)}…` : tail;
}

/** Display label for a value of any dimension. */
export const labelFor = (dim, value) =>
  dim === 'model' || dim === 'g_model' ? shortModel(value) : String(value);

/** Day label for chips and logs: the calendar date. */
export const formatDay = (d) => formatDateShort(d);

export function formatHod(h) {
  const whole = Math.floor(h) % 24;
  return `${String(whole).padStart(2, '0')}:00`;
}

/** 6,122,413,756 → "6.12B". */
export function compact(n) {
  if (n == null || !Number.isFinite(n)) return '—';
  const a = Math.abs(n);
  if (a >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return n.toFixed(0);
}

export function pct(part, whole) {
  if (!whole) return '—';
  const p = (100 * part) / whole;
  if (p === 0) return '0%';
  if (p < 0.01) return '<0.01%';
  if (p < 1) return `${p.toFixed(2)}%`;
  return `${p.toFixed(1)}%`;
}
