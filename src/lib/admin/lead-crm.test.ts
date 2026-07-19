import { describe, expect, it } from "vitest";
import { CONTACT_KIND_LABELS, CONTACT_STATUS_LABELS } from "@/lib/admin/lead-crm";

describe("lead CRM labels", () => {
  it("has human labels for every persisted status and kind", () => {
    expect(Object.keys(CONTACT_STATUS_LABELS)).toEqual(["new", "in_progress", "waiting", "resolved", "spam"]);
    expect(CONTACT_KIND_LABELS.tour_inquiry).toBe("Вопрос о туре");
    expect(Object.values(CONTACT_KIND_LABELS).every((label) => !label.includes("_"))).toBe(true);
  });
});
