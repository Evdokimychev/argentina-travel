import { describe, expect, it, vi } from "vitest";
import {
  publishCmsDocument,
  publishDueScheduledCmsDocuments,
  restoreCmsDocumentFromRevision,
  scheduleCmsDocument,
  updateCmsDocument,
} from "@/lib/cms/content-server";
import type { Database, Json } from "@/types/database";
import type { CmsBlogBody } from "@/types/cms-content";

vi.mock("@/lib/search/cms-search-sync", () => ({
  syncCmsDocumentToSearchIndex: vi.fn(async () => ({ ok: true })),
}));

type ContentRow = Database["public"]["Tables"]["content_documents"]["Row"];
type RevisionRow = Database["public"]["Tables"]["content_revisions"]["Row"];

const longContent = Array.from(
  { length: 130 },
  (_, index) => `рекомендация${index + 1}`,
).join(" ");

const validBody = {
  kind: "blog",
  excerpt: "Проверенный практический материал для путешественника.",
  content: longContent,
  sections: [{ title: "Практический план", body: longContent }],
  collector: {
    schemaVersion: 2,
    identity: "cms-publication-gate",
    source: "official-source",
    sourceId: "official-source",
    sourceItemId: 1,
    sourceUrl: "https://example.com/official-source",
    fingerprint: "cms-publication-gate-v1",
    qualityScore: 90,
    scoreBreakdown: {},
    flags: [],
    category: "puteshestviya",
    tags: ["проверка"],
    media: [],
  },
} satisfies CmsBlogBody;

const thinBody = {
  ...validBody,
  content: "Слишком короткий материал.",
  sections: [{ title: "Коротко", body: "Слишком короткий материал." }],
} satisfies CmsBlogBody;

function documentRow(
  overrides: Partial<ContentRow> = {},
): ContentRow {
  return {
    id: "knowledge:cms-publication-gate:ru",
    doc_type: "knowledge",
    slug: "cms-publication-gate",
    locale: "ru",
    title: "Проверенный гид",
    status: "draft",
    body: validBody,
    seo: { description: "Проверенный практический гид" },
    published_at: null,
    scheduled_publish_at: null,
    workflow_stage: "draft",
    risk_level: "low",
    reviewer_id: null,
    last_fact_checked_at: null,
    next_review_at: null,
    last_substantive_update_at: null,
    schema_version: 1,
    created_by: null,
    updated_by: null,
    row_version: 7,
    created_at: "2026-07-16T00:00:00.000Z",
    updated_at: "2026-07-17T00:00:00.000Z",
    ...overrides,
  };
}

function revisionRow(overrides: Partial<RevisionRow> = {}): RevisionRow {
  return {
    id: "revision-1",
    document_id: "knowledge:cms-publication-gate:ru",
    revision_number: 2,
    title: "Проверенный гид из ревизии",
    body: validBody,
    seo: { description: "Проверенная ревизия" },
    created_by: null,
    created_at: "2026-07-17T00:00:00.000Z",
    ...overrides,
  };
}

type MockOptions = {
  current?: ContentRow | null;
  due?: ContentRow[];
  revision?: RevisionRow | null;
  rpc?: (name: string, args: Record<string, unknown>) => Promise<{ data: Json | null; error: null }>;
};

function rpcDocument(row: ContentRow): Json {
  return { document: row } as Json;
}

function createSupabaseMock(options: MockOptions = {}) {
  const rpc = vi.fn(
    options.rpc ??
      (async (_name: string, args: Record<string, unknown>) => {
        const current = options.current ?? documentRow();
        const operation = args.p_operation;
        const status =
          operation === "schedule"
            ? "scheduled"
            : operation === "restore"
              ? "draft"
              : "published";
        return {
          data: rpcDocument({
            ...current,
            status,
            row_version: current.row_version + 1,
          }),
          error: null,
        };
      }),
  );

  const from = vi.fn((table: string) => {
    const query: Record<string, unknown> = {};
    for (const method of ["select", "update", "delete", "eq", "in", "lte", "order"]) {
      query[method] = vi.fn(() => query);
    }
    query.maybeSingle = vi.fn(async () => ({
      data:
        table === "content_documents"
          ? (options.current ?? null)
          : table === "content_revisions"
            ? (options.revision ?? null)
            : null,
      error: null,
    }));
    query.limit = vi.fn(async () => ({
      data:
        table === "content_documents"
          ? (options.due ?? [])
          : table === "cms_search_outbox"
            ? []
            : [],
      error: null,
    }));
    query.then = (
      resolve: (value: { data: null; error: null }) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => Promise.resolve({ data: null, error: null }).then(resolve, reject);
    return query;
  });

  return { from, rpc };
}

describe("CMS knowledge publication gate", () => {
  it("rejects an invalid publish before any mutation RPC", async () => {
    const current = documentRow({ body: thinBody });
    const supabase = createSupabaseMock({ current });

    const result = await publishCmsDocument(supabase as never, current.id, {
      actorId: "owner",
      expectedVersion: current.row_version,
    });

    expect(result).toMatchObject({ code: "INVALID" });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("reports a stale version before publication-quality issues", async () => {
    const current = documentRow({ body: thinBody, row_version: 9 });
    const supabase = createSupabaseMock({ current });

    const result = await publishCmsDocument(supabase as never, current.id, {
      actorId: "owner",
      expectedVersion: 8,
    });

    expect(result).toMatchObject({ code: "STALE_VERSION" });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it.each(["published", "scheduled"] as const)(
    "validates a partial body update as a composed %s document",
    async (status) => {
      const current = documentRow({ status });
      const supabase = createSupabaseMock({ current });

      const result = await updateCmsDocument(supabase as never, current.id, {
        actorId: "owner",
        expectedVersion: current.row_version,
        body: thinBody,
      });

      expect(result).toMatchObject({ code: "INVALID" });
      expect(supabase.rpc).not.toHaveBeenCalled();
    },
  );

  it("validates the composed schedule candidate before scheduling", async () => {
    const current = documentRow();
    const supabase = createSupabaseMock({ current });

    const result = await scheduleCmsDocument(supabase as never, current.id, {
      actorId: "owner",
      expectedVersion: current.row_version,
      scheduledPublishAt: "2099-01-02T12:00:00.000Z",
      title: "Новый заголовок",
      body: thinBody,
    });

    expect(result).toMatchObject({ code: "INVALID" });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("allows a plain restore to draft but blocks publishing the same invalid revision", async () => {
    const current = documentRow();
    const revision = revisionRow({ body: thinBody });

    const draftSupabase = createSupabaseMock({ current, revision });
    await restoreCmsDocumentFromRevision(
      draftSupabase as never,
      current.id,
      revision.id,
      {
        actorId: "owner",
        expectedVersion: current.row_version,
        publish: false,
      },
    );
    expect(draftSupabase.rpc).toHaveBeenCalledWith(
      "cms_mutate_document_atomic",
      expect.objectContaining({
        p_operation: "restore",
        p_allow_publish: false,
        p_restore_revision_id: revision.id,
      }),
    );

    const publishSupabase = createSupabaseMock({ current, revision });
    const result = await restoreCmsDocumentFromRevision(
      publishSupabase as never,
      current.id,
      revision.id,
      {
        actorId: "owner",
        expectedVersion: current.row_version,
        publish: true,
      },
    );
    expect(result).toMatchObject({ code: "INVALID" });
    expect(publishSupabase.rpc).not.toHaveBeenCalled();
  });

  it("uses restore_publish for a valid revision", async () => {
    const current = documentRow();
    const revision = revisionRow();
    const supabase = createSupabaseMock({ current, revision });

    await restoreCmsDocumentFromRevision(supabase as never, current.id, revision.id, {
      actorId: "owner",
      expectedVersion: current.row_version,
      publish: true,
    });

    expect(supabase.rpc).toHaveBeenCalledWith(
      "cms_mutate_document_atomic",
      expect.objectContaining({
        p_operation: "restore_publish",
        p_allow_publish: true,
        p_restore_revision_id: revision.id,
      }),
    );
  });

  it("skips an invalid due document, publishes the valid one with exact CAS, and never calls the batch RPC", async () => {
    const invalid = documentRow({
      id: "knowledge:invalid-scheduled:ru",
      slug: "invalid-scheduled",
      status: "scheduled",
      body: thinBody,
      row_version: 11,
    });
    const valid = documentRow({
      id: "knowledge:valid-scheduled:ru",
      slug: "valid-scheduled",
      status: "scheduled",
      row_version: 23,
    });
    const supabase = createSupabaseMock({
      due: [invalid, valid],
      rpc: async () => ({
        data: rpcDocument({ ...valid, status: "published", row_version: 24 }),
        error: null,
      }),
    });

    const result = await publishDueScheduledCmsDocuments(supabase as never, "owner");

    expect(result.publishedIds).toEqual([valid.id]);
    expect(result.failed).toEqual([
      expect.objectContaining({ id: invalid.id }),
    ]);
    expect(supabase.rpc).toHaveBeenCalledTimes(1);
    expect(supabase.rpc).toHaveBeenCalledWith("cms_mutate_document_atomic", {
      p_document_id: valid.id,
      p_expected_version: 23,
      p_actor_id: null,
      p_operation: "publish_scheduled",
      p_allow_publish: true,
    });
    expect(supabase.rpc).not.toHaveBeenCalledWith(
      "cms_publish_due_scheduled_atomic",
      expect.anything(),
    );
  });
});
