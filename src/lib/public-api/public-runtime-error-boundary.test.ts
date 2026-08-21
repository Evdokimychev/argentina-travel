import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function source(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

describe("public runtime error boundary", () => {
  it("keeps unknown errors out of the shared user-facing normalizer", () => {
    const normalizer = source("src/lib/site-feedback/normalize-error.ts");
    expect(normalizer).not.toContain("description: raw");
  });

  it("returns controlled transfer errors and resolves them by code in the client", () => {
    const route = source("src/app/api/transfers/search/route.ts");
    const view = source("src/components/transfers/TransfersSearchView.tsx");

    expect(route).not.toContain("Invalid search parameters");
    expect(route).not.toContain("Origin and destination must be set");
    expect(route).toContain('publicApiError("INVALID_REQUEST")');
    expect(route).toContain('publicApiError("PARTNER_DATA_UNAVAILABLE")');
    expect(view).toContain("resolvePublicApiErrorMessage(payload.code)");
  });

  it("does not expose provider or server exceptions from expert inquiries", () => {
    const route = source("src/app/api/experts/[slug]/inquiry/route.ts");

    expect(route).not.toContain("после настройки Supabase");
    expect(route).not.toContain("error.message");
    expect(route).not.toContain("Unexpected error");
    expect(route).toContain('publicApiError("SERVICE_UNAVAILABLE")');
  });

  it("keeps unexpected CORE route errors on the allowlisted public payload", () => {
    const clientLeak = "{ error: error instanceof Error ? error.message";
    const coreRoutes = [
      "src/app/api/tours/route.ts",
      "src/app/api/tours/[slug]/route.ts",
      "src/app/api/tours/[slug]/availability/route.ts",
      "src/app/api/tours/[slug]/waitlist/route.ts",
      "src/app/api/auth/lookup-phone/route.ts",
      "src/app/api/auth/ensure-profile/route.ts",
      "src/app/api/organizer-applications/route.ts",
      "src/app/api/organizer/bookings/route.ts",
      "src/app/api/organizer/inbox/route.ts",
      "src/app/api/bookings/route.ts",
      "src/app/api/bookings/[id]/route.ts",
      "src/app/api/map/objects/route.ts",
      "src/app/api/map/layers/route.ts",
      "src/app/api/notifications/route.ts",
      "src/app/api/privacy/export/route.ts",
      "src/app/api/privacy/delete-request/route.ts",
      "src/app/api/saved-articles/route.ts",
      "src/app/api/favorites/route.ts",
      "src/lib/public-api/handlers.ts",
    ];

    for (const path of coreRoutes) {
      expect(source(path), path).not.toContain(clientLeak);
    }
  });

  it("does not collapse a search catalogue outage into an empty confirmed set", () => {
    const route = source("src/app/api/search/route.ts");
    expect(route).not.toContain(".catch(() => ({ items: [], cities: [] }))");
    expect(route).toContain('return { status: "unavailable" }');
    expect(route).toContain("loadCatalogPathSlice");
  });
});
