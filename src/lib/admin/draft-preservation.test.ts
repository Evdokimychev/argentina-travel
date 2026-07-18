import { describe, expect, it } from "vitest";
import { mergeServerDraftsPreservingDirty } from "@/lib/admin/draft-preservation";

describe("mergeServerDraftsPreservingDirty", () => {
  it("refreshes clean keys while retaining another key's unsaved draft", () => {
    const result = mergeServerDraftsPreservingDirty(
      {
        appearance: { color: "blue" },
        marketing: { title: "local draft" },
      },
      {
        appearance: { color: "red" },
        marketing: { title: "saved" },
      },
      {
        appearance: { color: "blue" },
        marketing: { title: "server refresh" },
      },
    );

    expect(result.drafts).toEqual({
      appearance: { color: "blue" },
      marketing: { title: "local draft" },
    });
    expect(result.baselines.marketing).toEqual({ title: "server refresh" });
  });

  it("uses the server value for first load and for clean drafts", () => {
    const result = mergeServerDraftsPreservingDirty(
      { flag: { enabled: false } },
      {},
      { flag: { enabled: true } },
    );

    expect(result.drafts.flag).toEqual({ enabled: true });
    expect(result.baselines.flag).toEqual({ enabled: true });
  });
});
