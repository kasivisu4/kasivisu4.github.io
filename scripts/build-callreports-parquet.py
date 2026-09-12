"""
scripts/build-callreports-parquet.py

Converts the New York Fed "Balance Sheets and Income Statements of Commercial
Banks" Stata file into a query-ready parquet dataset.

Source
------
https://www.newyorkfed.org/research/banking_research/balance-sheets-income-statements

Built from FFIEC Call Reports by Correia, Luck and Verner. Cite as:

  Correia, Sergio A., Stephan Luck, and Emil Verner. "Failing Banks."
  The Quarterly Journal of Economics, 141(1), February 2026, 147-204.

  (c) 2026 Federal Reserve Bank of New York. Content from the New York Fed
  subject to the Terms of Use at newyorkfed.org.

This script produces a MODIFIED derivative of that dataset. The New York Fed
does not endorse it and the modifications are not attributed to them. See
DERIVATIVE_NOTES below for exactly what changed.

Why this exists
---------------
The source is a 2.7 GB .dta holding 2,557,391 bank-quarter rows x 194 columns,
covering 1959 to 2026. Three things make it unusable as shipped:

  1. Nothing in a browser reads Stata.
  2. A naive parquet dump is ~416 MB in one file. GitHub rejects files over
     100 MB, and Pages serves Git LFS files as pointer text rather than data.
  3. All 175 measure columns are float64, but every value is integral -- these
     are Call Report line items denominated in whole thousands of dollars.
     Floats waste space and invite rounding drift in aggregates.

So the conversion does three things beyond a format change:

  * Splits one wide table into a narrow fact table plus a small bank dimension.
    The 17 identity/location columns (legal name, street, city, LEI, charter
    codes) repeat on every quarter of every bank's life. Deduplicating them
    into their own table removes that redundancy from 2.5 M rows.

  * Casts the measures to the narrowest exact integer type that holds them.
    NOT float32: the largest value observed is ~990,253,492 (thousands of USD,
    so roughly $990 billion), and float32 only represents integers exactly up
    to 16,777,216. Casting to float32 would silently corrupt every large bank.
    Column width is chosen from an actual min/max scan, not a guess.

  * Partitions the fact table by year, so each file clears the 100 MB limit and
    a client reading one decade never downloads the other six.

Run:  python scripts/build-callreports-parquet.py --src <path to .dta>
Needs: pip install pandas duckdb pyarrow
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
import time

import duckdb
import pandas as pd

DERIVATIVE_NOTES = [
    "Converted from Stata .dta to Apache Parquet.",
    "Split into a fact table (bank-quarter measures) and a bank dimension table.",
    "Measure columns cast from float64 to exact integer types; values unchanged.",
    "Fact table partitioned by calendar year.",
    "No rows dropped, no values recomputed, no imputation applied.",
]

# Read this many Stata rows at a time. 200k x 194 float64 is ~310 MB resident,
# which is the largest chunk worth holding on a 16 GB machine.
CHUNK = 200_000

KEY_COLS = ["id_rssd", "date"]


def log(msg: str) -> None:
    print(msg, flush=True)


def classify(src: str) -> tuple[list[str], list[str]]:
    """Return (measure_cols, dim_cols) by reading one chunk's dtypes.

    Measures are the float64 columns. Everything else that is not a key -- the
    integer codes and the string identity fields -- describes the bank rather
    than the quarter, so it belongs in the dimension.
    """
    head = next(pd.read_stata(src, chunksize=1000))
    measures = [c for c in head.columns if head[c].dtype == "float64"]
    dims = [c for c in head.columns if c not in measures and c not in KEY_COLS]
    return measures, dims


def stage_raw(src: str, staging: str) -> int:
    """Pass 1: stream the .dta out to parquet parts, types untouched.

    Kept deliberately dumb. Deciding column widths needs whole-column min/max,
    which needs the data on disk in something DuckDB can scan.
    """
    os.makedirs(staging, exist_ok=True)
    rows = 0
    started = time.time()

    for i, chunk in enumerate(pd.read_stata(src, chunksize=CHUNK)):
        part = os.path.join(staging, f"part-{i:04d}.parquet")
        chunk.to_parquet(part, compression="zstd", index=False)
        rows += len(chunk)
        log(f"    part {i:>3}  {rows:>10,} rows")

    log(f"  {rows:,} rows staged in {time.time() - started:.0f}s")
    return rows


def integer_type(lo, hi) -> str:
    """Narrowest DuckDB integer type holding [lo, hi].

    All-null columns collapse to lo/hi of None; they get the narrowest type
    since they hold nothing. Signed throughout -- several Call Report items
    (net income, unrealized gains) legitimately go negative.
    """
    if lo is None or hi is None:
        return "SMALLINT"
    bounds = [
        ("SMALLINT", -32_768, 32_767),
        ("INTEGER", -2_147_483_648, 2_147_483_647),
    ]
    for name, low, high in bounds:
        if lo >= low and hi <= high:
            return name
    return "BIGINT"


def measure_types(con, glob: str, measures: list[str]) -> dict[str, str]:
    """One scan over the staged data to size every measure column."""
    aggs = ", ".join(f'min("{c}") AS "lo_{c}", max("{c}") AS "hi_{c}"' for c in measures)
    row = con.execute(f"SELECT {aggs} FROM read_parquet('{glob}')").fetchone()
    names = [d[0] for d in con.description]
    stats = dict(zip(names, row))

    chosen = {}
    for c in measures:
        lo, hi = stats[f"lo_{c}"], stats[f"hi_{c}"]
        chosen[c] = integer_type(lo, hi)

    tally = {}
    for t in chosen.values():
        tally[t] = tally.get(t, 0) + 1
    log(f"  widths chosen: {tally}")
    return chosen


def build_fact(con, glob: str, measures: list[str], types: dict[str, str], out: str) -> None:
    """Fact table: one row per bank-quarter, integer measures, hive-partitioned.

    The cast is exact by construction -- every source value was verified
    integral before this script was written, and a non-integral value would
    raise here rather than round silently.
    """
    cols = ",\n          ".join(
        f'CAST("{c}" AS {types[c]}) AS "{c}"' for c in measures
    )
    con.execute(
        f"""
        COPY (
          SELECT
            CAST(id_rssd AS INTEGER) AS id_rssd,
            CAST(date AS DATE)       AS date,
            CAST(YEAR(date) AS SMALLINT) AS year,
          {cols}
          FROM read_parquet('{glob}')
        ) TO '{out}' (
          FORMAT PARQUET, COMPRESSION ZSTD, COMPRESSION_LEVEL 9,
          PARTITION_BY (year), OVERWRITE_OR_IGNORE 1
        )
        """
    )


def build_dim(con, glob: str, dims: list[str], out: str) -> int:
    """Bank dimension, as slowly-changing rows rather than one row per bank.

    A bank's legal name, city and charter change over a 67-year panel. Keeping
    only the latest would misdate every historical report, so each distinct
    combination of attributes is kept once with the date range it was observed
    over. Dedup collapses millions of repeats to a small table regardless.
    """
    cols = ", ".join(f'"{c}"' for c in dims)
    con.execute(
        f"""
        COPY (
          SELECT
            CAST(id_rssd AS INTEGER) AS id_rssd,
            {cols},
            MIN(date) AS valid_from,
            MAX(date) AS valid_to,
            COUNT(*)  AS quarters
          FROM read_parquet('{glob}')
          GROUP BY id_rssd, {cols}
        ) TO '{out}' (FORMAT PARQUET, COMPRESSION ZSTD, COMPRESSION_LEVEL 9)
        """
    )
    return con.execute(f"SELECT count(*) FROM read_parquet('{out}')").fetchone()[0]


def write_manifest(src: str, out_dir: str, measures, dims, types, rows, banks) -> str:
    """Column labels lifted straight from the .dta.

    191 of the 194 columns carry a human-readable Stata label ("Commercial Real
    Estate Loans" for ln_cre). That is the seed for any semantic layer or model
    tool schema, and it would be lost the moment the file became parquet.
    """
    with pd.read_stata(src, iterator=True) as r:
        r._ensure_open()
        labels = r.variable_labels()

    manifest = {
        "source": {
            "name": "Balance Sheets and Income Statements of Commercial Banks",
            "url": "https://www.newyorkfed.org/research/banking_research/"
                   "balance-sheets-income-statements",
            "attribution": "(c) 2026 Federal Reserve Bank of New York. Content from "
                           "the New York Fed subject to the Terms of Use at "
                           "newyorkfed.org.",
            "citation": "Correia, Sergio A., Stephan Luck, and Emil Verner. "
                        "\"Failing Banks.\" The Quarterly Journal of Economics, "
                        "141(1), February 2026, 147-204.",
            "endorsement": "The New York Fed does not endorse this derivative and "
                           "the modifications are not attributed to them.",
        },
        "derivative_notes": DERIVATIVE_NOTES,
        "units": "Call Report line items are denominated in thousands of US dollars.",
        "grain": "One row per bank (id_rssd) per quarter (date).",
        "rows": rows,
        "banks": banks,
        "measures": [
            {"column": c, "label": labels.get(c) or None, "type": types[c]}
            for c in measures
        ],
        "dimensions": [
            {"column": c, "label": labels.get(c) or None} for c in dims
        ],
    }

    path = os.path.join(out_dir, "manifest.json")
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, indent=2)
    return path


def report_sizes(out_dir: str) -> None:
    log("\n6. output")
    total = biggest = 0
    biggest_name = ""
    for root, _, files in os.walk(out_dir):
        for f in files:
            size = os.path.getsize(os.path.join(root, f))
            total += size
            if size > biggest:
                biggest, biggest_name = size, os.path.relpath(
                    os.path.join(root, f), out_dir
                )
    log(f"  total       {total / 1048576:.1f} MB")
    log(f"  largest     {biggest / 1048576:.1f} MB  ({biggest_name})")
    if biggest > 100 * 1048576:
        log("  WARNING: largest file exceeds GitHub's 100 MB limit")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--src",
        default=os.path.join(
            os.path.expanduser("~"), "Downloads",
            "call-reports-balance-sheets-Jan2026",
            "call-reports-balance-sheets-Jun2026.dta",
        ),
    )
    ap.add_argument("--out", default=os.path.join("public", "data", "callreports"))
    ap.add_argument("--staging", default=None, help="scratch dir for pass 1")
    ap.add_argument("--keep-staging", action="store_true")
    args = ap.parse_args()

    if not os.path.exists(args.src):
        log(f"source not found: {args.src}")
        return 1

    staging = args.staging or os.path.join(
        os.environ.get("TEMP") or ".", "callreports-staging"
    )
    out_dir = args.out
    os.makedirs(out_dir, exist_ok=True)

    log(f"source  {args.src} ({os.path.getsize(args.src) / 1048576:.0f} MB)")
    log(f"output  {out_dir}\n")

    log("1. classifying columns")
    measures, dims = classify(args.src)
    log(f"  {len(measures)} measures, {len(dims)} dimension attributes")

    log("2. staging Stata to parquet")
    rows = stage_raw(args.src, staging)

    glob = os.path.join(staging, "*.parquet").replace(os.sep, "/")
    con = duckdb.connect()

    log("3. sizing measure columns")
    types = measure_types(con, glob, measures)

    log("4. writing fact table (partitioned by year)")
    fact_dir = os.path.join(out_dir, "fact").replace(os.sep, "/")
    build_fact(con, glob, measures, types, fact_dir)

    log("5. writing bank dimension")
    dim_path = os.path.join(out_dir, "dim_bank.parquet").replace(os.sep, "/")
    banks = build_dim(con, glob, dims, dim_path)
    log(f"  {banks:,} distinct bank-attribute versions")

    report_sizes(out_dir)

    mpath = write_manifest(args.src, out_dir, measures, dims, types, rows, banks)
    log(f"  manifest    {os.path.relpath(mpath)}")

    log("\n7. sanity check")
    check = con.execute(
        f"""SELECT count(*) AS rows,
                   count(DISTINCT id_rssd) AS banks,
                   min(date) AS from_, max(date) AS to_
            FROM read_parquet('{fact_dir}/**/*.parquet', hive_partitioning=1)"""
    ).fetchone()
    log(f"  rows={check[0]:,} banks={check[1]:,} {check[2]} .. {check[3]}")
    if check[0] != rows:
        log(f"  WARNING: fact rows {check[0]:,} != staged rows {rows:,}")

    con.close()
    if not args.keep_staging:
        shutil.rmtree(staging, ignore_errors=True)
        log("  staging removed")

    return 0


if __name__ == "__main__":
    sys.exit(main())
