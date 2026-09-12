// components/viz/nycTaxi/projection.js
//
// Inverse of the Lambert Conformal Conic forward transform used in
// scripts/build-nyc-basemap.mjs and by DuckDB's ST_Transform. Brushes are made
// in State Plane feet, which nobody can check against a real map, so the
// selection readout reports lon/lat as well.
import { formatHour } from './constants';

const D2R = Math.PI / 180;
const ELL_A = 6378137; // GRS80 semi-major axis, metres
const ELL_F = 1 / 298.257222101;
const ECC = Math.sqrt(2 * ELL_F - ELL_F * ELL_F);
const US_FOOT = 0.3048006096012192;

const LAT_0 = 40.16666666666666 * D2R;
const LON_0 = -74 * D2R;
const LAT_1 = 41.03333333333333 * D2R;
const LAT_2 = 40.66666666666666 * D2R;
const FALSE_EASTING = 300000; // metres

const lccM = (phi) => Math.cos(phi) / Math.sqrt(1 - ECC * ECC * Math.sin(phi) ** 2);
const lccT = (phi) => {
  const s = ECC * Math.sin(phi);
  return Math.tan(Math.PI / 4 - phi / 2) / ((1 - s) / (1 + s)) ** (ECC / 2);
};

const LCC_N =
  (Math.log(lccM(LAT_1)) - Math.log(lccM(LAT_2))) /
  (Math.log(lccT(LAT_1)) - Math.log(lccT(LAT_2)));
const LCC_F = lccM(LAT_1) / (LCC_N * lccT(LAT_1) ** LCC_N);
const LCC_RHO0 = ELL_A * LCC_F * lccT(LAT_0) ** LCC_N;

/** ESRI:102718 [x, y] in US survey feet → WGS84 [lon, lat] in degrees. */
export function toLonLat(xFt, yFt) {
  const x = xFt * US_FOOT - FALSE_EASTING;
  const y = LCC_RHO0 - yFt * US_FOOT;
  const rho = Math.sign(LCC_N) * Math.hypot(x, y);
  const theta = Math.atan2(x, y);
  const t = (rho / (ELL_A * LCC_F)) ** (1 / LCC_N);

  // phi has no closed form; the series converges in a handful of steps.
  let phi = Math.PI / 2 - 2 * Math.atan(t);
  for (let i = 0; i < 8; i++) {
    const s = ECC * Math.sin(phi);
    phi = Math.PI / 2 - 2 * Math.atan(t * ((1 - s) / (1 + s)) ** (ECC / 2));
  }

  return [(theta / LCC_N + LON_0) / D2R, phi / D2R];
}

const num = (v) => Math.round(v).toLocaleString('en-US');

/**
 * Turns one Mosaic clause into something a person can read and verify:
 * a label, a value in familiar units, and the raw extent underneath.
 */
export function describeClause(clause) {
  const names = (clause.fields ?? [clause.field ?? '']).map((f) =>
    String(f).replace(/"/g, ''),
  );
  const value = clause.value;
  if (!value) return null;

  if (names[0] === 'time') {
    const [lo, hi] = value;
    return {
      key: 'time',
      label: 'Hours',
      value: `${formatHour(lo)} – ${formatHour(hi)}`,
      detail: `time BETWEEN ${lo.toFixed(2)} AND ${hi.toFixed(2)}`,
    };
  }

  const label =
    names[0] === 'px' ? 'Pickup area' : names[0] === 'dx' ? 'Dropoff area' : null;
  if (!label) return null;

  const [[x0, x1], [y0, y1]] = value;
  const [lon0, lat0] = toLonLat(x0, y0);
  const [lon1, lat1] = toLonLat(x1, y1);

  return {
    key: names[0],
    label,
    value: `${lat0.toFixed(4)}, ${lon0.toFixed(4)} → ${lat1.toFixed(4)}, ${lon1.toFixed(4)}`,
    detail:
      `${((x1 - x0) / 5280).toFixed(1)} × ${((y1 - y0) / 5280).toFixed(1)} mi · ` +
      `ESRI:102718 x ${num(x0)}–${num(x1)} ft, y ${num(y0)}–${num(y1)} ft`,
  };
}
