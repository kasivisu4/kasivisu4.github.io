// components/viz/chutes/duckdb.js
//
// The Chutes figure's own DuckDB-WASM instance, from the same same-origin
// assets as the taxi figure (public/duckdb/, see nycTaxi/duckdb.js).
//
// Its own instance, not the taxi's shared one, because it needs a different
// HTTP configuration. With the defaults, DuckDB-WASM may fall back to a *full*
// read of a remote file -- for the 91 GB trace on S3 that is a query that
// never returns, quietly downloading the whole object. Declaring that HEAD
// requests are reliable and full reads are forbidden makes it use range
// requests only: the 7.8 MB footer once, then just the row groups a query
// touches. Measured: a count(*) in 2.8 s, one hour of raw rows in ~3 s.

const WORKER_URL = '/duckdb/duckdb-browser-eh.worker.js';
const WASM_URL = '/duckdb/duckdb-eh.wasm';

let dbPromise = null;

export function createChutesDuckDB() {
  dbPromise ??= (async () => {
    const duckdb = await import('@duckdb/duckdb-wasm');
    const worker = new Worker(WORKER_URL);
    const db = new duckdb.AsyncDuckDB(new duckdb.VoidLogger(), worker);
    try {
      await db.instantiate(WASM_URL);
      await db.open({
        filesystem: { reliableHeadRequests: true, allowFullHTTPReads: false, forceFullHTTPReads: false },
      });
    } catch (err) {
      worker.terminate();
      dbPromise = null;
      throw new Error(
        `Could not start DuckDB from ${WASM_URL}. This build requires WebAssembly exception handling ` +
          `(Chrome 95+, Firefox 100+, Safari 15.2+). Original error: ${err?.message ?? err}`,
      );
    }
    return db;
  })();
  return dbPromise;
}
