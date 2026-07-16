import { describe, expect, it } from "vitest";
import { rowToPublicTour } from "@/lib/tour-content-mapper";
import type { TourRow } from "@/types/database";

function row(overrides: Partial<TourRow> = {}): TourRow {
  return {
    id: "org-1",
    slug: "new-title",
    owner_user_id: "owner-1",
    product_type: "tour",
    status: "published",
    title: "New title",
    listing: null,
    payload: { id: "org-1", slug: "new-title", title: "New title" },
    editor_draft: null,
    approved_listing: null,
    approved_payload: null,
    approved_at: null,
    published_at: "2026-07-15T00:00:00.000Z",
    moderation_status: "pending",
    moderation_notes: null,
    moderated_by: null,
    moderated_at: null,
    created_at: "2026-07-15T00:00:00.000Z",
    updated_at: "2026-07-15T00:00:00.000Z",
    ...overrides,
  };
}

describe("public tour snapshots", () => {
  it("does not expose a first publication while it is pending", () => {
    expect(rowToPublicTour(row())).toBeNull();
  });

  it("keeps the last approved version live while edits are pending", () => {
    const publicTour = rowToPublicTour(
      row({
        approved_payload: {
          id: "org-1",
          slug: "new-title",
          title: "Approved title",
        },
      })
    );

    expect(publicTour?.title).toBe("Approved title");
  });

  it("uses the current payload after approval", () => {
    expect(rowToPublicTour(row({ moderation_status: "approved" }))?.title).toBe("New title");
  });
});
