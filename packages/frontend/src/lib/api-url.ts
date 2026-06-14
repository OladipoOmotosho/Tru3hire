/**
 * API URL Resolution
 *
 * Production: resolves synchronously — VITE_API_URL if set, else the live
 * backend. No probing, zero added latency for visitors.
 *
 * Development: probes localhost first (so a running local backend wins),
 * falls back to the live backend if unreachable. Result cached per session.
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
 * - Production builds: VITE_API_URL (or LIVE_URL fallback), synchronously.
 * - Dev builds: if VITE_API_URL is non-localhost, trust it; otherwise probe
 *   localhost /health (2s timeout) and fall back to LIVE_URL.
 */
export async function getApiUrl(): Promise<string> {
  // Already resolved — return cached
  if (_resolvedUrl !== null) return _resolvedUrl;

  // Production: never probe localhost (Req 4.3/4.4, .agent/90-day-roadmap)
  if (!import.meta.env.DEV) {
    _resolvedUrl = ENV_URL && !ENV_URL.includes("localhost") ? ENV_URL : LIVE_URL;
    return _resolvedUrl;
  }

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
 * Get API URL synchronously (returns cached value or environment default).
 * Use this only when you can't await (e.g. module-level constants).
 * Callers should call `getApiUrl()` at least once before using this.
 */
export function getApiUrlSync(): string {
  if (_resolvedUrl !== null) return _resolvedUrl;
  if (!import.meta.env.DEV) {
    return ENV_URL && !ENV_URL.includes("localhost") ? ENV_URL : LIVE_URL;
  }
  return ENV_URL ?? LOCAL_URL;
}

/**
 * Force re-probe on next call (useful after network recovery, and for tests).
 */
export function resetApiUrl(): void {
  _resolvedUrl = null;
  _resolving = null;
}
