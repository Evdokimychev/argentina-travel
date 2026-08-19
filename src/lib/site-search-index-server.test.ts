import { describe, expect, it } from "vitest";

import { buildStaticSearchIndexServer } from "./site-search-index-server";

describe("unified server search index", () => {
  it("includes publication-ready knowledge-base entries with aliases and body text", async () => {
    const index = await buildStaticSearchIndexServer();
    const buses = index.find((item) => item.href === "/baza-znaniy/mezhgorodnie-avtobusy");

    expect(buses).toMatchObject({
      type: "knowledge",
      title: "Междугородние автобусы Аргентины (micros)",
    });
    expect(buses?.keywords).toContain("micro");
    expect(buses?.searchText).toContain("Междугородний автобус");
  });

  it("does not index quarantined knowledge-base entries", async () => {
    const index = await buildStaticSearchIndexServer();
    expect(index.some((item) => item.href === "/baza-znaniy/aep-eze-stykovka")).toBe(false);
  });

  it("indexes the canonical visa article instead of the archived FAQ slug", async () => {
    const index = await buildStaticSearchIndexServer();
    expect(index.some((item) => item.href === "/baza-znaniy/viza-rf-v-argentinu")).toBe(false);
    expect(index.some((item) => item.href === "/baza-znaniy/viza-i-granica-dlya-rossiyan")).toBe(
      true,
    );
  });
});
