import { describe, expect, it } from "vitest";
import {
  editorialBlockRegistry,
  getEditorialRegistryEntry,
  listEditorialRegistryEntries,
} from "@/editorial/registry/definitions";
import { PAGE_BUILDER_BLOCKS } from "@/lib/cms/page-builder/block-registry";

describe("editorialBlockRegistry", () => {
  it("covers all page-builder block slugs", () => {
    for (const block of PAGE_BUILDER_BLOCKS) {
      expect(getEditorialRegistryEntry(block.slug), block.slug).toBeTruthy();
    }
  });

  it("marks new pilot blocks as new/stable", () => {
    expect(editorialBlockRegistry.photo?.status).toBe("new");
    expect(editorialBlockRegistry.sources?.status).toBe("new");
    expect(editorialBlockRegistry.phrasebook?.status).toBe("new");
    expect(editorialBlockRegistry.faq?.status).toBe("stable");
    expect(editorialBlockRegistry["link-chips"]?.status).toBe("stable");
    expect(editorialBlockRegistry["story-deck"]?.status).toBe("stable");
  });

  it("lists unique types", () => {
    const types = listEditorialRegistryEntries().map((entry) => entry.type);
    expect(new Set(types).size).toBe(types.length);
  });
});
