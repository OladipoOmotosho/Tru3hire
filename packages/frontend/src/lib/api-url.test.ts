import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Tests for API URL resolution (Req 4.3 / 4.4, .agent/90-day-roadmap).
 *
 * api-url.ts reads import.meta.env.VITE_API_URL and DEV into module-level
 * constants at import time, so each scenario stubs the env, resets the module
 * registry, then dynamically imports a fresh copy. This is the only reliable
 * way to test module-load-time env branching.
 */

const LIVE_URL = "https://truehire-api-274298644527.us-central1.run.app";
const LOCAL_URL = "http://localhost:8000";

async function freshImport() {
  vi.resetModules();
  return import("./api-url");
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("getApiUrl — production (DEV=false)", () => {
  it("resolves synchronously to LIVE_URL with no fetch when VITE_API_URL is unset", async () => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("VITE_API_URL", "");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const { getApiUrl } = await freshImport();
    const url = await getApiUrl();

    expect(url).toBe(LIVE_URL);
    expect(fetchSpy).not.toHaveBeenCalled(); // no localhost probe tax in prod
  });

  it("uses VITE_API_URL when set to a non-localhost URL", async () => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("VITE_API_URL", "https://custom.example.com");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const { getApiUrl } = await freshImport();
    const url = await getApiUrl();

    expect(url).toBe("https://custom.example.com");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("ignores a localhost VITE_API_URL in prod and falls back to LIVE_URL", async () => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("VITE_API_URL", "http://localhost:9999");
    vi.stubGlobal("fetch", vi.fn());

    const { getApiUrl } = await freshImport();
    expect(await getApiUrl()).toBe(LIVE_URL);
  });
});

describe("getApiUrl — development (DEV=true)", () => {
  it("probes localhost and uses it when /health responds ok", async () => {
    vi.stubEnv("DEV", true);
    vi.stubEnv("VITE_API_URL", "");
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true } as Response);
    vi.stubGlobal("fetch", fetchSpy);

    const { getApiUrl } = await freshImport();
    const url = await getApiUrl();

    expect(url).toBe(LOCAL_URL);
    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(fetchSpy.mock.calls[0][0]).toBe(`${LOCAL_URL}/health`);
  });

  it("falls back to LIVE_URL when the localhost probe rejects", async () => {
    vi.stubEnv("DEV", true);
    vi.stubEnv("VITE_API_URL", "");
    const fetchSpy = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    vi.stubGlobal("fetch", fetchSpy);

    const { getApiUrl } = await freshImport();
    expect(await getApiUrl()).toBe(LIVE_URL);
    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it("trusts a non-localhost VITE_API_URL without probing", async () => {
    vi.stubEnv("DEV", true);
    vi.stubEnv("VITE_API_URL", "https://staging.example.com");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const { getApiUrl } = await freshImport();
    expect(await getApiUrl()).toBe("https://staging.example.com");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("caches the resolved URL (second call does not re-probe)", async () => {
    vi.stubEnv("DEV", true);
    vi.stubEnv("VITE_API_URL", "");
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true } as Response);
    vi.stubGlobal("fetch", fetchSpy);

    const { getApiUrl } = await freshImport();
    await getApiUrl();
    await getApiUrl();

    expect(fetchSpy).toHaveBeenCalledOnce(); // cached after first resolve
  });
});

describe("getApiUrlSync", () => {
  it("returns LIVE_URL in prod before any async resolve", async () => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("VITE_API_URL", "");
    const { getApiUrlSync } = await freshImport();
    expect(getApiUrlSync()).toBe(LIVE_URL);
  });

  it("returns the cached value after getApiUrl resolves", async () => {
    vi.stubEnv("DEV", true);
    vi.stubEnv("VITE_API_URL", "");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true } as Response));

    const { getApiUrl, getApiUrlSync } = await freshImport();
    await getApiUrl();
    expect(getApiUrlSync()).toBe(LOCAL_URL);
  });
});

describe("resetApiUrl", () => {
  it("forces a re-probe on the next getApiUrl call", async () => {
    vi.stubEnv("DEV", true);
    vi.stubEnv("VITE_API_URL", "");
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true } as Response);
    vi.stubGlobal("fetch", fetchSpy);

    const { getApiUrl, resetApiUrl } = await freshImport();
    await getApiUrl();
    resetApiUrl();
    await getApiUrl();

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
