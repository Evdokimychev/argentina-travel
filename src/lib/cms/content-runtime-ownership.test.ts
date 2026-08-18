import { describe, expect, it } from "vitest";
import { CONTENT_RUNTIME_OWNERSHIP, contentOwnershipFor } from "@/lib/cms/content-runtime-ownership";
import { MODULE_LIFECYCLE } from "@/lib/modules/business-lifecycle";

describe("Sprint 7 content ownership + lifecycle", () => {
  it("covers all four content families with removal conditions", () => {
    expect(CONTENT_RUNTIME_OWNERSHIP).toHaveLength(4);
    for (const row of CONTENT_RUNTIME_OWNERSHIP) {
      expect(row.removalCondition.length).toBeGreaterThan(20);
      expect(row.cutoverFlag.startsWith("cms")).toBe(true);
    }
    expect(contentOwnershipFor("blog").family).toBe("blog");
  });

  it("classifies high-impact dormant modules", () => {
    const byId = Object.fromEntries(MODULE_LIFECYCLE.map((row) => [row.id, row]));
    expect(byId.forum.businessStatus).toBe("DORMANT");
    expect(byId.shop.businessStatus).toBe("DORMANT");
    expect(byId.tours.businessStatus).toBe("CORE");
    expect(MODULE_LIFECYCLE.every((row) => row.businessStatus !== "UNKNOWN")).toBe(true);
  });
});
