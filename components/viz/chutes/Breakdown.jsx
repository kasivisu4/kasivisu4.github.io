'use client';

// components/viz/chutes/Breakdown.jsx
//
// The grouping, as a table: one row per group under the current filters, in
// the colors the charts stack by. It is the legend and the numbers at once,
// and a row is also a filter -- click one to narrow everything to it.
//
// Averages divide by each group's *measured* requests (n_it, n_ttft), not all
// of them, for the reasons in the post's caveats; the coverage
// columns say how many that was, because for some groups it is almost none.
// Folded "Other" buckets stay at the bottom whatever the sort.
import { useState } from 'react';
import Info from './Info';
import { OTHER_BUCKETS, compact, labelFor, pct } from './constants';
import { HELP } from './help';

function Cov({ value }) {
  if (value == null) return <span className="opacity-40">—</span>;
  const p = value * 100;
  return (
    <span className={p < 50 ? 'text-amber-600 dark:text-amber-400' : undefined}>
      {p < 1 && p > 0 ? '<1' : p.toFixed(0)}%
    </span>
  );
}

const COLUMNS = [
  { id: 'key', label: null, align: 'left' },
  { id: 'reqs', label: 'Requests', align: 'right' },
  { id: 'share', label: 'Share of requests', align: 'left', width: 'w-48' },
  { id: 'tokens', label: '% of tokens', align: 'right', title: 'share of input + output tokens' },
  { id: 'avgIn', label: 'Avg in', align: 'right' },
  { id: 'avgOut', label: 'Avg out', align: 'right' },
  { id: 'tokenCov', label: 'Tokens counted', align: 'right', title: 'share of requests with token counts', more: true },
  { id: 'ttft', label: 'TTFT', align: 'right', title: 'streaming calls only' },
  { id: 'ttftCov', label: 'TTFT measured', align: 'right', title: 'share of requests with a TTFT', more: true },
];

/** A value tinted amber when the share it was measured on is under half. */
function Thin({ cov, children }) {
  return (
    <span
      className={cov != null && cov < 0.5 ? 'text-amber-600 dark:text-amber-400' : undefined}
      title={cov != null ? `measured on ${(cov * 100).toFixed(cov < 0.01 ? 2 : 0)}% of requests` : undefined}
    >
      {children}
    </span>
  );
}

const EMPTY = { reqs: 0, tokens: 0, avgIn: null, avgOut: null, tokenCov: null, ttft: null, ttftCov: null };

export default function Breakdown({ group, rows: found, keys = [], colors, selected, onToggle, dense = false }) {
  const [sort, setSort] = useState({ id: 'reqs', dir: -1 });
  // One row per group every time, zeros included. A group with no requests
  // under the current filters drops out of the query result; leaving its row
  // out too made the table -- and the page below it -- change height with
  // every filter and every Play frame.
  const byKey = new Map(found.map((r) => [r.key, r]));
  const rows = [
    ...keys.map((k) => byKey.get(k) ?? { key: k, ...EMPTY }),
    ...found.filter((r) => !keys.includes(r.key)),
  ];
  // The coverage columns are for checking an average, not for scanning, so
  // they start hidden; a thinly measured average is tinted amber instead.
  const [more, setMore] = useState(false);
  const columns = COLUMNS.filter((c) => more || !c.more);
  const cell = dense ? 'px-2.5 py-0.5' : 'px-3 py-1';
  const total = rows.reduce((a, r) => a + r.reqs, 0);
  const totalTokens = rows.reduce((a, r) => a + r.tokens, 0);
  const max = Math.max(1, ...rows.map((r) => r.reqs));

  const value = (r, id) =>
    id === 'share' ? r.reqs : id === 'key' ? String(labelFor(group.col, r.key)) : r[id];
  const sorted = [...rows].sort((a, b) => {
    const folded = OTHER_BUCKETS.has(a.key) - OTHER_BUCKETS.has(b.key);
    if (folded) return folded;
    const va = value(a, sort.id);
    const vb = value(b, sort.id);
    if (va == null && vb == null) return 0;
    if (va == null) return 1; // missing values sink, whatever the direction
    if (vb == null) return -1;
    return (typeof va === 'string' ? va.localeCompare(vb) : va - vb) * sort.dir;
  });

  const header = (c) => {
    const active = sort.id === c.id;
    return (
      <th
        key={c.id}
        title={c.title}
        className={`${dense ? 'px-2.5 py-1.5' : 'px-3 py-2'} font-semibold ${c.align === 'right' ? 'text-right' : 'text-left'} ${c.width ?? ''}`}
      >
        <button
          type="button"
          onClick={() =>
            setSort((s) => ({ id: c.id, dir: s.id === c.id ? -s.dir : c.id === 'key' ? 1 : -1 }))
          }
          className={`inline-flex items-center gap-1 uppercase tracking-wider hover:text-slate-800 dark:hover:text-slate-100 ${
            active ? 'text-cyan-700 dark:text-cyan-300' : ''
          }`}
        >
          {c.label ?? group.label}
          <span aria-hidden="true" className={active ? '' : 'opacity-0'}>
            {sort.dir < 0 ? '↓' : '↑'}
          </span>
        </button>
        {c.id === 'key' && (
          <span className="ml-1.5 inline-flex align-middle normal-case tracking-normal">
            <Info label="About this table">{HELP.table}</Info>
          </span>
        )}
      </th>
    );
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-black/5 bg-white/80 dark:border-white/10 dark:bg-slate-900/60">
      <table className={`w-full ${more ? 'min-w-[820px]' : 'min-w-[640px]'} ${dense ? 'text-[11px]' : 'text-xs'} tabular-nums`}>
        <thead>
          <tr className="border-b border-black/5 text-[11px] text-slate-500 dark:border-white/10 dark:text-slate-400">
            {columns.map(header)}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => {
            const folded = OTHER_BUCKETS.has(r.key);
            const on = selected.includes(r.key);
            const color = colors.get(r.key) ?? '#94a3b8';
            return (
              <tr
                key={r.key}
                onClick={folded ? undefined : () => onToggle(r.key)}
                title={
                  folded
                    ? 'A remainder bucket — filter its members from the sidebar'
                    : on
                      ? 'Click to remove this filter'
                      : 'Click to filter the dashboard to this group'
                }
                className={`border-b border-black/5 last:border-0 dark:border-white/5 ${
                  folded ? '' : 'cursor-pointer hover:bg-cyan-500/5'
                } ${on ? 'bg-cyan-500/10' : ''} ${r.reqs ? '' : 'opacity-40'}`}
              >
                <td className={cell}>
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: color }} />
                    <span
                      className={`truncate font-medium ${
                        folded ? 'italic text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-slate-100'
                      }`}
                      title={String(r.key)}
                    >
                      {labelFor(group.col, r.key)}
                    </span>
                    {on && <span className="text-cyan-600 dark:text-cyan-300">✓</span>}
                  </span>
                </td>
                <td className={`${cell} text-right font-semibold text-slate-800 dark:text-slate-100`}>
                  {r.reqs ? compact(r.reqs) : '0'}
                </td>
                <td className={cell}>
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                      <span
                        className="block h-full rounded-full"
                        style={{ width: `${(r.reqs / max) * 100}%`, background: color }}
                      />
                    </span>
                    <span className="w-12 text-right text-slate-700 dark:text-slate-200">{pct(r.reqs, total)}</span>
                  </span>
                </td>
                <td className={`${cell} text-right`}>{r.tokens ? pct(r.tokens, totalTokens) : '—'}</td>
                <td className={`${cell} text-right`}><Thin cov={r.tokenCov}>{r.avgIn != null ? compact(r.avgIn) : '—'}</Thin></td>
                <td className={`${cell} text-right`}><Thin cov={r.tokenCov}>{r.avgOut != null ? compact(r.avgOut) : '—'}</Thin></td>
                {more && (
                  <td className={`${cell} text-right`}>
                    <Cov value={r.tokenCov} />
                  </td>
                )}
                <td className={`${cell} text-right`}><Thin cov={r.ttftCov}>{r.ttft != null ? `${r.ttft.toFixed(2)} s` : '—'}</Thin></td>
                {more && (
                  <td className={`${cell} text-right`}>
                    <Cov value={r.ttftCov} />
                  </td>
                )}
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-6 text-center text-slate-400">
                Nothing matches the current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="flex flex-wrap items-center gap-x-3 border-t border-black/5 px-3 py-1 text-[10px] text-slate-500 dark:border-white/10 dark:text-slate-400">
        <span>
          Click a column to sort, a row to filter. Averages use measured requests only; amber means under 50%
          were measured.
        </span>
        <button
          type="button"
          onClick={() => setMore((v) => !v)}
          className="ml-auto rounded px-1.5 py-0.5 font-medium text-cyan-700 hover:bg-cyan-500/10 dark:text-cyan-300"
        >
          {more ? 'Fewer columns' : 'More columns'}
        </button>
      </div>
    </div>
  );
}
