import { afterEach, describe, expect, it, vi } from "vitest";
import type { Database } from "@/types/database";
import {
  fetchPublishedCmsDocument,
  readPublishedCmsDocument,
  readPublishedCmsDocumentsByType,
  readPublishedCmsDocumentsMergedByLocaleChain,
  resolveWithPublishedCmsOverride,
  resolveWithPublishedCmsOverrideResult,
  type CmsDbClient,
} from "@/lib/cms/content-resolver";
import { CmsPublicContentUnavailableError } from "@/lib/cms/public-read-result";

type ContentRow = Database["public"]["Tables"]["content_documents"]["Row"];
type QueryResponse = { data: unknown; error: unknown };

const row: ContentRow = {
  id: "blog:cms-only:ru",
  doc_type: "blog",
  slug: "cms-only",
  locale: "ru",
  title: "CMS only",
  status: "published",
  body: { kind: "blog", content: "Published CMS article" },
  seo: {},
  published_at: "2026-07-29T00:00:00.000Z",
  scheduled_publish_at: null,
  workflow_stage: "published",
  risk_level: "low",
  reviewer_id: null,
  last_fact_checked_at: null,
  next_review_at: null,
  last_substantive_update_at: null,
  schema_version: 1,
  created_by: null,
  updated_by: null,
  row_version: 1,
  created_at: "2026-07-29T00:00:00.000Z",
  updated_at: "2026-07-29T00:00:00.000Z",
};

function queryBuilder(response: QueryResponse | Promise<QueryResponse>) {
  const result = Promise.resolve(response);
  const builder: {
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    abortSignal: ReturnType<typeof vi.fn>;
    retry: ReturnType<typeof vi.fn>;
    maybeSingle: ReturnType<typeof vi.fn>;
    then: Promise<QueryResponse>["then"];
  } = {
    select: vi.fn(),
    eq: vi.fn(),
    abortSignal: vi.fn(),
    retry: vi.fn(),
    maybeSingle: vi.fn(() => result),
    then: result.then.bind(result),
  };
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.abortSignal.mockReturnValue(builder);
  builder.retry.mockReturnValue(builder);
  return builder;
}

function cmsClient(...responses: QueryResponse[]) {
  const builders = responses.map(queryBuilder);
  const from = vi.fn(() => {
    const next = builders.shift();
    if (!next) throw new Error("unexpected CMS query");
    return next;
  });
  return { client: { from } as unknown as CmsDbClient, from };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CMS public read results", () => {
  it("distinguishes confirmed missing from quota failure on a detail read", async () => {
    const missing = cmsClient({ data: null, error: null });
    await expect(
      readPublishedCmsDocument(missing.client, "blog", "absent"),
    ).resolves.toEqual({ status: "available", data: null });

    const quota = cmsClient({ data: null, error: { status: 402, message: "restricted" } });
    await expect(readPublishedCmsDocument(quota.client, "blog", "cms-only")).resolves.toEqual({
      status: "unavailable",
      retryable: true,
      errorClass: "quota",
    });
  });

  it("distinguishes a confirmed empty catalog from a malformed unavailable response", async () => {
    const empty = cmsClient({ data: [], error: null });
    await expect(readPublishedCmsDocumentsByType(empty.client, "blog")).resolves.toEqual({
      status: "available",
      data: [],
    });

    const malformed = cmsClient({ data: null, error: null });
    await expect(readPublishedCmsDocumentsByType(malformed.client, "blog")).resolves.toEqual({
      status: "unavailable",
      retryable: true,
      errorClass: "unknown",
    });
  });

  it("preserves successful locale data as partial while marking the merged read unavailable", async () => {
    const { client } = cmsClient(
      { data: [row], error: null },
      { data: null, error: { code: "PGRST003" } },
    );

    const result = await readPublishedCmsDocumentsMergedByLocaleChain(
      client,
      "blog",
      "es",
    );
    expect(result.status).toBe("unavailable");
    if (result.status === "unavailable") {
      expect(result.errorClass).toBe("timeout");
      expect(result.partial?.map((doc) => doc.slug)).toEqual(["cms-only"]);
    }
  });

  it("returns degraded fallback but never reports CMS-only outage as missing", async () => {
    const withFallback = cmsClient({ data: null, error: { code: "PGRST001" } });
    await expect(
      resolveWithPublishedCmsOverrideResult({
        docType: "blog",
        slug: "reviewed",
        fallback: { title: "Reviewed" },
        supabase: withFallback.client,
        merge: () => null,
      }),
    ).resolves.toEqual({
      status: "degraded",
      errorClass: "db_unavailable",
      fallback: { title: "Reviewed" },
    });

    const cmsOnly = cmsClient({ data: null, error: { code: "PGRST001" } });
    await expect(
      resolveWithPublishedCmsOverride({
        docType: "author_article",
        slug: "cms-only",
        fallback: null,
        supabase: cmsOnly.client,
        merge: () => null,
      }),
    ).rejects.toBeInstanceOf(CmsPublicContentUnavailableError);
  });

  it("keeps compatibility fetchers strict and disables automatic retries", async () => {
    const { client, from } = cmsClient({ data: null, error: { code: "42501" } });
    await expect(fetchPublishedCmsDocument(client, "legal", "terms")).rejects.toMatchObject({
      name: "CmsPublicContentUnavailableError",
      errorClass: "auth_restricted",
    });
    const builder = from.mock.results[0]?.value;
    expect(builder.abortSignal).toHaveBeenCalledOnce();
    expect(builder.retry).toHaveBeenCalledWith(false);
  });
});
