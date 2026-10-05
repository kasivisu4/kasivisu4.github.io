// components/viz/chutes/help.js
//
// Hover help for every component of the Chutes figure, in one place so the
// wording stays consistent and each claim can be checked against the code
// and data notes it summarizes.

export const HELP = {
  // KPI strip
  requests:
    'Requests in the current selection — every filter, click, brush and period applies. The sparkline is weekly volume; the arrow compares the last N days of the selection with the N days before.',
  avgIn:
    'Mean input (prompt) tokens per request, over requests that recorded token counts. 7.5% of the trace has none, so dividing by every request would read ~8% low. The median is about half the mean — a few huge prompts pull it up.',
  avgOut: 'Mean output tokens per request, measured the same way as input: over requests that recorded token counts.',
  ttft:
    'Mean time to first token. Only streaming calls have one — a non-streaming call returns everything at once — so this covers the streaming share shown underneath. An upward arrow is worse.',
  last:
    'How long your most recent filter or brush took: first query sent to last result back, across every query it triggered. "From cubes" means Mosaic answered from a pre-aggregated index instead of the table.',
  trend:
    'Window for the trend arrows: the last 30 or 90 days of the selected dates compared with the same number of days just before them. A shorter selection (a brush, a 14-day Play frame) is compared whole with the equal stretch before it, even when those days are outside the selection.',
  compact:
    'Collapses the filters, folds anomalies and peak hours into one line, and makes the table and charts denser so more fits on screen. Remembered in this browser.',

  // sidebar
  activeFilters: 'Every active filter. Click a chip to remove it; Esc clears them all.',
  category:
    'What the API call did: 98 raw function names folded into 7 classes. "Control plane" is health checks and model listing — traffic, but not inference.',
  streaming: 'Whether output streamed back token by token. Time to first token only exists for streaming calls.',
  mtype:
    'Reasoning / Coding / Vision / Chat, inferred from the model name (R1, Thinking, Coder, VL…). A heuristic: when a name gives no signal the model is "Unknown", not guessed.',
  family:
    'Model lineage inferred from the name. Fine-tunes stay with their base (R1T Chimera counts as DeepSeek). "Unnamed" are top models missing from the paper\'s name list; "Long tail" is everything outside the top 200.',
  func:
    'The raw function_name recorded for each call — 98 values, five of which carry 99.9% of traffic. Search, or take the top 10/20 under the current filters.',
  model:
    'The 200 busiest models by name; the rest fold into "Other (outside top 200)". Search, or take the top 10/20 under the current filters.',
  savedViews:
    'Save the current filters, grouping, period and clicks under a name in this browser, or copy a link that reopens this exact view anywhere.',

  // main column
  groupBy:
    'Colors every chart and the table by one dimension. Model, Function and Family show their top 8 and fold the rest into "Other". Switching keeps your filters.',
  period:
    'Zoom to a calendar quarter or trailing window; it also filters everything else. The file\'s timestamps start at 1970; dates follow the paper\'s stated span, 11 Apr 2025 to 12 Apr 2026.',
  exports: 'Download the timeline, as currently filtered, as a PNG.',
  rawData:
    'One random hour matching your filters, two ways: real requests read live from the 91 GB trace on AWS S3, and the same hour as rollup rows in the 24 MB summary file the charts read. Shows how raw requests become counts and sums.',
  timeline:
    'Requests per day, stacked by the current grouping; the thin line is the daily total. Hover for the day\'s mix; drag to brush a date range, which filters everything else.',
  anomalies:
    'Days where a group broke from its own recent past: at least 3×, or at most a third of, its median over the previous 14 days. At most two per group, bigger traffic ranked first. Click one to zoom in.',
  peak:
    'The busiest and quietest two-hour windows for the current selection. Hours are on the trace\'s own clock — the real timezone is not recoverable.',
  table:
    'One row per group under the current filters. Click a column to sort, a row to filter to it. Averages count measured requests only; amber means under half were measured.',
  hours:
    'Requests by hour of day, stacked by the current grouping. Click an hour to filter to it, or drag a range. Trace clock, not UTC.',
  heatmap:
    'Every hour of the year; darker means more requests. Click a cell to filter to that hour of that day, or drag a box. The blank band on Jan 13–14, 2026 is 30 hours with no traffic at all.',
};
