// ─── Portfolio chat engine ────────────────────────────────────────────────────
//
// Intent matching for the portfolio assistant. Replaces the previous in-browser
// LLM runtimes (WebLLM / Transformers.js), which cost megabytes of download for
// answers the knowledge base already contains verbatim.
//
// Two routes, in priority order:
//
//   1. remote   — only when NEXT_PUBLIC_CHAT_ENDPOINT is set at build time.
//                 Must be a proxy that holds the provider key server-side; this
//                 is a static site, so a key shipped in the bundle is public.
//   2. local    — scored keyword match over `chatResponses`. Always available,
//                 works offline, and is the fallback whenever the remote route
//                 is absent, slow, or errors.
//
// The local matcher fixes three faults in the original `lower.includes(p)` scan:
//   · substring bleed — 'ai' matched "email", "available", "explain", "training"
//   · order bias      — first listed intent won regardless of match quality
//   · false certainty — a single weak hit answered as confidently as ten

import { chatResponses, chatFallback } from './data';

const ENDPOINT = process.env.NEXT_PUBLIC_CHAT_ENDPOINT || '';

/** True when a server-side proxy is configured to answer with a real model. */
export const REMOTE_ENABLED = Boolean(ENDPOINT);

// Words carrying no intent signal. Dropped before scoring so that
// "what is his email" scores on `email` alone.
const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'of', 'to', 'in', 'on', 'for', 'with', 'at', 'by',
  'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'do', 'does', 'did', 'has',
  'have', 'had', 'can', 'could', 'would', 'should', 'will', 'shall', 'may', 'might', 'he', 'his',
  'him', 'she', 'her', 'hers', 'they', 'them', 'their', 'you', 'your', 'yours', 'i', 'me', 'my',
  'we', 'our', 'it', 'its', 'this', 'that', 'these', 'those', 'there', 'here', 'what', 'whats',
  'which', 'who', 'whom', 'whose', 'how', 'why', 'when', 'where', 'tell', 'about', 'some', 'any',
  'more', 'most', 'much', 'many', 'please', 'thanks', 'thank', 'hi', 'hello', 'hey', 'ok', 'okay',
  'kasi', 'kasis',
]);

// A `phrase` is worth more than a `strong` term because word order is evidence.
const WEIGHT = { phrase: 4, strong: 3, term: 1.5 };

// Below this, answer with the fallback rather than a confident wrong answer.
// Tuned so one strong term (3) or two ordinary terms (3) qualifies, but a lone
// ordinary term (1.5) does not.
const MIN_SCORE = 2;

function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    // Keep +, #, ., / and - so "c++", "node.js" and "duckdb-wasm" survive.
    .replace(/[^a-z0-9+#./\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Crude de-pluralisation — enough for "projects", "skills", "queries". */
function singular(word) {
  if (word.length > 3 && word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.length > 4 && word.endsWith('ses')) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

/**
 * Whole-word tokens, singular and plural forms both present so intents can
 * list either. Compound tokens also yield their parts, so "duckdb-wasm"
 * matches an intent listing plain `duckdb`.
 */
function tokenize(text) {
  const tokens = new Set();

  for (const raw of normalize(text).split(' ')) {
    if (!raw || STOPWORDS.has(raw)) continue;

    tokens.add(raw);
    tokens.add(singular(raw));

    if (/[-./]/.test(raw)) {
      for (const part of raw.split(/[-./]/)) {
        if (part && !STOPWORDS.has(part)) {
          tokens.add(part);
          tokens.add(singular(part));
        }
      }
    }
  }

  return tokens;
}

function scoreIntent(intent, tokens, normalized) {
  let score = 0;
  const hits = [];

  for (const phrase of intent.phrases ?? []) {
    if (normalized.includes(phrase)) {
      score += WEIGHT.phrase;
      hits.push(phrase);
    }
  }
  for (const term of intent.strong ?? []) {
    if (tokens.has(term)) {
      score += WEIGHT.strong;
      hits.push(term);
    }
  }
  for (const term of intent.terms ?? []) {
    if (tokens.has(term)) {
      score += WEIGHT.term;
      hits.push(term);
    }
  }

  return { score, hits };
}

/**
 * Best-scoring intent for a query. Every intent is scored and the highest wins,
 * so listing order no longer decides the answer.
 *
 * @returns {{id: string, response: string, score: number, confident: boolean, hits: string[]}}
 */
export function matchIntent(query) {
  const normalized = normalize(query);
  const tokens = tokenize(query);

  let best = null;
  for (const intent of chatResponses) {
    const { score, hits } = scoreIntent(intent, tokens, normalized);
    if (score > 0 && (best === null || score > best.score)) {
      best = { intent, score, hits };
    }
  }

  if (best === null || best.score < MIN_SCORE) {
    return {
      id: 'fallback',
      response: chatFallback,
      score: best?.score ?? 0,
      confident: false,
      hits: best?.hits ?? [],
    };
  }

  return {
    id: best.intent.id,
    response: best.intent.response,
    score: best.score,
    confident: true,
    hits: best.hits,
  };
}

/** Local-only answer. Never throws, never touches the network. */
export function answerLocally(query) {
  return matchIntent(query).response;
}

/**
 * Ask the configured proxy. Returns null on any failure — missing endpoint,
 * timeout, non-2xx, malformed body — so the caller can fall back silently.
 */
export async function askRemote(messages, { timeoutMs = 9000 } = {}) {
  if (!REMOTE_ENABLED) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
      signal: controller.signal,
    });
    if (!res.ok) return null;

    const data = await res.json();
    const text = String(data?.reply ?? data?.text ?? data?.content ?? '').trim();
    return text || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const SYSTEM_PROMPT =
  "You are the assistant on Kasi Vandanapu's portfolio site. Answer briefly, " +
  'factually and professionally, using only the context provided. If a question ' +
  "is unrelated to Kasi's profile, steer back to his experience, skills, projects " +
  'or writing. Never invent employers, dates, metrics or technologies.';

/**
 * Resolve a query: remote first when configured, local match otherwise, and
 * local match again whenever the remote route fails.
 *
 * @returns {Promise<{text: string, source: 'remote'|'local'|'fallback'}>}
 */
export async function answer(query, history = []) {
  const local = matchIntent(query);

  if (REMOTE_ENABLED) {
    // Ground the model in whatever the local matcher found, so the remote
    // answer stays anchored to real portfolio facts.
    const grounding = local.confident
      ? `\n\nRelevant portfolio context:\n${local.response}`
      : '';

    const remote = await askRemote([
      { role: 'system', content: SYSTEM_PROMPT + grounding },
      ...history.slice(-6),
      { role: 'user', content: query },
    ]);

    if (remote) return { text: remote, source: 'remote' };
  }

  return { text: local.response, source: local.confident ? 'local' : 'fallback' };
}
