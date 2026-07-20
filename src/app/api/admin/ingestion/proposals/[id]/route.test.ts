import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  proposal: {
    id: "proposal-1",
    candidate_id: "candidate-1",
    content_document_id: "knowledge:mendoza:ru",
    base_version: 7,
    proposed_title: "Обновлённая Мендоса",
    proposed_body: { kind: "blog", content: "Новый проверенный текст" },
    status: "pending",
  } as Record<string, unknown>,
  updatedProposal: null as Record<string, unknown> | null,
  rpc: vi.fn(),
  authorize: vi.fn(),
  audit: vi.fn(),
}));

vi.mock("@/lib/admin/authorize-request", () => ({
  authorizeAdminRequest: mocks.authorize,
}));
vi.mock("@/lib/admin/audit", () => ({
  clientIpFromRequest: () => "127.0.0.1",
  writeAdminAuditLog: mocks.audit,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    rpc: mocks.rpc,
    from: () => {
      let updatePayload: Record<string, unknown> | null = null;
      const query = {
        select: () => query,
        update: (payload: Record<string, unknown>) => {
          updatePayload = payload;
          return query;
        },
        eq: () => query,
        in: () => query,
        maybeSingle: async () => {
          if (updatePayload) {
            mocks.updatedProposal = { ...mocks.proposal, ...updatePayload };
            return { data: mocks.updatedProposal, error: null };
          }
          return { data: mocks.proposal, error: null };
        },
      };
      return query;
    },
  }),
}));

import { POST } from "@/app/api/admin/ingestion/proposals/[id]/route";

function request(action: string) {
  return new Request("https://example.test/api/admin/ingestion/proposals/proposal-1", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action }),
  });
}

const context = { params: Promise.resolve({ id: "proposal-1" }) };

describe("POST /api/admin/ingestion/proposals/[id]", () => {
  beforeEach(() => {
    mocks.proposal = {
      id: "proposal-1",
      candidate_id: "candidate-1",
      content_document_id: "knowledge:mendoza:ru",
      base_version: 7,
      proposed_title: "Обновлённая Мендоса",
      proposed_body: { kind: "blog", content: "Новый проверенный текст" },
      status: "pending",
    };
    mocks.updatedProposal = null;
    mocks.authorize.mockReset().mockResolvedValue({
      ok: true,
      actorId: "8df63e78-5184-4f49-b75c-60c2f2897f15",
    });
    mocks.audit.mockReset().mockResolvedValue(undefined);
    mocks.rpc.mockReset().mockResolvedValue({
      data: {
        proposal: { ...mocks.proposal, status: "applied", applied_revision_id: "revision-8" },
        document: { id: "knowledge:mendoza:ru", row_version: 8 },
      },
      error: null,
    });
  });

  it("requires an explicit acceptance before applying", async () => {
    const response = await POST(request("apply"), context);

    expect(response.status).toBe(409);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("applies with the proposal base version and records the created revision", async () => {
    mocks.proposal.status = "accepted";
    const response = await POST(request("apply"), context);

    expect(response.status).toBe(200);
    expect(mocks.authorize).toHaveBeenCalledWith(expect.any(Request), "moderation.publish");
    expect(mocks.rpc).toHaveBeenCalledWith(
      "apply_ingestion_update_proposal_atomic",
      expect.objectContaining({ p_proposal_id: "proposal-1" }),
    );
  });

  it("keeps acceptance human-only and audited", async () => {
    const response = await POST(request("accept"), context);

    expect(response.status).toBe(200);
    expect(mocks.authorize).toHaveBeenCalledWith(expect.any(Request), "moderation.approve");
    expect(mocks.updatedProposal).toEqual(expect.objectContaining({ status: "accepted" }));
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({
      action: "ingestion.proposal.accept",
    }));
  });
});
