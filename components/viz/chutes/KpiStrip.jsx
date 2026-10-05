'use client';

// components/viz/chutes/KpiStrip.jsx
//
// The five headline numbers, pinned to the top while the page scrolls.
//
// Each card carries a weekly sparkline and a trend arrow: the last N days of
// the current selection against the N days before them. Ratio metrics (avg
// tokens, TTFT) are recomputed from sums and measured counts in each window,
// never averaged from averages. Only TTFT gets a good/bad color -- a rise in
// requests or tokens is not a problem in itself, a rise in latency is.
import Info from './Info';
import { COMPARE_WINDOWS, compact } from './constants';
import { HELP } from './help';

function Sparkline({ values, className }) {
  const pts = values.filter((v) => v != null && Number.isFinite(v));
  if (pts.length < 2) return <svg width="96" height="26" className="max-w-full" aria-hidden="true" />;
  const lo = Math.min(...pts);
  const hi = Math.max(...pts);
  const span = hi - lo || 1;
  const step = 96 / (values.length - 1);
  const d = values
    .map((v, i) =>
      v == null || !Number.isFinite(v) ? null : `${(i * step).toFixed(1)},${(26 - ((v - lo) / span) * 24).toFixed(1)}`,
    )
    .filter(Boolean)
    .join(' ');
  return (
    // Shrinks with a narrow card instead of pushing the number onto two lines.
    <svg width="96" height="26" viewBox="0 0 96 28" preserveAspectRatio="none" className={`max-w-full ${className ?? ''}`} aria-hidden="true">
      <polyline points={d} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

/** Sums over days in (lo, hi]. */
function windowSums(daily, lo, hi) {
  const s = { reqs: 0, it: 0, nit: 0, ot: 0, nout: 0, ttft: 0, nttft: 0, days: 0 };
  for (const r of daily) {
    if (r.d > lo && r.d <= hi) {
      for (const k of Object.keys(s)) if (k !== 'days') s[k] += r[k];
      s.days++;
    }
  }
  return s;
}

const METRICS = {
  reqs: (s) => s.reqs,
  avgIn: (s) => (s.nit ? s.it / s.nit : null),
  avgOut: (s) => (s.nout ? s.ot / s.nout : null),
  ttft: (s) => (s.nttft ? s.ttft / s.nttft : null),
};

/** Weekly values over days in [from, to]; daily ones for spans under ten weeks. */
function series(daily, metric, from, to) {
  const days = daily.filter((r) => r.d >= from && r.d <= to);
  if (!days.length) return [];
  if (to - from < 70) return days.map((r) => METRICS[metric](r));
  const byWeek = new Map();
  for (const r of days) {
    const w = Math.floor(r.d / 7);
    const s = byWeek.get(w) ?? { reqs: 0, it: 0, nit: 0, ot: 0, nout: 0, ttft: 0, nttft: 0 };
    for (const k of Object.keys(s)) s[k] += r[k];
    byWeek.set(w, s);
  }
  return [...byWeek.keys()].sort((a, b) => a - b).map((w) => METRICS[metric](byWeek.get(w)));
}

function Delta({ now, before, invert, n }) {
  if (now == null || before == null || !before) {
    return (
      <span className="text-[11px] text-slate-400 dark:text-slate-500" title={`no traffic in the ${n} days before this window`}>
        no prior {n}d
      </span>
    );
  }
  const change = (now - before) / before;
  const up = change >= 0;
  const bad = invert ? up : false;
  const good = invert ? !up : false;
  const tone = bad
    ? 'text-rose-600 dark:text-rose-400'
    : good
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-slate-600 dark:text-slate-300';
  return (
    <span className={`text-[11px] font-semibold tabular-nums ${tone}`} title={`Change: the last ${n} days of the selection vs the ${n} days before them`}>
      {up ? '▲' : '▼'} {Math.abs(change * 100).toFixed(1)}%
    </span>
  );
}

function Card({ label, help, value, sub, spark, delta, accent }) {
  return (
    <div
      className={`min-w-0 rounded-xl border px-3.5 py-2 ${
        accent
          ? 'border-cyan-500/40 bg-cyan-500/10'
          : 'border-black/5 dark:border-white/10 bg-white/90 dark:bg-slate-900/80'
      }`}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
        {help && <Info label={`About ${label}`}>{help}</Info>}
      </div>
      <div className="flex items-end justify-between gap-2">
        <div
          className={`shrink-0 whitespace-nowrap font-display text-[1.5rem] font-bold leading-tight tabular-nums ${
            accent ? 'text-cyan-700 dark:text-cyan-300' : 'text-slate-900 dark:text-slate-100'
          }`}
        >
          {value}
        </div>
        {/* Hidden on phones: two cards to a row leave no room beside the number. */}
        <div className="hidden min-w-0 justify-end sm:flex">{spark}</div>
      </div>
      {/* One line, always: a wrapping trend label ("no prior 14d" becoming
          "▲ 28.2% vs prior 14d" mid-Play) changed the card's height and
          shifted every control below the strip. */}
      <div className="flex flex-wrap items-center justify-between gap-x-2 text-xs text-slate-500 dark:text-slate-400 sm:flex-nowrap sm:whitespace-nowrap">
        <span className="min-w-0 sm:truncate" title={typeof sub === 'string' ? sub : undefined}>{sub}</span>
        <span className="shrink-0">{delta}</span>
      </div>
    </div>
  );
}

export default function KpiStrip({
  kpis,
  daily,
  dayWin,
  total,
  lastFrame,
  frameHistory,
  compareN,
  onCompareN,
  activeCount,
  compactMode,
  onCompact,
}) {
  // `daily` spans every day the non-date filters allow; `dayWin` is the days
  // the period, Play, a brush or a clicked day narrow it to. Compare the last
  // n days of that window with the n days right before it -- which may lie
  // outside the window: a 14-day Play frame is compared with the 14 days
  // before it, not reported as having no prior 90.
  const maxD = daily.length ? Math.max(...daily.map((r) => r.d)) : 0;
  const first = Math.max(0, Math.floor(dayWin?.[0] ?? 0));
  const last = Math.min(maxD, Math.ceil(dayWin?.[1] ?? maxD + 1) - 1);
  const n = Math.max(1, Math.min(compareN, last - first + 1));
  const now = windowSums(daily, last - n, last);
  const before = windowSums(daily, last - 2 * n, last - n);
  // A prior window mostly without traffic (the trace's first days, or the
  // two-day outage) would compare a full window against a sliver.
  const hasPrior = last - 2 * n + 1 >= 0 && before.days >= n * 0.8;
  const d = (m, invert = false) => (
    <Delta now={METRICS[m](now)} before={hasPrior ? METRICS[m](before) : null} invert={invert} n={n} />
  );
  // Sparklines show the window, reaching back far enough to include the
  // period it is compared with.
  const sparkFrom = Math.max(0, Math.min(first, last - 2 * n + 1));
  const spark = (m) => series(daily, m, sparkFrom, last);
  const sparkTone = 'text-cyan-600/80 dark:text-cyan-300/80';

  return (
    // Pinned from tablet width up; on a phone five cards would cover a third of the screen.
    <div className="z-20 -mx-2 mb-4 rounded-2xl md:sticky md:top-16 bg-slate-50/90 px-2 py-2 backdrop-blur-md dark:bg-slate-950/85">
      <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[11px] text-slate-500 dark:text-slate-400">
        {activeCount > 0 && kpis && total ? (
          <span className="tabular-nums text-slate-700 dark:text-slate-200">
            Showing <strong>{compact(kpis.reqs)}</strong> of {compact(total)} requests (
            {((kpis.reqs / total) * 100).toFixed(kpis.reqs / total < 0.001 ? 3 : 1)}%) · {activeCount} filter
            {activeCount === 1 ? '' : 's'} ·{' '}
            <span className="text-slate-500 dark:text-slate-400">
              <kbd>Esc</kbd> clears
            </span>
          </span>
        ) : (
          <span>All requests · no filters</span>
        )}
        <label className="ml-auto flex cursor-pointer items-center gap-1.5">
          <input type="checkbox" checked={compactMode} onChange={(e) => onCompact(e.target.checked)} className="accent-cyan-600" />
          Compact
        </label>
        <Info label="About compact mode">{HELP.compact}</Info>
        <span className="flex items-center gap-1">
          Trend window <Info label="About the trend window">{HELP.trend}</Info>
        </span>
        {COMPARE_WINDOWS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onCompareN(n)}
            className={`rounded px-1.5 py-0.5 ${
              n === compareN
                ? 'bg-cyan-600 text-white'
                : 'hover:bg-black/5 dark:hover:bg-white/10'
            }`}
          >
            {n}d
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-5">
        <Card
          label="Requests"
          help={HELP.requests}
          value={kpis ? compact(kpis.reqs) : '—'}
          sub={kpis && total ? `${((kpis.reqs / total) * 100).toFixed(1)}% of year` : ' '}
          spark={<Sparkline values={spark('reqs')} className={sparkTone} />}
          delta={d('reqs')}
        />
        <Card
          label="Avg input"
          help={HELP.avgIn}
          value={kpis?.avgIn != null ? compact(kpis.avgIn) : '—'}
          sub={kpis?.tokenCov != null ? `on ${(kpis.tokenCov * 100).toFixed(0)}% of reqs` : 'tokens'}
          spark={<Sparkline values={spark('avgIn')} className={sparkTone} />}
          delta={d('avgIn')}
        />
        <Card
          label="Avg output"
          help={HELP.avgOut}
          value={kpis?.avgOut != null ? compact(kpis.avgOut) : '—'}
          sub="tokens per request"
          spark={<Sparkline values={spark('avgOut')} className={sparkTone} />}
          delta={d('avgOut')}
        />
        <Card
          label="Avg TTFT · streaming"
          help={HELP.ttft}
          value={kpis?.ttft != null ? `${kpis.ttft.toFixed(2)} s` : '—'}
          sub={
            kpis == null
              ? ' '
              : kpis.ttft == null
                ? 'no streaming calls'
                : `on ${(kpis.ttftCov * 100).toFixed(0)}% of reqs`
          }
          spark={<Sparkline values={spark('ttft')} className={sparkTone} />}
          delta={d('ttft', true)}
        />
        <Card
          label="Last interaction"
          help={HELP.last}
          accent
          value={lastFrame ? `${lastFrame.ms.toFixed(0)} ms` : '—'}
          sub={
            lastFrame
              ? `${lastFrame.queries} queries · ${
                  lastFrame.path === 'build' ? 'built cubes' : lastFrame.path === 'cube' ? 'from cubes' : 'rollup scan'
                }`
              : 'filter or brush to measure'
          }
          spark={<Sparkline values={frameHistory} className="text-cyan-600 dark:text-cyan-300" />}
          delta={null}
        />
      </div>
    </div>
  );
}
