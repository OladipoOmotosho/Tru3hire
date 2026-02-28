/**
 * API URL Resolution with Fallback
 *
 * Tries localhost first; if unavailable, falls back to the live backend.
 * Caches the resolved URL so subsequent calls are instant.
 */

const LOCAL_URL = "http://localhost:8000";
const LIVE_URL = "https://truehire-api-274298644527.us-central1.run.app";

// Read from env first (allows explicit override)
const ENV_URL = import.meta.env.VITE_API_URL;

let _resolvedUrl: string | null = null;
let _resolving: Promise<string> | null = null;

/**
 * Resolve the API URL to use.
 *
 * - If VITE_API_URL points to something other than localhost, use it directly.
 * - If it's localhost (default), probe /health; fall back to LIVE_URL on failure.
 * - Result is cached for the session.
 */
export async function getApiUrl(): Promise<string> {
  // Already resolved — return cached
  if (_resolvedUrl !== null) return _resolvedUrl;

  // Deduplicate concurrent callers
  if (_resolving) return _resolving;

  _resolving = (async () => {
    // If env points to a non-localhost URL, trust it
    if (ENV_URL && !ENV_URL.includes("localhost")) {
      _resolvedUrl = ENV_URL;
      return _resolvedUrl;
    }

    // Probe localhost
    const localTarget = ENV_URL || LOCAL_URL;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout

      const res = await fetch(`${localTarget}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        _resolvedUrl = localTarget;
        console.info(`[API] Using local backend: ${_resolvedUrl}`);
        return _resolvedUrl;
      }
    } catch {
      // localhost unreachable — fall through
    }

    // Fallback to live
    _resolvedUrl = LIVE_URL;
    console.info(
      `[API] Local backend unavailable, using live: ${_resolvedUrl}`,
    );
    return _resolvedUrl;
  })();

  const result = await _resolving;
  _resolving = null;
  return result;
}

/**
 * Get API URL synchronously (returns cached value or LOCAL_URL).
 * Use this only when you can't await (e.g. module-level constants).
 * Callers should call `getApiUrl()` at least once before using this.
 */
export function getApiUrlSync(): string {
  return _resolvedUrl ?? ENV_URL ?? LOCAL_URL;
}

/**
 * Force re-probe on next call (useful after network recovery).
 */
export function resetApiUrl(): void {
  _resolvedUrl = null;
  _resolving = null;
}
