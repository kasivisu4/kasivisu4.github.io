// scripts/copy-duckdb-assets.mjs
//
// Copies the DuckDB-WASM worker and wasm binaries into public/duckdb/ so the
// figure can run without reaching jsDelivr.
//
// Mosaic's wasmConnector calls duckdb.getJsDelivrBundles() internally and has
// no option to point it elsewhere -- but it *does* accept an already-built
// AsyncDuckDB instance, which is the hook this enables. See createLocalDuckDB()
// in components/viz/nycTaxi/duckdb.js.
//
// Run: npm run duckdb:assets  (also runs automatically before build)
import { cp, mkdir, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const FROM = join(process.cwd(), 'node_modules', '@duckdb', 'duckdb-wasm', 'dist');
const TO = join(process.cwd(), 'public', 'duckdb');

// Only the `eh` (exception-handling) build ships. The `mvp` fallback is another
// 40 MB and is only needed by browsers without WASM exception handling, which
// has been standard since Chrome 95 / Firefox 100 / Safari 15.2. If you need to
// support older browsers, add the mvp pair back here and in duckdb.js.
const ASSETS = ['duckdb-browser-eh.worker.js', 'duckdb-eh.wasm'];

const mb = (n) => `${(n / 1048576).toFixed(1)} MB`;

await mkdir(TO, { recursive: true });

let total = 0;
for (const name of ASSETS) {
  const src = join(FROM, name);
  try {
    const info = await stat(src);
    await cp(src, join(TO, name));
    total += info.size;
    console.log(`  ${name.padEnd(34)} ${mb(info.size)}`);
  } catch {
    console.error(`  MISSING ${name} — is @duckdb/duckdb-wasm installed?`);
    process.exitCode = 1;
  }
}

console.log(`\ncopied ${ASSETS.length} files, ${mb(total)} into public/duckdb/`);
console.log('available:', (await readdir(TO)).join(', '));
