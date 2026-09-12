// components/viz/MosaicFlow.jsx
//
// The whole system in one picture: what happens when you hover, and what
// happens on every frame of a drag. Numbers are the ones measured from the
// figure on this page, not illustrative.
//
// Server-rendered, so every color comes from a CSS class rather than a theme
// value the server cannot know.

// Lane geometry. Gaps between lanes are wide enough for an arrow *and* its
// label, which is the thing that goes wrong if you tighten them.
const L1 = { x: 16, w: 168 }; // you
const L2 = { x: 254, w: 236 }; // coordinator
const L3 = { x: 560, w: 324 }; // duckdb
const R1 = L1.x + L1.w;
const R2 = L2.x + L2.w;

const TONES = {
  warm: 'fill-amber-500/10 stroke-amber-500/45',
  cool: 'fill-emerald-500/10 stroke-emerald-500/45',
  accent: 'fill-cyan-500/10 stroke-cyan-500/45',
};

function Box({ x, y, w, h, title, sub, tone }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="7" className={TONES[tone]} strokeWidth="1" />
      <text
        x={x + 12}
        y={y + (sub ? 21 : h / 2 + 4)}
        className="fill-slate-800 dark:fill-slate-100"
        style={{ fontSize: 12.5, fontWeight: 600 }}
      >
        {title}
      </text>
      {sub && (
        <text
          x={x + 12}
          y={y + 38}
          className="fill-slate-500 dark:fill-slate-400"
          style={{ fontSize: 10.5 }}
        >
          {sub}
        </text>
      )}
    </g>
  );
}

function Arrow({ x1, x2, y, label }) {
  return (
    <g>
      <line
        x1={x1}
        y1={y}
        x2={x2 - 7}
        y2={y}
        className="stroke-slate-400/70 dark:stroke-slate-500/70"
        strokeWidth="1.25"
      />
      <path
        d={`M${x2} ${y} L${x2 - 7} ${y - 3.5} L${x2 - 7} ${y + 3.5} Z`}
        className="fill-slate-400/70 dark:fill-slate-500/70"
      />
      {label && (
        <text
          x={(x1 + x2) / 2}
          y={y - 9}
          textAnchor="middle"
          className="fill-slate-500 dark:fill-slate-400"
          style={{ fontSize: 10 }}
        >
          {label}
        </text>
      )}
    </g>
  );
}

export default function MosaicFlow() {
  const lanes = [
    { ...L1, label: 'You' },
    { ...L2, label: 'Mosaic coordinator' },
    { ...L3, label: 'DuckDB-WASM · your tab' },
  ];

  // fan-out elbow
  const elbow = 524;
  const rows = [200, 260, 320].map((y) => y + 24); // vertical centres

  return (
    <figure className="not-prose my-10">
      <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-slate-50/80 dark:bg-slate-950/60 p-4 sm:p-6 overflow-x-auto">
        <svg
          viewBox="0 0 900 430"
          className="w-full min-w-[720px]"
          role="img"
          aria-label="Hovering a chart builds indexes; dragging reads them without touching the source table"
        >
          {lanes.map((l) => (
            <g key={l.label}>
              <text
                x={l.x}
                y={15}
                className="fill-slate-400 dark:fill-slate-500"
                style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.09em' }}
              >
                {l.label.toUpperCase()}
              </text>
              <line
                x1={l.x}
                y1={23}
                x2={l.x + l.w}
                y2={23}
                className="stroke-slate-300/60 dark:stroke-slate-700"
                strokeWidth="1"
              />
            </g>
          ))}

          {/* ── phase 1 · hover ───────────────────────────────────────── */}
          <text
            x={L1.x}
            y={58}
            className="fill-amber-600 dark:fill-amber-400"
            style={{ fontSize: 11, fontWeight: 700 }}
          >
            1 · Your pointer enters a map
          </text>

          <Box x={L1.x} y={72} w={L1.w} h={54} tone="warm" title="pointerenter" sub="nothing pressed" />
          <Arrow x1={R1} x2={L2.x} y={99} label="activate" />
          <Box
            x={L2.x}
            y={72}
            w={L2.w}
            h={54}
            tone="warm"
            title="Build the indexes"
            sub="one per view that can use one"
          />
          <Arrow x1={R2} x2={L3.x} y={99} label="CREATE ×3" />
          <Box
            x={L3.x}
            y={72}
            w={L3.w}
            h={54}
            tone="warm"
            title="3 index tables materialized"
            sub="62 · 92 · 146 ms — once, before you click"
          />

          <line
            x1={L1.x}
            y1={152}
            x2={884}
            y2={152}
            className="stroke-slate-300/50 dark:stroke-slate-700/60"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* ── phase 2 · drag ────────────────────────────────────────── */}
          <text
            x={L1.x}
            y={182}
            className="fill-emerald-600 dark:fill-emerald-400"
            style={{ fontSize: 11, fontWeight: 700 }}
          >
            2 · You drag — repeats every frame
          </text>

          <Box x={L1.x} y={200} w={L1.w} h={48} tone="accent" title="Brush moves" sub="one clause" />
          <Arrow x1={R1} x2={L2.x} y={224} label="predicate" />
          <Box
            x={L2.x}
            y={200}
            w={L2.w}
            h={48}
            tone="accent"
            title="Resolve once, fan out"
            sub="skips the view you are touching"
          />

          {/* fan-out: one elbow, three stubs */}
          <path
            d={`M${R2} 224 H${elbow} M${elbow} ${rows[0]} V${rows[2]}`}
            className="stroke-slate-400/60 dark:stroke-slate-500/60"
            fill="none"
            strokeWidth="1.25"
          />
          {rows.map((y) => (
            <g key={y}>
              <line
                x1={elbow}
                y1={y}
                x2={L3.x - 7}
                y2={y}
                className="stroke-slate-400/60 dark:stroke-slate-500/60"
                strokeWidth="1.25"
              />
              <path
                d={`M${L3.x} ${y} L${L3.x - 7} ${y - 3.5} L${L3.x - 7} ${y + 3.5} Z`}
                className="fill-slate-400/60 dark:fill-slate-500/60"
              />
            </g>
          ))}

          <Box x={L3.x} y={200} w={L3.w} h={48} tone="cool" title="KPI tiles — 4 numbers" sub="1 row · 32 B" />
          <Box x={L3.x} y={260} w={L3.w} h={48} tone="cool" title="Dropoffs map" sub="59,740 rows · 891 KB" />
          <Box x={L3.x} y={320} w={L3.w} h={48} tone="cool" title="Hour histogram" sub="24 rows · 576 B" />

          {/* note under the "you" lane */}
          {['The map you are dragging', 'is skipped — it costs', 'nothing.'].map((line, i) => (
            <text
              key={line}
              x={L1.x}
              y={272 + i * 15}
              className="fill-slate-500 dark:fill-slate-400"
              style={{ fontSize: 10.5 }}
            >
              {line}
            </text>
          ))}

          {/* summary */}
          <text
            x={L3.x}
            y={392}
            className="fill-slate-700 dark:fill-slate-200"
            style={{ fontSize: 11.5, fontWeight: 600 }}
          >
            3 queries · 28–77 ms per frame
          </text>
          <text
            x={L3.x}
            y={410}
            className="fill-slate-500 dark:fill-slate-400"
            style={{ fontSize: 10.5 }}
          >
            The 1,000,000-row table is never read during the drag.
          </text>
        </svg>
      </div>
      <figcaption className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
        Every number measured from the figure above, on a 1,000,000-row table.
      </figcaption>
    </figure>
  );
}
