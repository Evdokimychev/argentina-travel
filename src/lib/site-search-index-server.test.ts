import { describe, expect, it } from "vitest";

import { buildStaticSearchIndexServer } from "./site-search-index-server";

describe("unified server search index", () => {
  it("includes publication-ready knowledge-base entries with aliases and body text", async () => {
    const index = await buildStaticSearchIndexServer();
    const airports = index.find((item) => item.href === "/baza-znaniy/aeroporty");

    expect(airports).toMatchObject({
      type: "knowledge",
      title: "Аэропорты Аргентины и трансферы в город",
    });
    expect(airports?.keywords).toContain("EZE");
    expect(airports?.searchText).toContain("Буэнос-Айрес");
  });

  it("does not index quarantined knowledge-base entries", async () => {
    const index = await buildStaticSearchIndexServer();
    expect(index.some((item) => item.href === "/baza-znaniy/aktualen-li-blue-dollar")).toBe(false);
  });
});
