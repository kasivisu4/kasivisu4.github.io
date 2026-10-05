'use client';

// components/viz/chutes/RawData.jsx
//
// "View raw data": one hour of traffic matching the dashboard's filters, seen
// two ways side by side --
//
//   Raw requests  real, unaggregated rows read live from the 91 GB trace on S3
//   Rollup rows   the same hour as the 24 MB summary file stores it
//
// so the transformation behind every chart is visible: thousands of raw
// requests become a handful of rollup rows of counts and sums. The hour is
// picked from the rollup (see sampler.js), so a rare filter never comes back
// empty. Portalled for the same stacking-context reason as the filter drawer.
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Info from './Info';
import { downloadCsv } from './exporters';
import { compact, formatDate, formatHod, shortModel } from './constants';

const SIZES = [10, 25, 50];

/** Raw started_at ("1970-02-27T14:13:52.123") -> calendar date (day 0 = 11 Apr 2025) + trace-clock time. */
function when(raw) {
  if (!raw) return { date: '∅', time: '' };
  const ms = Date.parse(`${raw}Z`);
  return { date: formatDate(Math.floor(ms / 86_400_000)), time: raw.slice(11, 19), ms };
}

/** "14:08" for hour 14, minute 8 (minute 60 rolls into the next hour). */
const clock = (hod, min) => {
  const t = hod * 60 + min;
  return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
};

const secs = (ms) => (ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.round(ms)} ms`);

const Null = () => <span className="text-slate-400 dark:text-slate-600">∅</span>;
const num = (v, digits = 0) =>
  v == null ? <Null /> : Number(v).toLocaleString('en-US', { maximumFractionDigits: digits });

const TH = 'px-2 py-1.5 font-semibold';

/** Rollup columns, as stored in chutes.parquet; the title says what each holds. */
const ROLLUP_COLS = [
  { id: 'reqs', title: 'requests in this hour × model × function' },
  { id: 'sum_it', title: 'input tokens, summed' },
  { id: 'n_it', title: 'requests that had an input-token count' },
  { id: 'sum_ot', title: 'output tokens, summed' },
  { id: 'n_ot', title: 'requests that had an output-token count' },
  { id: 'sum_ttft', title: 'time to first token, summed (seconds)', digits: 1 },
  { id: 'n_ttft', title: 'requests that had a TTFT (streaming only)' },
];

/**
 * @param api  { pick(where), rollup({ where, day, hod }), raw({ where, limit, pick }) }
 */
export default function RawData({ open, onClose, getWhere, filterCount, api }) {
  const [limit, setLimit] = useState(10);
  const [tab, setTab] = useState('raw');
  const [hour, setHour] = useState({ status: 'idle' });
  const [roll, setRoll] = useState({ status: 'idle' });
  const [raw, setRaw] = useState({ status: 'idle' });
  const [showSql, setShowSql] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const where = getWhere();
    setHour({ status: 'loading' });
    setRoll({ status: 'loading' });
    setRaw({ status: 'loading' });
    let pick;
    try {
      pick = await api.pick(where);
    } catch (err) {
      const error = String(err?.message ?? err);
      setHour({ status: 'error', error });
      setRoll({ status: 'error', error });
      setRaw({ status: 'error', error });
      return;
    }
    if (!pick) {
      const reason = 'No traffic matches the current filters.';
      setHour({ status: 'empty', reason });
      setRoll({ status: 'empty' });
      setRaw({ status: 'empty' });
      return;
    }
    setHour({ status: 'ready', ...pick });
    // Rollup first: it answers in milliseconds, but DuckDB-WASM runs one
    // statement at a time, so started second it would wait out the S3 setup.
    try {
      setRoll({ status: 'ready', ...(await api.rollup({ where, day: pick.day, hod: pick.hod })) });
    } catch (err) {
      setRoll({ status: 'error', error: String(err?.message ?? err) });
    }
    api
      .raw({ where, limit, pick })
      .then((r) => setRaw({ status: 'ready', ...r }))
      .catch((err) => setRaw({ status: 'error', error: String(err?.message ?? err) }));
  }, [api, getWhere, limit]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  if (!open) return null;

  const active = tab === 'raw' ? raw : roll;
  const rawRows = raw.rows ?? [];
  const rollRows = roll.rows ?? [];
  const rollReqs = rollRows.reduce((a, r) => a + Number(r.reqs), 0);
  const busy = hour.status === 'loading' || raw.status === 'loading';

  const exportCsv = () =>
    tab === 'raw'
      ? downloadCsv(
          'chutes-raw-requests.csv',
          rawRows.map((r) => ({
            date: when(r.started_at).date,
            time_trace_clock: when(r.started_at).time,
            started_at_raw: r.started_at,
            completed_at_raw: r.completed_at,
            model: r.model,
            chute_id: r.chute_id,
            function_name: r.function_name,
            category: r.category,
            input_tokens: r.it,
            output_tokens: r.ot,
            cached_tokens: r.ct,
            ttft_s: r.ttft,
            user_id: r.user_id,
            rehash_round: r.rehash_round,
            instance_id: r.instance_id,
            invocation_id: r.invocation_id,
          })),
        )
      : downloadCsv(
          'chutes-rollup-rows.csv',
          rollRows.map((r) => ({
            date: formatDate(hour.day),
            hour_trace_clock: hour.hod,
            model: r.model,
            function_name: r.func,
            category: r.category,
            streaming: r.streaming,
            ...Object.fromEntries(ROLLUP_COLS.map((c) => [c.id, r[c.id]])),
          })),
        );

  const tabBtn = (id, label, state, count) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={`-mb-px border-b-2 px-3 py-2 text-xs font-semibold ${
        tab === id
          ? 'border-cyan-600 text-cyan-800 dark:border-cyan-400 dark:text-cyan-200'
          : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
      }`}
    >
      {label}
      <span className="ml-1.5 font-normal text-slate-500 dark:text-slate-400">
        {state.status === 'loading' ? '…' : state.status === 'ready' ? count : ''}
      </span>
    </button>
  );

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-slate-950/50 p-4 sm:p-8" role="dialog" aria-label="Raw and rollup data" data-raw-modal>
      <button type="button" aria-label="Close" onClick={onClose} className="fixed inset-0 cursor-default" />
      <div className="relative w-full max-w-6xl rounded-2xl border border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900">
        {/* header: what this is + controls */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-black/5 px-5 py-3 dark:border-white/10">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">The data behind the charts</h3>
          <Info label="About this view">
            One random hour that matches your filters, two ways. Raw requests are read live from the 91 GB parquet on
            AWS S3. Rollup rows are the same hour as stored in the 24 MB summary file every chart reads: one row per
            model × function, holding counts and sums. Dates follow the paper&rsquo;s stated span; hours are on the trace clock.
          </Info>
          <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[11px] text-cyan-800 dark:text-cyan-200">
            {filterCount ? `${filterCount} filter${filterCount === 1 ? '' : 's'} applied` : 'no filters'}
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            {tab === 'raw' && (
              <div className="flex overflow-hidden rounded-lg border border-black/10 text-xs dark:border-white/10" title="Raw requests to sample">
                {SIZES.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setLimit(n)}
                    className={`px-2.5 py-1 ${n === limit ? 'bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900' : 'text-slate-600 dark:text-slate-300'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
            <button type="button" onClick={load} disabled={busy} className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-800 hover:bg-cyan-500/20 disabled:opacity-50 dark:text-cyan-200">
              {busy ? 'Sampling…' : '↻ Another hour'}
            </button>
            <button type="button" onClick={() => setShowSql((v) => !v)} disabled={!active.sql} className="rounded-lg border border-black/10 px-3 py-1 text-xs text-slate-700 disabled:opacity-40 dark:border-white/10 dark:text-slate-300">
              {showSql ? 'Hide SQL' : 'Show SQL'}
            </button>
            <button type="button" onClick={exportCsv} disabled={!(active.rows ?? []).length} className="rounded-lg border border-black/10 px-3 py-1 text-xs text-slate-700 disabled:opacity-40 dark:border-white/10 dark:text-slate-300">
              CSV
            </button>
            <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-slate-500 hover:bg-black/5 dark:hover:bg-white/10" aria-label="Close (Esc)">
              ✕
            </button>
          </div>
        </div>

        {/* the hour, and the transformation in one line */}
        <div className="px-5 pt-2 text-xs text-slate-600 dark:text-slate-300">
          {hour.status === 'loading' && 'Picking an hour that matches your filters…'}
          {hour.status === 'empty' && hour.reason}
          {hour.status === 'error' && <span className="text-rose-600 dark:text-rose-400">{hour.error}</span>}
          {hour.status === 'ready' && (
            <>
              <strong>
                {formatDate(hour.day)}, {formatHod(hour.hod)}–{formatHod(hour.hod + 1)}
              </strong>{' '}
              <span className="text-slate-500 dark:text-slate-400">(trace clock)</span> ·{' '}
              <strong>{compact(hour.matching)}</strong> matching raw requests
              {roll.status === 'ready' && (
                <>
                  {' '}
                  → <strong>{rollRows.length.toLocaleString('en-US')}</strong> rollup row{rollRows.length === 1 ? '' : 's'}
                  <span className="text-slate-500 dark:text-slate-400">
                    {' '}
                    ({Math.round(hour.matching / Math.max(1, rollRows.length)).toLocaleString('en-US')}× fewer)
                  </span>
                </>
              )}
            </>
          )}
        </div>

        <div className="mt-1 flex items-end gap-1 border-b border-black/5 px-4 dark:border-white/10">
          {tabBtn('raw', 'Raw requests · AWS S3', raw, rawRows.length)}
          {tabBtn('rollup', 'Rollup rows · summary file', roll, rollRows.length)}
        </div>

        {/* per-tab status */}
        <div className="px-5 py-2 text-xs text-slate-600 dark:text-slate-300">
          {active.status === 'loading' &&
            (tab === 'raw' ? 'Reading a slice of this hour from the 91 GB parquet on AWS S3…' : 'Reading the rollup…')}
          {active.status === 'error' && <span className="text-rose-600 dark:text-rose-400">{active.error}</span>}
          {active.status === 'ready' && tab === 'raw' && (
            <>
              <strong>{rawRows.length}</strong> random requests from{' '}
              <strong>
                {raw.slice && raw.slice[1] - raw.slice[0] < 60
                  ? `${clock(hour.hod, raw.slice[0])}–${clock(hour.hod, raw.slice[1])}`
                  : 'the whole hour'}
              </strong>{' '}
              <span className="text-slate-500 dark:text-slate-400">
                · read live from AWS S3 by DuckDB in your browser in {secs(raw.ms)}
              </span>
            </>
          )}
          {active.status === 'ready' && tab === 'rollup' && (
            <>
              Every matching request in this hour, as stored in the 24 MB file the charts read: one row per model ×
              function. <strong>{compact(rollReqs)}</strong> requests in {rollRows.length} rows{' '}
              <span className="text-slate-500 dark:text-slate-400">· {secs(roll.ms)}, no network</span>
            </>
          )}
        </div>

        {showSql && active.sql && (
          <div className="mx-5 mb-2 rounded-lg border border-black/10 dark:border-white/10">
            <div className="flex justify-end border-b border-black/5 px-2 py-1 dark:border-white/10">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(active.sql);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  } catch {
                    /* clipboard unavailable */
                  }
                }}
                className="text-[11px] text-cyan-700 dark:text-cyan-300"
              >
                {copied ? 'Copied' : 'Copy SQL'}
              </button>
            </div>
            <pre className="max-h-48 overflow-auto px-3 py-2 font-mono text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">{active.sql}</pre>
          </div>
        )}

        <div className="max-h-[60vh] overflow-auto px-5 pb-4">
          {tab === 'raw' ? (
            <>
              <table className="w-full min-w-[980px] text-xs tabular-nums">
                <thead className="sticky top-0 bg-white dark:bg-slate-900">
                  <tr className="border-b border-black/10 text-[11px] uppercase tracking-wider text-slate-500 dark:border-white/10 dark:text-slate-400">
                    {['Date', 'Time', 'Model', 'Function', 'In tok', 'Out tok', 'Cached', 'TTFT', 'Duration', 'User', 'Instance'].map((h, i) => (
                      <th key={h} className={`${TH} ${i >= 4 && i <= 8 ? 'text-right' : 'text-left'}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rawRows.map((r) => {
                    const s = when(r.started_at);
                    const e = when(r.completed_at);
                    const dur = s.ms != null && e.ms != null ? (e.ms - s.ms) / 1000 : null;
                    return (
                      <tr key={r.invocation_id} className="border-b border-black/5 last:border-0 hover:bg-cyan-500/5 dark:border-white/5">
                        <td className="whitespace-nowrap px-2 py-1 text-slate-800 dark:text-slate-100" title={`stored as ${r.started_at}`}>
                          {s.date}
                        </td>
                        <td className="px-2 py-1 font-mono text-slate-600 dark:text-slate-300">{s.time}</td>
                        <td className="max-w-[16rem] truncate px-2 py-1 text-slate-800 dark:text-slate-100" title={`${r.model}\nchute_id ${r.chute_id}`}>
                          {shortModel(r.model)}
                        </td>
                        <td className="whitespace-nowrap px-2 py-1">
                          <span className="font-mono text-slate-700 dark:text-slate-200">{r.function_name}</span>
                          <span className="ml-1.5 text-[10px] text-slate-400">{r.category}</span>
                        </td>
                        <td className="px-2 py-1 text-right">{num(r.it)}</td>
                        <td className="px-2 py-1 text-right">{num(r.ot)}</td>
                        <td className="px-2 py-1 text-right">{num(r.ct)}</td>
                        <td className="px-2 py-1 text-right">{r.ttft == null ? <Null /> : `${Number(r.ttft).toFixed(2)} s`}</td>
                        <td className="px-2 py-1 text-right">{dur == null ? <Null /> : `${dur.toFixed(2)} s`}</td>
                        <td className="px-2 py-1 font-mono text-[11px] text-slate-500" title={`user_id ${r.user_id} · rehash round ${r.rehash_round}`}>
                          {String(r.user_id ?? '').slice(0, 8)}·r{r.rehash_round}
                        </td>
                        <td className="px-2 py-1 font-mono text-[11px] text-slate-500" title={`instance_id ${r.instance_id}\ninvocation_id ${r.invocation_id}`}>
                          {String(r.instance_id ?? '').slice(0, 8)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400">
                ∅ is a value the trace did not record: TTFT is absent on every non-streaming call, token counts on 7.5%
                of requests, cached tokens on 88%. User ids are anonymized and re-hashed every three months (r = rehash
                round).
              </p>
            </>
          ) : (
            <>
              <table className="w-full min-w-[900px] text-xs tabular-nums">
                <thead className="sticky top-0 bg-white dark:bg-slate-900">
                  <tr className="border-b border-black/10 text-[11px] text-slate-500 dark:border-white/10 dark:text-slate-400">
                    <th className={`${TH} text-left uppercase tracking-wider`}>Model</th>
                    <th className={`${TH} text-left uppercase tracking-wider`}>Function</th>
                    {ROLLUP_COLS.map((c) => (
                      <th key={c.id} className={`${TH} text-right font-mono`} title={c.title}>
                        {c.id}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rollRows.map((r) => (
                    <tr key={`${r.model}|${r.func}`} className="border-b border-black/5 last:border-0 hover:bg-cyan-500/5 dark:border-white/5">
                      <td className="max-w-[16rem] truncate px-2 py-1 text-slate-800 dark:text-slate-100" title={r.model}>
                        {shortModel(r.model)}
                      </td>
                      <td className="whitespace-nowrap px-2 py-1">
                        <span className="font-mono text-slate-700 dark:text-slate-200">{r.func}</span>
                        <span className="ml-1.5 text-[10px] text-slate-400">{r.category}</span>
                      </td>
                      {ROLLUP_COLS.map((c) => (
                        <td key={c.id} className={`px-2 py-1 text-right ${c.id === 'reqs' ? 'font-semibold text-slate-800 dark:text-slate-100' : ''}`}>
                          {num(r[c.id], c.digits ?? 0)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400">
                <span className="font-mono">reqs</span> counts the requests a row stands for;{' '}
                <span className="font-mono">sum_*</span> add up their values;{' '}
                <span className="font-mono">n_*</span> count how many actually had a value. An average is{' '}
                <span className="font-mono">sum / n</span>, never <span className="font-mono">sum / reqs</span>, which is
                why the KPIs stay right when values are missing. Coarser questions (a day, a model family) are just sums
                of these rows. Hover a column for its meaning.
              </p>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
