// components/viz/chutes/queryLog.js
//
// Instrumentation behind the Chutes figure's "What's running" panel.
//
// Same design as nycTaxi/queryLog.js: every statement Mosaic sends passes
// through one connector, so wrapping that connector's query() captures the
// whole conversation. The difference is where the statement runs -- here it is
// an HTTP round trip to a local DuckDB process, so each entry also carries the
// server's own timing (X-Query-MS) when the connector can see it.
//
// Kept separate from the taxi log on purpose: the store is module state, and
// the two figures classify very different SQL.

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

/** Opens a new operation; the queries that follow are grouped under it. */
export function setActivity(label) {
  currentActivity = label;
  operationId++;
}

// A drag logs a dozen statements in a few hundred milliseconds. Bump the
// version at once so nothing is lost, but wake React at most ~12x a second so
// the panel does not re-render behind the brush and report its own lag.
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
        console.error('[chutes] log subscriber failed', err);
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

export const subscribeLog = (fn) => {
  store.listeners.add(fn);
  return () => store.listeners.delete(fn);
};
export const logSnapshot = () => store.version;
export const logEntries = () => store.entries;
export const totalIssued = () => store.nextId - 1;
export const retainedCount = () => store.entries.length;
export const RETAIN_LIMIT = MAX_ENTRIES;

if (typeof window !== 'undefined') {
  window.__chutesLog = { entries: () => store.entries, clear: clearLog };
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
    return {};
  }
}

/** Marker the panel appends to its own probes so they can be excluded. */
export const INSPECTOR_TAG = '/* mosaic-inspector */';

/**
 * Which execution path a statement takes.
 *
 *   build  — Mosaic materializes a pre-aggregated cube for the active brush
 *   cube   — the query reads that cube instead of the table
 *   source — a pass over `chutes`, the 537k-row rollup table
 *   trace  — a pass over the raw 91 GB parquet (console only)
 *   meta   — planning chatter (column types, schema)
 */
export function queryPath(sql) {
  if (/CREATE\s+(OR\s+REPLACE\s+)?(TEMP\s+)?TABLE[^;]*preagg/i.test(sql)) return 'build';
  if (/preagg/i.test(sql)) return 'cube';
  if (/\bFROM\s+"?trace"?\b/i.test(sql)) return 'trace';
  if (/^\s*DESC(RIBE)?\b/i.test(sql) || /CREATE SCHEMA/i.test(sql)) return 'meta';
  if (/\bFROM\s+"?chutes"?\b/i.test(sql)) return 'source';
  return 'other';
}

/** The SELECT list only -- WHERE clauses mention every brushed column. */
function selectList(sql) {
  const m = sql.match(/\bSELECT\b([\s\S]*?)\bFROM\b/i);
  return m ? m[1] : '';
}

/** Last of the named columns to appear in `text`, or null. */
function lastColumn(text, cols) {
  let best = null;
  let at = -1;
  for (const c of cols) {
    const i = text.lastIndexOf(`"${c}"`);
    if (i > at) {
      at = i;
      best = c;
    }
  }
  return best;
}

/**
 * Names the plot a SELECT list belongs to, from the aliases Mosaic gives each
 * mark's channels. The brushed columns can also appear as "active" dimensions
 * inside a cube build, so only the expression feeding the view's own channel
 * is inspected, never the whole statement.
 */
export function viewOf(list) {
  // A cube build also selects the *brushed* columns, aliased "active0",
  // "active1". Those say which selection the cube serves, not which view reads
  // it -- with a model toggle active, the endpoint cube mentions "model" too.
  const own = list.replace(/[^,]*AS\s+"active\d+"/gi, '');
  // Series clients alias their time bucket "d" (day) or "h" (hour).
  if (/AS\s+"d"/i.test(own)) return /AS\s+"key"/i.test(own) ? 'Daily × group' : 'Daily series';
  if (/AS\s+"h"/i.test(own)) return 'Hourly totals';
  // Grouped clients alias their group column "key": the breakdown table also
  // carries the TTFT sums, the filter-count clients carry only requests.
  if (/AS\s+"key"/i.test(own)) {
    return /AS\s+"nttft"/i.test(own) ? 'Breakdown table' : 'Filter counts';
  }
  if (/AS\s+"nttft"/i.test(own)) return 'KPI aggregate';
  if (/AS\s+"y1"/i.test(own)) return 'Heatmap cells';
  const x1 = own.match(/([\s\S]{0,200})AS\s+"x1"/i);
  if (x1) {
    const col = lastColumn(x1[1], ['day', 'hod']);
    if (col === 'day') return 'Timeline bins';
    if (col === 'hod') return 'Hour histogram';
  }
  // barX groups by the raw column: `sum(...) AS "x", "model"`, no alias.
  if (/"endpoint"/.test(own)) return 'Endpoint bars';
  if (/"streaming"/.test(own)) return 'Streaming bars';
  if (/"model"/.test(own)) return 'Model bars';
  return null;
}

/**
 * Cube table -> the view it feeds, kept outside the capped entry log.
 *
 * A cube read names its table but, for the two bar histograms, carries only
 * `"x1", "x2"` -- nothing says whether that is days or hours. Only the build
 * statement knows, and one drag issues enough cube reads to push every build
 * out of the retained log. Mosaic names cubes by a hash of their definition,
 * so a table name always means the same view and can be remembered for good.
 */
const cubeRegistry = new Map();

function registerCubes(sql) {
  const re = /"?mosaic"?\."?(preagg_\w+)"?\s+AS\s+SELECT([\s\S]*?)(?=CREATE\s+TABLE|$)/gi;
  let m;
  while ((m = re.exec(sql))) {
    const [, table, body] = m;
    const owner = viewOf(selectList(`SELECT ${body}`));
    if (owner) cubeRegistry.set(table, owner);
  }
}

/** Wraps a Mosaic connector so each request is timed and recorded. */
export function instrumentConnector(raw) {
  return new Proxy(raw, {
    get(target, prop) {
      if (prop !== 'query') {
        const value = Reflect.get(target, prop, target);
        return typeof value === 'function' ? value.bind(target) : value;
      }

      return async (request) => {
        const sql = String(request?.sql ?? '');
        const entry = {
          id: store.nextId++,
          opId: operationId,
          activity: currentActivity,
          type: request?.type ?? 'exec',
          sql,
          ms: null,
          rows: null,
          cols: null,
          sample: null,
          error: null,
          path: queryPath(sql),
          internal: sql.includes(INSPECTOR_TAG),
          startedAt: performance.now(),
          endedAt: 0,
        };

        if (entry.path === 'build') registerCubes(sql);

        // The try wraps only the query, so a throwing subscriber can never
        // land in this catch and log the same entry twice.
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

/** Human title and purpose for one statement, from its shape. */
export function classifyStep(sql) {
  const path = queryPath(sql);
  if (path === 'trace') {
    return { title: 'Raw trace scan', purpose: 'Reads the 91 GB parquet directly.' };
  }
  if (/CREATE SCHEMA/i.test(sql)) {
    return { title: 'Cube schema', purpose: 'Where Mosaic keeps its pre-aggregations.' };
  }
  if (/^\s*DESC(RIBE)?\b/i.test(sql)) {
    return { title: 'Column metadata', purpose: 'Types Mosaic needs to plan queries.' };
  }
  const view = viewOf(selectList(sql));
  if (view) return { title: view, purpose: null };
  if (/\bmin\(.*\bmax\(/is.test(sql)) {
    return { title: 'Scale statistics', purpose: 'Extents Mosaic uses to size the scales.' };
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
 * Maps each materialized cube table to the view it feeds. Reads the registry
 * rather than the entries, which may no longer hold the builds.
 */
export function cubeOwners() {
  return cubeRegistry;
}

/** Human label for one logged statement, resolved against the cube map. */
export function describeQuery(entry, owners) {
  if (entry.path === 'build') {
    const made = [...entry.sql.matchAll(/"?(preagg_\w+)"?/g)].map((m) => owners.get(m[1]));
    const named = [...new Set(made.filter(Boolean))];
    return named.length ? `Build cube — ${named.join(', ')}` : 'Build cube';
  }
  if (entry.path === 'cube') {
    const table = entry.sql.match(/"?mosaic"?\."?(preagg_\w+)"?/i)?.[1];
    // Heatmap, models and KPI reads identify themselves from their own
    // aliases; the two histograms need the registry.
    const owner = (table && owners.get(table)) ?? viewOf(selectList(entry.sql));
    return owner ? `${owner} (cube)` : 'Cube read';
  }
  return classifyStep(entry.sql).title;
}

/** Wall-clock span of one operation: first start to last end. */
export function operationSpan(entries) {
  const timed = entries.filter((e) => e.endedAt && !e.internal);
  if (!timed.length) return 0;
  return Math.max(...timed.map((e) => e.endedAt)) - Math.min(...timed.map((e) => e.startedAt));
}

// 'prepare' is deliberately absent: Mosaic builds cubes when the pointer
// merely enters a plot, before anything is clicked. Counting that as the
// previous interaction's cost once reported a 30 s "frame" made of idle time.
const isInteractive = (activity) =>
  activity === 'brush' ||
  activity === 'select' ||
  activity === 'filter' ||
  activity.startsWith('play');

/** The most recent interactive operations, newest first. */
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
        // A frame that builds a cube also reads it; build wins, then cube.
        path: paths.has('build') ? 'build' : paths.has('cube') ? 'cube' : 'source',
        returned: work.reduce((n, e) => n + (e.rows ?? 0), 0),
      };
    });
}

/** Folds the flat list into one card per operation, steps in order. */
export function groupEntries(entries) {
  const byOp = new Map();
  for (const entry of entries) {
    let group = byOp.get(entry.opId);
    if (!group) {
      group = { opId: entry.opId, activity: entry.activity, entries: [], totalMs: 0 };
      byOp.set(entry.opId, group);
    }
    group.entries.unshift(entry);
    group.totalMs += entry.ms ?? 0;
  }
  return [...byOp.values()].sort((a, b) => b.opId - a.opId);
}
