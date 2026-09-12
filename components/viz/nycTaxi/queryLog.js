// components/viz/nycTaxi/queryLog.js
//
// Instrumentation behind the figure's developer console.
//
// Every statement Mosaic sends to DuckDB passes through a single connector, so
// wrapping that connector's query() captures the entire conversation: the load
// pipeline, each brush, each animation frame, each KPI refresh. Entries are
// tagged with an operation id so the UI can group the queries one interaction
// caused, and carry a small sample of the result so the log shows what came
// back rather than only how much.

const MAX_ENTRIES = 90;
const SAMPLE_ROWS = 5;

const store = {
  entries: [], // newest first
  version: 0,
  paused: false,
  nextId: 1,
  listeners: new Set(),
};

let currentActivity = 'boot';
let operationId = 0;

/**
 * Opens a new operation. Call immediately before the action whose queries you
 * want grouped; follow-up queries (rasters, KPIs) inherit the label.
 */
export function setActivity(label) {
  currentActivity = label;
  operationId++;
}

// A drag logs a dozen statements in a few hundred milliseconds. Notifying
// React on every one made the panel re-render behind the brush and *look*
// slower than the queries it was reporting. Bump the version immediately so
// no update is lost, but wake subscribers at most a few times a second.
const NOTIFY_INTERVAL_MS = 80;
let notifyPending = false;

function emit() {
  store.version++;
  if (notifyPending) return;
  notifyPending = true;
  setTimeout(() => {
    notifyPending = false;
    store.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('[nyc-taxi] log subscriber failed', err);
      }
    });
  }, NOTIFY_INTERVAL_MS);
}

function push(entry) {
  if (store.paused) return;
  store.entries.unshift(entry);
  if (store.entries.length > MAX_ENTRIES) store.entries.length = MAX_ENTRIES;
  emit();
}

export function clearLog() {
  store.entries = [];
  emit();
}

export function setPaused(paused) {
  store.paused = paused;
  emit();
}

export const isPaused = () => store.paused;
export const subscribeLog = (fn) => {
  store.listeners.add(fn);
  return () => store.listeners.delete(fn);
};
export const logSnapshot = () => store.version;
export const logEntries = () => store.entries;
/** Monotonic count of statements ever issued (entries themselves are capped). */
export const totalIssued = () => store.nextId - 1;
export const retainedCount = () => store.entries.length;
export const RETAIN_LIMIT = MAX_ENTRIES;

// Debug hook: the panel is the supported surface, but having the raw log
// reachable from the browser console makes the figure inspectable by anyone
// who wants to check its numbers rather than trust them.
if (typeof window !== 'undefined') {
  window.__mosaicLog = { entries: () => store.entries, clear: clearLog };
}

/** Renders one Arrow cell as short, readable text. */
export function formatCell(v) {
  if (v == null) return '∅';
  if (typeof v === 'bigint') return v.toString();
  if (typeof v === 'number') {
    return Number.isInteger(v) ? v.toLocaleString('en-US') : String(parseFloat(v.toFixed(4)));
  }
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

/** Grabs the first few result rows without materializing the whole table. */
function sampleResult(result, rowCount) {
  if (!result?.schema?.fields || rowCount == null) return {};
  try {
    const cols = result.schema.fields.map((f) => f.name);
    const sample = [];
    for (let i = 0; i < Math.min(SAMPLE_ROWS, rowCount); i++) {
      const row = result.get(i);
      sample.push(cols.map((c) => formatCell(row?.[c])));
    }
    return { cols, sample };
  } catch {
    // Sampling is best-effort; the query itself already succeeded.
    return {};
  }
}

/**
 * Which execution path a statement takes — the whole scalability story in one
 * field.
 *
 *   build  — Mosaic materializes a pre-aggregated cube for the active brush
 *   cube   — the query reads that cube instead of the source table
 *   source — a full pass over the trips table
 *   meta   — planning chatter (column types, scale extents)
 */
/** Marker the panel appends to its own probes so they can be excluded. */
export const INSPECTOR_TAG = '/* mosaic-inspector */';

export function queryPath(sql) {
  if (/CREATE\s+(OR\s+REPLACE\s+)?(TEMP\s+)?TABLE[^;]*preagg/i.test(sql)) return 'build';
  if (/preagg/i.test(sql)) return 'cube';
  if (/^\s*DESC(RIBE)?\b/i.test(sql) || /CREATE SCHEMA/i.test(sql)) return 'meta';
  if (/\bFROM\s+"?trips"?/i.test(sql)) return 'source';
  return 'other';
}

/** Wraps the DuckDB-WASM connector so each request is timed and recorded. */
export function instrumentConnector(raw) {
  return new Proxy(raw, {
    get(target, prop) {
      if (prop !== 'query') {
        const value = Reflect.get(target, prop, target);
        return typeof value === 'function' ? value.bind(target) : value;
      }

      return async (request) => {
        const entry = {
          id: store.nextId++,
          opId: operationId,
          activity: currentActivity,
          type: request?.type ?? 'exec',
          sql: String(request?.sql ?? ''),
          ms: null,
          rows: null,
          cols: null,
          sample: null,
          error: null,
          path: queryPath(String(request?.sql ?? '')),
          // Queries this panel issues about itself are logged but never
          // counted as frame cost -- otherwise the instrument changes the
          // reading it is taking.
          internal: String(request?.sql ?? '').includes(INSPECTOR_TAG),
          startedAt: 0,
          endedAt: 0,
        };

        entry.startedAt = performance.now();

        // The try wraps only the query. Bookkeeping and listener notification
        // sit outside it — otherwise a subscriber that throws lands in this
        // catch and logs the same entry a second time, under the same id.
        let result;
        try {
          result = await target.query(request);
        } catch (err) {
          entry.endedAt = performance.now();
          entry.ms = entry.endedAt - entry.startedAt;
          entry.error = String(err?.message ?? err);
          push(entry);
          throw err;
        }

        entry.endedAt = performance.now();
        entry.ms = entry.endedAt - entry.startedAt;
        entry.rows = typeof result?.numRows === 'number' ? result.numRows : null;
        Object.assign(entry, sampleResult(result, entry.rows));
        push(entry);
        return result;
      };
    },
  });
}

/**
 * Names the role a statement plays, from the shape of its SQL.
 * Order matters: metadata probes are matched before the marks that ran them.
 */
export function classifyStep(sql) {
  const rules = [
    [/INSTALL|LOAD\s/i, 'Load spatial extension', 'DuckDB pulls in its GIS module so ST_Transform exists.'],
    [/read_parquet/i, 'Ingest parquet', 'Streams the 46 MB file and reprojects both endpoints of every trip.'],
    [/CREATE TABLE IF NOT EXISTS "trips"/, 'Materialize trips table', 'Flattens geometry into plain numeric columns for fast scans.'],
    [/CREATE\s+TABLE[^;]*preagg/i, 'Build pre-aggregation cube', 'Mosaic materializes an index so dragging stays interactive.'],
    [/^\s*DESC(RIBE)?\b/i, 'Column metadata', 'Mosaic asks DuckDB for column types before planning its queries.'],
    [/avg\(\s*"?distance"?\s*\)/i, 'KPI aggregate', 'One row of count and averages under the current filters.'],
    [/min\(.*max\(/is, 'Scale statistics', 'Min/max extents Mosaic uses to size the plot scales.'],
    [/"px"/, 'Pickups raster', 'Bins matching pickups into pixels — one result row per lit pixel.'],
    [/"dx"/, 'Dropoffs raster', 'Bins matching dropoffs into pixels — one result row per lit pixel.'],
    [/"time"/, 'Histogram bins', 'Trip counts per hour-of-day bucket.'],
    [/^\s*SELECT count\(\*\)/i, 'Row count', 'How many trips made it into the table.'],
  ];

  for (const [pattern, title, purpose] of rules) {
    if (pattern.test(sql)) return { title, purpose };
  }
  return { title: 'Statement', purpose: null };
}

/** Name of the most recently materialized cube, or null. */
export function lastCubeTable(entries) {
  for (const e of entries) {
    if (e.path !== 'build') continue;
    const m = e.sql.match(/"?(mosaic)"?\."?(preagg_\w+)"?/i);
    if (m) return `"${m[1]}"."${m[2]}"`;
  }
  return null;
}

/**
 * Maps each materialized cube to the view it feeds.
 *
 * A build statement gives this away twice over: the expression aliased to
 * "index" (or "x1") is the view's own binning, while "active0"/"active1" carry
 * whichever brush is currently being dragged.
 */
export function cubeOwners(entries) {
  const owners = new Map();
  for (const e of entries) {
    if (e.path !== 'build') continue;
    const re = /"mosaic"\."(preagg_\w+)"\s+AS\s+SELECT([\s\S]*?)(?=CREATE\s+TABLE|$)/gi;
    let m;
    while ((m = re.exec(e.sql))) {
      const [, table, body] = m;
      let label = 'Raster';
      if (/AS\s+"x1"/i.test(body)) {
        label = 'Histogram bins';
      } else {
        const idx = body.match(/([\s\S]{0,220})AS\s+"index"/i)?.[1] ?? '';
        if (/"dx"|"dy"/.test(idx)) label = 'Dropoffs raster';
        else if (/"px"|"py"/.test(idx)) label = 'Pickups raster';
      }
      owners.set(table, label);
    }
  }
  return owners;
}

/** Human label for one logged statement, resolved against the cube map. */
export function describeQuery(entry, owners) {
  if (entry.path === 'build') {
    const created = [...entry.sql.matchAll(/"(preagg_\w+)"/g)].map((m) => owners.get(m[1]));
    const named = [...new Set(created.filter(Boolean))];
    return named.length ? `Build cube — ${named.join(', ')}` : 'Build cube';
  }
  if (entry.path === 'cube') {
    const table = entry.sql.match(/"mosaic"\."(preagg_\w+)"/)?.[1];
    const owner = table && owners.get(table);
    return owner ? `${owner} (cube)` : 'Cube read';
  }
  return classifyStep(entry.sql).title;
}

/**
 * Wall-clock span of one operation: first query start to last query end.
 * Summing would overcount, since the coordinator runs them concurrently.
 */
export function operationSpan(entries) {
  const timed = entries.filter((e) => e.endedAt && !e.internal);
  if (!timed.length) return 0;
  return Math.max(...timed.map((e) => e.endedAt)) - Math.min(...timed.map((e) => e.startedAt));
}

/** Does this operation represent one interactive frame the user waited on? */
const isInteractive = (activity) => activity === 'brush' || activity.startsWith('play');

/**
 * The most recent interactive operations, newest first, with the derived
 * numbers the performance panel reads.
 */
export function recentFrames(groups, limit = 40) {
  return groups
    .filter((g) => isInteractive(g.activity))
    .slice(0, limit)
    .map((g) => {
      const work = g.entries.filter((e) => !e.internal);
      const paths = new Set(work.map((e) => e.path));
      return {
        opId: g.opId,
        activity: g.activity,
        ms: operationSpan(g.entries),
        queries: work.length,
        work,
        // Order matters: a frame that BUILDS a cube also reads it, and must
        // not be counted as a warm-cube frame. Build wins, then cube, then a
        // plain source scan.
        path: paths.has('build') ? 'build' : paths.has('cube') ? 'cube' : 'source',
        returned: work.reduce((n, e) => n + (e.rows ?? 0), 0),
      };
    });
}

/**
 * Folds the flat entry list into one card per operation: newest operation
 * first, steps inside in execution order.
 */
export function groupEntries(entries) {
  const byOp = new Map();
  for (const entry of entries) {
    let group = byOp.get(entry.opId);
    if (!group) {
      group = { opId: entry.opId, activity: entry.activity, entries: [], totalMs: 0 };
      byOp.set(entry.opId, group);
    }
    group.entries.unshift(entry); // entries arrive newest-first
    group.totalMs += entry.ms ?? 0;
  }
  // Newest operation first; steps inside stay in execution order.
  return [...byOp.values()].sort((a, b) => b.opId - a.opId);
}
