# NYC taxi figure — architecture, changes, and open work

The interactive figure behind
[`content/blog/how-mosaic-scales-interactive-aggregation.mdx`](../../../content/blog/how-mosaic-scales-interactive-aggregation.mdx).

A million NYC taxi trips, crossfiltered in the browser with
[Mosaic](https://idl.uw.edu/mosaic/) + DuckDB-WASM, on a static site with no
backend. The panel under the charts is the point of the piece: it measures what
each interactive frame costs and shows the path it took.

---

## Files

| File | Responsibility |
|---|---|
| `../NycTaxiRides.jsx` | The figure: data loading, plots, KPIs, play-through |
| `constants.js` | Frame geometry, palette, landmarks, cache config |
| `projection.js` | Inverse Lambert Conformal Conic; clause → readable filter |
| `queryLog.js` | Connector instrumentation, frame timing, cube attribution |
| `UnderTheHood.jsx` | The instrument panel (dataflow diagram + SQL console) |
| `../../../scripts/build-nyc-basemap.mjs` | Reprojects borough geometry to match the data |

---

## Data loading

The parquet is **cached in the browser after the first visit**.

```
first visit   fetch(idl.uw.edu/…parquet)  →  caches.put()  →  registerFileBuffer()  →  DuckDB
later visits  caches.match()              →  registerFileBuffer()                   →  DuckDB
```

`stageRidesFile()` in `NycTaxiRides.jsx` uses the **Cache Storage API**, reads
the bytes back as an `ArrayBuffer`, and hands DuckDB-WASM a registered virtual
file (`registerFileBuffer`). On a repeat visit the network is not touched at
all — verified by instrumenting `window.fetch` and confirming zero parquet
requests.

Falls back to streaming when Cache Storage is unavailable (private windows,
older browsers). The status line reports which path was taken.

To invalidate, bump `DATA_CACHE` in `constants.js`.

---

## How the instrumentation works

Mosaic sends every statement through one connector, so wrapping that connector
captures the whole conversation.

- `instrumentConnector()` proxies `query()`, recording SQL, wall-clock span,
  row count, and a 5-row sample of the result.
- `setActivity(label)` opens an **operation** — one interaction. Queries it
  causes inherit the label and an `opId`, so a frame can be reconstructed.
- `queryPath(sql)` classifies each statement as `build` / `cube` / `source` /
  `meta`. This is the whole scalability story in one field.
- `cubeOwners()` parses build statements to attribute each cube to the view it
  feeds, so a cube read reads as *"Histogram bins (cube)"* rather than an
  opaque hash.
- Panel probes carry `INSPECTOR_TAG` and are **excluded from frame cost** — the
  instrument must not change the reading it takes.

`window.__mosaicLog.entries()` exposes the raw log for anyone who wants to
check the numbers rather than trust them.

---

## Changes in this pass

### Caching
- Parquet now served from Cache Storage; zero network on repeat visits.
- New `cached` load stage and a `data from cache` / `data downloaded` badge.

### Panel redesign
The previous layout listed the same query twice — once as a cost bar, once as
a statement. Replaced with a **live dataflow diagram** where each client box
*is* its statement:

```
Brush ──▶ Coordinator ──┬──▶ KPI aggregate      source  11 ms   1 row
                        ├──▶ Dropoffs raster    cube    19 ms   22,457 rows
                        └──▶ Histogram bins     cube    45 ms   24 rows
```

- Click a box to reveal its SQL, **Copy SQL**, or **Open in console**.
- Three stat cards collapsed into one mono line: `trips (N rows) → cube (M
  cells) → X ms median frame`.
- Latency sparkline reduced to a compact strip beside its caption.
- SQL console collapsed behind a toggle.

### KPI tiles are now a Mosaic client
They were a hand-rolled `coordinator.query()` fired from a React effect, which
put them outside the filter group, the cache, consolidation and
pre-aggregation — an O(N) scan of `trips` every frame. Now a `MosaicClient`
subclass (`makeKpiClient` in `NycTaxiRides.jsx`). `count` and `avg` both
decompose into sufficient statistics, so the pre-aggregator builds them a cube
too. **A warm frame no longer touches the source table.**

Verified: all three frame queries report path `cube`; the KPI statement begins
`SELECT coalesce(sum("pre_…"), 0) AS "trips"`.

Note this is *not* a reduction in query count. Three views ask three different
questions (different `GROUP BY`, different measures, different cardinality),
and Mosaic's consolidator explicitly bails on any query carrying a `WHERE`
clause — which every filtered frame query does. Three queries is correct; what
changed is which table they read.

### Correctness fixes
| Bug | Cause | Fix |
|---|---|---|
| Panel felt slower than the brush | Notified React on every logged statement | Coalesce notifications on an 80 ms timer; version bumps immediately so no update is lost |
| Cube *reads* labelled "Building cube" | `classifyStep` matched any SQL containing `preagg` | Require `CREATE TABLE`; attribute reads via `cubeOwners()` |
| Duplicate React keys | Connector's `try` wrapped the logging, so a throwing subscriber pushed the same entry twice | `try` wraps only the query; `emit()` isolates subscriber failures |
| Warm frames counted as cold | A frame that builds a cube also reads it | `build` wins the classification |
| Instrument inflated its own numbers | Cube-size probe ran inside the measured frame | `INSPECTOR_TAG`, excluded from frame cost |
| Phantom operations | Grouping merged only *adjacent* entries | Group by `opId` globally |
| Histogram never filtered | Missing `filterBy` | Added; it now participates in the crossfilter |

---

## Why each view issues its own query

A recurring question: if the Coordinator is central, why do the KPIs, the
rasters and the histogram each make a separate call?

**The coordinator centralizes the *predicate*, not the *result*.** It resolves
one Selection into one predicate, caches identical queries, consolidates
concurrent ones, and decides when to build a cube. But the three views ask
genuinely different questions — different `GROUP BY`, different measures,
different output cardinality (24 buckets vs 22,457 pixels vs 1 row). No single
result set can answer all three, so a shared query would have to return the raw
rows and push aggregation to the client, which is the design Mosaic exists to
avoid.

What *is* shared: the predicate, the cube, the cache, and the queue.

---

## Known limits

- **Pre-aggregated counts are approximate.** The cube bins the brushed
  dimension at pixel resolution, so a brush edge snaps to a bin boundary.
  Measured against a source scan under an identical filter: 549,766 vs 548,931
  trips (0.15% high). Averages were exact. Fine for exploration; think twice
  before putting a cube-backed count in a report.
- **Cube builds are prefetched on hover**, not paid at mousedown. Interactors
  call `activate()` on `pointerenter` (`Interval2D.js`) and the coordinator
  builds indexes then. Verified cold: one hover, no click → three `CREATE
  TABLE` statements (85/62/146 ms), cached entries 0 → 4. Synthetic
  `left_click_drag` skips `pointerenter`, so automated tests will wrongly
  measure the build as first-frame cost. Touch input has no hover and does pay
  it.
- **Decomposable aggregates only** — no medians, no exact distinct counts.
- **The cube is not small.** ~0.3–0.9 M rows against a 1 M row source. The win
  is that its size is set by *resolution*, not row count.

---

## Open work

- [ ] **SF 311 dataset** (planned) — 8.9 M rows, 99.7% geocoded, current
      through yesterday, CORS-enabled via DataSF. Needs its own basemap and
      EPSG:2227 (California State Plane III) projection.
- [ ] Consider serving the parquet from the repo to remove the third-party
      dependency, at the cost of ~46 MB in git.
- [x] ~~Cube eviction~~ — Reset now issues `DROP SCHEMA IF EXISTS "mosaic"
      CASCADE` and clears the preaggregator index. (`preaggregator.dropSchema()`
      resolves without dropping anything here, so do it explicitly.)
- [ ] Port remaining tabs from the mosaic dev console at
      `projects/mosaic/dev/devtools.js`: insights, coordinator log, backend
      info, Arrow byte accounting.
- [ ] Mobile: the figure scales to fit but the dataflow diagram wraps awkwardly
      below ~640 px.

---

## Local development

```bash
npm run dev        # http://localhost:3000/blog/how-mosaic-scales-interactive-aggregation/
npm run basemap    # regenerate borough outlines (only if FRAME changes)
npm run build      # static export to out/
```

Note: running `npm run build` while `npm run dev` is live corrupts `.next`.
Stop the dev server, build, then `rm -rf .next` before restarting dev.
