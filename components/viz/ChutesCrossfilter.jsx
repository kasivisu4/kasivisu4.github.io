'use client';

// components/viz/ChutesCrossfilter.jsx
//
// A crossfilter over a year of LLM serving traffic -- 6.12 billion requests --
// built on Mosaic vgplot, in the same family as NycTaxiRides.jsx. Classic
// analytics layout:
//
//   ┌──────────────────────────────────────────────┐
//   │ sticky KPI strip (sparklines, vs prior N d)  │
//   ├──────────┬───────────────────────────────────┤
//   │ filters  │ group by · period · export        │
//   │ sidebar  │ timeline, stacked by the grouping │
//   │          │ anomalies · peak hours            │
//   │          │ breakdown table (sortable)        │
//   │          │ hour of day  │  day × hour        │
//   └──────────┴───────────────────────────────────┘
//
// Everything that narrows the data -- sidebar filters, table rows, the period
// tabs, clicks on an hour or a heatmap cell, brushes -- publishes into ONE
// crossfilter selection, each under its own stable source, so they compose and
// each can be cleared on its own.
//
// Where DuckDB lives: in the reader's browser (DuckDB-WASM). The charts read
// `chutes`, an hour x model x function rollup of the trace (1.34M rows, a 24 MB
// parquet served with the page, lossless for counts and sums). "View raw data"
// reads the original 91 GB object straight from its public S3 bucket.
//
// Coordinator isolation: vgplot's default coordinator is a module singleton the
// taxi figure configures with a WASM connector. createAPIContext gives this
// figure its own, so visiting both pages in one session breaks neither.
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from 'next-themes';

import Anomalies, { detectAnomalies } from './chutes/Anomalies';
import Breakdown from './chutes/Breakdown';
import FilterSidebar from './chutes/FilterSidebar';
import Info from './chutes/Info';
import KpiStrip from './chutes/KpiStrip';
import RawData from './chutes/RawData';
import { pickHour, rollupForHour, sampleInBrowser } from './chutes/sampler';
import UnderTheHood from './chutes/UnderTheHood';
import { dayExtent, describeClause, isDayOnly } from './chutes/clauses';
import { HELP } from './chutes/help';
import {
  downloadSvgAsPng,
  linkForView,
  loadSavedViews,
  storeSavedViews,
  viewFromLocation,
} from './chutes/exporters';
import {
  groupEntries,
  instrumentConnector,
  logEntries,
  logSnapshot,
  recentFrames,
  setActivity,
  subscribeLog,
} from './chutes/queryLog';
import {
  ANIM_SOURCE,
  BRUSH_STYLE,
  STATIC_BASE,
  TRACE_FACTS,
  B_H,
  B_H_COMPACT,
  B_MB,
  B_MT,
  FILTERS,
  FILTER_SOURCES,
  GAP,
  GROUPS,
  HEAT_ML,
  HOUR_W,
  INK,
  LOGICAL_W,
  MIN_PLOT_W,
  OTHER_BUCKETS,
  PERIODS,
  PLAY_STEP,
  PLAY_TICK_MS,
  PLAY_WINDOW,
  SOURCES,
  STAGE_TEXT,
  TABLE,
  TL_H,
  TL_H_COMPACT,
  TL_MB,
  TL_ML,
  TL_MR,
  TL_MT,
  TRACE_DAYS,
  WIDE_MEDIA,
  colorsFor,
  compact,
  formatDate,
  formatDateLong,
  formatDateShort,
  formatDay,
  formatHod,
  labelFor,
  monthLabel,
  monthTicks,
  pct,
  weekRules,
} from './chutes/constants';

// --- one-time loads, shared across mounts ---------------------------------

// One engine per page; see prepareEngine.
let enginePromise = null;

/**
 * Only the newest query's result may reach a client.
 *
 * Mosaic's updateClient hands every result to the client as it arrives, and
 * results do not arrive in order: a cached answer comes back at once while an
 * earlier query is still on the wire. During Play that meant Pause or Stop
 * drew the right view for a moment, then an in-flight frame landed on top of
 * it -- the figure looked like it had ignored the click. Stamp each request
 * per client and drop any result that is no longer the latest.
 */
/**
 * Mosaic cancels a queued query by rejecting it with the string 'Cleared' (a
 * rebuild) or 'Canceled' (superseded). That is bookkeeping, not a failure --
 * the figure rebuilds once on load when the plots first measure their width.
 */
const isCancellation = (reason) => reason === 'Cleared' || reason === 'Canceled';

function guardStaleResults(coordinator, core) {
  coordinator.updateClient = function updateClient(client, query, priority = core.Priority.Normal) {
    const seq = (client.__seq = (client.__seq ?? 0) + 1);
    client.queryPending();
    return (client._pending = this.query(query, { priority })
      .then(
        (data) => {
          if (client.__seq === seq) client.queryResult(data).update();
        },
        (err) => {
          const e = new core.QueryError(err, query);
          if (!isCancellation(err)) console.error('[chutes] query failed', e);
          if (client.__seq === seq) client.queryError(e);
          return e; // the pre-aggregation path retries on a QueryError
        },
      )
      .catch((err) => console.error('[chutes]', err)));
  };
}

const DATA_CACHE = 'chutes-data-v1';

/**
 * The crossfilter table's bytes, preferring the browser's Cache Storage: the
 * first visit downloads the 24 MB file and keeps it, later visits read it
 * back without touching the network. Same approach as the taxi figure.
 */
async function fetchStatic(name, onStage) {
  const url = `${STATIC_BASE}/${name}`;
  const get = async () => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    return res;
  };
  if (typeof caches === 'undefined') {
    onStage?.('download');
    return { bytes: new Uint8Array(await (await get()).arrayBuffer()), via: 'network' };
  }
  try {
    const cache = await caches.open(DATA_CACHE);
    let res = await cache.match(url);
    const via = res ? 'cache' : 'network';
    onStage?.(res ? 'cached' : 'download');
    if (!res) {
      res = await get();
      await cache.put(url, res.clone());
    }
    return { bytes: new Uint8Array(await res.arrayBuffer()), via };
  } catch (err) {
    console.warn('[chutes] cache unavailable, downloading', err);
    onStage?.('download');
    return { bytes: new Uint8Array(await (await get()).arrayBuffer()), via: 'network' };
  }
}

/**
 * DuckDB-WASM in this tab. The crossfilter table comes from a static parquet;
 * raw rows for "View raw data" come from the public S3 object on demand (see
 * chutes/sampler.js). No backend, and no copy of the 91 GB file anywhere but
 * its original bucket.
 */
async function connectWasm(vgModule, onStage) {
  onStage('wasm');
  const { createChutesDuckDB } = await import('./chutes/duckdb');
  const raw = vgModule.wasmConnector({ duckdb: await createChutesDuckDB() });
  const connector = instrumentConnector(raw);
  const setup = async (coordinator) => {
    const db = await raw.getDuckDB();
    const [table, ids] = await Promise.all([
      fetchStatic('chutes.parquet', onStage),
      fetchStatic('model_ids.parquet'),
    ]);
    // Measured before registering: the buffer is transferred to the worker.
    const bytes = table.bytes.byteLength;
    await db.registerFileBuffer('chutes.parquet', table.bytes);
    await db.registerFileBuffer('model_ids.parquet', ids.bytes);
    onStage('load');
    setActivity('load');
    // DOUBLE measures and hour (Mosaic bins numerics), and `day` rebuilt from
    // its parts -- the file keeps two small integers instead of a fractional double.
    await coordinator.exec(`
      CREATE TABLE IF NOT EXISTS ${TABLE} AS
      SELECT dnum::DOUBLE + hod::DOUBLE / 24 AS day, dnum::INTEGER AS dnum, hod::DOUBLE AS hod,
             model, category, func, streaming,
             reqs::DOUBLE AS reqs, sum_it::DOUBLE AS sum_it, n_it::DOUBLE AS n_it,
             sum_ot::DOUBLE AS sum_ot, n_ot::DOUBLE AS n_ot,
             sum_ttft::DOUBLE AS sum_ttft, n_ttft::DOUBLE AS n_ttft,
             family, mtype, g_model, g_func, g_family
      FROM read_parquet('chutes.parquet')
    `);
    await coordinator.exec("CREATE TABLE IF NOT EXISTS model_ids AS SELECT * FROM read_parquet('model_ids.parquet')");
    return { via: table.via, bytes };
  };
  return { connector, meta: null, setup };
}

/**
 * Loads Mosaic and builds this figure's own coordinator on DuckDB-WASM.
 * Resolves with the option lists every filter shows.
 */
function prepareEngine(onStage) {
  enginePromise ??= (async () => {
    const started = performance.now();
    onStage('engine');
    const [vgModule, core] = await Promise.all([
      import('@uwdata/vgplot'),
      import('@uwdata/mosaic-core'),
    ]);
    const { connector, setup } = await connectWasm(vgModule, onStage);
    const coordinator = new vgModule.Coordinator(connector);
    guardStaleResults(coordinator, core);
    const vg = vgModule.createAPIContext({ coordinator });
    const loaded = await setup(coordinator);

    // Every dimension's full option list, ordered by all-year volume. Counts
    // change with the selection; this order and membership do not, so options
    // never reshuffle or vanish while you are choosing.
    setActivity('setup');
    const dims = [...new Set([...FILTERS.map((f) => f.dim), ...GROUPS.map((g) => g.col)])];
    const lists = await Promise.all(
      dims.map((d) =>
        coordinator.query(`SELECT "${d}" AS key, sum(reqs) AS total FROM ${TABLE} GROUP BY 1`),
      ),
    );
    const options = {};
    dims.forEach((d, i) => {
      options[d] = lists[i]
        .toArray()
        .map((r) => ({ key: r.key, total: Number(r.total) }))
        .sort((a, b) => OTHER_BUCKETS.has(a.key) - OTHER_BUCKETS.has(b.key) || b.total - a.total);
    });
    const requests = options.category.reduce((a, o) => a + o.total, 0);
    const meta = { trace: TRACE_FACTS, rollup: { rows: 1_337_094 } };
    const boot = { ms: performance.now() - started, via: loaded.via, bytes: loaded.bytes };

    return { vg, core, meta, options, requests, boot };
  })();

  enginePromise.catch(() => {
    enginePromise = null; // a failed attempt must not poison later retries
  });
  return enginePromise;
}

// --- Mosaic clients ---------------------------------------------------------
//
// MosaicClient comes from mosaic-core, not the API context: createAPIContext
// spreads vgplot's api.js, and the base class is only re-exported from
// vgplot's package index.

const MEASURES = (vg) => ({
  reqs: vg.sum('reqs'),
  it: vg.sum('sum_it'),
  nit: vg.sum('n_it'),
  ot: vg.sum('sum_ot'),
  nout: vg.sum('n_ot'),
  ttft: vg.sum('sum_ttft'),
  nttft: vg.sum('n_ttft'),
});

/**
 * Averages divide by the measured count, never by all requests: tokens are
 * missing on 7.5% of the trace and TTFT on every non-streaming call.
 */
function measured(row) {
  const reqs = Number(row.reqs);
  const nit = Number(row.nit);
  const nout = Number(row.nout);
  const nttft = Number(row.nttft);
  return {
    reqs,
    tokens: Number(row.it) + Number(row.ot),
    avgIn: nit ? Number(row.it) / nit : null,
    avgOut: nout ? Number(row.ot) / nout : null,
    tokenCov: reqs ? nit / reqs : null,
    ttft: nttft ? Number(row.ttft) / nttft : null,
    ttftCov: reqs ? nttft / reqs : null,
  };
}

/**
 * Generic filtered client: `select` + optional `groupby`, rows to `onData`.
 * `where`, when given, replaces the crossfilter's predicate with the client's
 * own choice of clauses.
 */
function makeClient(core, vg, filter, { select, groupby, onData, where: ownWhere }) {
  return new (class extends core.MosaicClient {
    constructor() {
      super(filter);
    }

    // A client that picks its own clauses must not be pre-aggregated: the cube
    // would re-apply the very clause it chose to leave out.
    get filterStable() {
      return !ownWhere;
    }

    query(where = []) {
      const q = vg.Query.from(TABLE).select(select);
      return (groupby ? q.groupby(...groupby) : q).where(ownWhere ? ownWhere() : where);
    }

    queryResult(data) {
      onData(data.toArray());
      return this;
    }
  })();
}

// --- small pieces -----------------------------------------------------------

function PanelLabel({ children, help }) {
  return (
    <span
      className="pointer-events-none absolute right-3 top-1 z-10 rounded-md border border-black/10 bg-white/70 px-2 py-0.5
        text-[10px] font-bold uppercase tracking-widest text-slate-600 backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-300"
    >
      {children}
      {help && (
        <span className="pointer-events-auto ml-1.5 inline-flex align-middle normal-case tracking-normal">
          <Info label="About this chart">{help}</Info>
        </span>
      )}
    </span>
  );
}

/** A plot block drawn at `width`, scaled down only below MIN_PLOT_W. */
function Scaled({ scale, width, height, outerRef, children, ...rest }) {
  return (
    <div ref={outerRef} className="w-full">
      <div
        style={{
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          marginBottom: (scale - 1) * height,
        }}
        {...rest}
      >
        {children}
      </div>
    </div>
  );
}

function Chip({ label, value, onClear }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1 text-[11px] text-slate-700 dark:text-slate-200">
      <span className="font-semibold uppercase tracking-wider text-cyan-700 dark:text-cyan-300">{label}</span>
      {value}
      {onClear && (
        <button type="button" onClick={onClear} title="Clear" className="ml-0.5 text-slate-500 hover:text-rose-500">
          ×
        </button>
      )}
    </span>
  );
}

// Interval filters are BETWEEN, inclusive at both ends. `hod` holds whole
// hours and `day` moves in 1/24 steps, so an upper bound of h+1 or d+1 would
// also catch the next hour or the next day's first hour. Stop half a step
// short instead.
const hourRange = (h) => [h, h + 0.5];
const dayRange = (a, b) => [a, b - 0.5 / 24];

const EMPTY_SELECTION = Object.fromEntries(FILTERS.map((f) => [f.dim, []]));

// --- figure ----------------------------------------------------------------

export default function ChutesCrossfilter() {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === 'dark';


  const timelineRef = useRef(null);
  const hoursRef = useRef(null);
  const heatRef = useRef(null);
  const wrapperRef = useRef(null);
  const vgRef = useRef(null);
  const coreRef = useRef(null);
  const filterRef = useRef(null);
  const countClientsRef = useRef({});
  const selectedRef = useRef(EMPTY_SELECTION);
  const clicksRef = useRef({ hour: null, cell: null });
  const timerRef = useRef(null);
  const playTRef = useRef(0);
  const playSpanRef = useRef(null);
  const stopRef = useRef(null);
  const timelineMarksRef = useRef(null);
  const loadRef = useRef(null);
  const buildIdRef = useRef(0);
  const downRef = useRef(null);

  const [status, setStatus] = useState('idle'); // idle | loading | ready | offline | error
  const [stage, setStage] = useState('connect');
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);
  const [total, setTotal] = useState(null);
  const [options, setOptions] = useState({});
  const [counts, setCounts] = useState({});
  const [selected, setSelected] = useState(selectedRef.current);
  const [groupId, setGroupId] = useState('category');
  const [periodId, setPeriodId] = useState('all');
  const [customRange, setCustomRange] = useState(null);
  const [hourClick, setHourClick] = useState(clicksRef.current.hour);
  const [cellClick, setCellClick] = useState(clicksRef.current.cell);
  const [groupKeys, setGroupKeys] = useState([]);
  const [rows, setRows] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [daily, setDaily] = useState([]);
  const [dayGroup, setDayGroup] = useState(new Map());
  const [hourly, setHourly] = useState([]);
  const [brushes, setBrushes] = useState([]);
  // Days the current clauses allow; the KPI trend compares within and before it.
  const [dayWin, setDayWin] = useState(null);
  // Measured main-column width. `plotW` follows it once a resize settles,
  // because every change of plot width is a rebuild.
  const [avail, setAvail] = useState(LOGICAL_W);
  const [plotW, setPlotW] = useState(LOGICAL_W);
  // True once plotW reflects a real measurement; the first build waits for it.
  const [widthReady, setWidthReady] = useState(false);
  // stopped | playing | paused. Paused keeps the window applied, so the view
  // freezes on the frame you paused on; Stop clears it.
  const [playState, setPlayState] = useState('stopped');
  const [playT, setPlayT] = useState(0);
  const playing = playState === 'playing';
  const [compareN, setCompareN] = useState(30);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [isWide, setIsWide] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [saved, setSaved] = useState([]);
  const [copied, setCopied] = useState(false);
  const [hover, setHover] = useState(null);
  const [rebuildKey, setRebuildKey] = useState(0);
  const [rawOpen, setRawOpen] = useState(false);
  // Which engine answered, and what its start cost -- shown in the header.
  const [boot, setBoot] = useState(null);

  const group = GROUPS.find((g) => g.id === groupId) ?? GROUPS[0];
  const period = PERIODS.find((p) => p.id === periodId);
  const range = periodId === 'custom' ? customRange : period?.range ?? null;
  const domain = range ?? [0, TRACE_DAYS];
  const periodLabel =
    periodId === 'custom' && customRange
      ? `${formatDateShort(customRange[0])} – ${formatDate(customRange[1])}`
      : period?.label;
  const scale = Math.min(1, avail / plotW);
  const heatW = plotW - HOUR_W - GAP;
  const tlH = compactMode ? TL_H_COMPACT : TL_H;
  const bH = compactMode ? B_H_COMPACT : B_H;

  useSyncExternalStore(subscribeLog, logSnapshot, () => 0);
  const frames = recentFrames(groupEntries(logEntries()), 20);
  const lastFrame = frames[0] ?? null;
  const frameHistory = frames.map((f) => f.ms).reverse();

  // Cancelled queries surface as unhandled rejections from inside Mosaic; they
  // are expected (see isCancellation), so keep them out of the console.
  useEffect(() => {
    const onRejection = (e) => {
      if (isCancellation(e.reason)) e.preventDefault();
    };
    window.addEventListener('unhandledrejection', onRejection);
    return () => window.removeEventListener('unhandledrejection', onRejection);
  }, []);

  // Browser-only state, read after mount: the server renders the default view,
  // and reading the #view= link during render made the first client render
  // disagree with it -- a hydration error that threw away the server HTML.
  useEffect(() => {
    setSaved(loadSavedViews());
    const linked = viewFromLocation();
    if (linked) applyView(linked);
    // Runs once on mount; applyView only sets refs and state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start as the figure comes into view, like the taxi figure.
  useEffect(() => {
    if (status !== 'idle') return undefined;
    const node = wrapperRef.current;
    if (!node) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      loadRef.current?.();
      return undefined;
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

  // Draw the plots at the main column's width, which also changes when the
  // sidebar opens or closes. `avail` updates at once so the old plots scale
  // smoothly; `plotW` -- and with it a rebuild -- waits for the resize to
  // settle and moves in 20 px steps.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return undefined;
    let timer = null;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      if (width <= 0) return;
      setAvail(width);
      clearTimeout(timer);
      timer = setTimeout(() => {
        setPlotW(Math.max(MIN_PLOT_W, Math.floor(width / 20) * 20));
        setWidthReady(true);
      }, 250);
    });
    observer.observe(wrapper);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  // Sidebar inline and open on wide screens, a closed drawer on narrower ones;
  // compact mode is a per-browser preference. Both are read after mount so the
  // server's HTML and the first client render agree.
  useEffect(() => {
    let compactPref = false;
    try {
      compactPref = window.localStorage.getItem('chutes.compact') === '1';
    } catch {
      // storage blocked (private mode): default layout
    }
    setCompactMode(compactPref);
    const mq = window.matchMedia(WIDE_MEDIA);
    setIsWide(mq.matches);
    setFiltersOpen(mq.matches && !compactPref);
    const onChange = () => {
      setIsWide(mq.matches);
      setFiltersOpen(mq.matches);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const toggleCompact = (on) => {
    setCompactMode(on);
    setInsightsOpen(false);
    setFiltersOpen(!on && isWide);
    try {
      window.localStorage.setItem('chutes.compact', on ? '1' : '0');
    } catch {
      // not persisted in private mode; the toggle still works for this visit
    }
  };

  const refreshBrushes = useCallback(() => {
    const filter = filterRef.current;
    if (!filter) return;
    try {
      setBrushes((filter.clauses ?? []).map(describeClause).filter(Boolean));
      setDayWin(dayExtent(filter.clauses));
    } catch (err) {
      console.error('[chutes] could not describe filters', err);
      setBrushes([]);
      setDayWin(null);
    }
  }, []);

  // --- publishing into the crossfilter --------------------------------------

  /**
   * One sidebar dimension. The clause names that dimension's count client as
   * its own, so the crossfilter leaves it out of that client's predicate: the
   * list you are choosing from keeps every option; everything else narrows.
   */
  const publishFilter = useCallback((dim, values) => {
    const filter = filterRef.current;
    const core = coreRef.current;
    if (!filter || !core) return;
    setActivity('filter');
    filter.update(
      core.clausePoints([dim], values.length ? values.map((v) => [v]) : null, {
        source: FILTER_SOURCES[dim],
        clients: new Set([countClientsRef.current[dim]]),
      }),
    );
  }, []);

  /**
   * Interval clauses for the period and the clicks. No `scale` option, for the
   * reason in NycTaxiRides.jsx: a synthetic clause with scale metadata goes
   * down the pre-aggregation path and comes back unfiltered. These are honest
   * filtered queries against the rollup instead.
   */
  const publishInterval = useCallback((source, field, extent) => {
    const filter = filterRef.current;
    const core = coreRef.current;
    if (!filter || !core) return;
    setActivity('filter');
    filter.update(core.clauseInterval(field, extent, { source }));
  }, []);

  const publishClicks = useCallback(() => {
    const { hour, cell } = clicksRef.current;
    publishInterval(SOURCES.hour, 'hod', hour == null ? null : hourRange(hour));
    publishInterval(SOURCES.cellDay, 'day', cell ? dayRange(cell.d, cell.d + 1) : null);
    publishInterval(SOURCES.cellHour, 'hod', cell ? hourRange(cell.h) : null);
  }, [publishInterval]);

  const changeFilter = useCallback(
    (dim, values) => {
      selectedRef.current = { ...selectedRef.current, [dim]: values };
      setSelected(selectedRef.current);
      publishFilter(dim, values);
    },
    [publishFilter],
  );

  const setClicks = useCallback(
    (next) => {
      clicksRef.current = { ...clicksRef.current, ...next };
      setHourClick(clicksRef.current.hour);
      setCellClick(clicksRef.current.cell);
      publishClicks();
    },
    [publishClicks],
  );

  const clearAll = useCallback(() => {
    for (const f of FILTERS) if (selectedRef.current[f.dim]?.length) publishFilter(f.dim, []);
    selectedRef.current = EMPTY_SELECTION;
    setSelected(EMPTY_SELECTION);
    setClicks({ hour: null, cell: null });
    setCustomRange(null);
    setPeriodId('all');
    stopRef.current?.();
  }, [publishFilter, setClicks]);

  // Keyboard: "/" jumps to the Function search, Esc clears every filter (or,
  // with the filter drawer open, closes it first). Neither fires while typing.
  useEffect(() => {
    const typing = (el) =>
      el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || typing(document.activeElement)) return;
      if (e.key === '/') {
        e.preventDefault();
        setFiltersOpen(true);
        // the sidebar may still be mounting; focus once it has rendered
        setTimeout(() => document.querySelector('[data-filter-search="func"]')?.focus(), 60);
      } else if (e.key === 'Escape') {
        if (rawOpen) setRawOpen(false);
        else if (!isWide && filtersOpen) setFiltersOpen(false);
        else clearAll();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clearAll, isWide, filtersOpen, rawOpen]);

  // --- play-through ---------------------------------------------------------

  const publishWindow = useCallback((extent) => {
    const core = coreRef.current;
    const filter = filterRef.current;
    if (!core || !filter) return;
    setActivity(extent ? `play ${formatDay(extent[0])}` : 'play stop');
    // Half a step short at the top, like every other day interval: a plain
    // [t, t + 14] would also take the first hour of day t + 14.
    // `clients`: the timeline is where the window is drawn, so -- like a brush
    // on it -- the window filters every other chart but not the timeline,
    // which keeps showing the whole year under the sweep.
    filter.update(
      core.clauseInterval('day', extent ? dayRange(extent[0], extent[1]) : null, {
        source: ANIM_SOURCE,
        ...(timelineMarksRef.current ? { clients: timelineMarksRef.current } : {}),
      }),
    );
  }, []);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  /** Freeze on the current window; Resume continues from it. */
  const pausePlaying = useCallback(() => {
    clearTimer();
    setPlayState('paused');
  }, []);

  /** Stop and clear the window. `clearClause` false when the selection is being rebuilt anyway. */
  const stopPlaying = useCallback(
    (clearClause = true) => {
      clearTimer();
      setPlayState('stopped');
      playSpanRef.current = null;
      if (clearClause) publishWindow(null);
    },
    [publishWindow],
  );
  stopRef.current = stopPlaying;

  /**
   * Where Play sweeps: the period, narrowed to any day brush or clicked day.
   * Sweeping the whole period across a brush would spend most frames on days
   * the brush already excludes -- empty charts, and panels that jump in height.
   */
  const playRange = () => {
    const within = dayExtent(filterRef.current?.clauses, ANIM_SOURCE);
    const a = Math.max(domain[0], Math.floor(within?.[0] ?? -Infinity));
    const b = Math.min(domain[1], Math.ceil(within?.[1] ?? Infinity));
    // Too narrow to sweep a window across: play the period instead.
    return b - a >= PLAY_WINDOW + PLAY_STEP ? [a, b] : domain;
  };

  /** Play from the start, or -- after a pause -- resume where it stopped. */
  const startPlaying = useCallback(() => {
    if (timerRef.current) return;
    const resuming = playState === 'paused' && playSpanRef.current;
    const [a, b] = resuming ? playSpanRef.current : playRange();
    playSpanRef.current = [a, b];
    let t = resuming ? playTRef.current : a;
    const show = () => {
      playTRef.current = t;
      setPlayT(t);
      publishWindow([t, t + PLAY_WINDOW]);
    };
    setPlayState('playing');
    show();
    timerRef.current = setInterval(() => {
      t += PLAY_STEP;
      if (t > b - PLAY_WINDOW) t = a;
      show();
    }, PLAY_TICK_MS);
    // playRange reads refs and `domain`, which derives from the period state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain, playState, publishWindow]);

  useEffect(() => () => stopPlaying(false), [stopPlaying]);

  // --- build ----------------------------------------------------------------

  const build = useCallback(() => {
    const vg = vgRef.current;
    const core = coreRef.current;
    const keysAll = options[group.col];
    if (!vg || !core || !keysAll) return;
    const buildId = ++buildIdRef.current;
    const live = (fn) => (value) => {
      if (buildIdRef.current === buildId) fn(value);
    };

    stopPlaying(false);
    const coordinator = vg.coordinator();
    coordinator.clear({ clients: true, cache: false });
    for (const ref of [timelineRef, hoursRef, heatRef]) ref.current?.replaceChildren();

    const filter = vg.Selection.crossfilter();
    filterRef.current = filter;
    // Hovering a plot makes Mosaic prepare cubes before anything is clicked.
    // Label that separately so it is never billed to the last interaction.
    filter.addEventListener('activate', () => setActivity('prepare'));
    filter.addEventListener('value', () => {
      const id = String(filter.active?.source?.id ?? '');
      const ours = filter.active?.source === ANIM_SOURCE || id.startsWith('filter-') || id === 'period' || id.startsWith('click-');
      if (!ours) setActivity('brush');
      refreshBrushes();
    });

    // Colors follow all-year volume, so a group keeps its color across
    // filters and periods, and the stack order matches the table.
    const keys = keysAll.map((o) => o.key);
    const colors = colorsFor(keys);
    setGroupKeys(keys.map((k, i) => [k, colors[i]]));

    const style = { background: 'transparent', color: dark ? '#94a3b8' : '#475569', fontSize: '11px' };
    const from = () => vg.from(TABLE, { filterBy: filter });
    const color = [vg.colorDomain(keys), vg.colorRange(colors)];
    const span = domain[1] - domain[0];
    // Month-of-trace ticks for long windows; days once zoomed in.
    const xTicks =
      span > 120
        ? [vg.xTicks(monthTicks(domain)), vg.xTickFormat(monthLabel)]
        : [vg.xTicks(weekRules(domain)), vg.xTickFormat((d) => formatDateShort(d))];

    // Filter counts: one client per sidebar dimension.
    const countClients = {};
    for (const f of FILTERS) {
      const client = makeClient(core, vg, filter, {
        select: { key: f.dim, reqs: vg.sum('reqs') },
        groupby: [f.dim],
        onData: live((rs) =>
          setCounts((prev) => ({ ...prev, [f.dim]: new Map(rs.map((r) => [r.key, Number(r.reqs)])) })),
        ),
      });
      countClients[f.dim] = client;
      coordinator.connect(client);
    }
    countClientsRef.current = countClients;

    coordinator.connect(
      makeClient(core, vg, filter, {
        select: { key: group.col, ...MEASURES(vg) },
        groupby: [group.col],
        onData: live((rs) => setRows(rs.map((r) => ({ key: r.key, ...measured(r) })))),
      }),
    );
    coordinator.connect(
      makeClient(core, vg, filter, {
        select: MEASURES(vg),
        onData: live((rs) => rs[0] && setKpis(measured(rs[0]))),
      }),
    );
    coordinator.connect(
      makeClient(core, vg, filter, {
        select: { d: 'dnum', ...MEASURES(vg) },
        groupby: ['dnum'],
        // The KPI trend compares the selected days with the days just before
        // them, so this series must reach outside the selection: every clause
        // applies except those on `day` alone (period, Play, timeline brush,
        // clicked day). The strip cuts its windows from `dayWin` instead.
        where: () =>
          (filter.clauses ?? [])
            .filter((c) => !isDayOnly(c))
            .map((c) => c.predicate)
            .filter(Boolean),
        onData: live((rs) =>
          setDaily(
            rs
              .map((r) => ({
                d: Number(r.d),
                reqs: Number(r.reqs),
                it: Number(r.it),
                nit: Number(r.nit),
                ot: Number(r.ot),
                nout: Number(r.nout),
                ttft: Number(r.ttft),
                nttft: Number(r.nttft),
              }))
              .sort((a, b) => a.d - b.d),
          ),
        ),
      }),
    );
    coordinator.connect(
      makeClient(core, vg, filter, {
        select: { d: 'dnum', key: group.col, reqs: vg.sum('reqs') },
        groupby: ['dnum', group.col],
        onData: live((rs) => {
          const byDay = new Map();
          for (const r of rs) {
            const d = Number(r.d);
            const day = byDay.get(d) ?? { total: 0, parts: new Map() };
            day.total += Number(r.reqs);
            day.parts.set(r.key, Number(r.reqs));
            byDay.set(d, day);
          }
          setDayGroup(byDay);
        }),
      }),
    );
    coordinator.connect(
      makeClient(core, vg, filter, {
        select: { h: 'hod', reqs: vg.sum('reqs') },
        groupby: ['hod'],
        onData: live((rs) => {
          const v = new Array(24).fill(0);
          for (const r of rs) v[Number(r.h)] = Number(r.reqs);
          setHourly(v);
        }),
      }),
    );

    // Timeline: stacked by the grouping, with the total as a line on top.
    const timelinePlot = vg.plot(
        vg.ruleX(weekRules(domain), { stroke: dark ? '#334155' : '#e2e8f0', strokeWidth: 1 }),
        vg.rectY(from(), {
          x: vg.bin('day', { step: 1 }),
          y: vg.sum('reqs'),
          fill: group.col,
          // An explicit series channel. Mosaic hands `fill` to Plot as
          // { value, scale: 'color' } (a workaround for a Plot color bug), and
          // Plot does not derive its stacking series from that form -- so with
          // no z, `order` had nothing to order and each day stacked in SQL
          // row order, flipping colors day to day.
          z: group.col,
          // Largest series at the bottom, on every day.
          order: 'sum',
          reverse: true,
          inset: 0,
        }),
        vg.lineY(from(), {
          x: vg.bin('day', { step: 1 }),
          y: vg.sum('reqs'),
          stroke: dark ? '#e2e8f0' : '#0f172a',
          strokeWidth: 1.1,
          curve: 'step-after',
        }),
        vg.intervalX({ as: filter, brush: BRUSH_STYLE }),
        vg.width(plotW),
        vg.height(tlH),
        vg.marginLeft(TL_ML),
        vg.marginRight(TL_MR),
        vg.marginTop(TL_MT),
        vg.marginBottom(TL_MB),
        vg.xDomain(domain),
        ...xTicks,
        vg.xLabel(null),
        vg.yLabel('↑ Requests / day'),
        vg.yTickFormat('s'),
        ...color,
        vg.style(style),
    );
    timelineMarksRef.current = timelinePlot.value?.markSet ?? null;
    timelineRef.current?.append(timelinePlot);

    // Hour of day, stacked the same way. Drag to brush, click to pick an hour.
    hoursRef.current?.append(
      vg.plot(
        vg.rectY(from(), {
          x: vg.bin('hod', { step: 1 }),
          y: vg.sum('reqs'),
          fill: group.col,
          // An explicit series channel. Mosaic hands `fill` to Plot as
          // { value, scale: 'color' } (a workaround for a Plot color bug), and
          // Plot does not derive its stacking series from that form -- so with
          // no z, `order` had nothing to order and each day stacked in SQL
          // row order, flipping colors day to day.
          z: group.col,
          // Largest series at the bottom, on every day.
          order: 'sum',
          reverse: true,
          inset: 0.5,
        }),
        vg.intervalX({ as: filter, brush: BRUSH_STYLE }),
        vg.width(HOUR_W),
        vg.height(bH),
        vg.marginLeft(TL_ML),
        vg.marginRight(TL_MR),
        vg.marginTop(B_MT),
        vg.marginBottom(B_MB),
        vg.xDomain([0, 24]),
        vg.xTicks([0, 6, 12, 18, 24]),
        vg.xLabel('Hour, trace clock →'),
        vg.yLabel('↑ Requests'),
        vg.yTickFormat('s'),
        ...color,
        vg.style(style),
      ),
    );

    // Day x hour: one ink, density as opacity, fixed opacity domain so a
    // filtered view genuinely looks quieter. Drag to brush, click a cell.
    heatRef.current?.append(
      vg.plot(
        vg.rect(from(), {
          x: vg.bin('day', { step: 1 }),
          y: vg.bin('hod', { step: 1 }),
          fill: INK.heat[dark ? 'dark' : 'light'],
          fillOpacity: vg.sum('reqs'),
          inset: 0,
        }),
        vg.intervalXY({ as: filter, brush: BRUSH_STYLE }),
        vg.width(heatW),
        vg.height(bH),
        vg.marginLeft(HEAT_ML),
        vg.marginRight(TL_MR),
        vg.marginTop(B_MT),
        vg.marginBottom(B_MB),
        vg.xDomain(domain),
        ...xTicks,
        vg.yDomain([0, 24]),
        vg.yTicks([0, 6, 12, 18, 24]),
        vg.xLabel(null),
        vg.yLabel('↑ Hour'),
        vg.opacityScale('sqrt'),
        vg.opacityDomain(vg.Fixed),
        vg.opacityClamp(true),
        vg.style(style),
      ),
    );

    // A rebuild starts a fresh selection. Carry over everything that is not a
    // brush -- filters, period, clicks -- so regrouping or zooming never
    // silently drops what you had narrowed to.
    for (const f of FILTERS) {
      const values = selectedRef.current[f.dim];
      if (values?.length) publishFilter(f.dim, values);
    }
    publishInterval(SOURCES.period, 'day', range ? dayRange(range[0], range[1]) : null);
    publishClicks();

    setActivity('render');
    refreshBrushes();
    // `domain` and `range` are derived from periodId/customRange, listed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dark, group.col, options, periodId, customRange, rebuildKey, plotW, tlH, bH, stopPlaying, refreshBrushes, publishFilter, publishInterval, publishClicks]);

  const reset = useCallback(async () => {
    const coordinator = vgRef.current?.coordinator();
    selectedRef.current = EMPTY_SELECTION;
    setSelected(EMPTY_SELECTION);
    clicksRef.current = { hour: null, cell: null };
    setHourClick(null);
    setCellClick(null);
    try {
      coordinator?.preaggregator?.clear?.();
      // Cubes live in DuckDB's `mosaic` schema; dropping them
      // is how to get back to a genuinely cold first brush.
      await coordinator?.exec('DROP SCHEMA IF EXISTS "mosaic" CASCADE');
    } catch (err) {
      console.warn('[chutes] could not drop cube schema', err);
    }
    setPeriodId('all');
    setCustomRange(null);
    // Drop a #view= link from the address bar too, or a reload would bring
    // back the view that was just cleared.
    if (window.location.hash.includes('view=')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    setRebuildKey((k) => k + 1);
  }, []);

  const load = useCallback(async () => {
    setStatus('loading');
    setStage('connect');
    setError(null);
    try {
      // Read here, not in render: load only ever runs in the browser.
      const engine = await prepareEngine(setStage);
      vgRef.current = engine.vg;
      coreRef.current = engine.core;
      setBoot(engine.boot);
      setMeta(engine.meta);
      setTotal(engine.requests);
      setOptions(engine.options);
      setStage('render');
      setStatus('ready');
    } catch (err) {
      console.error('[chutes] load failed', err);
      setError(err?.message ?? String(err));
      setStatus('error');
    }
  }, []);

  loadRef.current = load;

  useEffect(() => {
    // Build once the layout has settled: a build at a guessed width or before
    // the theme resolves is immediately rebuilt, and the rebuild cancels the
    // first build's queries mid-flight.
    if (status === 'ready' && widthReady && resolvedTheme) build();
  }, [status, build]);

  /**
   * Every active clause -- sidebar, period, clicks, brushes, play -- as one
   * SQL predicate over `chutes`, for the raw-data sampler. `noSkip` so no
   * clause is dropped for being the active one.
   */
  const currentWhere = useCallback(() => {
    const preds = filterRef.current?.predicate(null, true) ?? [];
    return (Array.isArray(preds) ? preds : [preds])
      .filter(Boolean)
      .map(String)
      .filter((sql) => sql && sql !== 'null')
      .map((sql) => `(${sql})`)
      .join(' AND ');
  }, []);

  // The data viewer's three reads: pick an hour, its rollup rows, its raw rows from S3.
  const dataApi = useMemo(
    () => ({
      pick: (where) => pickHour(vgRef.current, where),
      rollup: (req) => rollupForHour(vgRef.current, req),
      raw: (req) => sampleInBrowser(vgRef.current, req),
    }),
    [],
  );

  // --- views ----------------------------------------------------------------

  const currentView = () => ({
    f: selectedRef.current,
    g: groupId,
    p: periodId,
    r: customRange,
    hc: clicksRef.current.hour,
    cc: clicksRef.current.cell,
  });

  const applyView = (v) => {
    selectedRef.current = { ...EMPTY_SELECTION, ...(v.f ?? {}) };
    setSelected(selectedRef.current);
    clicksRef.current = { hour: v.hc ?? null, cell: v.cc ?? null };
    setHourClick(clicksRef.current.hour);
    setCellClick(clicksRef.current.cell);
    setGroupId(v.g ?? 'category');
    setPeriodId(v.p ?? 'all');
    setCustomRange(v.r ?? null);
    setRebuildKey((k) => k + 1); // one rebuild re-publishes all of the above
  };

  const saveView = (name) => {
    const next = [...saved.filter((s) => s.name !== name), { name, view: currentView() }];
    setSaved(next);
    storeSavedViews(next);
  };

  const deleteView = (name) => {
    const next = saved.filter((s) => s.name !== name);
    setSaved(next);
    storeSavedViews(next);
  };

  const copyLink = async () => {
    const link = linkForView(currentView());
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      window.location.hash = link.split('#')[1]; // at least put it in the address bar
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // --- exports --------------------------------------------------------------

  const exportPng = () =>
    downloadSvgAsPng(`chutes-timeline-by-${group.id}.png`, timelineRef.current?.querySelector('svg'), {
      background: dark ? '#020617' : '#ffffff',
      color: dark ? '#94a3b8' : '#475569',
    });

  // --- pointer handling for clicks on the hour chart and heatmap -------------

  /** Pointer position in the plot's own (unscaled) coordinates. */
  const local = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    return [(e.clientX - r.left) / scale, (e.clientY - r.top) / scale];
  };
  const onDown = (e) => {
    downRef.current = [e.clientX, e.clientY];
    setHover(null); // a press starts a brush or a click; the day tooltip would only get in the way
    if (playState !== 'stopped') stopPlaying();
  };
  // A click is a press that did not move: a drag is a brush and is Mosaic's.
  const isClick = (e) => {
    const d = downRef.current;
    return d && Math.hypot(e.clientX - d[0], e.clientY - d[1]) < 4;
  };

  const onHourClick = (e) => {
    if (!isClick(e)) return;
    const [x] = local(e);
    const inner = HOUR_W - TL_ML - TL_MR;
    if (x < TL_ML || x > TL_ML + inner) return;
    const h = Math.min(23, Math.floor(((x - TL_ML) / inner) * 24));
    setClicks({ hour: hourClick === h ? null : h });
  };

  const onHeatClick = (e) => {
    if (!isClick(e)) return;
    const [x, y] = local(e);
    const innerW = heatW - HEAT_ML - TL_MR;
    const innerH = bH - B_MT - B_MB;
    if (x < HEAT_ML || x > HEAT_ML + innerW || y < B_MT || y > B_MT + innerH) return;
    const d = Math.floor(domain[0] + ((x - HEAT_ML) / innerW) * (domain[1] - domain[0]));
    const h = Math.min(23, Math.floor((1 - (y - B_MT) / innerH) * 24));
    const same = cellClick && cellClick.d === d && cellClick.h === h;
    setClicks({ cell: same ? null : { d, h } });
  };

  const onTimelineMove = (e) => {
    // No tooltip while a button is held: mid-brush it reads like part of the result.
    if (e.buttons) {
      if (hover) setHover(null);
      return;
    }
    const [x] = local(e);
    const inner = plotW - TL_ML - TL_MR;
    if (x < TL_ML || x > TL_ML + inner) {
      setHover(null);
      return;
    }
    const d = Math.floor(domain[0] + ((x - TL_ML) / inner) * (domain[1] - domain[0]));
    setHover({ d, x });
  };

  // --- derived --------------------------------------------------------------

  const colorMap = useMemo(() => new Map(groupKeys), [groupKeys]);
  const anomalies = useMemo(
    () => detectAnomalies(dayGroup, groupKeys.map(([k]) => k)),
    [dayGroup, groupKeys],
  );
  const peak = useMemo(() => {
    const sum = hourly.reduce((a, b) => a + b, 0);
    if (!sum) return null;
    let best = 0;
    let low = 0;
    const two = (h) => hourly[h] + hourly[(h + 1) % 24];
    for (let h = 1; h < 24; h++) {
      if (two(h) > two(best)) best = h;
      if (two(h) < two(low)) low = h;
    }
    return { best, low, bestShare: two(best) / sum, lowShare: two(low) / sum };
  }, [hourly]);

  // Every active filter as a removable chip, for the pinned sidebar summary.
  const chips = [
    ...FILTERS.flatMap((f) =>
      (selected[f.dim] ?? []).map((v) => ({
        id: `${f.dim}:${v}`,
        label: f.label,
        value: labelFor(f.dim, v),
        onRemove: () => changeFilter(f.dim, (selectedRef.current[f.dim] ?? []).filter((k) => k !== v)),
      })),
    ),
    ...(hourClick != null
      ? [
          {
            id: 'hour',
            label: 'Hour',
            value: `${formatHod(hourClick)}–${formatHod(hourClick + 1)}`,
            onRemove: () => setClicks({ hour: null }),
          },
        ]
      : []),
    ...(cellClick
      ? [
          {
            id: 'cell',
            label: 'Cell',
            value: `${formatDateShort(cellClick.d)} · ${formatHod(cellClick.h)}`,
            onRemove: () => setClicks({ cell: null }),
          },
        ]
      : []),
    ...(periodId !== 'all'
      ? [
          {
            id: 'period',
            label: 'Period',
            value: periodLabel,
            onRemove: () => {
              setCustomRange(null);
              setPeriodId('all');
            },
          },
        ]
      : []),
  ];
  const activeCount = chips.length;
  const traceRows = meta?.trace?.rows ?? null;
  const tlInner = plotW - TL_ML - TL_MR;
  const span = domain[1] - domain[0];
  const sweepLeft = TL_ML + ((playT - domain[0]) / span) * tlInner;
  const sweepWidth = (PLAY_WINDOW / span) * tlInner;
  const hoverDay = hover ? dayGroup.get(hover.d) : null;
  const dayBrushed = brushes.some((b) => b.label === 'Days' || b.key === 'heat') || cellClick != null;
  const playTarget = dayBrushed ? 'the brush' : periodId === 'all' ? 'the year' : 'the period';

  const btn =
    'rounded-lg border border-black/10 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-cyan-500/50 dark:border-white/10 dark:text-slate-300';

  return (
    <figure className="chutes-viz not-prose my-8">
      <div className="rounded-2xl border border-black/5 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-slate-950/70 sm:p-5">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="font-display text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            When the year&rsquo;s LLM traffic arrived, and what it was
          </h3>
          <p className="flex flex-wrap items-center gap-x-2 text-sm tabular-nums text-slate-500 dark:text-slate-400">
            {total ? `${total.toLocaleString('en-US')} requests · ` : ''}367 days
            {boot && (
              <span
                className="rounded-full border border-black/10 px-2 py-0.5 text-[11px] dark:border-white/10"
                title="DuckDB-WASM runs in this tab on a 24 MB hourly table; raw rows are read from the public S3 bucket on demand."
              >
                DuckDB in your browser · ready in {(boot.ms / 1000).toFixed(1)} s{boot.via === 'cache' ? ' (cached)' : ''}
              </span>
            )}
          </p>
        </div>

        <KpiStrip
          kpis={kpis}
          daily={daily}
          dayWin={dayWin}
          total={total}
          lastFrame={lastFrame}
          frameHistory={frameHistory}
          compareN={compareN}
          onCompareN={setCompareN}
          activeCount={activeCount}
          compactMode={compactMode}
          onCompact={toggleCompact}
        />

        <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
          {/* ── sidebar: inline on wide screens, a slide-over drawer below ── */}
          {/* The slot is reserved while the engine loads, so the chart column
              already has its final width when the first build runs. */}
          {filtersOpen && isWide && (
            <aside className="sticky top-[12.5rem] max-h-[calc(100vh-13.5rem)] w-72 shrink-0 self-start overflow-y-auto rounded-xl">
              {status !== 'ready' ? (
                <div className="h-96 rounded-xl border border-black/5 bg-white/60 dark:border-white/10 dark:bg-slate-900/40" aria-hidden="true" />
              ) : (
              <FilterSidebar
                  filters={FILTERS}
                  options={options}
                  counts={counts}
                  selected={selected}
                  onChange={changeFilter}
                  chips={chips}
                  onClearAll={clearAll}
                  saved={saved}
                  onSaveView={saveView}
                  onLoadView={(s) => applyView(s.view)}
                  onDeleteView={deleteView}
                  onCopyLink={copyLink}
                  copied={copied}
                onClose={() => setFiltersOpen(false)}
                closeLabel="Collapse filters"
              />
              )}
            </aside>
          )}
          {/* Portalled to <body>: the page's <main> is `relative z-10`, a
              stacking context no descendant can escape, so an in-place drawer
              always rendered under the fixed navbar. */}
          {status === 'ready' && filtersOpen && !isWide && createPortal(
            <div className="fixed inset-0 z-[60] flex" role="dialog" aria-label="Filters">
              <button
                type="button"
                aria-label="Close filters"
                onClick={() => setFiltersOpen(false)}
                className="absolute inset-0 bg-slate-950/40"
              />
              <aside className="relative h-full w-80 max-w-[88vw] overflow-y-auto bg-slate-50 p-2 shadow-2xl dark:bg-slate-950">
                <FilterSidebar
                  filters={FILTERS}
                  options={options}
                  counts={counts}
                  selected={selected}
                  onChange={changeFilter}
                  chips={chips}
                  onClearAll={clearAll}
                  saved={saved}
                  onSaveView={saveView}
                  onLoadView={(s) => applyView(s.view)}
                  onDeleteView={deleteView}
                  onCopyLink={copyLink}
                  copied={copied}
                  onClose={() => setFiltersOpen(false)}
                  closeLabel="Close"
                />
              </aside>
            </div>,
            document.body,
          )}

          {/* ── main column ─────────────────────────────────────────────── */}
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-1 rounded-lg border border-black/5 bg-white/80 p-1 dark:border-white/10 dark:bg-slate-900/60">
              {!(filtersOpen && isWide) && (
                <button
                  type="button"
                  onClick={() => setFiltersOpen(true)}
                  disabled={status !== 'ready'}
                  title="Show filters ( / )"
                  className="rounded-md border border-black/10 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-cyan-500/50 dark:border-white/10 dark:text-slate-200"
                >
                  ☰ Filters
                  {activeCount > 0 && (
                    <span className="ml-1.5 rounded-full bg-cyan-600 px-1.5 text-[11px] text-white">{activeCount}</span>
                  )}
                </button>
              )}
              <span className="flex items-center gap-1.5 px-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Group by <Info label="About group by">{HELP.groupBy}</Info>
              </span>
              {GROUPS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGroupId(g.id)}
                  disabled={status !== 'ready'}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                    g.id === groupId
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-cyan-500/10 dark:text-slate-300'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>

            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Period <Info label="About the period">{HELP.period}</Info>
              </span>
              <div className="flex flex-wrap overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
                {PERIODS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setCustomRange(null);
                      setPeriodId(p.id);
                    }}
                    disabled={status !== 'ready'}
                    className={`px-2.5 py-1 text-xs ${
                      p.id === periodId
                        ? 'bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900'
                        : 'text-slate-600 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {/* Play lives up here, above everything that changes height as
                  it plays, so Pause never slides out from under the pointer. */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={playing ? pausePlaying : startPlaying}
                  disabled={status !== 'ready'}
                  title={
                    playing
                      ? 'Pause: freeze on this window'
                      : playState === 'paused'
                        ? 'Resume from this window'
                        : 'Sweep a 14-day window across the days in view'
                  }
                  className={`min-w-[8.5rem] rounded-lg border px-3 py-1 text-xs font-semibold tabular-nums ${
                    playing
                      ? 'border-amber-500/50 bg-amber-500/15 text-amber-800 dark:text-amber-200'
                      : 'border-cyan-500/40 bg-cyan-500/10 text-cyan-800 hover:bg-cyan-500/20 dark:text-cyan-200'
                  }`}
                >
                  {playing ? '⏸ Pause' : playState === 'paused' ? '▶ Resume' : `▶ Play ${playTarget}`}
                </button>
                {playState !== 'stopped' && (
                  <button
                    type="button"
                    onClick={() => stopPlaying()}
                    title="Stop and clear the window"
                    className={btn}
                  >
                    ■ Stop
                  </button>
                )}
                <button
                  type="button"
                  onClick={reset}
                  disabled={status !== 'ready'}
                  title="Clear every filter, click and brush, and drop every pre-aggregation cube"
                  className={btn}
                >
                  ↺ Reset
                </button>
              </div>
              <div className="ml-auto flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setRawOpen(true)}
                  disabled={status !== 'ready'}
                  className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1.5 text-xs font-semibold text-cyan-800 hover:bg-cyan-500/20 dark:text-cyan-200"
                >
                  ⊞ View raw & rollup data
                </button>
                <Info label="About raw data">{HELP.rawData}</Info>
                <span className="mx-1 h-4 w-px bg-black/10 dark:bg-white/10" aria-hidden="true" />
                <button type="button" className={btn} onClick={exportPng} disabled={status !== 'ready'}>
                  PNG · timeline
                </button>
                <Info label="About exports">{HELP.exports}</Info>
              </div>
            </div>

            <div className="mb-2 flex min-h-[1.75rem] flex-wrap items-center gap-1.5">
              {periodId === 'custom' && customRange && (
                <Chip
                  label="Zoom"
                  value={periodLabel}
                  onClear={() => {
                    setCustomRange(null);
                    setPeriodId('all');
                  }}
                />
              )}
              {hourClick != null && (
                <Chip
                  label="Hour"
                  value={`${formatHod(hourClick)}–${formatHod(hourClick + 1)}`}
                  onClear={() => setClicks({ hour: null })}
                />
              )}
              {cellClick && (
                <Chip
                  label="Cell"
                  value={`${formatDateShort(cellClick.d)} · ${formatHod(cellClick.h)}`}
                  onClear={() => setClicks({ cell: null })}
                />
              )}
              {brushes.map((b) => (
                <Chip key={b.key} label={b.label} value={b.value} />
              ))}
              {playState !== 'stopped' && (
                <Chip
                  label={playing ? 'Playing' : 'Paused'}
                  value={`${formatDateShort(playT)} – ${formatDateShort(playT + PLAY_WINDOW - 1)}`}
                  onClear={() => stopPlaying()}
                />
              )}
            </div>

            {/* ── timeline ──────────────────────────────────────────────── */}
            <Scaled scale={scale} width={plotW} height={tlH} outerRef={wrapperRef} onPointerDownCapture={onDown}>
              <div
                className="relative"
                style={{ height: tlH }}
                onMouseMove={onTimelineMove}
                onMouseLeave={() => setHover(null)}
              >
                <div ref={timelineRef} className="absolute inset-0" />
                <PanelLabel help={HELP.timeline}>
                  Requests per day · by {group.label.toLowerCase()} · {periodLabel}
                </PanelLabel>
                {playState !== 'stopped' && (
                  <div
                    className="pointer-events-none absolute rounded-sm border-x-2 border-cyan-400 bg-cyan-400/20"
                    style={{ left: sweepLeft, width: sweepWidth, top: TL_MT, bottom: TL_MB }}
                  />
                )}
                {hover && hoverDay && (
                  <div
                    className="pointer-events-none absolute z-20 w-60 rounded-lg border border-black/10 bg-white/95 p-2 text-[11px] shadow-lg dark:border-white/10 dark:bg-slate-900/95"
                    style={{
                      left: Math.min(hover.x + 12, plotW - 250),
                      top: TL_MT + 4,
                    }}
                  >
                    <div className="mb-1 flex justify-between font-semibold text-slate-800 dark:text-slate-100">
                      <span>{formatDateLong(hover.d)}</span>
                      <span className="tabular-nums">{hoverDay.total.toLocaleString('en-US')}</span>
                    </div>
                    {groupKeys
                      .filter(([k]) => hoverDay.parts.get(k))
                      .map(([k, c]) => {
                        const v = hoverDay.parts.get(k);
                        return (
                          <div key={k} className="flex items-center gap-1.5 tabular-nums">
                            <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: c }} />
                            <span className="min-w-0 flex-1 truncate text-slate-600 dark:text-slate-300">
                              {labelFor(group.col, k)}
                            </span>
                            <span className="text-slate-800 dark:text-slate-100">{compact(v)}</span>
                            <span className="w-12 text-right text-slate-500">{pct(v, hoverDay.total)}</span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </Scaled>

            {/* ── anomalies · peak hours ────────────────────────────────── */}
            {compactMode && !insightsOpen ? (
              <button
                type="button"
                onClick={() => setInsightsOpen(true)}
                className="my-3 flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-black/5 bg-white/80 px-3 py-2 text-left text-xs text-slate-600 hover:border-cyan-500/40 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-100">Insights</span>
                <span>
                  {anomalies.length} anomal{anomalies.length === 1 ? 'y' : 'ies'}
                  {anomalies[0] ? ` · strongest ${formatDateShort(anomalies[0].day)}` : ''}
                </span>
                {peak && (
                  <span>
                    · peak {formatHod(peak.best)}–{formatHod(peak.best + 2)}
                  </span>
                )}
                <span className="ml-auto font-medium text-cyan-700 dark:text-cyan-300">Show ▾</span>
              </button>
            ) : (
            <div className="my-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_15rem]">
              <Anomalies
                items={anomalies}
                groupCol={group.col}
                colors={colorMap}
                onFocus={(d) => {
                  setCustomRange([Math.max(0, d - 14), Math.min(TRACE_DAYS, d + 15)]);
                  setPeriodId('custom');
                }}
              />
              <div className="rounded-xl border border-black/5 bg-white/80 px-3 py-2 dark:border-white/10 dark:bg-slate-900/60">
                <div className="flex items-baseline justify-between">
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100">
                    Peak hours <Info label="About peak hours">{HELP.peak}</Info>
                  </h4>
                  {compactMode && (
                    <button
                      type="button"
                      onClick={() => setInsightsOpen(false)}
                      className="text-[11px] text-cyan-700 hover:underline dark:text-cyan-300"
                    >
                      Hide ▴
                    </button>
                  )}
                </div>
                {/* One layout with or without data, so the card never changes height. */}
                <div className="font-display text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {peak ? `${formatHod(peak.best)}–${formatHod(peak.best + 2)}` : '—'}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {peak ? `busiest two hours · ${(peak.bestShare * 100).toFixed(1)}% of requests` : 'no requests in view'}
                </p>
                <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">
                  {peak
                    ? `Quietest ${formatHod(peak.low)}–${formatHod(peak.low + 2)} · ${(peak.lowShare * 100).toFixed(1)}%`
                    : '\u00a0'}
                </p>
                <p className="mt-1 text-[10px] leading-snug text-slate-400 dark:text-slate-500">
                  Trace clock, not UTC: the release removed the real timezone.
                </p>
              </div>
            </div>
            )}

            {/* ── breakdown ─────────────────────────────────────────────── */}
            <div className="mb-3">
              <Breakdown
                dense={compactMode}
                group={group}
                rows={rows}
                keys={groupKeys.map(([k]) => k)}
                colors={colorMap}
                selected={selected[group.dim] ?? []}
                onToggle={(key) => {
                  const cur = selectedRef.current[group.dim] ?? [];
                  changeFilter(group.dim, cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]);
                }}
              />
            </div>

            {/* ── hour of day · day × hour ──────────────────────────────── */}
            <Scaled scale={scale} width={plotW} height={bH}>
              <div className="flex" style={{ gap: GAP, height: bH }}>
                <div
                  className="relative cursor-pointer"
                  style={{ width: HOUR_W, height: bH }}
                  onPointerDownCapture={onDown}
                  onClick={onHourClick}
                  title="Click an hour to filter to it; drag to brush a range"
                >
                  <div ref={hoursRef} className="absolute inset-0" />
                  <PanelLabel help={HELP.hours}>Hour of day</PanelLabel>
                </div>
                <div
                  className="relative cursor-pointer"
                  style={{ width: heatW, height: bH }}
                  onPointerDownCapture={onDown}
                  onClick={onHeatClick}
                  title="Click a cell to filter to that hour of that day; drag to brush"
                >
                  <div ref={heatRef} className="absolute inset-0" />
                  <PanelLabel help={HELP.heatmap}>Day × hour</PanelLabel>
                </div>
              </div>
            </Scaled>

            <div className="mt-2 flex flex-wrap items-center gap-3 empty:hidden">
              {status === 'idle' && (
                <span className="text-sm text-slate-500 dark:text-slate-400">Starting the query engine…</span>
              )}
              {status === 'loading' && (
                <span className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                  <span
                    className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-500"
                    aria-hidden="true"
                  />
                  {STAGE_TEXT[stage] ?? 'Working…'}
                </span>
              )}
              {status === 'error' && (
                <>
                  <button type="button" onClick={load} className={btn}>
                    Try again
                  </button>
                  <span className="text-sm text-rose-600 dark:text-rose-400">Could not start the figure ({error}).</span>
                </>
              )}
            </div>
          </div>
        </div>

        <RawData
          open={rawOpen}
          onClose={() => setRawOpen(false)}
          getWhere={currentWhere}
          api={dataApi}
          filterCount={activeCount + brushes.length}
        />

        <UnderTheHood
          tableRows={meta?.rollup?.rows ?? null}
          traceRows={traceRows}
          vgRef={vgRef}
          playing={playing}
          playLabel={`${formatDateShort(playT)} – ${formatDateShort(playT + PLAY_WINDOW - 1)}`}
        />
      </div>

      <figcaption className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        One year of production traffic from Chutes — {traceRows ? traceRows.toLocaleString('en-US') : '6.12 billion'}{' '}
        requests across 9,174 models. Charts read an hourly rollup of the trace; raw rows are read live from the original
        91 GB file on AWS S3. Dates follow the paper&rsquo;s stated span; hours are on the trace&rsquo;s own clock. Data:{' '}
        <a
          href="https://github.com/HarvardMadSys/chutes_workload"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-dotted underline-offset-2 hover:text-cyan-600 dark:hover:text-cyan-400"
        >
          Nixon et al., <em>A Year in LLM Serving</em>
        </a>
        . Engine:{' '}
        <a
          href="https://idl.uw.edu/mosaic/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-dotted underline-offset-2 hover:text-cyan-600 dark:hover:text-cyan-400"
        >
          Mosaic
        </a>{' '}
        and DuckDB.
      </figcaption>
    </figure>
  );
}
