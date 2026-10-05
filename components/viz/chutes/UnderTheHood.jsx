'use client';

// components/viz/chutes/UnderTheHood.jsx
//
// The Chutes counterpart of nycTaxi/UnderTheHood.jsx, answering the same three
// questions in the same order:
//
//   1. What are the components on this screen?   -> the roster
//   2. What SQL is running right now?            -> live, no click needed
//   3. What did this frame cost?                 -> per-component bars
//
// The one addition is scale. The figure itself reads a 537k-row rollup, but the
// console can also reach the raw 91 GB trace, so a reader can put the two
// latencies side by side instead of taking the ratio on trust.
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ensureTrace } from './sampler';
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
 * The fixed cast of this figure. Mosaic's client names are minified at
 * runtime, so the roster is declared here and matched to live queries by the
 * label describeQuery() resolves from the SQL.
 */
const COMPONENTS = [
  {
    key: 'Filter counts',
    n: 1,
    name: 'Filter counts',
    role: '6 Mosaic clients · grouped',
    detail: 'one per filter; each ignores its own selection',
  },
  {
    key: 'Timeline bins',
    n: 2,
    name: 'Daily timeline',
    role: 'Mosaic client · stacked bars + line',
    detail: 'days × the current grouping, plus the total',
  },
  {
    key: 'Breakdown table',
    n: 3,
    name: 'Breakdown table',
    role: 'Mosaic client · grouped',
    detail: 'one row per group, measured-only averages',
  },
  {
    key: 'Hour histogram',
    n: 4,
    name: 'Hour of day',
    role: 'Mosaic client · stacked bars',
    detail: '24 hours × the current grouping',
  },
  {
    key: 'Heatmap cells',
    n: 5,
    name: 'Day × hour heatmap',
    role: 'Mosaic client · rect',
    detail: 'one cell per hour of the trace',
  },
  {
    key: 'KPI aggregate',
    n: 6,
    name: 'KPI cards',
    role: 'Mosaic client · aggregate',
    detail: 'sums and measured counts from 1 row',
  },
  {
    key: 'Daily series',
    n: 7,
    name: 'KPI sparklines',
    role: 'Mosaic client · by day',
    detail: 'feeds sparklines and the vs-prior-period arrows',
  },
  {
    key: 'Daily × group',
    n: 8,
    name: 'Tooltip & anomalies',
    role: 'Mosaic client · day × group',
    detail: 'per-day composition for hover and spike detection',
  },
  {
    key: 'Hourly totals',
    n: 9,
    name: 'Peak hours',
    role: 'Mosaic client · by hour',
    detail: 'the busiest two-hour window',
  },
];

const PATH_LABEL = {
  cube: 'index',
  source: 'table scan',
  build: 'building index',
  trace: '91 GB scan',
  meta: 'metadata',
};
const PATH_CHIP = {
  cube: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  source: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  build: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  trace: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  meta: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
};
const PATH_BAR = {
  cube: 'bg-emerald-500',
  source: 'bg-sky-500',
  build: 'bg-amber-500',
  trace: 'bg-rose-500',
  meta: 'bg-slate-400',
};

// Two groups on purpose: the rollup presets answer in milliseconds, the raw
// ones read the 91 GB file and are labelled with what they will cost.
const SQL_PRESETS = [
  { label: 'peek', sql: 'SELECT * FROM chutes LIMIT 10' },
  { label: 'schema', sql: 'DESCRIBE chutes' },
  {
    label: 'by hour',
    sql: 'SELECT hod, SUM(reqs) AS requests, ROUND(SUM(sum_ot) / SUM(reqs), 1) AS avg_out\nFROM chutes GROUP BY 1 ORDER BY 1',
  },
  {
    label: 'the indexes',
    sql: "SELECT table_name, estimated_size AS rows\nFROM duckdb_tables()\nWHERE schema_name = 'mosaic'",
  },
  {
    label: 'raw · one hour (~0.2 s)',
    raw: true,
    sql: "SELECT count(*) AS requests, avg(ttft) AS avg_ttft\nFROM trace\nWHERE started_at >= TIMESTAMP '1970-06-01 12:00:00'\n  AND started_at <  TIMESTAMP '1970-06-01 13:00:00'",
  },
  {
    label: 'raw · top models (~6 s)',
    raw: true,
    sql: 'SELECT chute_id, count(*) AS requests\nFROM trace GROUP BY 1 ORDER BY 2 DESC LIMIT 10',
  },
  {
    label: 'raw · by hour (~30 s)',
    raw: true,
    sql: 'SELECT hour(started_at) AS hod, count(*) AS requests\nFROM trace GROUP BY 1 ORDER BY 1',
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

export default function UnderTheHood({ tableRows, traceRows, vgRef, playing, playLabel }) {
  const [watch, setWatch] = useState('Timeline bins');
  const [open, setOpen] = useState(false);
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
    if (!vg || !cubeTable || probedRef.current === cubeTable) return undefined;
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
      // `trace` is the S3 object; it is registered on first use, not at load.
      if (/\btrace\b/i.test(sqlText)) await ensureTrace(vg);
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

  const statusFor = (key) => work.find((e) => describeQuery(e, owners).startsWith(key)) ?? null;

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

  // Play publishes its filter directly rather than through a plot interactor,
  // so it carries no pixel/scale metadata and cannot use a cube. Those frames
  // scan the table, and saying so beats hiding it.
  const playScans = playing && work.some((e) => e.path === 'source');

  const stateLabel = playing
    ? `Playing · ${playLabel ?? ''}`
    : work.length
      ? 'Last interaction'
      : 'Idle — brush a plot or press Play';

  const runningRaw = sqlBusy && /\bFROM\s+"?trace"?\b/i.test(sqlText);

  return (
    <div className="mt-4 rounded-xl border border-black/10 dark:border-white/10 overflow-hidden">
      {/* Collapsed by default: it is for readers who want the SQL, and while
          open it re-renders on every query the figure sends. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full px-4 py-2 bg-slate-100/80 dark:bg-slate-900/60 flex flex-wrap items-center gap-x-3 gap-y-1 text-left hover:bg-slate-200/60 dark:hover:bg-slate-800/60"
      >
        <span className="text-slate-400" aria-hidden="true">{open ? '▾' : '▸'}</span>
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          What&rsquo;s running
        </span>
        {!open && (
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            the SQL behind each chart, its timing, and a console
          </span>
        )}
        {open && (
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
            playing
              ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {stateLabel}
        </span>
        )}
        <span className="ml-auto text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
          DuckDB-WASM · in this tab
        </span>
      </button>

      {open && (
      <div className="px-6 py-6 bg-white/60 dark:bg-slate-950/60 space-y-7">
        {/* ── 1. the roster ─────────────────────────────────────────────── */}
        <section>
          <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Components on this screen
          </h4>
          <p className="mb-3 text-[11px] text-slate-500 dark:text-slate-400">
            These ask the database questions. The filter bar, the table rows and the brushes do
            not — they publish the filter the others are answered under.
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
                  <span className="w-36 shrink-0 text-[12px] font-semibold text-slate-800 dark:text-slate-100">
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
                10
              </span>
              <span className="w-36 shrink-0 text-[12px] font-semibold text-slate-800 dark:text-slate-100">
                Filters / Brush / Play
              </span>
              <span className="w-44 shrink-0 text-[11px] text-slate-500 dark:text-slate-400">
                interactors — not clients
              </span>
              <span className="hidden lg:block flex-1 text-[11px] text-slate-400 dark:text-slate-500">
                publish one filter clause each; run no query of their own
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
                index. Brush a plot by hand to see the same charts served from it.
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
              Nothing running. Brush a plot, click a bar, or press <strong>Play the year</strong>.
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
                {(tableRows ?? 0).toLocaleString('en-US')} rollup rows, summarizing{' '}
                {(traceRows ?? 0).toLocaleString('en-US')} requests
              </span>
            </div>
            <ul className="space-y-1.5">
              {work.map((e) => (
                <li key={e.id} className="flex items-center gap-3">
                  <span className="w-48 shrink-0 truncate text-[11px] text-slate-700 dark:text-slate-200">
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
                    className={`px-2.5 py-1 rounded-md border text-[11px] ${
                      p.raw
                        ? 'border-rose-500/30 text-rose-700 dark:text-rose-300 hover:border-rose-500/60'
                        : 'border-black/10 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-cyan-500/40'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                <code>chutes</code> is the 537k-row rollup behind the charts. <code>trace</code> is
                the raw 6.12B-row parquet — the red presets read it directly, so their cost is the
                full-file price the rollup avoids.
              </p>
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
                      {sqlBusy ? (runningRaw ? 'Scanning 91 GB…' : 'Running…') : 'Run (Ctrl+Enter)'}
                    </button>
                    {sqlResult && (
                      <span className="text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                        {sqlResult.total.toLocaleString('en-US')} rows in{' '}
                        {sqlResult.ms >= 1000
                          ? `${(sqlResult.ms / 1000).toFixed(2)} s`
                          : `${sqlResult.ms.toFixed(1)} ms`}
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
      )}
    </div>
  );
}
