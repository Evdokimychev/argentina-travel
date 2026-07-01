import { describe, expect, it } from "vitest";
import { mergeReadingHistory } from "@/lib/blog-reading-history-sync";
import type { BlogReadingHistoryEntry } from "@/lib/blog-reading-history";

function entry(
  slug: string,
  readAt: string,
  title = slug,
): BlogReadingHistoryEntry {
  return { slug, title, category: "guide", readAt };
}

describe("mergeReadingHistory", () => {
  it("prefers the latest readAt for the same slug", () => {
    const merged = mergeReadingHistory(
      [entry("patagonia", "2026-06-02T10:00:00.000Z")],
      [entry("patagonia", "2026-06-01T10:00:00.000Z", "Older title")],
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]?.readAt).toBe("2026-06-02T10:00:00.000Z");
  });

  it("keeps remote entry when it is newer than local", () => {
    const merged = mergeReadingHistory(
      [entry("iguazu", "2026-06-01T10:00:00.000Z")],
      [entry("iguazu", "2026-06-03T10:00:00.000Z", "Remote title")],
    );

    expect(merged[0]).toMatchObject({
      slug: "iguazu",
      title: "Remote title",
      readAt: "2026-06-03T10:00:00.000Z",
    });
  });

  it("merges unique slugs and sorts by readAt desc", () => {
    const merged = mergeReadingHistory(
      [entry("a", "2026-06-01T00:00:00.000Z"), entry("b", "2026-06-03T00:00:00.000Z")],
      [entry("c", "2026-06-02T00:00:00.000Z")],
    );

    expect(merged.map((item) => item.slug)).toEqual(["b", "c", "a"]);
  });

  it("limits merged history to 12 entries", () => {
    const local = Array.from({ length: 8 }, (_, index) =>
      entry(`local-${index}`, `2026-06-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`),
    );
    const remote = Array.from({ length: 8 }, (_, index) =>
      entry(`remote-${index}`, `2026-07-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`),
    );

    expect(mergeReadingHistory(local, remote)).toHaveLength(12);
  });
});
