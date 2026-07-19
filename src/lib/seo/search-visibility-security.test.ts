import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migration = fs.readFileSync(
  path.join(root, "supabase/migrations/20260717090100_seo_search_visibility.sql"),
  "utf8",
);
const route = fs.readFileSync(
  path.join(root, "src/app/api/admin/seo/search-visibility/route.ts"),
  "utf8",
);
const server = fs.readFileSync(
  path.join(root, "src/lib/seo/search-visibility-server.ts"),
  "utf8",
);

describe("search visibility security boundary", () => {
  it("keeps provider secrets in Vault and denies browser roles", () => {
    expect(migration).toContain("create extension if not exists supabase_vault cascade");
    expect(migration).toContain("vault.create_secret");
    expect(migration).toContain("vault.update_secret");
    expect(migration).toContain("revoke all on public.seo_provider_connections from anon, authenticated, public");
    expect(migration).toContain("revoke all on function public.seo_get_provider_secret(text)");
    expect(migration).toContain("grant execute on function public.seo_get_provider_secret(text)");
  });

  it("never includes a credential value in the admin response", () => {
    expect(route).not.toContain("secret_value");
    expect(route).not.toContain("vault_secret_id");
    expect(route).toContain('authorizeAdminRequest(request, "system.settings")');
    expect(route).toContain('authorizeAdminRequest(request, "analytics.view")');
  });

  it("registers automatic daily synchronization", () => {
    const vercel = fs.readFileSync(path.join(root, "vercel.json"), "utf8");
    expect(vercel).toContain('"path": "/api/cron/seo-search-sync"');
  });

  it("expires sensitive search phrases after the defined retention window", () => {
    expect(server).toContain('.lt("metric_date", dateDaysAgo(400))');
    expect(migration).toContain("search phrases are sensitive telemetry");
  });
});
