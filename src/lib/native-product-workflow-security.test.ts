import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("native tour and excursion workflow", () => {
  it("persists exact drafts and separates public catalogs in the database", () => {
    const migration = fs.readFileSync(
      path.join(
        root,
        "supabase/migrations/20260715202136_native_tour_excursion_workflow.sql"
      ),
      "utf8"
    );

    expect(migration).toContain("product_type text not null default 'tour'");
    expect(migration).toContain("editor_draft jsonb");
    expect(migration).toContain("approved_payload jsonb");
    expect(migration).toContain("product_type in ('tour', 'excursion')");
    expect(migration).toContain('drop policy if exists "tours_select_published"');
    expect(migration).not.toContain('create policy "tours_select_published"');
  });

  it("stores uploaded media outside the draft payload", () => {
    const migration = fs.readFileSync(
      path.join(
        root,
        "supabase/migrations/20260715202136_native_tour_excursion_workflow.sql"
      ),
      "utf8"
    );
    const uploadRoute = fs.readFileSync(
      path.join(root, "src/app/api/organizer/tours/[id]/media/route.ts"),
      "utf8"
    );

    expect(migration).toContain("'organizer-products'");
    expect(uploadRoute).toContain("processCmsUploadImage");
    expect(uploadRoute).toContain("product.owner_user_id !== sessionUser.id");
    expect(uploadRoute).toContain("MAX_BYTES");
  });

  it("enforces ownership, slug uniqueness and publish readiness on the server", () => {
    const route = fs.readFileSync(
      path.join(root, "src/app/api/organizer/tours/[id]/draft/route.ts"),
      "utf8"
    );

    expect(route).toContain("existingRow.owner_user_id !== auth.sessionUser.id");
    expect(route).toContain("evaluatePublishReadiness(serverDraft)");
    expect(route).toContain('.neq("id", id)');
    expect(route).toContain("serverDraft");
    expect(route).toContain("p_actor_user_id: auth.sessionUser.id");
    expect(route).toContain("containsEmbeddedDataUrl(draft)");
  });

  it("keeps native tours and excursions in their corresponding public queries", () => {
    const server = fs.readFileSync(
      path.join(root, "src/lib/tour-content-server.ts"),
      "utf8"
    );

    expect(server).toContain('.eq("product_type", "tour")');
    expect(server).toContain('.eq("product_type", "excursion")');
    expect(server).toContain("fetchPublishedExcursionBySlugServer");
  });

  it("resolves product and queue through the atomic moderation contract", () => {
    const source = fs.readFileSync(
      path.join(root, "src/lib/admin/moderation-server.ts"),
      "utf8"
    );
    const migration = fs.readFileSync(
      path.join(
        root,
        "supabase/migrations/20260717050000_general_moderation_atomic_workflow.sql",
      ),
      "utf8",
    );

    expect(source).toContain('supabase.rpc("admin_resolve_moderation_item_atomic"');
    expect(migration).toContain("where id = tour_row.id and row_version = p_expected_entity_version");
    expect(migration.indexOf("update public.tours")).toBeLessThan(
      migration.indexOf("update public.moderation_queue", migration.indexOf("update public.tours")),
    );
  });

  it("does not expose organizer drafts through public APIs", () => {
    const apiFiles = [
      "src/app/api/tours/route.ts",
      "src/app/api/tours/[slug]/route.ts",
      "src/app/api/v1/tours/route.ts",
      "src/app/api/v1/tours/[slug]/route.ts",
    ];

    for (const file of apiFiles) {
      const source = fs.readFileSync(path.join(root, file), "utf8");
      expect(source).toMatch(
        /fetchPublishedListingsResultServer|fetchTourDetailBySlugResultServer/,
      );
      expect(source).not.toContain("createSupabaseServerClient");
    }
  });

  it("retires the unvalidated canonical sync endpoint", () => {
    const source = fs.readFileSync(
      path.join(root, "src/app/api/organizer/tours/sync/route.ts"),
      "utf8"
    );
    expect(source).toContain("status: 410");
    expect(source).not.toContain("upsertTourFromCanonical");
  });

  it("queues organizer publications through the atomic database workflow", () => {
    const route = fs.readFileSync(
      path.join(root, "src/app/api/organizer/tours/[id]/draft/route.ts"),
      "utf8"
    );
    expect(route).toContain('"organizer_mutate_tour_atomic"');
    expect(route).not.toMatch(/\bforce\b/);
  });

  it("loads and books first-party excursions without falling through to partner APIs", () => {
    const excursionServer = fs.readFileSync(
      path.join(root, "src/lib/excursion-server.ts"),
      "utf8"
    );
    const scheduleRoute = fs.readFileSync(
      path.join(root, "src/app/api/excursions/[slug]/schedule/route.ts"),
      "utf8"
    );
    const bookingForm = fs.readFileSync(
      path.join(root, "src/components/excursions/ExcursionBookingContactSection.tsx"),
      "utf8"
    );

    expect(excursionServer).toContain("fetchNativeDetailResult(slug)");
    expect(excursionServer.indexOf("fetchNativeDetailResult(slug)")).toBeLessThan(
      excursionServer.indexOf("parseExcursionSlug(slug)")
    );
    expect(scheduleRoute).toContain('excursion.partner === "platform"');
    expect(bookingForm).toContain('fetch("/api/bookings"');
    expect(bookingForm).toContain("excursion.platformTourId");
  });

  it("keeps approved availability live during repeat moderation", () => {
    const availability = fs.readFileSync(
      path.join(root, "src/lib/tour-availability-server.ts"),
      "utf8"
    );
    expect(availability).toContain("approved_payload");
    expect(availability).toContain('"pending"');
    expect(availability).toContain('"rejected"');
  });

  it("requires a real admin UUID for service-role moderation", () => {
    const route = fs.readFileSync(
      path.join(root, "src/app/api/admin/moderation/[id]/route.ts"),
      "utf8"
    );
    expect(route).toContain("x-admin-actor-id");
    expect(route).toContain("status: 400");
    expect(route).not.toContain("resolveModerationItem(\n    supabase,\n    id,\n    body.action,\n    auth.actorId");
  });

  it("keeps middleware maintenance reads compatible with the Edge runtime", () => {
    const middleware = fs.readFileSync(path.join(root, "src/middleware.ts"), "utf8");
    const edgeSettings = fs.readFileSync(
      path.join(root, "src/lib/site-settings-edge.ts"),
      "utf8"
    );

    expect(middleware).toContain('from "@/lib/site-settings-edge"');
    expect(middleware).not.toContain('from "@/lib/site-settings-server"');
    expect(middleware).toContain('from "@/lib/redirects/url-redirect-edge"');
    expect(middleware).not.toContain('from "@/lib/redirects/url-redirect-server"');
    expect(edgeSettings).not.toContain("createSupabaseAdminClient");
    expect(edgeSettings).not.toContain('from "@/lib/supabase/admin"');

    const edgeRedirects = fs.readFileSync(
      path.join(root, "src/lib/redirects/url-redirect-edge.ts"),
      "utf8"
    );
    expect(edgeRedirects).not.toContain("createSupabaseAdminClient");
    expect(edgeRedirects).not.toContain('from "@/lib/supabase/admin"');
  });
});
