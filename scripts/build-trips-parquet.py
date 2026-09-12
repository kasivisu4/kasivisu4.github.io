"""
scripts/build-trips-parquet.py

Builds the self-contained trip dataset the figure loads.

Why this exists
---------------
The figure originally fetched a parquet from idl.uw.edu and then, in the
browser, ran INSTALL spatial + ST_Transform to project every coordinate. That
means two external dependencies at page load:

  1. the dataset host
  2. extensions.duckdb.org, for the spatial extension

Both are commonly blocked on corporate networks. This script does the identical
work ahead of time -- same DuckDB, same spatial extension, same ST_Transform --
and writes the finished table into public/data/. The browser then loads one
local file and needs no extension at all.

Run:  python scripts/build-trips-parquet.py
Needs: pip install duckdb
"""

from __future__ import annotations

import os
import sys
import time
import urllib.request

import duckdb

SOURCE = "https://idl.uw.edu/mosaic-datasets/data/nyc-rides-2010.parquet"
OUT_DIR = os.path.join("public", "data")
OUT = os.path.join(OUT_DIR, "nyc-trips.parquet")

# NOTE: deliberately no spatial filtering here.
#
# An earlier version dropped rows whose pickup *and* dropoff both fell outside
# the drawable frame. That looked like a harmless 10% saving and was not: the
# trips it removed were disproportionately long ones to the airports, which
# pulled average distance from 2.83 to 2.15 mi and average fare from $11.06 to
# $9.31. The figure already clips at render time via fixed plot domains, so
# every row ships and the aggregates stay faithful.


def fetch(url: str, dest: str) -> str:
    if os.path.exists(dest):
        print(f"  using cached download ({os.path.getsize(dest) / 1048576:.1f} MB)")
        return dest
    print(f"  downloading {url}")
    urllib.request.urlretrieve(url, dest)
    print(f"  got {os.path.getsize(dest) / 1048576:.1f} MB")
    return dest


def main() -> int:
    cache_dir = os.environ.get("TMPDIR") or os.environ.get("TEMP") or "."
    raw = os.path.join(cache_dir, "nyc-rides-2010-source.parquet")

    print("1. source data")
    fetch(SOURCE, raw)

    print("2. projecting with DuckDB + spatial (same path the browser used to take)")
    con = duckdb.connect()
    con.execute("INSTALL spatial; LOAD spatial;")

    started = time.time()
    con.execute(
        f"""
        CREATE TABLE trips AS
        SELECT
          -- hour of day as a fraction, the x axis of the histogram
          (HOUR(ts) + MINUTE(ts) / 60.0)::FLOAT      AS time,
          ST_X(pick)::FLOAT                          AS px,
          ST_Y(pick)::FLOAT                          AS py,
          ST_X(drop_)::FLOAT                         AS dx,
          ST_Y(drop_)::FLOAT                         AS dy,
          distance, fare, riders
        FROM (
          SELECT
            pickup_datetime::TIMESTAMP AS ts,
            trip_distance::FLOAT       AS distance,
            total_amount::FLOAT        AS fare,
            passenger_count::UTINYINT  AS riders,
            -- EPSG:4326 is latitude-first, so ST_Point takes (lat, lon)
            ST_Transform(ST_Point(pickup_latitude, pickup_longitude),
                         'EPSG:4326', 'ESRI:102718') AS pick,
            ST_Transform(ST_Point(dropoff_latitude, dropoff_longitude),
                         'EPSG:4326', 'ESRI:102718') AS drop_
          FROM read_parquet('{raw.replace(os.sep, "/")}')
        )
        """
    )
    kept = con.execute("SELECT count(*) FROM trips").fetchone()[0]
    print(f"  {kept:,} rows projected in {time.time() - started:.1f}s")

    print("3. writing")
    os.makedirs(OUT_DIR, exist_ok=True)
    con.execute(
        f"COPY trips TO '{OUT.replace(os.sep, '/')}' "
        "(FORMAT PARQUET, COMPRESSION ZSTD, COMPRESSION_LEVEL 9)"
    )
    size = os.path.getsize(OUT)
    print(f"  {OUT} — {size / 1048576:.1f} MB")

    print("4. sanity check")
    check = con.execute(
        f"""SELECT count(*) AS rows, round(avg(distance), 2) AS dist,
                   round(avg(fare), 2) AS fare, round(min(px)) AS xmin,
                   round(max(px)) AS xmax
            FROM read_parquet('{OUT.replace(os.sep, "/")}')"""
    ).fetchone()
    print(f"  rows={check[0]:,} avg_distance={check[1]} avg_fare={check[2]} "
          f"px range {check[3]:.0f}..{check[4]:.0f}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
