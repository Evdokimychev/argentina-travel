import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { fetchOwnerOnboardingSnapshot } from "@/lib/admin/owner-onboarding-server";
import type { IntegrationReadinessItem } from "@/lib/integrations/admin-readiness";
import type { OpsStatusSnapshot } from "@/lib/ops/ops-status";
import type { AdminCapability } from "@/types/admin";
import type { Database } from "@/types/database";

type FakeResponse = {
  data?: unknown;
  count?: number | null;
  error?: { message: string } | null;
};

const NOW = Date.parse("2026-07-17T12:00:00.000Z");
const CRITICAL_IDS = ["supabase", "email", "mercadopago", "stripe", "sentry"];

function source(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function fakeClient(responses: Record<string, FakeResponse>): SupabaseClient<Database> {
  const from = (table: string) => {
    const response = responses[table] ?? { data: null, count: null, error: null };
    const query = {
      select: () => query,
      in: () => query,
      eq: () => query,
      order: () => query,
      limit: () => query,
      then: (
        onFulfilled: (value: FakeResponse) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) => Promise.resolve(response).then(onFulfilled, onRejected),
    };
    return query;
  };
  return { from } as unknown as SupabaseClient<Database>;
}

function integrations(status: IntegrationReadinessItem["status"] = "configured") {
  return CRITICAL_IDS.map((id) => ({
    id,
    label: id,
    group: id === "mercadopago" || id === "stripe" ? "payments" as const : "platform" as const,
    status,
    summary: id,
  }));
}

function ops(productionReady: boolean): OpsStatusSnapshot {
  return {
    rlsAudit: null,
    backup: {
      lastBackupAt: null,
      lastBackupFile: null,
      hint: "",
      productionReady,
      mode: productionReady ? "managed" : "unverified",
      restoreVerifiedAt: productionReady ? "2026-07-17T10:00:00.000Z" : null,
    },
    cron: {
      digest: null,
      cleanupTyping: null,
      backupHint: null,
      contentFreshness: null,
      privacyProcess: null,
    },
  };
}

function healthyResponses(): Record<string, FakeResponse> {
  return {
    site_settings: {
      data: [
        { key: "site.branding", value: { siteName: "Пора в Аргентину", defaultTitle: "Путешествия", logoAlt: "Логотип" } },
        { key: "site.design", value: { palettePreset: "argentina", headingFont: "unbounded" } },
        { key: "site.modules", value: { apartmentsMode: "native_request", carRentalMode: "partner", transfersMode: "partner" } },
      ],
      error: null,
    },
    tours: { count: 3, error: null },
    content_documents: { count: 12, error: null },
    admin_staff: { count: 2, error: null },
    admin_audit_log: {
      data: CRITICAL_IDS.map((entityId) => ({
        entity_id: entityId,
        payload: { status: "verified" },
        created_at: "2026-07-17T10:00:00.000Z",
      })),
      error: null,
    },
  };
}

describe("owner onboarding server facts", () => {
  it("marks every item complete only from successful real facts", async () => {
    const snapshot = await fetchOwnerOnboardingSnapshot(fakeClient(healthyResponses()), ["*"], {
      getIntegrations: () => integrations(),
      readOps: () => ops(true),
      now: () => NOW,
    });

    expect(snapshot.generatedAt).toBe("2026-07-17T12:00:00.000Z");
    expect(snapshot.items).toHaveLength(7);
    expect(snapshot.items.every((item) => item.status === "complete")).toBe(true);
    expect(snapshot.items.find((item) => item.id === "critical_integrations")?.fact).toBe(
      "Проверено 5 из 5",
    );
  });

  it("never converts database failures into zero or green", async () => {
    const failed = { error: { message: "database unavailable" } };
    const snapshot = await fetchOwnerOnboardingSnapshot(
      fakeClient({
        site_settings: failed,
        tours: failed,
        content_documents: failed,
        admin_staff: failed,
        admin_audit_log: failed,
      }),
      ["*"],
      {
        getIntegrations: () => integrations(),
        readOps: () => {
          throw new Error("filesystem unavailable");
        },
        now: () => NOW,
      },
    );

    expect(snapshot.items).toHaveLength(7);
    expect(snapshot.items.every((item) => item.status === "unavailable")).toBe(true);
    expect(snapshot.items.every((item) => item.fact.startsWith("Нет данных"))).toBe(true);
  });

  it("shows successful zero counts as unfinished rather than unavailable", async () => {
    const responses = healthyResponses();
    responses.tours = { count: 0, error: null };
    responses.content_documents = { count: 0, error: null };
    responses.admin_staff = { count: 0, error: null };

    const snapshot = await fetchOwnerOnboardingSnapshot(fakeClient(responses), ["*"], {
      getIntegrations: () => integrations(),
      readOps: () => ops(false),
      now: () => NOW,
    });

    expect(snapshot.items.find((item) => item.id === "tour_catalog")?.status).toBe("attention");
    expect(snapshot.items.find((item) => item.id === "published_content")?.status).toBe("attention");
    expect(snapshot.items.find((item) => item.id === "admin_team")?.status).toBe("attention");
    expect(snapshot.items.find((item) => item.id === "backup")?.status).toBe("attention");
  });

  it("does not treat empty settings rows or draft tours as completed setup", async () => {
    const responses = healthyResponses();
    responses.site_settings = {
      data: [
        { key: "site.branding", value: {} },
        { key: "site.design", value: {} },
        { key: "site.modules", value: {} },
      ],
      error: null,
    };
    responses.tours = { count: 0, error: null };
    const snapshot = await fetchOwnerOnboardingSnapshot(fakeClient(responses), ["*"], {
      getIntegrations: () => integrations(),
      readOps: () => ops(true),
      now: () => NOW,
    });
    expect(snapshot.items.find((item) => item.id === "site_identity")?.status).toBe("attention");
    expect(snapshot.items.find((item) => item.id === "site_modules")?.status).toBe("attention");
    expect(snapshot.items.find((item) => item.id === "tour_catalog")?.fact).toBe("Опубликованных туров пока нет");
  });

  it("does not treat configured, failed or stale integrations as verified", async () => {
    const responses = healthyResponses();
    responses.admin_audit_log = {
      data: [
        {
          entity_id: "supabase",
          payload: { status: "failed" },
          created_at: "2026-07-17T11:00:00.000Z",
        },
        {
          entity_id: "supabase",
          payload: { status: "verified" },
          created_at: "2026-07-17T10:00:00.000Z",
        },
        ...CRITICAL_IDS.slice(1).map((entityId) => ({
          entity_id: entityId,
          payload: { status: "verified" },
          created_at: "2026-05-01T10:00:00.000Z",
        })),
      ],
      error: null,
    };

    const snapshot = await fetchOwnerOnboardingSnapshot(fakeClient(responses), ["*"], {
      getIntegrations: () => integrations(),
      readOps: () => ops(true),
      now: () => NOW,
    });
    const item = snapshot.items.find((entry) => entry.id === "critical_integrations");

    expect(item).toMatchObject({ status: "attention", fact: "Настроено 5 из 5, проверено 0" });
  });

  it("filters unavailable work by server capabilities", async () => {
    const snapshot = await fetchOwnerOnboardingSnapshot(
      fakeClient(healthyResponses()),
      ["content.edit"] as AdminCapability[],
      {
        getIntegrations: () => integrations(),
        readOps: () => ops(true),
        now: () => NOW,
      },
    );

    expect(snapshot.items.map((item) => item.id)).toEqual(["published_content"]);
  });
});

describe("owner onboarding route and UI contracts", () => {
  it("keeps the endpoint guarded, private and read-only", () => {
    const route = source("src/app/api/admin/owner-onboarding/route.ts");
    const server = source("src/lib/admin/owner-onboarding-server.ts");

    expect(route).toContain('authorizeAdminRequest(request, "dashboard.view")');
    expect(route).toContain('"Cache-Control": "private, no-store"');
    expect(server).toContain('.from("site_settings")');
    expect(server).toContain('.from("admin_audit_log")');
    expect(server).not.toMatch(/\.(insert|update|upsert|delete)\(/);
  });

  it("persists integration checks without exposing environment variable names", () => {
    const route = source("src/app/api/admin/integrations/verify/route.ts");
    const panel = source("src/components/admin/cms/IntegrationReadinessPanel.tsx");
    expect(route).toContain("export async function GET");
    expect(route).toContain('.eq("action", "integration.verify")');
    expect(route).toContain("auditError");
    expect(route).toContain('auth.via !== "session"');
    expect(panel).toContain('fetch("/api/admin/integrations/verify"');
    expect(panel).not.toContain('entry.missingVariables.join(", ")');
  });

  it("uses AdminContext and never exposes manual completion state", () => {
    const component = source("src/components/admin/AdminOwnerOnboardingChecklist.tsx");
    const dashboard = source("src/app/admin/page.tsx");

    expect(component).toContain("useAdminContext");
    expect(component).toContain("hasCapability(item.requiredCapability)");
    expect(component).not.toContain("localStorage");
    expect(component).not.toContain('type="checkbox"');
    expect(dashboard).toContain("<AdminOwnerOnboardingChecklist />");
  });
});
