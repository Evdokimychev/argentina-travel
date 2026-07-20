import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseAdminClientMock } = vi.hoisted(() => ({
  createSupabaseAdminClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: createSupabaseAdminClientMock,
}));

type QueryResult = {
  data: Array<{ key: string; value: unknown }> | null;
  error: unknown;
};

function queryBuilder(result: Promise<QueryResult>) {
  const builder = {
    select: vi.fn(),
    in: vi.fn(),
    abortSignal: vi.fn(),
    retry: vi.fn(),
    then: result.then.bind(result),
  };
  builder.select.mockReturnValue(builder);
  builder.in.mockReturnValue(builder);
  builder.abortSignal.mockReturnValue(builder);
  builder.retry.mockReturnValue(builder);
  return builder;
}

describe("public site settings latency guard", () => {
  let now = 0;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    now = 0;
    vi.spyOn(Date, "now").mockImplementation(() => now);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("deduplicates concurrent globals into one bounded bulk query", async () => {
    let resolveQuery!: (value: QueryResult) => void;
    const pending = new Promise<QueryResult>((resolve) => {
      resolveQuery = resolve;
    });
    const builder = queryBuilder(pending);
    const from = vi.fn(() => builder);
    createSupabaseAdminClientMock.mockReturnValue({ from });

    const settings = await import("@/lib/site-settings-server");
    const brandingPromise = settings.fetchSiteBranding();
    const contactPromise = settings.fetchSiteContact();

    expect(from).toHaveBeenCalledTimes(1);
    expect(builder.in).toHaveBeenCalledWith(
      "key",
      expect.arrayContaining(["site.branding", "site.contact", "site.design"]),
    );
    expect(builder.abortSignal).toHaveBeenCalledTimes(1);
    expect(builder.retry).toHaveBeenCalledWith(false);

    resolveQuery({
      data: [
        { key: "site.branding", value: { siteName: "Ручная редакция" } },
        { key: "site.contact", value: { supportEmail: "team@example.com" } },
      ],
      error: null,
    });

    const [branding, contact] = await Promise.all([brandingPromise, contactPromise]);
    expect(branding.siteName).toBe("Ручная редакция");
    expect(contact.supportEmail).toBe("team@example.com");

    await settings.fetchSiteDesign();
    expect(from).toHaveBeenCalledTimes(1);
  });

  it("retries a cold transport failure after a short backoff instead of caching defaults", async () => {
    const responses = [
      Promise.resolve<QueryResult>({ data: null, error: { message: "offline" } }),
      Promise.resolve<QueryResult>({
        data: [{ key: "site.branding", value: { siteName: "CMS снова доступна" } }],
        error: null,
      }),
    ];
    const from = vi.fn(() => queryBuilder(responses.shift()!));
    createSupabaseAdminClientMock.mockReturnValue({ from });

    const settings = await import("@/lib/site-settings-server");
    expect((await settings.fetchSiteBranding()).siteName).toBe("Пора в Аргентину");

    now = 1_000;
    expect((await settings.fetchSiteBranding()).siteName).toBe("Пора в Аргентину");
    expect(from).toHaveBeenCalledTimes(1);

    now = 4_000;
    expect((await settings.fetchSiteBranding()).siteName).toBe("CMS снова доступна");
    expect(from).toHaveBeenCalledTimes(2);
  });

  it("keeps transactional travel modules closed during a cold settings failure", async () => {
    const from = vi.fn(() => queryBuilder(
      Promise.resolve<QueryResult>({ data: null, error: { message: "offline" } }),
    ));
    createSupabaseAdminClientMock.mockReturnValue({ from });

    const settings = await import("@/lib/site-settings-server");
    await expect(settings.fetchSiteModules()).resolves.toMatchObject({
      apartmentsMode: "disabled",
      carRentalMode: "disabled",
      transfersMode: "disabled",
      hotelsMode: "disabled",
      showApartmentsInServices: false,
      showCarRentalInServices: false,
      showTransfersInServices: false,
    });
  });

  it("serves the last successful public shell snapshot during a later outage", async () => {
    const responses = [
      Promise.resolve<QueryResult>({
        data: [{ key: "site.branding", value: { siteName: "Последняя редакция" } }],
        error: null,
      }),
      Promise.resolve<QueryResult>({ data: null, error: { message: "offline" } }),
    ];
    const from = vi.fn(() => queryBuilder(responses.shift()!));
    createSupabaseAdminClientMock.mockReturnValue({ from });

    const settings = await import("@/lib/site-settings-server");
    expect((await settings.fetchSiteBranding()).siteName).toBe("Последняя редакция");

    now = 61_000;
    expect((await settings.fetchSiteBranding()).siteName).toBe("Последняя редакция");
    now = 62_000;
    expect((await settings.fetchSiteBranding()).siteName).toBe("Последняя редакция");
    expect(from).toHaveBeenCalledTimes(2);
  });

  it("starts redirect and control-plane lookups together while preserving decision order", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src/middleware.ts"), "utf8");
    const redirectStart = source.indexOf("const redirectLookup =");
    const missingStart = source.indexOf("const missingPublicDetailLookup =");
    const controlPlaneStart = source.indexOf("const controlPlaneLookup =");
    const redirectAwait = source.indexOf("const redirect = await redirectLookup;");
    const missingAwait = source.indexOf(
      "const missingPublicDetail = await missingPublicDetailLookup;",
    );
    const controlPlaneAwait = source.indexOf("const controlPlane = await controlPlaneLookup;");

    expect(redirectStart).toBeGreaterThan(-1);
    expect(missingStart).toBeGreaterThan(redirectStart);
    expect(controlPlaneStart).toBeGreaterThan(missingStart);
    expect(missingStart).toBeLessThan(redirectAwait);
    expect(controlPlaneStart).toBeLessThan(redirectAwait);
    expect(redirectAwait).toBeLessThan(missingAwait);
    expect(redirectAwait).toBeLessThan(controlPlaneAwait);
  });

  it("bounds public CMS reads and streams optional blog tours independently", () => {
    const resolver = fs.readFileSync(
      path.join(process.cwd(), "src/lib/cms/content-resolver.ts"),
      "utf8",
    );
    const blogPage = fs.readFileSync(
      path.join(process.cwd(), "src/app/blog/[slug]/page.tsx"),
      "utf8",
    );
    const blogView = fs.readFileSync(
      path.join(process.cwd(), "src/components/blog/BlogPostView.tsx"),
      "utf8",
    );

    expect(resolver).toContain("CMS_PUBLIC_QUERY_TIMEOUT_MS = 1_500");
    expect(resolver.match(/\.retry\(false\)/g)?.length).toBeGreaterThanOrEqual(4);
    expect(resolver).toContain("const localizedDocuments = await Promise.all(");
    expect(blogPage).toContain("const initialTours = fetchMarketplaceTours();");
    expect(blogPage).not.toContain("await fetchMarketplaceTours()");
    expect(blogView).toContain("<Suspense fallback={null}>");
    expect(blogView).toContain("async function BlogPostTourEmbeds");
  });

  it("keeps optional social, tour, and flight data off the destination critical path", () => {
    const destinationPage = fs.readFileSync(
      path.join(process.cwd(), "src/app/destinations/[slug]/page.tsx"),
      "utf8",
    );
    const flightTeasers = fs.readFileSync(
      path.join(process.cwd(), "src/lib/flights/hub-price-teasers.ts"),
      "utf8",
    );
    const socialFeed = fs.readFileSync(
      path.join(process.cwd(), "src/components/social-feed/SocialFeed.tsx"),
      "utf8",
    );

    expect(destinationPage).toContain("const [tours, flightTeasers] = await Promise.all([");
    expect(flightTeasers).toContain("PUBLIC_TEASER_WAIT_MS = 3_000");
    expect(flightTeasers).toContain("return await Promise.race([request, deadline]);");
    expect(socialFeed).toContain("<Suspense fallback={null}>");
    expect(socialFeed).toContain("<SocialFeedContent {...props} />");
    expect(socialFeed).toContain("PUBLIC_SOCIAL_FEED_WAIT_MS = 2_500");
    expect(socialFeed).toContain("Promise.race([loadSocialFeedBlock(props), deadline])");
  });

  it("bounds homepage feature flags and skips anonymous remote auth", () => {
    const flags = fs.readFileSync(
      path.join(process.cwd(), "src/lib/feature-flags/server.ts"),
      "utf8",
    );
    const actor = fs.readFileSync(
      path.join(process.cwd(), "src/lib/personalization/interaction-context-server.ts"),
      "utf8",
    );

    expect(flags).toContain("QUERY_TIMEOUT_MS = 1_000");
    expect(flags).toContain(".retry(false)");
    expect(flags).toContain("const flagInFlight = new Map");
    expect(actor).toContain("if (!hasSupabaseAuthSessionCookie(cookieStore.getAll()))");
  });
});

describe("edge public shell fallbacks", () => {
  let now = 0;

  beforeEach(() => {
    vi.resetModules();
    now = 0;
    vi.spyOn(Date, "now").mockImplementation(() => now);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "public-test-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("keeps the last durable control snapshot during a later outage", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              revision: 8,
              features: { maintenanceMode: true, allowOrganizerSignup: false },
              navigation: { showForum: false },
              modules: { apartmentsMode: "disabled" },
            },
          ]),
          { status: 200 },
        ),
      )
      .mockRejectedValueOnce(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);

    const { fetchSiteControlPlaneEdge } = await import("@/lib/site-settings-edge");
    expect(await fetchSiteControlPlaneEdge()).toMatchObject({
      ok: true,
      source: "fresh",
      revision: 8,
      features: { maintenanceMode: true },
      navigation: { showForum: false },
      modules: { apartmentsMode: "disabled" },
    });

    now = 61_000;
    expect(await fetchSiteControlPlaneEdge()).toMatchObject({
      ok: true,
      source: "last_known_good",
      revision: 8,
      features: { maintenanceMode: true },
      navigation: { showForum: false },
    });
    now = 62_000;
    expect((await fetchSiteControlPlaneEdge()).features.maintenanceMode).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("keeps established read-only sections available but closes transactional modules on a cold outage", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const { fetchSiteControlPlaneEdge } = await import("@/lib/site-settings-edge");
    const snapshot = await fetchSiteControlPlaneEdge();

    expect(snapshot).toMatchObject({
      ok: false,
      source: "safe_fallback",
      revision: null,
      features: { maintenanceMode: false, allowOrganizerSignup: false },
      navigation: { showTours: true, showJournal: true, showForum: true, showShop: true },
      modules: {
        apartmentsMode: "disabled",
        carRentalMode: "disabled",
        transfersMode: "disabled",
      },
    });
  });

  it("does not keep a removed dynamic redirect alive during an outage", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            { from_path: "/__latency-old", to_path: "/guide", status_code: 301 },
          ]),
          { status: 200 },
        ),
      )
      .mockRejectedValueOnce(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);

    const { matchUrlRedirectEdge } = await import("@/lib/redirects/url-redirect-edge");
    expect(await matchUrlRedirectEdge("/__latency-old")).toEqual({
      toPath: "/guide",
      statusCode: 301,
    });

    now = 61_000;
    expect(await matchUrlRedirectEdge("/__latency-old")).toBeNull();
    now = 62_000;
    expect(await matchUrlRedirectEdge("/__latency-old")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
