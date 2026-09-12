// components/viz/nycTaxi/duckdb.js
//
// Boots DuckDB-WASM from assets served by this site.
//
// Mosaic's wasmConnector calls duckdb.getJsDelivrBundles() internally and gives
// you no way to redirect it. But it accepts an already-built AsyncDuckDB via
// `wasmConnector({ duckdb: db })`, and when one is supplied it never runs its
// own initializer -- so building the instance here removes the CDN entirely.
//
// Assets come from scripts/copy-duckdb-assets.mjs, which copies them out of
// node_modules into public/duckdb/ at build time.

const WORKER_URL = '/duckdb/duckdb-browser-eh.worker.js';
const WASM_URL = '/duckdb/duckdb-eh.wasm';

let dbPromise = null;

/**
 * Returns a shared AsyncDuckDB backed by same-origin assets.
 *
 * Only the exception-handling build is shipped, so this throws a readable
 * error rather than failing obscurely on a browser that lacks WASM EH.
 */
export function createLocalDuckDB() {
  dbPromise ??= (async () => {
    const duckdb = await import('@duckdb/duckdb-wasm');

    // The worker is same-origin, so it can be constructed directly -- no need
    // for the importScripts/blob dance the CDN path requires.
    const worker = new Worker(WORKER_URL);
    const logger = new duckdb.VoidLogger();
    const db = new duckdb.AsyncDuckDB(logger, worker);

    try {
      await db.instantiate(WASM_URL);
    } catch (err) {
      worker.terminate();
      dbPromise = null;
      throw new Error(
        `Could not start DuckDB from ${WASM_URL}. This build requires WebAssembly ` +
          `exception handling (Chrome 95+, Firefox 100+, Safari 15.2+). ` +
          `Original error: ${err?.message ?? err}`,
      );
    }

    return db;
  })();

  return dbPromise;
}
