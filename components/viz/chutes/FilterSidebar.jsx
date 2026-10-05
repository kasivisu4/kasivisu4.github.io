'use client';

// components/viz/chutes/FilterSidebar.jsx
//
// The filter sidebar: every dimension multi-select, every option showing what
// it would keep under the *other* filters (Mosaic count clients, each excluded
// from its own clause -- how faceted search behaves), with a proportional bar
// so dominance reads at a glance.
//
// Built to stay short. Each dimension is an accordion; no list shows more than
// eight options until asked; Function (98) and Model (201) lead with search
// and "top 10 / top 20 by volume". Active filters sit in a pinned summary at
// the top, each removable in one click, so nothing has to be scrolled back to.
//
// Options that would empty the selection are dimmed, never removed, so the
// list does not reshuffle under the cursor.
import { useMemo, useState } from 'react';
import Info from './Info';
import { compact, labelFor, pct } from './constants';
import { HELP } from './help';

// Open by default: the short dimensions people filter on first, and saved
// views. Function (98) and Model (201) start closed -- they are reached by
// search, and an open section's search box is one Tab away anyway.
const OPEN_BY_DEFAULT = new Set(['category', 'streaming', 'mtype', 'family']);

// Rows shown before "Show all". The searchable lists (98 functions, 201
// models) show none until asked: they are entered by search or top-N, and
// only what is already selected stays listed.
const VISIBLE = 8;
const VISIBLE_SEARCHABLE = 0;

function OptionRow({ label, title, count, total, selected, onToggle }) {
  const share = total ? count / total : 0;
  const empty = !selected && count === 0;
  return (
    <label
      title={title}
      className={`relative flex cursor-pointer items-center gap-2 overflow-hidden rounded-md px-2 py-[3px] text-xs ${
        empty ? 'cursor-not-allowed text-slate-400 dark:text-slate-600' : 'text-slate-700 dark:text-slate-200'
      } ${selected ? 'ring-1 ring-cyan-500/50' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 rounded-md bg-cyan-400"
        style={{ width: `${Math.max(share * 100, count > 0 ? 1.5 : 0)}%`, opacity: selected ? 0.35 : 0.16 }}
      />
      <input
        type="checkbox"
        checked={selected}
        disabled={empty}
        onChange={onToggle}
        className="relative accent-cyan-600"
      />
      <span className="relative min-w-0 flex-1 truncate font-medium">{label}</span>
      <span className="relative shrink-0 tabular-nums text-[11px] opacity-80">
        {compact(count)} · {pct(count, total)}
      </span>
    </label>
  );
}

/**
 * One dimension's option list. `searchable` adds the search box and top-N
 * buttons. Either way at most eight rows show until "Show all", and selected
 * options are always visible even when they rank below the cut.
 */
function OptionList({ filter, options, live, dimTotal, selected, onChange, searchable }) {
  const [q, setQ] = useState('');
  const [all, setAll] = useState(false);
  const cap = searchable ? VISIBLE_SEARCHABLE : VISIBLE;

  const ranked = useMemo(
    () =>
      searchable
        ? options
            .map((o) => ({ ...o, live: live.get(o.key) ?? 0 }))
            .sort((a, b) => b.live - a.live || b.total - a.total)
        : // Short lists keep their all-year order, so a row never moves.
          options.map((o) => ({ ...o, live: live.get(o.key) ?? 0 })),
    [options, live, searchable],
  );

  const needle = q.trim().toLowerCase();
  const matched = ranked.filter((o) => !needle || String(o.key).toLowerCase().includes(needle));
  const head = needle || all ? matched : matched.slice(0, cap);
  const pinned = needle || all ? [] : matched.slice(cap).filter((o) => selected.includes(o.key));
  const shown = [...head, ...pinned];
  const toggle = (key) =>
    onChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);

  return (
    <div>
      {searchable && (
        <>
          <div className="mb-1 flex flex-wrap items-center gap-1">
            {[10, 20].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange(ranked.filter((o) => o.live > 0).slice(0, n).map((o) => o.key))}
                className="rounded-md border border-black/10 px-2 py-0.5 text-[11px] text-slate-600 hover:border-cyan-500/50 dark:border-white/10 dark:text-slate-300"
              >
                Top {n}
              </button>
            ))}
            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="rounded-md px-2 py-0.5 text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-100"
              >
                clear {selected.length}
              </button>
            )}
          </div>
          <input
            data-filter-search={filter.dim}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.stopPropagation(); // Esc here clears the search, not every filter
                setQ('');
                e.currentTarget.blur();
              }
            }}
            placeholder={`Search ${options.length} ${filter.label.toLowerCase()}s…  ( / )`}
            className="mb-1 w-full rounded-md border border-black/10 bg-white/80 px-2 py-1 text-xs text-slate-800 outline-none focus:border-cyan-500/50 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-200"
          />
        </>
      )}
      <div className={`space-y-0.5 ${needle || all ? 'max-h-60 overflow-y-auto pr-1' : ''}`}>
        {shown.map((o) => (
          <OptionRow
            key={o.key}
            label={labelFor(filter.dim, o.key)}
            title={String(o.key)}
            count={o.live}
            total={dimTotal}
            selected={selected.includes(o.key)}
            onToggle={() => toggle(o.key)}
          />
        ))}
        {shown.length === 0 && <p className="px-2 py-1.5 text-[11px] text-slate-400">No match.</p>}
      </div>
      {!needle && matched.length > cap && (
        <button
          type="button"
          onClick={() => setAll((v) => !v)}
          className="mt-0.5 px-2 text-[11px] text-cyan-700 hover:underline dark:text-cyan-300"
        >
          {all ? (cap ? `Show top ${cap}` : 'Hide list') : cap ? `Show all ${matched.length}` : `Browse all ${matched.length}`}
        </button>
      )}
    </div>
  );
}

function SavedViews({ saved, onSave, onLoad, onDelete, onCopyLink, copied }) {
  const [name, setName] = useState('');
  return (
    <div className="space-y-1.5">
      <form
        className="flex gap-1"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) {
            onSave(name.trim());
            setName('');
          }
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name this view…"
          className="min-w-0 flex-1 rounded-md border border-black/10 bg-white/80 px-2 py-1 text-xs text-slate-800 outline-none focus:border-cyan-500/50 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-200"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="rounded-md bg-cyan-600 px-2 py-1 text-[11px] font-medium text-white disabled:opacity-40"
        >
          Save
        </button>
      </form>
      <button
        type="button"
        onClick={onCopyLink}
        className="w-full rounded-md border border-black/10 px-2 py-1 text-[11px] text-slate-600 hover:border-cyan-500/50 dark:border-white/10 dark:text-slate-300"
      >
        {copied ? 'Link copied' : 'Copy link to this view'}
      </button>
      {saved.map((v) => (
        <div key={v.name} className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => onLoad(v)}
            className="min-w-0 flex-1 truncate rounded-md px-2 py-1 text-left text-slate-700 hover:bg-black/5 dark:text-slate-200 dark:hover:bg-white/5"
          >
            {v.name}
          </button>
          <button
            type="button"
            onClick={() => onDelete(v.name)}
            title="Delete saved view"
            className="rounded px-1.5 text-slate-400 hover:text-rose-500"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

function Section({ title, hint, help, badge, open, onToggle, children }) {
  return (
    <section className="border-b border-black/5 pb-2 last:border-0 dark:border-white/10">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left"
        >
          <span className={`text-[10px] text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`}>▶</span>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">{title}</span>
          {badge > 0 && (
            <span className="rounded-full bg-cyan-600 px-1.5 text-[10px] font-semibold text-white">{badge}</span>
          )}
          <span className="ml-auto truncate text-[10px] text-slate-400 dark:text-slate-500">{hint}</span>
        </button>
        {help && <Info label={`About ${title}`}>{help}</Info>}
      </div>
      {open && <div className="pt-0.5">{children}</div>}
    </section>
  );
}

export default function FilterSidebar({
  filters,
  options,
  counts,
  selected,
  onChange,
  chips,
  onClearAll,
  onClose,
  closeLabel,
  saved,
  onSaveView,
  onLoadView,
  onDeleteView,
  onCopyLink,
  copied,
}) {
  const [open, setOpen] = useState(() => Object.fromEntries(filters.map((f) => [f.dim, OPEN_BY_DEFAULT.has(f.dim)])));
  const [viewsOpen, setViewsOpen] = useState(true);

  return (
    <div className="rounded-xl border border-black/5 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
      {/* pinned: title, and every active filter as a one-click chip */}
      <div className="sticky top-0 z-10 rounded-t-xl border-b border-black/5 bg-white/95 p-3 backdrop-blur dark:border-white/10 dark:bg-slate-900/95">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Filters</span>
          <Info label="About filters">{HELP.activeFilters}</Info>
          {chips.length > 0 && (
            <span className="rounded-full bg-cyan-600 px-1.5 text-[11px] font-semibold text-white">{chips.length}</span>
          )}
          <div className="ml-auto flex items-center gap-1">
            {chips.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                title="Clear all filters (Esc)"
                className="rounded-md px-2 py-0.5 text-[11px] text-slate-600 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10"
              >
                Clear all
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              title={closeLabel}
              className="rounded-md px-1.5 py-0.5 text-slate-500 hover:bg-black/5 dark:hover:bg-white/10"
            >
              {closeLabel === 'Close' ? '×' : '«'}
            </button>
          </div>
        </div>
        {chips.length > 0 ? (
          <div className="mt-2 flex max-h-24 flex-wrap gap-1 overflow-y-auto">
            {chips.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={c.onRemove}
                title="Remove this filter"
                className="inline-flex max-w-full items-center gap-1 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-[11px] text-slate-700 hover:border-rose-400/60 dark:text-slate-200"
              >
                <span className="font-semibold text-cyan-700 dark:text-cyan-300">{c.label}</span>
                <span className="truncate">{c.value}</span>
                <span aria-hidden="true" className="text-slate-400">×</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-[10px] leading-snug text-slate-500 dark:text-slate-400">
            Counts show what each option keeps under the other filters. Press <kbd>/</kbd> to search.
          </p>
        )}
      </div>

      <div className="px-3 pb-2">
        {filters.map((f) => {
          const opts = options[f.dim] ?? [];
          // Until live counts arrive, all-year totals -- a zero would disable
          // every option for the first frame.
          const live = counts[f.dim] ?? new Map(opts.map((o) => [o.key, o.total]));
          const sel = selected[f.dim] ?? [];
          let dimTotal = 0;
          live.forEach((v) => {
            dimTotal += v;
          });
          return (
            <Section
              key={f.dim}
              title={f.label}
              hint={f.hint}
              help={HELP[f.dim]}
              badge={sel.length}
              open={open[f.dim]}
              onToggle={() => setOpen((o) => ({ ...o, [f.dim]: !o[f.dim] }))}
            >
              <OptionList
                filter={f}
                options={opts}
                live={live}
                dimTotal={dimTotal}
                selected={sel}
                searchable={f.kind === 'picker'}
                onChange={(next) => onChange(f.dim, next)}
              />
            </Section>
          );
        })}
        <Section
          title="Saved views"
          hint={saved.length ? `${saved.length} saved` : 'save or share'}
          help={HELP.savedViews}
          badge={0}
          open={viewsOpen}
          onToggle={() => setViewsOpen((v) => !v)}
        >
          <SavedViews
            saved={saved}
            onSave={onSaveView}
            onLoad={onLoadView}
            onDelete={onDeleteView}
            onCopyLink={onCopyLink}
            copied={copied}
          />
        </Section>
      </div>
    </div>
  );
}
