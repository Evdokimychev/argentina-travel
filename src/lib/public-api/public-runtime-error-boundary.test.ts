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
});
