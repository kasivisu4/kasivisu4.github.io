// components/viz/chutes/clauses.js
//
// Turns Mosaic selection clauses into readouts a person can check -- the Chutes
// counterpart of nycTaxi/projection.js's describeClause. The units here are
// days and hours of the trace clock rather than map coordinates.
import { formatDateShort, formatHod, shortModel } from './constants';

const fieldNames = (clause) =>
  (clause.fields ?? [clause.field ?? '']).map((f) => String(f).replace(/"/g, ''));

/** A clause on `day` alone: the period, Play, a timeline brush, a clicked cell's day. */
export const isDayOnly = (clause) => {
  const names = fieldNames(clause);
  return names.length === 1 && names[0] === 'day';
};

/**
 * The days every clause still allows -- the intersection of each clause's day
 * interval, heatmap brushes included -- or null when nothing limits days.
 * `skip` leaves one source out (Play asks where it may sweep, not where it is).
 */
export function dayExtent(clauses, skip = null) {
  let lo = -Infinity;
  let hi = Infinity;
  for (const clause of clauses ?? []) {
    if (skip && clause.source === skip) continue;
    const names = fieldNames(clause);
    const i = names.indexOf('day');
    const value = clause.value;
    if (i < 0 || !Array.isArray(value) || !value.length) continue;
    const range = names.length === 1 ? value : value[i];
    if (!Array.isArray(range) || range.length !== 2) continue;
    lo = Math.max(lo, Number(range[0]));
    hi = Math.min(hi, Number(range[1]));
  }
  return Number.isFinite(lo) || Number.isFinite(hi) ? [lo, hi] : null;
}

export function describeClause(clause) {
  // Filter-bar clauses are already shown, as checked chips and pills, in the
  // bar itself; repeating them here would say the same thing twice.
  // Period and click selections likewise have their own chips.
  const id = String(clause.source?.id ?? '');
  // Play has its own Playing / Paused chip.
  if (id.startsWith('filter-') || id === 'period' || id.startsWith('click-') || id === 'chutes-play') return null;
  const names = fieldNames(clause);
  const value = clause.value;
  if (value == null || (Array.isArray(value) && value.length === 0)) return null;

  // Heatmap brush: two intervals, day by hour.
  if (names.length === 2 && names.includes('day') && names.includes('hod')) {
    const [[d0, d1], [h0, h1]] = value;
    return {
      key: 'heat',
      label: 'Days × hours',
      value: `${formatDateShort(d0)} – ${formatDateShort(d1)} · ${formatHod(h0)}–${formatHod(Math.ceil(h1))}`,
      detail: `day BETWEEN ${d0.toFixed(1)} AND ${d1.toFixed(1)} AND hod BETWEEN ${h0.toFixed(1)} AND ${h1.toFixed(1)}`,
    };
  }

  if (names[0] === 'day') {
    const [lo, hi] = value;
    return {
      key: `day-${clause.source?.id ?? 'brush'}`,
      label: clause.source?.id === 'chutes-play' ? 'Playing' : 'Days',
      value: `${formatDateShort(lo)} – ${formatDateShort(hi)}`,
      detail: `${(hi - lo).toFixed(1)} days · day BETWEEN ${lo.toFixed(1)} AND ${hi.toFixed(1)}`,
    };
  }

  if (names[0] === 'hod') {
    const [lo, hi] = value;
    return {
      key: 'hod',
      label: 'Hours',
      value: `${formatHod(lo)} – ${formatHod(Math.ceil(hi))}`,
      detail: `hod BETWEEN ${lo.toFixed(2)} AND ${hi.toFixed(2)} (trace clock)`,
    };
  }

  // Bar toggles: point clauses whose value is a list of one-element tuples.
  const picked = Array.isArray(value) ? value.map((v) => (Array.isArray(v) ? v[0] : v)) : [];
  const hint = 'shift-click a bar to add, click again to clear';

  if (names[0] === 'model') {
    return {
      key: 'model',
      label: picked.length > 1 ? `${picked.length} models` : 'Model',
      value: picked.map(shortModel).join(', '),
      detail: hint,
    };
  }

  if (names[0] === 'endpoint') {
    return {
      key: 'endpoint',
      label: picked.length > 1 ? `${picked.length} endpoints` : 'Endpoint',
      value: picked.join(', '),
      detail: hint,
    };
  }

  if (names[0] === 'streaming') {
    return {
      key: 'streaming',
      label: 'Delivery',
      value: picked.join(', '),
      detail: picked.includes('Non-streaming')
        ? 'non-streaming calls carry no TTFT'
        : hint,
    };
  }

  return null;
}
