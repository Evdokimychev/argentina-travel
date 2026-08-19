import { describe, expect, it } from "vitest";
import { cmsPublicPathsForTest } from "@/lib/cms/cms-public-revalidate";
import {
  CONTENT_RUNTIME_OWNERSHIP,
  EDITORIAL_OVERLAY_OWNERSHIP,
} from "@/lib/cms/content-runtime-ownership";

describe("CMS public revalidate mapping", () => {
  it("maps every cutover family to a listing and a detail path", () => {
    expect(cmsPublicPathsForTest("blog", "patagonia")).toEqual(["/blog", "/blog/patagonia"]);
    expect(cmsPublicPathsForTest("guide", "viza")).toEqual(["/guide", "/guide/viza"]);
    expect(cmsPublicPathsForTest("destination", "iguazu")).toEqual([
      "/destinations",
      "/destinations/iguazu",
    ]);
    expect(cmsPublicPathsForTest("place", "ushuaia")).toEqual(["/places", "/places/ushuaia"]);
  });

  it("maps knowledge and landing without inventing a cutover flag", () => {
    expect(cmsPublicPathsForTest("knowledge", "viza-i-granica")).toEqual([
      "/baza-znaniy",
      "/baza-znaniy/viza-i-granica",
    ]);
    expect(cmsPublicPathsForTest("landing", "join")).toEqual(["/join"]);
    expect(CONTENT_RUNTIME_OWNERSHIP).toHaveLength(4);
    expect(EDITORIAL_OVERLAY_OWNERSHIP.map((row) => row.family)).toEqual([
      "knowledge",
      "landing",
    ]);
    expect(EDITORIAL_OVERLAY_OWNERSHIP.every((row) => row.cutover === "none_do_not_mass_flip")).toBe(
      true,
    );
  });
});
