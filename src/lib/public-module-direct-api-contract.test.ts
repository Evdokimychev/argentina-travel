import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function expectGuardBefore(path: string, module: "tours" | "transfers", marker: string) {
  const route = source(path);
  const guard = `enforcePublicModuleAccess("${module}"`;
  expect(route).toContain(guard);
  expect(route.indexOf(guard)).toBeLessThan(route.indexOf(marker));
}

describe("direct API module kill-switch", () => {
  it("guards tour waitlist and recommendation APIs before work starts", () => {
    expectGuardBefore(
      "src/app/api/tours/[slug]/waitlist/route.ts",
      "tours",
      "getClientIp(request)",
    );
    expectGuardBefore("src/app/api/ai/tour-match/route.ts", "tours", "let body: TourMatchRequest");
    expectGuardBefore(
      "src/app/api/podbor/narrative/route.ts",
      "tours",
      "let payload: PodborAiNarrativeRequest",
    );
  });

  it("guards public group discovery, creation and joining but keeps continuity actions", () => {
    const collection = source("src/app/api/group-trips/route.ts");
    const join = source("src/app/api/group-trips/[id]/join/route.ts");
    const leave = source("src/app/api/group-trips/[id]/leave/route.ts");
    const organizer = source("src/app/api/organizer/group-trips/[id]/route.ts");

    expect(collection).toContain("if (!mine && !organizer)");
    expect(collection).toContain('enforcePublicModuleAccess("tours", "public_read")');
    expect(collection).toContain('enforcePublicModuleAccess("tours", "public_write")');
    expect(join).toContain('enforcePublicModuleAccess("tours", "public_write")');
    expect(leave).toContain("Safety/continuity action");
    expect(leave).not.toContain("enforcePublicModuleAccess");
    expect(organizer).toContain('body.action === "confirm"');
    expect(organizer).toContain('enforcePublicModuleAccess("tours", "public_write")');
  });

  it("guards every transfer search and affiliate entry before provider calls", () => {
    expectGuardBefore(
      "src/app/api/transfers/search/route.ts",
      "transfers",
      "const { searchParams }",
    );
    expectGuardBefore(
      "src/app/api/transfers/autocomplete/route.ts",
      "transfers",
      "const { searchParams }",
    );
    expectGuardBefore(
      "src/app/api/affiliate/transfers/search/route.ts",
      "transfers",
      "const { searchParams }",
    );
    expectGuardBefore(
      "src/app/api/affiliate/transfers/book/route.ts",
      "transfers",
      "const { searchParams }",
    );
  });

  it("keeps kill-switch responses private and settings updates invalidate the shared cache", () => {
    const policy = source("src/lib/public-module-policy-server.ts");
    const settingsRoute = source("src/app/api/admin/settings/route.ts");
    const settingsServer = source("src/lib/site-settings-server.ts");

    expect(policy).toContain('"Cache-Control": "private, no-store, max-age=0"');
    expect(settingsRoute).toContain("invalidateSiteGlobal(update.key)");
    expect(settingsServer).toContain("cacheGeneration += 1");
    expect(settingsServer).toContain("snapshotCache = null");
  });
});
