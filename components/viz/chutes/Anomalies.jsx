'use client';

// components/viz/chutes/Anomalies.jsx
//
// Days where a group's volume broke sharply from its own recent past, found
// with a rule simple enough to state on screen:
//
//   flag day d when value(d) >= 3x, or <= 1/3 of, the median of d-14..d-1
//
// Medians rather than means, so one earlier spike cannot hide the next. A
// volume floor keeps a model going from 12 requests to 40 from being called a
// spike, and the final day is skipped because the trace ends 0.82 of the way
// into it -- a guaranteed false "drop". Consecutive flagged days collapse to
// their strongest, so one outage is one line, not three.
import { useState } from 'react';
import Info from './Info';
import { compact, formatDateShort, labelFor } from './constants';
import { HELP } from './help';

const WINDOW = 14;
const RATIO = 3;
const MAX_ITEMS = 6;

function median(xs) {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/**
 * @param byDay Map(day -> { total, parts: Map(groupKey -> requests) })
 * @param keys  group keys to scan, in color order
 */
export function detectAnomalies(byDay, keys) {
  if (!byDay.size) return [];
  const lastDay = Math.max(...byDay.keys());
  const totals = [...byDay.values()].map((v) => v.total);
  const floor = Math.max(50_000, median(totals) * 0.002);

  const series = [['__total', 'All traffic'], ...keys.map((k) => [k, k])];
  const found = [];

  for (const [key, label] of series) {
    const v = [];
    for (let d = 0; d <= lastDay; d++) {
      const day = byDay.get(d);
      v[d] = day ? (key === '__total' ? day.total : day.parts.get(key) ?? 0) : 0;
    }
    let run = null;
    for (let d = WINDOW; d < lastDay; d++) {
      const base = median(v.slice(d - WINDOW, d));
      if (base < floor) {
        run = null;
        continue;
      }
      const ratio = v[d] / base;
      const kind = ratio >= RATIO ? 'spike' : ratio <= 1 / RATIO ? 'drop' : null;
      if (!kind) {
        run = null;
        continue;
      }
      // Strength on a log scale, capped so a drop to exactly zero is finite.
      const score = Math.min(Math.abs(Math.log(Math.max(ratio, 1e-3))), 7);
      const item = { key, label, day: d, value: v[d], base, ratio, kind, score };
      if (run && run.kind === kind && d === run.last + 1) {
        run.last = d;
        if (score > run.best.score) run.best = item;
      } else {
        run = { kind, last: d, best: item };
        found.push(run);
      }
    }
  }

  // Rank by how sharp the break was AND how much traffic it moved: a 300x
  // collapse in embeddings (0.3% of traffic) should not bury a 4x swing in
  // chat. And at most two per series, so one noisy group cannot fill the list.
  const perKey = new Map();
  return found
    .map((r) => ({ ...r.best, rank: r.best.score * Math.log10(Math.max(r.best.base, 10)) }))
    .sort((a, b) => b.rank - a.rank)
    .filter((a) => {
      const n = perKey.get(a.key) ?? 0;
      perKey.set(a.key, n + 1);
      return n < 2;
    })
    .slice(0, MAX_ITEMS);
}

const SHOWN = 4;
const ROW_H = 22; // one row: text-xs line + py-0.5 + the list's 2px gap

export default function Anomalies({ items, groupCol, colors, onFocus }) {
  const [all, setAll] = useState(false);
  const shown = all ? items : items.slice(0, SHOWN);
  return (
    <div className="rounded-xl border border-black/5 bg-white/80 px-3 py-2 dark:border-white/10 dark:bg-slate-900/60">
      <div className="mb-1 flex flex-wrap items-baseline gap-x-2">
        <h4 className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100">
          Anomalies <Info label="About anomalies">{HELP.anomalies}</Info>
        </h4>
        <span className="text-[10px] text-slate-500 dark:text-slate-400">
          ≥3× or ≤⅓ of the prior 14-day median · click to zoom
        </span>
      </div>
      {/* Room for SHOWN rows whether there are 0 or 6, so the panel -- and
          everything below it -- holds still while filters or Play change it. */}
      <div style={{ minHeight: all ? undefined : SHOWN * ROW_H }}>
      {items.length === 0 ? (
        <p className="py-2 text-[11px] text-slate-400">None in the current view.</p>
      ) : (
        <ul className="space-y-0.5">
          {shown.map((a) => (
            <li key={`${a.key}-${a.day}`}>
              <button
                type="button"
                onClick={() => onFocus(a.day)}
                className="flex w-full items-center gap-2 rounded-md px-1.5 py-0.5 text-left text-xs hover:bg-black/5 dark:hover:bg-white/5"
              >
                <span
                  className={`w-4 shrink-0 font-bold ${
                    a.kind === 'spike' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {a.kind === 'spike' ? '▲' : '▼'}
                </span>
                <span className="w-16 shrink-0 tabular-nums text-slate-500 dark:text-slate-400" title={`trace day ${a.day}`}>
                  {formatDateShort(a.day)}
                </span>
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ background: a.key === '__total' ? '#64748b' : colors.get(a.key) ?? '#94a3b8' }}
                />
                <span className="min-w-0 flex-1 truncate text-slate-800 dark:text-slate-100">
                  {a.key === '__total' ? a.label : labelFor(groupCol, a.label)}
                </span>
                <span className="shrink-0 tabular-nums text-slate-600 dark:text-slate-300">
                  {a.ratio >= 1 ? `${a.ratio.toFixed(1)}×` : a.value === 0 ? 'to zero' : `${(a.ratio * 100).toFixed(0)}%`}
                </span>
                <span className="w-24 shrink-0 text-right tabular-nums text-[11px] text-slate-400 dark:text-slate-500">
                  {compact(a.value)} vs {compact(a.base)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      </div>
      {/* Always rendered; hidden rather than removed when there is no more. */}
      <button
        type="button"
        onClick={() => setAll((v) => !v)}
        className={`mt-0.5 px-1.5 text-[11px] text-cyan-700 hover:underline dark:text-cyan-300 ${
          items.length > SHOWN ? '' : 'invisible'
        }`}
        tabIndex={items.length > SHOWN ? 0 : -1}
      >
        {all ? 'Show fewer' : `+${Math.max(0, items.length - SHOWN)} more`}
      </button>
    </div>
  );
}
