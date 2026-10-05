// components/viz/chutes/exporters.js
//
// Getting a view out of the page: CSV of the numbers, PNG of a chart, and the
// view itself -- filters, grouping, period, clicks -- as a link or a named
// save. Everything here runs in the browser; nothing is sent anywhere.

/** Downloads `rows` (array of flat objects) as a CSV file. */
export function downloadCsv(filename, rows) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const cell = (v) => {
    if (v == null) return '';
    const s = typeof v === 'number' ? String(Math.round(v * 1e4) / 1e4) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const text = [cols.join(','), ...rows.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\n');
  save(filename, new Blob([text], { type: 'text/csv;charset=utf-8' }));
}

/**
 * Rasterizes an Observable Plot SVG to PNG. Plot styles text with
 * currentColor, which is lost once the SVG leaves the page, so the color and
 * background are written onto the copy explicitly.
 */
export async function downloadSvgAsPng(filename, svg, { background, color, scale = 2 }) {
  if (!svg) return;
  const clone = svg.cloneNode(true);
  const { width, height } = svg.getBoundingClientRect();
  const w = Math.round(Number(svg.getAttribute('width')) || width);
  const h = Math.round(Number(svg.getAttribute('height')) || height);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', w);
  clone.setAttribute('height', h);
  clone.style.color = color;
  clone.style.background = background;

  const url = URL.createObjectURL(
    new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }),
  );
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (blob) save(filename, blob);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function save(filename, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// --- views ------------------------------------------------------------------

/** View state <-> URL-safe string. */
export function encodeView(view) {
  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(view))));
  } catch {
    return '';
  }
}

export function decodeView(text) {
  try {
    const v = JSON.parse(decodeURIComponent(escape(atob(text))));
    return v && typeof v === 'object' ? v : null;
  } catch {
    return null;
  }
}

/** The view carried in the page's #view= fragment, if any. */
export function viewFromLocation() {
  if (typeof window === 'undefined') return null;
  const m = window.location.hash.match(/view=([^&]+)/);
  return m ? decodeView(m[1]) : null;
}

export function linkForView(view) {
  const url = new URL(window.location.href);
  url.hash = `view=${encodeView(view)}`;
  return url.toString();
}

// Saved views are a per-browser convenience, so browser storage is enough --
// and every access is guarded, because storage throws in some private modes.
const STORE = 'chutes.savedViews.v1';

export function loadSavedViews() {
  try {
    const list = JSON.parse(window.localStorage.getItem(STORE) ?? '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function storeSavedViews(list) {
  try {
    window.localStorage.setItem(STORE, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}
