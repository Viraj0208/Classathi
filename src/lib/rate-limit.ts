/**
 * In-memory fixed-window rate limiter.
 *
 * Persists within a single runtime instance (Edge worker / Node.js function).
 * Provides effective protection against brute-force, API abuse, and
 * accidental client-side infinite loops.
 *
 * For distributed rate limiting across multiple instances, replace with
 * Upstash Redis (@upstash/ratelimit) or similar.
 */

type RateLimitEntry = {
  count: number;
  resetTime: number;
};

const store = new Map<string, RateLimitEntry>();

const MAX_STORE_SIZE = 10_000;
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = 0;

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  store.forEach((entry, key) => {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  });

  // Prevent unbounded memory growth under distributed attacks
  if (store.size > MAX_STORE_SIZE) {
    store.clear();
  }
}

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
};

/**
 * Check and increment rate limit counter for a given key.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  cleanup();

  const now = Date.now();
  let entry = store.get(key);

  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + windowMs };
    store.set(key, entry);
  }

  entry.count++;

  return {
    success: entry.count <= limit,
    limit,
    remaining: Math.max(0, limit - entry.count),
    resetTime: entry.resetTime,
  };
}

/**
 * Standard rate-limit response headers (RFC 6585 / draft-ietf-httpapi-ratelimit-headers).
 */
export function rateLimitHeaders(
  result: RateLimitResult
): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetTime / 1000)),
  };
}
