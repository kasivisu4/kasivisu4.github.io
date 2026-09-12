'use client';

// components/viz/NycTaxiRides.jsx
//
// An in-browser crossfilter over a million NYC taxi trips, built on Mosaic
// vgplot and DuckDB-WASM. Nothing is precomputed: the parquet file is fetched
// once, projected to NY State Plane inside DuckDB, and every brush — and every
// frame of the play-through — runs a real aggregation query in the browser.
//
// Everything is served from this origin -- Mosaic is bundled and code-split,
// DuckDB's worker and wasm come from public/duckdb/. An earlier version loaded
// both from esm.sh, which is fine until a corporate proxy blocks it and the
// whole figure dies with "failed to fetch dynamically imported module".
// The imports stay dynamic so the ~1 MB engine is only fetched by readers who
// actually scroll to the figure.
//
// Theme note: everything server-rendered (outlines, labels, legends) is themed
// with CSS classes only, because the server cannot know the visitor's theme and
// inline theme-dependent styles break hydration. `dark` is read client-side
// only, inside build(), where it picks the raster ink.
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';

import UnderTheHood from './nycTaxi/UnderTheHood';
import { createLocalDuckDB } from './nycTaxi/duckdb';
import { describeClause } from './nycTaxi/projection';
import {
  groupEntries,
  instrumentConnector,
  logEntries,
  logSnapshot,
  recentFrames,
  setActivity,
  subscribeLog,
} from './nycTaxi/queryLog';
import {
  ANIM_SOURCE,
  BASEMAP_URL,
  BRUSH_STYLE,
  DATA_CACHE,
  FRAME,
  GAP,
  HIST_H,
  HIST_MB,
  HIST_ML,
  HIST_MR,
  HIST_MT,
  INK,
  LANDMARKS,
  LOGICAL_H,
  LOGICAL_W,
  MAP_H,
  MAP_W,
  PLAY_STEP,
  PLAY_TICK_MS,
  PLAY_WINDOW,
  RIDES_FILE,
  RIDES_LABEL,
  RIDES_URL,
  STAGE_TEXT,
  formatHour,
} from './nycTaxi/constants';

// --- one-time loads, shared across mounts ---------------------------------

let vgplotPromise = null;
let corePromise = null;
let datasetPromise = null;
let basemapPromise = null;

// Code-split, not CDN-loaded: webpack emits these as their own chunks served
// from this origin, so nothing third-party is required at runtime.
function importVgplot() {
  vgplotPromise ??= import('@uwdata/vgplot');
  return vgplotPromise;
}

// clauseInterval is not re-exported by vgplot; it drives the play-through.
function importCore() {
  corePromise ??= import('@uwdata/mosaic-core');
  return corePromise;
}

function loadBasemap() {
  basemapPromise ??= fetch(BASEMAP_URL).then((r) => {
    if (!r.ok) throw new Error(`basemap ${r.status}`);
    return r.json();
  });
  return basemapPromise;
}

/**
 * Loads the trips into DuckDB-WASM once per page. `onStage` only reports for
 * the first caller; later mounts resolve immediately off the same promise.
 */
/**
 * Gets the parquet bytes to DuckDB, preferring the browser's Cache Storage.
 *
 * First visit streams the file and stores it. Every visit after that reads it
 * back locally and hands DuckDB a registered virtual file, so the network is
 * never touched. Falls back to streaming when Cache Storage is unavailable
 * (private windows, older browsers) -- the figure still works, just slower.
 */
async function stageRidesFile(rawConnector, onStage) {
  if (typeof caches === 'undefined') {
    onStage('download');
    return { file: RIDES_URL, via: 'network' };
  }

  try {
    const cache = await caches.open(DATA_CACHE);
    let response = await cache.match(RIDES_URL);
    let via = 'cache';

    if (response) {
      onStage('cached');
    } else {
      via = 'network';
      onStage('download');
      response = await fetch(RIDES_URL);
      if (!response.ok) throw new Error(`parquet ${response.status}`);
      await cache.put(RIDES_URL, response.clone());
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    const db = await rawConnector.getDuckDB();
    await db.registerFileBuffer(RIDES_FILE, bytes);
    return { file: RIDES_FILE, via };
  } catch (err) {
    console.warn('[nyc-taxi] cache unavailable, streaming instead', err);
    onStage('download');
    return { file: RIDES_URL, via: 'network' };
  }
}

function prepareDataset(vg, onStage) {
  datasetPromise ??= (async () => {
    const coordinator = vg.coordinator();
    // Supplying the database means wasmConnector never runs its own
    // initializer, which would fetch the worker and wasm from jsDelivr.
    const rawConnector = vg.wasmConnector({ duckdb: await createLocalDuckDB() });
    coordinator.databaseConnector(instrumentConnector(rawConnector));

    onStage('engine');
    setActivity('setup');

    // No spatial extension. The parquet arrives already projected to
    // ESRI:102718 by scripts/build-trips-parquet.py, which runs the identical
    // ST_Transform offline. That removes a download from extensions.duckdb.org
    // at page load -- one fewer thing for a corporate proxy to block.
    const { file, via } = await stageRidesFile(rawConnector, onStage);

    onStage('project');
    setActivity('load');
    await coordinator.exec(vg.loadParquet('trips', file));

    let rows = null;
    try {
      const result = await coordinator.query('SELECT count(*) AS n FROM trips');
      rows = Number(result.get(0).n);
    } catch {
      // A missing row count is cosmetic; the dashboard works without it.
    }

    return { coordinator, rows, via };
  })();

  return datasetPromise;
}

/**
 * The KPI tiles, as a first-class Mosaic client.
 *
 * These numbers used to come from a hand-rolled `coordinator.query()` fired
 * from a React effect. That worked, but it bypassed the entire runtime: the
 * query sat outside the filter group, outside the cache, outside
 * consolidation, and -- the expensive part -- outside pre-aggregation. So it
 * ran a full O(N) scan of `trips` on every single frame while the charts read
 * a cube.
 *
 * Declaring it as a client instead hands Mosaic the same information it has
 * about the plots. `count` and `avg` both decompose into sufficient
 * statistics (avg becomes sum/count), and an ungrouped aggregate still counts
 * as an aggregate query, so the pre-aggregator can build a cube for this too.
 * The frame stops touching the source table at all.
 */
function makeKpiClient(vg, filter, onData) {
  return new (class extends vg.MosaicClient {
    constructor() {
      super(filter); // filterBy -- joins the crossfilter group
    }

    query(filter = []) {
      return vg.Query.from('trips')
        .select({
          trips: vg.count(),
          distance: vg.avg('distance'),
          fare: vg.avg('fare'),
          riders: vg.avg('riders'),
        })
        .where(filter);
    }

    queryResult(data) {
      const row = data?.get?.(0);
      if (row) {
        onData({
          trips: Number(row.trips),
          distance: Number(row.distance),
          fare: Number(row.fare),
          riders: Number(row.riders),
        });
      }
      return this;
    }
  })();
}

// --- map overlays ----------------------------------------------------------

function ringToPath(flat) {
  let d = `M${flat[0]} ${flat[1]}`;
  for (let i = 2; i < flat.length; i += 2) d += `L${flat[i]} ${flat[i + 1]}`;
  return `${d}Z`;
}

/**
 * Borough coastline in data coordinates. The plots use margin 0 and fixed
 * domains, so an SVG spanning the same box lines up pixel for pixel. Strokes
 * only — the raster is the one thing in the frame allowed to carry color.
 */
function BoroughOutlines({ basemap }) {
  if (!basemap) return null;
  const { xmin, xmax, ymin, ymax } = FRAME;

  return (
    <svg
      viewBox={`${xmin} ${ymin} ${xmax - xmin} ${ymax - ymin}`}
      width={MAP_W}
      height={MAP_H}
      className="absolute inset-0 pointer-events-none"
      aria-hidden="true"
    >
      {/* Screen coordinates run downwards; northings run upwards. */}
      <g
        transform={`translate(0, ${ymin + ymax}) scale(1, -1)`}
        className="fill-none stroke-slate-400/50 dark:stroke-slate-500/45"
        strokeWidth={1.25}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      >
        {basemap.boroughs.map((borough) => (
          <g key={borough.name}>
            {borough.rings.map((ring, i) => (
              <path key={i} d={ringToPath(ring)} />
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}

/** Neighborhood names, positioned by percentage of the data frame. */
function LandmarkLabels() {
  const { xmin, xmax, ymin, ymax } = FRAME;

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {LANDMARKS.map(({ name, x, y }) => (
        <span
          key={name}
          className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap
            text-xs font-semibold tracking-wider uppercase
            text-slate-700 dark:text-slate-200
            [text-shadow:0_0_2px_#fff,0_0_6px_#fff,0_0_10px_rgba(255,255,255,0.8)]
            dark:[text-shadow:0_0_2px_#020817,0_0_6px_#020817,0_0_10px_rgba(2,8,23,0.9)]"
          style={{
            left: `${((x - xmin) / (xmax - xmin)) * 100}%`,
            top: `${((ymax - y) / (ymax - ymin)) * 100}%`,
          }}
        >
          {name}
        </span>
      ))}
    </div>
  );
}

/**
 * States the density encoding rather than leaving it assumed. Both theme
 * variants are rendered and CSS picks one, so the server markup does not
 * depend on a theme it cannot know.
 */
function DensityLegend({ scheme }) {
  const { light, dark } = INK[scheme];
  const ramp = (ink) => `linear-gradient(to right, transparent, ${ink})`;

  return (
    <span
      className="absolute bottom-3 left-3 flex items-center gap-1.5 pointer-events-none
        rounded-full px-2.5 py-1 bg-white/70 dark:bg-slate-950/70 backdrop-blur-sm"
    >
      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">fewer</span>
      <span
        className="h-1.5 w-16 rounded-full ring-1 ring-black/10 dark:hidden"
        style={{ background: ramp(light) }}
      />
      <span
        className="h-1.5 w-16 rounded-full ring-1 ring-white/15 hidden dark:block"
        style={{ background: ramp(dark) }}
      />
      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">more</span>
    </span>
  );
}

function MapPanel({ label, chip, scheme, mountRef, basemap }) {
  return (
    <div
      className="relative overflow-hidden rounded-xl border border-black/5 dark:border-white/10
        bg-white dark:bg-slate-950"
      style={{ width: MAP_W, height: MAP_H }}
    >
      <div ref={mountRef} className="absolute inset-0" />
      <BoroughOutlines basemap={basemap} />
      <LandmarkLabels />
      <span
        className={`absolute left-3 top-3 rounded-md border px-2.5 py-1
          text-xs font-bold tracking-widest uppercase pointer-events-none
          backdrop-blur-sm ${chip}`}
      >
        {label}
      </span>
      <DensityLegend scheme={scheme} />
    </div>
  );
}

function Kpi({ label, value, sub, accent = false }) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        accent
          ? 'border-cyan-500/40 bg-cyan-500/10'
          : 'border-black/5 dark:border-white/10 bg-white/80 dark:bg-slate-900/60'
      }`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div
        className={`mt-0.5 font-display text-2xl font-bold tabular-nums ${
          accent ? 'text-cyan-700 dark:text-cyan-300' : 'text-slate-900 dark:text-slate-100'
        }`}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">{sub}</div>}
    </div>
  );
}

// --- figure ----------------------------------------------------------------

export default function NycTaxiRides() {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === 'dark';

  const pickupRef = useRef(null);
  const dropoffRef = useRef(null);
  const histogramRef = useRef(null);
  const wrapperRef = useRef(null);
  const vgRef = useRef(null);
  const coreRef = useRef(null);
  const filterRef = useRef(null);
  const timerRef = useRef(null);
  const loadRef = useRef(null);
  const buildRef = useRef(null);
  const kpiClientRef = useRef(null);

  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [stage, setStage] = useState('engine');
  const [error, setError] = useState(null);
  const [rows, setRows] = useState(null);
  const [basemap, setBasemap] = useState(null);
  const [scale, setScale] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [playT, setPlayT] = useState(0);
  const [kpis, setKpis] = useState(null);
  const [filters, setFilters] = useState([]);
  const [dataVia, setDataVia] = useState(null); // 'cache' | 'network'

  // The panel below and this KPI read the same measured frames, so the
  // headline latency is never a different number from the chart.
  useSyncExternalStore(subscribeLog, logSnapshot, () => 0);
  const lastFrame = recentFrames(groupEntries(logEntries()), 1)[0] ?? null;

  // The outlines are ~17 kB and carry the figure on their own, so the idle
  // state is already a map of New York rather than an empty grey box.
  useEffect(() => {
    let alive = true;
    loadBasemap()
      .then((data) => alive && setBasemap(data))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Start loading as the figure comes into view. No button: a reader who gets
  // here gets a working chart, and one who never scrolls this far never pays
  // the 46 MB. rootMargin gives the engine a head start.
  useEffect(() => {
    if (status !== 'idle') return;
    const node = wrapperRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      loadRef.current?.();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          loadRef.current?.();
        }
      },
      { rootMargin: '400px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [status]);

  // Fit the fixed-width design into whatever column it lands in.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      if (width > 0) setScale(Math.min(1, width / LOGICAL_W));
    });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  /**
   * Mirrors the filter readout. The KPI *numbers* are no longer computed here
   * -- see makeKpiClient below for why.
   */
  const refreshStats = useCallback(() => {
    const filter = filterRef.current;
    if (!filter) return;
    try {
      setFilters((filter.clauses ?? []).map(describeClause).filter(Boolean));
    } catch (err) {
      console.error('[nyc-taxi] could not describe filters', err);
      setFilters([]);
    }
  }, []);

  const publishWindow = useCallback((extent) => {
    const core = coreRef.current;
    const filter = filterRef.current;
    if (!core || !filter) return;

    setActivity(extent ? `play ${formatHour(extent[0])}` : 'play stop');
    // No `scale` option on purpose. Passing one sends the clause down Mosaic's
    // pre-aggregation path, which expects a clause published by a real plot
    // interactor and quietly returns unfiltered results for a synthetic one.
    // Without it each frame is an honest filtered scan, which DuckDB-WASM does
    // well inside the frame budget for a million rows.
    filter.update(core.clauseInterval('time', extent, { source: ANIM_SOURCE }));
  }, []);

  const stopPlaying = useCallback(
    (clearClause = true) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setPlaying(false);
      // A null extent replaces the animation clause with a no-op predicate.
      if (clearClause) publishWindow(null);
    },
    [publishWindow],
  );

  const startPlaying = useCallback(() => {
    if (timerRef.current) return;
    let t = 0;
    setPlaying(true);
    setPlayT(0);
    publishWindow([0, PLAY_WINDOW]);

    timerRef.current = setInterval(() => {
      t += PLAY_STEP;
      if (t > 24 - PLAY_WINDOW) t = 0;
      setPlayT(t);
      publishWindow([t, t + PLAY_WINDOW]);
    }, PLAY_TICK_MS);
  }, [publishWindow]);

  useEffect(() => () => stopPlaying(false), [stopPlaying]);

  /**
   * Full reset: rebuild the plots and drop the pre-aggregation schema.
   *
   * Cubes are keyed by (view, active selection), so a long session leaves
   * dozens behind. Mosaic re-issues CREATE TABLE IF NOT EXISTS for each one on
   * every frame -- individually ~1 ms, collectively noise that drowns out the
   * three queries that matter. Dropping the schema returns the figure to a
   * cold, honest starting point.
   */
  const reset = useCallback(async () => {
    const vg = vgRef.current;
    const coordinator = vg?.coordinator();
    try {
      // preaggregator.dropSchema() resolves without dropping anything in this
      // setup, so do it explicitly: forget the cached entries, then drop the
      // tables they point at.
      coordinator?.preaggregator?.clear?.();
      await coordinator?.exec('DROP SCHEMA IF EXISTS "mosaic" CASCADE');
    } catch (err) {
      console.warn('[nyc-taxi] could not drop cube schema', err);
    }
    buildRef.current?.();
  }, []);

  const build = useCallback(() => {
    const vg = vgRef.current;
    if (!vg) return;

    stopPlaying(false);

    const coordinator = vg.coordinator();
    // Drop the previous plots' clients so they stop answering queries. The
    // query cache and the DuckDB tables both survive, so this is cheap.
    coordinator.clear({ clients: true, cache: false });

    for (const ref of [pickupRef, dropoffRef, histogramRef]) {
      ref.current?.replaceChildren();
    }

    const filter = vg.Selection.crossfilter();
    filterRef.current = filter;
    filter.addEventListener('value', () => {
      // Label the queries this update is about to cause. The play-through
      // labels itself in publishWindow; anything else is a hand-made brush.
      if (filter.active?.source !== ANIM_SOURCE) setActivity('brush');
      refreshStats();
    });

    const style = {
      background: 'transparent',
      color: dark ? '#94a3b8' : '#475569',
      fontSize: '11px',
    };

    const map = (x, y, key) =>
      vg.plot(
        vg.raster(vg.from('trips', { filterBy: filter }), {
          x,
          y,
          bandwidth: 0,
          // Constant ink + density-driven opacity, so an empty bin over water
          // is transparent instead of painted with the end of a color ramp.
          fill: INK[key][dark ? 'dark' : 'light'],
        }),
        vg.intervalXY({ as: filter, brush: BRUSH_STYLE }),
        vg.width(MAP_W),
        vg.height(MAP_H),
        vg.margin(0),
        vg.xAxis(null),
        vg.yAxis(null),
        vg.xDomain([FRAME.xmin, FRAME.xmax]),
        vg.yDomain([FRAME.ymin, FRAME.ymax]),
        // symlog so a handful of trips stays visible next to Midtown, and a
        // fixed opacity domain so a quiet hour genuinely looks quiet during
        // the play-through instead of being renormalized to full contrast.
        vg.opacityScale('symlog'),
        vg.opacityDomain(vg.Fixed),
        vg.opacityClamp(true),
        vg.style(style),
      );

    pickupRef.current?.append(map('px', 'py', 'pickups'));
    dropoffRef.current?.append(map('dx', 'dy', 'dropoffs'));

    // The KPI tiles are a client like any other, so they ride the same cube
    // the plots do instead of scanning the source table each frame.
    kpiClientRef.current = makeKpiClient(vg, filter, setKpis);
    coordinator.connect(kpiClientRef.current);

    histogramRef.current?.append(
      vg.plot(
        // filterBy so the histogram participates in the crossfilter: a map
        // brush reshapes it, but its own interval never filters itself.
        vg.rectY(vg.from('trips', { filterBy: filter }), {
          x: vg.bin('time'),
          y: vg.count(),
          fill: dark ? '#22d3ee' : '#0891b2',
          inset: 0.5,
        }),
        vg.intervalX({ as: filter, brush: BRUSH_STYLE }),
        vg.width(LOGICAL_W),
        vg.height(HIST_H),
        vg.marginLeft(HIST_ML),
        vg.marginRight(HIST_MR),
        vg.marginTop(HIST_MT),
        vg.marginBottom(HIST_MB),
        vg.xDomain([0, 24]),
        vg.xLabel('Hour of day →'),
        vg.yLabel('Trips'),
        vg.yTickFormat('s'),
        vg.style(style),
      ),
    );

    setActivity('render');
    // Issued last: coordinator.clear() at the top of a rebuild rejects any
    // query still in flight, so asking earlier just gets it cancelled.
    refreshStats();
  }, [dark, stopPlaying, refreshStats]);

  const load = useCallback(async () => {
    setStatus('loading');
    setStage('engine');
    setError(null);

    try {
      const [vg, core] = await Promise.all([importVgplot(), importCore()]);
      vgRef.current = vg;
      coreRef.current = core;

      const { rows: count, via } = await prepareDataset(vg, setStage);
      setRows(count);
      setDataVia(via);

      setStage('render');
      setStatus('ready');
    } catch (err) {
      console.error('[nyc-taxi] load failed', err);
      setError(err?.message ?? String(err));
      setStatus('error');
    }
  }, []);

  loadRef.current = load;
  buildRef.current = build;

  // Builds once when ready, and again whenever the site theme flips so the
  // raster ink follows the page.
  useEffect(() => {
    if (status === 'ready') build();
  }, [status, build]);

  // Sweep overlay geometry: the histogram's inner x range maps [0, 24] hours.
  const histInnerW = LOGICAL_W - HIST_ML - HIST_MR;
  const sweepLeft = HIST_ML + (playT / 24) * histInnerW;
  const sweepWidth = (PLAY_WINDOW / 24) * histInnerW;

  return (
    <figure className="nyc-taxi-viz not-prose my-12">
      <div
        className="rounded-2xl border border-black/5 dark:border-white/10
          bg-slate-50/90 dark:bg-slate-950/70 backdrop-blur-sm p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-4">
          <h3 className="font-display text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Where New York got in, and where it got out
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 tabular-nums">
            {playing ? (
              <span className="font-semibold text-cyan-600 dark:text-cyan-300">
                {formatHour(playT)} – {formatHour(playT + PLAY_WINDOW)}
              </span>
            ) : (
              <>{rows ? `${rows.toLocaleString('en-US')} trips · ` : ''}1–3 January 2010</>
            )}
          </p>
        </div>

        {/* Headline numbers for whatever is currently selected. With no brush
            down these describe all million trips; every brush and every
            animation frame recomputes them from the maps' own predicates. */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          <Kpi
            label="Trips selected"
            value={kpis ? kpis.trips.toLocaleString('en-US') : '—'}
            sub={kpis && rows ? `${((kpis.trips / rows) * 100).toFixed(1)}% of all trips` : ' '}
          />
          <Kpi
            label="Avg distance"
            value={kpis?.distance ? `${kpis.distance.toFixed(2)} mi` : '—'}
            sub={' '}
          />
          <Kpi
            label="Avg fare"
            value={kpis?.fare ? `$${kpis.fare.toFixed(2)}` : '—'}
            sub={' '}
          />
          <Kpi
            label="Avg party"
            value={kpis?.riders ? kpis.riders.toFixed(2) : '—'}
            sub={kpis?.riders ? 'passengers per cab' : ' '}
          />
          <Kpi
            label="Last frame"
            accent
            value={lastFrame ? `${lastFrame.ms.toFixed(1)} ms` : '—'}
            sub={
              lastFrame
                ? lastFrame.path === 'cube'
                  ? 'from pre-aggregated cube'
                  : lastFrame.path === 'build'
                    ? 'building cube'
                    : 'source table scan'
                : 'drag to measure'
            }
          />
        </div>

        {/* What is actually being filtered, in units a reader can check. */}
        <div className="mb-6 min-h-[2.5rem] flex flex-wrap items-start gap-2">
          {filters.length === 0 ? (
            <span className="text-sm text-slate-500 dark:text-slate-400 py-1">
              No filters — showing every trip. Drag on a map or across the hours to select.
            </span>
          ) : (
            filters.map((f) => (
              <span
                key={f.key}
                className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5"
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
                  {f.label}
                </span>
                <span className="ml-2 text-sm tabular-nums text-slate-700 dark:text-slate-200">
                  {f.value}
                </span>
                <span className="block text-xs tabular-nums text-slate-500 dark:text-slate-400">
                  {f.detail}
                </span>
              </span>
            ))
          )}
        </div>

        <div ref={wrapperRef} className="w-full">
          <div
            style={{
              width: LOGICAL_W,
              height: LOGICAL_H,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              marginBottom: (scale - 1) * LOGICAL_H,
            }}
            // A manual brush and the play-through fight over the same filter,
            // so touching any plot hands control back to the mouse.
            onPointerDownCapture={() => {
              if (timerRef.current) stopPlaying();
            }}
          >
            <div className="flex" style={{ gap: GAP }}>
              <MapPanel
                label="Pickups"
                chip="bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/40"
                scheme="pickups"
                mountRef={pickupRef}
                basemap={basemap}
              />
              <MapPanel
                label="Dropoffs"
                chip="bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/40"
                scheme="dropoffs"
                mountRef={dropoffRef}
                basemap={basemap}
              />
            </div>

            <div className="relative" style={{ marginTop: GAP, height: HIST_H }}>
              <div ref={histogramRef} className="absolute inset-0" />
              {playing && (
                <div
                  className="absolute pointer-events-none rounded-sm
                    bg-cyan-400/20 border-x-2 border-cyan-400"
                  style={{
                    left: sweepLeft,
                    width: sweepWidth,
                    top: HIST_MT,
                    bottom: HIST_MB,
                  }}
                />
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3 min-h-[2.25rem]">
          {status === 'idle' && (
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Preparing {RIDES_LABEL} of trips — everything is queried locally, nothing leaves
              your browser.
            </span>
          )}

          {status === 'loading' && (
            <span className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
              <span
                className="h-3.5 w-3.5 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin"
                aria-hidden="true"
              />
              {STAGE_TEXT[stage] ?? 'Working…'}
            </span>
          )}

          {status === 'ready' && (
            <>
              <button
                type="button"
                onClick={playing ? () => stopPlaying() : startPlaying}
                className="rounded-lg px-4 py-2 text-sm font-medium
                  bg-cyan-500/10 text-cyan-700 dark:text-cyan-300
                  border border-cyan-500/30
                  hover:bg-cyan-500/20 transition-colors tabular-nums"
              >
                {playing ? '⏸ Pause' : '▶ Play the day'}
              </button>
              <button
                type="button"
                onClick={reset}
                title="Clear selections and drop every pre-aggregation cube"
                className="rounded-lg px-3 py-2 text-sm font-medium
                  bg-black/5 dark:bg-white/5 text-slate-700 dark:text-slate-300
                  border border-black/10 dark:border-white/10
                  hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                Reset
              </button>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {playing
                  ? 'A two-hour window is sweeping across the day — both maps follow it.'
                  : 'Drag a box on either map to filter the other two, or drag across the hours. Click once on a plot to clear its box.'}
              </span>
            </>
          )}

          {status === 'error' && (
            <>
              <button
                type="button"
                onClick={load}
                className="rounded-lg px-3 py-2 text-sm font-medium
                  bg-black/5 dark:bg-white/5 text-slate-700 dark:text-slate-300
                  border border-black/10 dark:border-white/10
                  hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                Try again
              </button>
              <span className="text-sm text-rose-600 dark:text-rose-400">
                Could not start the query engine ({error}). It needs WebAssembly and a modern
                browser.
              </span>
            </>
          )}
        </div>

        <UnderTheHood
          sourceRows={rows}
          vgRef={vgRef}
          dataVia={dataVia}
          playing={playing}
          playLabel={`${formatHour(playT)} – ${formatHour(playT + PLAY_WINDOW)}`}
        />
      </div>

      <figcaption className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
        The first million yellow-cab trips of 2010 — New Year&rsquo;s Day through the Sunday
        after — binned one pixel at a time. Borough outlines from the NYC Department of City
        Planning, reprojected to match. Data and engine:{' '}
        <a
          href="https://idl.uw.edu/mosaic/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-dotted underline-offset-2 hover:text-cyan-600 dark:hover:text-cyan-400"
        >
          Mosaic
        </a>{' '}
        and DuckDB-WASM.
      </figcaption>
    </figure>
  );
}
