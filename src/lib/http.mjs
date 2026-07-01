const cache = new Map();

const DEFAULT_TIMEOUT = Number(process.env.MED_RESEARCH_TIMEOUT_MS || 15_000);
const DEFAULT_TTL = Number(process.env.MED_RESEARCH_CACHE_TTL_MS || 300_000);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cacheGet(key) {
  const item = cache.get(key);
  if (!item || item.expiresAt < Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return structuredClone(item.value);
}

function cacheSet(key, value, ttlMs) {
  cache.set(key, { value: structuredClone(value), expiresAt: Date.now() + ttlMs });
}

export async function requestJson(url, options = {}) {
  const {
    headers = {},
    timeoutMs = DEFAULT_TIMEOUT,
    ttlMs = DEFAULT_TTL,
    retries = 1,
  } = options;
  const key = `json:${url}`;
  const cached = ttlMs > 0 ? cacheGet(key) : undefined;
  if (cached !== undefined) return cached;

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        headers: {
          accept: "application/json",
          "user-agent": "med-research-assistant/0.1.0 (+https://github.com/zengenb/med-research-assistant)",
          ...headers,
        },
        signal: controller.signal,
      });
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status} from ${new URL(url).hostname}`);
        error.status = response.status;
        throw error;
      }
      const data = await response.json();
      if (ttlMs > 0) cacheSet(key, data, ttlMs);
      return data;
    } catch (error) {
      lastError = error;
      const retryable = error.name === "AbortError" || error.status === 429 || error.status >= 500;
      if (!retryable || attempt === retries) break;
      await sleep(300 * 2 ** attempt);
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

export function clearHttpCache() {
  cache.clear();
}
