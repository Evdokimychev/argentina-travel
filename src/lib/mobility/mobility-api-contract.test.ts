import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("mobility API boundaries", () => {
  it("checks organizer entitlements before every inventory mutation", () => {
    const auth = readFileSync("src/lib/mobility/organizer-auth-server.ts", "utf8");
    const route = readFileSync("src/app/api/organizer/mobility/route.ts", "utf8");
    expect(auth).toContain('"module.cars.manage"');
    expect(auth).toContain('"module.transfers.manage"');
    expect(auth).toContain("guardOrganizerEntitlement");
    expect(route.match(/authorizeOrganizerMobility/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("guards public catalog, native requests and affiliate handoffs", () => {
    for (const file of [
      "src/app/api/mobility/catalog/route.ts",
      "src/app/api/mobility/requests/route.ts",
      "src/app/api/mobility/handoff/route.ts",
    ]) {
      const source = readFileSync(file, "utf8");
      const policyIndex = Math.max(
        source.indexOf("enforceMobilityModuleAccess"),
        source.indexOf("resolveMobilityModuleAccess"),
      );
      expect(policyIndex).toBeGreaterThanOrEqual(0);
      expect(policyIndex).toBeLessThan(source.indexOf("callMobilityRpc"));
    }
  });

  it("protects native requests and keeps partner-only modes honest", () => {
    const requestRoute = readFileSync("src/app/api/mobility/requests/route.ts", "utf8");
    const catalogRoute = readFileSync("src/app/api/mobility/catalog/route.ts", "utf8");
    const policy = readFileSync("src/lib/mobility/module-policy-server.ts", "utf8");
    expect(requestRoute).toContain("verifyGuestFormProtection");
    expect(requestRoute).toContain("checkRateLimit");
    expect(requestRoute).toContain("allowNativeOffers");
    expect(catalogRoute).toContain("offers: []");
    expect(policy).toContain('mode === "preparing_hybrid"');
  });

  it("never returns exact addresses, documents or request contacts in catalog", () => {
    const migration = readFileSync("supabase/migrations/20260717041000_mobility_native_foundation.sql", "utf8");
    const catalog = migration.slice(
      migration.indexOf("create or replace function public.mobility_public_catalog"),
      migration.indexOf("create or replace function public.mobility_create_request"),
    );
    expect(catalog).not.toMatch(/exact_address|storage_object_ref|contact_email|contact_phone|customer_note/);
    expect(catalog).toContain("pickup_public_label");
    expect(catalog).toContain("origin_public_label");
  });

  it("does not alter existing partner checkout implementations", () => {
    const catalogRoute = readFileSync("src/app/api/mobility/catalog/route.ts", "utf8");
    const handoffRoute = readFileSync("src/app/api/mobility/handoff/route.ts", "utf8");
    expect(catalogRoute + handoffRoute).not.toMatch(/buildIntui|createTransferSearchAffiliateUrl|LocalRent|travelpayouts/i);
  });

  it("keeps both owner workspaces discoverable", () => {
    const adminNav = readFileSync("src/lib/admin/nav-config.ts", "utf8");
    const organizerNav = readFileSync("src/data/organizer-dashboard.ts", "utf8");
    expect(adminNav).toContain('href: "/admin/marketplace/mobility"');
    expect(adminNav).toContain('label: "Авто и трансферы"');
    expect(organizerNav).toContain('href: "/organizer/mobility"');
  });

  it("connects native inventory to the existing rental and transfer entries", () => {
    const rentalPage = readFileSync("src/app/car-rental/page.tsx", "utf8");
    const transferPage = readFileSync("src/app/transfers/page.tsx", "utf8");
    const mobilityPage = readFileSync("src/app/mobility/page.tsx", "utf8");
    for (const source of [rentalPage, transferPage]) {
      expect(source).toContain("MobilityCatalogClient");
      expect(source).toContain("allowNativeOffers");
      expect(source).toContain("PRIMARY_PUBLIC_MARKET.id");
    }
    expect(mobilityPage).toContain("resolveMobilityModuleAccess");
    expect(mobilityPage).toContain("notFound()");
  });

  it("keeps compliance documents private while supporting real review", () => {
    const upload = readFileSync("src/app/api/organizer/mobility/documents/route.ts", "utf8");
    const review = readFileSync("src/app/api/admin/mobility/documents/[id]/route.ts", "utf8");
    const migration = readFileSync("supabase/migrations/20260717041000_mobility_native_foundation.sql", "utf8");
    expect(migration).toContain("'mobility-private-documents'");
    expect(migration).toContain("false,\n  10485760");
    expect(upload).toContain("authorizeOrganizerMobility");
    expect(upload).toContain("file.size > 10 * 1024 * 1024");
    expect(upload).toContain("mobility_register_private_document");
    expect(upload).toContain("remove([storagePath])");
    expect(review).toContain('"marketplace.moderation"');
    expect(review).toContain("createSignedUrl");
    expect(review).toContain("300");
    expect(review).not.toContain("storage_object_ref }");
  });
});
