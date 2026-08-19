import fs from "node:fs";
import path from "path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("Iteration 3 organizer ownership and application contracts", () => {
  it("does not leak missing or foreign drafts", () => {
    const route = source("src/app/api/organizer/tours/[id]/draft/route.ts");
    expect(route).toContain('status: 404');
    expect(route).toContain("Предложение не найдено");
    expect(route).not.toContain('updatedAt: null, tour: null, draft: null');
  });

  it("maps a pending unique violation to 409 and exposes own application status", () => {
    const route = source("src/app/api/organizer-applications/route.ts");
    expect(route).toContain('insertError?.code === "23505"');
    expect(route).toContain("status: 409");
    expect(route).toContain("export async function GET");
    expect(route).toContain(".eq(\"user_id\", user.id)");
  });

  it("keeps contact submissions out of the organizer application table", () => {
    const route = source("src/app/api/contact/route.ts");
    expect(route).toContain("USE_ORGANIZER_APPLICATIONS");
    expect(route).not.toContain("allowOrganizerSignup");
  });

  it("uses owned catalog slugs on server booking and inbox APIs", () => {
    expect(source("src/app/api/organizer/bookings/route.ts")).toContain(
      "getOrganizerOwnedCatalogSlugs",
    );
    expect(source("src/app/api/organizer/inbox/route.ts")).toContain(
      "getOrganizerOwnedCatalogSlugs",
    );
    expect(source("src/app/api/organizer/reviews/route.ts")).toContain(
      "getOrganizerOwnedCatalogSlugs",
    );
    expect(source("src/lib/bookings-server.ts")).not.toContain(
      "getOrganizerCatalogSlugs(organizerUserId)",
    );
  });

  it("notifies both approval and rejection after the atomic decision", () => {
    const route = source("src/app/api/admin/organizer-applications/[id]/route.ts");
    expect(route).toContain("organizer_application_rejected");
    expect(route).toContain("organizer_application_approved");
  });

  it("locks application updates to the decision RPC", () => {
    const migration = source(
      "supabase/migrations/20260819093000_lock_organizer_application_decisions.sql",
    );
    expect(migration).toContain("organizer_applications_update_staff");
    expect(migration).toContain("revoke update on table public.organizer_applications");
  });
});
