import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const source = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("settings control-plane integration", () => {
  it("keeps CAS, audit and the public snapshot in one database transaction", () => {
    const migration = source(
      "supabase/migrations/20260717043000_admin_settings_control_plane_atomic.sql",
    );

    expect(migration).toContain("admin_update_site_settings_atomic");
    expect(migration).toContain("for update of setting");
    expect(migration).toContain("SETTINGS_CONFLICT");
    expect(migration).toContain("insert into public.admin_audit_log");
    expect(migration).toContain("site_settings_refresh_control_plane");
    expect(migration).toContain("to service_role");
    expect(migration).toContain("from public, anon, authenticated");
  });

  it("uses a non-secret snapshot and a read-available, write-closed cold fallback at Edge", () => {
    const edge = source("src/lib/site-settings-edge.ts");
    const middleware = source("src/middleware.ts");

    expect(edge).toContain("site_settings_control_plane");
    expect(edge).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    expect(edge).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(edge).toContain('source: "last_known_good"');
    expect(edge).toContain('source: "safe_fallback"');
    expect(edge).toContain("navigation: { ...DEFAULT_SITE_NAVIGATION }");
    expect(edge).toContain('apartmentsMode: "disabled"');
    expect(middleware).toContain("fetchSiteControlPlaneEdge");
    expect(middleware).toContain("controlPlane.navigation");
    expect(middleware).toContain("controlPlane.modules");
  });

  it("uses the same public snapshot for routing, shell, discovery and public policies", () => {
    const layout = source("src/app/layout.tsx");
    const homeTeaser = source("src/components/flights/TravelPrepStrip.tsx");
    const services = source("src/app/services/page.tsx");
    const search = source("src/app/api/search/route.ts");
    const searchIndex = source("src/app/api/site/search-index/route.ts");
    const serverSettings = source("src/lib/site-settings-server.ts");

    for (const publicSurface of [layout, homeTeaser, services, search, searchIndex]) {
      expect(publicSurface).toContain("fetchSiteControlPlaneEdge");
    }
    expect(serverSettings).toContain("const result = await fetchSiteControlPlaneEdge()");
  });

  it("requires versions and binds confirmation to the exact risky batch", () => {
    const route = source("src/app/api/admin/settings/route.ts");
    const view = source("src/components/admin/views/SettingsView.tsx");

    expect(route).toContain("SETTINGS_VERSION_REQUIRED");
    expect(route).toContain("createSettingsConfirmationToken");
    expect(route).toContain("admin_update_site_settings_atomic");
    expect(view).toContain("expectedVersion: rowVersionsRef.current[key] ?? 0");
    expect(view).toContain("Проверьте важные последствия");
    expect(view).toContain("SETTINGS_CONFLICT");
  });
});
