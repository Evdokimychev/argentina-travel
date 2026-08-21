import { describe, expect, it, vi, afterEach } from "vitest";

describe("executeSiteSearch interactive budget", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    vi.useRealTimers();
  });

  it("falls back to static results within the backend budget when postgres hangs", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");

    vi.doMock("@/lib/search/meilisearch-client", () => ({
      isMeilisearchConfigured: () => false,
      searchMeilisearchDocuments: vi.fn(async () => []),
    }));

    vi.doMock("@/lib/supabase/admin", () => ({
      createSupabaseAdminClient: () => ({
        rpc: () => new Promise(() => undefined),
        from: () => ({
          select: () => ({
            then: () => new Promise(() => undefined),
          }),
        }),
      }),
    }));

    const { executeSiteSearch, SEARCH_BACKEND_BUDGET_MS } = await import(
      "@/lib/search/search-query"
    );

    const started = Date.now();
    const result = await executeSiteSearch("Патагония");
    const elapsed = Date.now() - started;

    expect(result.source).toBe("static");
    expect(result.results.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(SEARCH_BACKEND_BUDGET_MS + 1_500);
  }, 15_000);
});
