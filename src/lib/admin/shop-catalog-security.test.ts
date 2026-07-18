import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migration = fs.readFileSync(
  path.join(root, "supabase/migrations/20260717038000_shop_catalog_admin.sql"),
  "utf8",
);

describe("shop catalog database security", () => {
  it("keeps money integral, lifecycle constrained and order history restrictive", () => {
    expect(migration).toContain("price_minor bigint");
    expect(migration).toContain("shop_products_price_minor_check");
    expect(migration).toContain("shop_products_lifecycle_check");
    expect(migration).toContain("shop_orders_product_id_catalog_fk");
    expect(migration).toContain("on delete restrict not valid");
    expect(migration).not.toMatch(/price_minor\s+(numeric|double|real)/i);
  });

  it("uses service-only atomic CAS RPCs with in-transaction audit", () => {
    expect(migration).toContain("admin_manage_shop_product");
    expect(migration).toContain("admin_manage_shop_category");
    expect(migration).toContain("for update");
    expect(migration).toContain("version_conflict");
    expect(migration).toContain("insert into public.admin_audit_log");
    expect(migration).toContain("grant execute on function public.admin_manage_shop_product");
    expect(migration).toMatch(/revoke execute on function public\.admin_manage_shop_product[\s\S]+from public, anon, authenticated/);
  });

  it("publishes only complete products and exposes only published rows", () => {
    expect(migration).toContain("publish_requirements");
    expect(migration).toContain("jsonb_array_length(p_images) = 0");
    expect(migration).toContain("shop_products_public_read");
    expect(migration).toContain("status = 'published'");
    expect(migration).toContain("category.is_active = true");
  });

  it("guards admin routes with a real session owner and hides raw failures", () => {
    const auth = fs.readFileSync(path.join(root, "src/lib/admin/shop-catalog-auth.ts"), "utf8");
    const route = fs.readFileSync(path.join(root, "src/app/api/admin/shop/catalog/route.ts"), "utf8");
    expect(auth).toContain('authorizeAdminRequest(request, "operations.shop")');
    expect(auth).toContain('auth.via !== "session"');
    expect(route).not.toContain("error.message");
    expect(route).toContain('"Cache-Control": "private, no-store"');
  });

  it("gives the owner a media picker, ordering control and publish confirmation", () => {
    const view = fs.readFileSync(
      path.join(root, "src/components/admin/views/ShopCatalogView.tsx"),
      "utf8",
    );
    expect(view).toContain("CmsMediaPathField");
    expect(view).toContain("Порядок (меньше — выше)");
    expect(view).toContain('payload.status === "published"');
    expect(view).toContain("window.confirm");
  });
});
