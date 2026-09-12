'use client';

// components/viz/nycTaxi/UnderTheHood.jsx
//
// Answers three questions, in order, and nothing else:
//
//   1. What are the components on this screen?   -> the roster
//   2. What SQL is running right now?            -> live, no click needed
//   3. What did this frame cost?                 -> per-component bars
//
// The live-SQL block exists because the previous design only revealed SQL on
// click, which is impossible during "Play the day" -- the frame changes every
// 260 ms. Here you pick a component once and then watch its statement change.
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  INSPECTOR_TAG,
  RETAIN_LIMIT,
  clearLog,
  cubeOwners,
  describeQuery,
  formatCell,
  groupEntries,
  lastCubeTable,
  logEntries,
  logSnapshot,
  recentFrames,
  retainedCount,
  setActivity,
  subscribeLog,
  totalIssued,
} from './queryLog';

/**
 * The fixed cast of this figure. Mosaic's own client names are minified at
 * runtime, so the roster is declared here and matched to live queries by the
 * label describeQuery() resolves from the SQL.
 */
const COMPONENTS = [
  {
    key: 'Pickups raster',
    n: 1,
    name: 'Pickups map',
    role: 'Mosaic client · raster',
    detail: '522 × 653 px — one row per lit pixel',
  },
  {
    key: 'Dropoffs raster',
    n: 2,
    name: 'Dropoffs map',
    role: 'Mosaic client · raster',
    detail: '522 × 653 px — one row per lit pixel',
  },
  {
    key: 'Histogram bins',
    n: 3,
    name: 'Hour histogram',
    role: 'Mosaic client · bars',
    detail: '24 buckets, one per hour',
  },
  {
    key: 'KPI aggregate',
    n: 4,
    name: 'KPI tiles',
    role: 'Mosaic client · aggregate',
    detail: '4 numbers from 1 row',
  },
];

const PATH_LABEL = { cube: 'index', source: 'table scan', build: 'building index', meta: 'metadata' };
const PATH_CHIP = {
  cube: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  source: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  build: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  meta: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
};
const PATH_BAR = {
  cube: 'bg-emerald-500',
  source: 'bg-sky-500',
  build: 'bg-amber-500',
  meta: 'bg-slate-400',
};

const SQL_PRESETS = [
  { label: 'peek', sql: 'SELECT * FROM trips LIMIT 10' },
  { label: 'schema', sql: 'DESCRIBE trips' },
  {
    label: 'by hour',
    sql: 'SELECT FLOOR(time) AS hour, COUNT(*) AS trips, ROUND(AVG(fare), 2) AS avg_fare\nFROM trips GROUP BY 1 ORDER BY 1',
  },
  {
    label: 'the indexes',
    sql: "SELECT table_name, estimated_size AS rows\nFROM duckdb_tables()\nWHERE schema_name = 'mosaic'",
  },
];

/** Splits a statement so the part that changes every frame can be highlighted. */
function splitPredicate(sql) {
  const i = sql.search(/\bWHERE\b/i);
  if (i < 0) return [sql, null];
  return [sql.slice(0, i), sql.slice(i)];
}

function ResultTable({ cols, rows, total }) {
  if (!cols?.length) return null;
  return (
    <div className="overflow-auto rounded-md border border-black/10 dark:border-white/10">
      <table className="w-full text-[11px] tabular-nums">
        <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900">
          <tr>
            {cols.map((c) => (
              <th
                key={c}
                className="px-2.5 py-1 text-left font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-black/5 dark:border-white/5">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="px-2.5 py-1 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {total != null && total > rows.length && (
        <p className="px-2 py-1 text-[10px] text-slate-500 dark:text-slate-400 border-t border-black/5 dark:border-white/5">
          first {rows.length} of {total.toLocaleString('en-US')} rows
        </p>
      )}
    </div>
  );
}

export default function UnderTheHood({ sourceRows, vgRef, dataVia, playing, playLabel }) {
  const [watch, setWatch] = useState('Histogram bins'); // which statement to follow
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sqlText, setSqlText] = useState(SQL_PRESETS[0].sql);
  const [sqlBusy, setSqlBusy] = useState(false);
  const [sqlError, setSqlError] = useState(null);
  const [sqlResult, setSqlResult] = useState(null);

  useSyncExternalStore(subscribeLog, logSnapshot, () => 0);
  const entries = logEntries();
  const groups = groupEntries(entries);
  const frames = recentFrames(groups);
  const owners = cubeOwners(entries);

  const [cube, setCube] = useState(null);
  const probedRef = useRef(null);
  const cubeTable = lastCubeTable(entries);

  useEffect(() => {
    const vg = vgRef?.current;
    if (!vg || !cubeTable || probedRef.current === cubeTable) return;
    probedRef.current = cubeTable;
    let alive = true;
    vg.coordinator()
      .query(`SELECT count(*) AS n FROM ${cubeTable} ${INSPECTOR_TAG}`)
      .then((r) => alive && setCube({ rows: Number(r.get(0).n) }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [cubeTable, vgRef]);

  const runSql = useCallback(async () => {
    const vg = vgRef?.current;
    if (!vg || sqlBusy) return;
    setSqlBusy(true);
    setSqlError(null);
    setActivity('console');
    try {
      const started = performance.now();
      const result = await vg.coordinator().query(sqlText, { cache: false });
      const cols = result.schema.fields.map((f) => f.name);
      const rows = result
        .toArray()
        .slice(0, 100)
        .map((r) => cols.map((c) => formatCell(r[c])));
      setSqlResult({ cols, rows, total: result.numRows, ms: performance.now() - started });
    } catch (err) {
      setSqlResult(null);
      setSqlError(String(err?.message ?? err));
    } finally {
      setSqlBusy(false);
    }
  }, [vgRef, sqlText, sqlBusy]);

  const last = frames[0];
  const work = last?.work ?? [];
  const slowest = Math.max(...work.map((e) => e.ms ?? 0), 1);

  // live status per component, matched by resolved label
  const statusFor = (key) => work.find((e) => describeQuery(e, owners).startsWith(key)) ?? null;

  // the statement being followed: the watched one if present, else the priciest
  const watched =
    work.find((e) => describeQuery(e, owners).startsWith(watch)) ??
    [...work].sort((a, b) => (b.ms ?? 0) - (a.ms ?? 0))[0] ??
    null;
  const [head, predicate] = watched ? splitPredicate(watched.sql) : ['', null];

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  // Play publishes a filter directly rather than through a plot interactor, so
  // it carries no pixel/scale metadata -- and without that the pre-aggregator
  // cannot index it. Those frames legitimately scan the table, and saying so is
  // more useful than hiding it.
  const playScans = playing && work.some((e) => e.path === 'source');

  const stateLabel = playing
    ? `Playing · ${playLabel ?? ''}`
    : work.length
      ? 'Last interaction'
      : 'Idle — drag a map or press Play';

  return (
    <div className="mt-6 rounded-xl border border-black/10 dark:border-white/10 overflow-hidden">
      <div className="px-6 py-3.5 bg-slate-100/80 dark:bg-slate-900/60 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          What&rsquo;s running
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
            playing
              ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {stateLabel}
        </span>
        {dataVia && (
          <span className="ml-auto text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {dataVia === 'cache' ? 'data from cache' : 'data downloaded'}
          </span>
        )}
      </div>

      <div className="px-6 py-6 bg-white/60 dark:bg-slate-950/60 space-y-7">
        {/* ── 1. the roster ─────────────────────────────────────────────── */}
        <section>
          <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Components on this screen
          </h4>
          <p className="mb-3 text-[11px] text-slate-500 dark:text-slate-400">
            Four of them ask the database questions. The brush does not — it publishes the
            filter the other four are answered under.
          </p>

          <ul className="space-y-1.5">
            {COMPONENTS.map((c) => {
              const live = statusFor(c.key);
              return (
                <li
                  key={c.key}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-black/5 dark:border-white/10 px-3 py-2"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-500/15 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    {c.n}
                  </span>
                  <span className="w-32 shrink-0 text-[12px] font-semibold text-slate-800 dark:text-slate-100">
                    {c.name}
                  </span>
                  <span className="w-44 shrink-0 text-[11px] text-slate-500 dark:text-slate-400">
                    {c.role}
                  </span>
                  <span className="hidden lg:block flex-1 text-[11px] text-slate-400 dark:text-slate-500">
                    {c.detail}
                  </span>
                  {live ? (
                    <span className="ml-auto flex items-center gap-2">
                      <span
                        className={`rounded px-1.5 text-[10px] uppercase tracking-wide ${PATH_CHIP[live.path] ?? PATH_CHIP.meta}`}
                      >
                        {PATH_LABEL[live.path] ?? live.path}
                      </span>
                      <span className="w-14 text-right text-[11px] tabular-nums text-slate-700 dark:text-slate-200">
                        {live.ms?.toFixed(0)} ms
                      </span>
                    </span>
                  ) : (
                    <span className="ml-auto text-[11px] text-slate-400 dark:text-slate-500">
                      {work.length ? 'not queried' : '—'}
                    </span>
                  )}
                </li>
              );
            })}

            <li className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-dashed border-cyan-500/30 px-3 py-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-[10px] font-bold text-cyan-700 dark:text-cyan-300">
                5
              </span>
              <span className="w-32 shrink-0 text-[12px] font-semibold text-slate-800 dark:text-slate-100">
                Brush / Play
              </span>
              <span className="w-44 shrink-0 text-[11px] text-slate-500 dark:text-slate-400">
                interactor — not a client
              </span>
              <span className="hidden lg:block flex-1 text-[11px] text-slate-400 dark:text-slate-500">
                publishes one filter clause; runs no query of its own
              </span>
              <span className="ml-auto text-[11px] tabular-nums text-cyan-700 dark:text-cyan-300">
                {work.length ? '1 clause' : '—'}
              </span>
            </li>
          </ul>
        </section>

        {/* ── 2. live SQL ───────────────────────────────────────────────── */}
        <section>
          <div className="mb-2 flex flex-wrap items-baseline gap-x-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              The statement running right now
            </h4>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              press Play and watch the highlighted line change every frame
            </span>
            {playScans && (
              <span className="w-full text-[11px] text-amber-700 dark:text-amber-300">
                Note: Play sets the filter directly instead of going through a brush, so it
                carries no pixel metadata — and without that these queries can&rsquo;t use the
                index. Drag a map by hand to see the same charts served from it.
              </span>
            )}
          </div>

          <div className="mb-2 flex flex-wrap gap-1.5">
            {COMPONENTS.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setWatch(c.key)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  watch === c.key
                    ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'
                }`}
              >
                {c.name}
              </button>
            ))}
            {watched && (
              <button
                type="button"
                onClick={() => copy(watched.sql)}
                className="ml-auto rounded-md border border-black/10 dark:border-white/10 px-2 py-1 text-[11px] text-slate-600 dark:text-slate-300 hover:border-cyan-500/40"
              >
                {copied ? 'Copied' : 'Copy SQL'}
              </button>
            )}
          </div>

          {watched ? (
            <div className="rounded-lg border border-black/10 dark:border-white/10 overflow-hidden">
              <div className="flex flex-wrap items-baseline gap-x-3 px-3 py-1.5 bg-slate-50 dark:bg-slate-900/60">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                  {describeQuery(watched, owners)}
                </span>
                <span className="text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                  {watched.ms?.toFixed(1)} ms ·{' '}
                  {watched.rows != null ? `${watched.rows.toLocaleString('en-US')} rows` : 'no rows'}
                </span>
              </div>
              <pre className="max-h-52 overflow-auto px-3 py-2.5 font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-all">
                <span className="text-slate-600 dark:text-slate-300">{head}</span>
                {predicate && (
                  <span className="rounded bg-cyan-500/15 text-cyan-800 dark:text-cyan-200">
                    {predicate}
                  </span>
                )}
              </pre>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-black/10 dark:border-white/10 px-3 py-6 text-center text-[11px] text-slate-400 dark:text-slate-500">
              Nothing running. Drag a map, or press <strong>Play the day</strong>.
            </p>
          )}
        </section>

        {/* ── 3. cost ───────────────────────────────────────────────────── */}
        {work.length > 0 && (
          <section>
            <div className="mb-2 flex flex-wrap items-baseline gap-x-3">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Cost of this frame
              </h4>
              <span className="text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                {last.ms.toFixed(0)} ms total · index holds{' '}
                {cube ? cube.rows.toLocaleString('en-US') : '—'} cells vs{' '}
                {(sourceRows ?? 0).toLocaleString('en-US')} rows in the table
              </span>
            </div>
            <ul className="space-y-1.5">
              {work.map((e) => (
                <li key={e.id} className="flex items-center gap-3">
                  <span className="w-44 shrink-0 truncate text-[11px] text-slate-700 dark:text-slate-200">
                    {describeQuery(e, owners)}
                  </span>
                  <span className="flex-1 h-2.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                    <span
                      className={`block h-full rounded-full ${PATH_BAR[e.path] ?? 'bg-slate-400'}`}
                      style={{ width: `${Math.max(3, ((e.ms ?? 0) / slowest) * 100)}%` }}
                    />
                  </span>
                  <span className="w-14 shrink-0 text-right text-[11px] tabular-nums text-slate-700 dark:text-slate-200">
                    {e.ms?.toFixed(0)} ms
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── console ───────────────────────────────────────────────────── */}
        <section>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setConsoleOpen((v) => !v)}
              className="rounded-md border border-black/10 dark:border-white/10 px-2.5 py-1 text-[11px] text-slate-600 dark:text-slate-300 hover:border-cyan-500/40"
            >
              {consoleOpen ? 'Hide SQL console' : 'Run your own SQL'}
            </button>
            <span className="text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
              {totalIssued().toLocaleString('en-US')} statements issued
              {retainedCount() >= RETAIN_LIMIT && ` · last ${RETAIN_LIMIT} kept`}
            </span>
            <button
              type="button"
              onClick={clearLog}
              className="ml-auto text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100"
            >
              clear
            </button>
          </div>

          {consoleOpen && (
            <div className="mt-2 rounded-lg border border-black/10 dark:border-white/10 px-3 py-3 space-y-2.5">
              <div className="flex flex-wrap gap-1.5">
                {SQL_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setSqlText(p.sql)}
                    className="px-2.5 py-1 rounded-md border border-black/10 dark:border-white/10 text-[11px] text-slate-600 dark:text-slate-300 hover:border-cyan-500/40"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="grid gap-2.5 lg:grid-cols-2 items-start">
                <div className="min-w-0 space-y-2">
                  <textarea
                    value={sqlText}
                    onChange={(e) => setSqlText(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                        e.preventDefault();
                        runSql();
                      }
                    }}
                    rows={5}
                    spellCheck={false}
                    className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 px-3 py-2 font-mono text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-cyan-500/50 resize-y"
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={runSql}
                      disabled={sqlBusy}
                      className="rounded-lg px-3.5 py-1.5 text-xs font-medium bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 disabled:opacity-50"
                    >
                      {sqlBusy ? 'Running…' : 'Run (Ctrl+Enter)'}
                    </button>
                    {sqlResult && (
                      <span className="text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                        {sqlResult.total.toLocaleString('en-US')} rows in{' '}
                        {sqlResult.ms.toFixed(1)} ms
                      </span>
                    )}
                  </div>
                </div>
                <div className="min-w-0">
                  {sqlError ? (
                    <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 font-mono text-[11px] text-rose-600 dark:text-rose-400 whitespace-pre-wrap">
                      {sqlError}
                    </p>
                  ) : sqlResult ? (
                    <div className="max-h-56 overflow-auto">
                      <ResultTable
                        cols={sqlResult.cols}
                        rows={sqlResult.rows}
                        total={sqlResult.total}
                      />
                    </div>
                  ) : (
                    <p className="rounded-lg border border-dashed border-black/10 dark:border-white/10 px-3 py-6 text-center text-[11px] text-slate-400 dark:text-slate-500">
                      Results appear here.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
