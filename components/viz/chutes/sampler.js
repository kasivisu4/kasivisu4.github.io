// components/viz/chutes/sampler.js
//
// "View raw data": real rows from the 91 GB trace, read by DuckDB-WASM.
//
// Same method: pick a random hour the crossfilter table says has matching
// traffic, translate the matching models and functions in that hour back to
// raw chute_ids and function_names, and read just that hour of the trace. The
// difference is where the trace lives: here it is the public S3 object itself,
// registered with DuckDB as an HTTP file. The bucket allows CORS range
// requests, so DuckDB fetches the footer and then only the byte ranges of the
// one or two row groups that hour occupies -- a few MB out of 91 GB.
import { TRACE_URL } from './constants';

const lit = (v) => `'${String(v).replace(/'/g, "''")}'`;

/** 'YYYY-MM-DD HH:MM:SS' for trace day `day`, hour `hod`, minute `min` (trace clock, 1970 origin). */
function stamp(day, hod, min = 0) {
  return new Date(Date.UTC(1970, 0, 1) + ((day * 24 + hod) * 60 + min) * 60_000)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');
}

/**
 * How much of the hour to read. Bytes, not rows, are the cost over S3: every
 * row group a query touches costs ~15 MB across all columns, and a busy hour
 * spans two or three. The file is time-sorted, so a random few minutes of a
 * busy hour is usually one row group -- a third of the download -- and still
 * holds hundreds of matching requests. Quiet hours (rare filters) are read
 * whole, so they never come back short.
 */
function sliceMinutes(matching) {
  if (matching > 30_000) return 2;
  if (matching > 3_000) return 10;
  return 60;
}

let tracePromise = null;

/**
 * Registers the S3 object once, as a DuckDB file read by HTTP range requests,
 * and puts a `trace` view over it -- the name the SQL
 * console's trace presets run unchanged.
 */
export function ensureTrace(vg) {
  tracePromise ??= (async () => {
    const [{ DuckDBDataProtocol }, db] = await Promise.all([
      import('@duckdb/duckdb-wasm'),
      vg.coordinator().databaseConnector().getDuckDB(),
    ]);
    await db.registerFileURL('trace.parquet', TRACE_URL, DuckDBDataProtocol.HTTP, false);
    await vg.coordinator().exec("CREATE VIEW IF NOT EXISTS trace AS SELECT * FROM read_parquet('trace.parquet')");
  })();
  tracePromise.catch(() => {
    tracePromise = null; // let a later click retry
  });
  return tracePromise;
}

/** Rows of an Arrow result as plain objects. */
const rowsOf = (table) => table.toArray().map((r) => ({ ...r }));

const condOf = (where) => (where && where.trim() ? `(${where})` : 'TRUE');
const query = (vg, sql) => vg.coordinator().query(sql, { cache: false });

/**
 * A random hour that has traffic matching the dashboard's filters, so a rare
 * filter never comes back empty. Both views of the viewer show this hour.
 * @param where  the dashboard's filters as SQL over `chutes` ('' for none)
 * @returns { day, hod, matching } or null when nothing matches
 */
export async function pickHour(vg, where) {
  const [pick] = rowsOf(
    await query(
      vg,
      `SELECT dnum, hod::INTEGER AS hod, sum(reqs)::DOUBLE AS n FROM chutes WHERE ${condOf(where)}
       GROUP BY 1, 2 ORDER BY random() LIMIT 1`,
    ),
  );
  return pick ? { day: Number(pick.dnum), hod: Number(pick.hod), matching: Number(pick.n) } : null;
}

/**
 * The rollup's own rows for one hour: what the 24 MB file actually stores.
 * Each row stands for every matching request of one model x function in that
 * hour, as counts and sums. Instant -- it reads the in-browser table.
 */
export async function rollupForHour(vg, { where, day, hod }) {
  const t0 = performance.now();
  const sql = `SELECT model, func, category, streaming,
       reqs, sum_it, n_it, sum_ot, n_ot, sum_ttft, n_ttft
FROM chutes
WHERE ${condOf(where)}
  AND dnum = ${day} AND hod = ${hod}
ORDER BY reqs DESC`;
  const rows = rowsOf(await query(vg, sql));
  return { rows, sql, ms: performance.now() - t0 };
}

/**
 * Raw requests for that hour, read from the 91 GB object on S3.
 * @param pick   the hour, from pickHour
 * @param limit  rows to return
 */
export async function sampleInBrowser(vg, { where, limit = 10, pick }) {
  const t0 = performance.now();
  const q = (sql) => query(vg, sql);
  const cond = condOf(where);
  const { day, hod, matching } = pick;

  const inHour = `${cond} AND dnum = ${day} AND hod = ${hod}`;
  const funcs = rowsOf(await q(`SELECT DISTINCT func FROM chutes WHERE ${inHour}`)).map((r) => r.func);
  const models = rowsOf(await q(`SELECT DISTINCT model FROM chutes WHERE ${inHour}`)).map((r) => r.model);
  const ids = rowsOf(
    await q(`SELECT chute_id FROM model_ids WHERE model IN (${models.map(lit).join(', ') || 'NULL'})`),
  ).map((r) => r.chute_id);
  const named = ids.filter((i) => i !== '~other');
  const chuteTerms = [];
  if (named.length) chuteTerms.push(`t.chute_id IN (${named.map(lit).join(', ')})`);
  if (ids.includes('~other')) {
    chuteTerms.push("t.chute_id NOT IN (SELECT chute_id FROM model_ids WHERE chute_id <> '~other')");
  }

  await ensureTrace(vg);

  const span = sliceMinutes(matching);
  const from = span === 60 ? 0 : Math.floor(Math.random() * (60 / span)) * span;
  const n = Math.max(1, Math.min(100, limit));
  let sql = rawSql({ day, hod, from, span, funcs, chuteTerms, n });
  let table = await q(shaped(sql));
  let slice = [from, from + span];
  // A slice can come up short when a filter is patchy within the hour; the
  // whole hour cannot, since the rollup says it holds matching traffic.
  if (table.numRows < n && span < 60) {
    sql = rawSql({ day, hod, from: 0, span: 60, funcs, chuteTerms, n });
    table = await q(shaped(sql));
    slice = [0, 60];
  }

  return { rows: rowsOf(table), slice, sql, ms: performance.now() - t0 };
}

/** The raw read: one slice of one hour, literal timestamps so the scan prunes to its row groups. */
function rawSql({ day, hod, from, span, funcs, chuteTerms, n }) {
  return `WITH s AS (
  SELECT t.started_at, t.completed_at, t.function_name, t.chute_id,
         t.user_id, t.rehash_round, t.instance_id,
         t.it, t.ot, t.ct, t.ttft, t.invocation_id
  FROM trace t
  WHERE t.started_at >= TIMESTAMP '${stamp(day, hod, from)}'
    AND t.started_at <  TIMESTAMP '${stamp(day, hod, from + span)}'
    AND t.function_name IN (${funcs.map(lit).join(', ')})
    AND (${chuteTerms.join(' OR ') || 'FALSE'})
  ORDER BY random()
  LIMIT ${n}
)
SELECT s.*,
       coalesce(m.model, 'Other (outside top 200)') AS model,
       c.category, c.streaming
FROM s
LEFT JOIN model_ids m ON m.chute_id = s.chute_id AND m.chute_id <> '~other'
LEFT JOIN (SELECT DISTINCT func, category, streaming FROM chutes) c ON c.func = s.function_name
ORDER BY s.started_at`;
}

/**
 * Timestamps as ISO text and counts as doubles, the shape the grid renders.
 */
const shaped = (sql) => `SELECT replace(started_at::VARCHAR, ' ', 'T') AS started_at,
    replace(completed_at::VARCHAR, ' ', 'T') AS completed_at,
    function_name, chute_id, user_id, rehash_round::INTEGER AS rehash_round, instance_id,
    it::DOUBLE AS it, ot::DOUBLE AS ot, ct::DOUBLE AS ct, ttft::DOUBLE AS ttft, invocation_id,
    model, category, streaming
  FROM (${sql})`;
