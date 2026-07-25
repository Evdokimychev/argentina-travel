import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Regression guard for the "card inside card inside card" UX bug on the
 * steak guide: the article is already a bordered/shadowed panel, and (when
 * `sectionPanels` is on) each section adds a border-top divider. Nothing
 * rendered *inside* a section — widgets, their item lists, callouts, the
 * story deck's CTAs — should stack another `shadow-*` layer on top of a
 * border, or mobile ends up as a pile of rounded boxes inside rounded boxes.
 *
 * This test reads component source directly (not rendered output) so it
 * fails fast if a future edit reintroduces `shadow-sm`/`shadow-md` on these
 * specific files, without having to snapshot full class strings.
 */
const FLAT_CHROME_FILES = [
  "SteakCutSelector.tsx",
  "SteakCutDiagram.tsx",
  "SteakOrderScenarios.tsx",
  "SteakDonenessPhrases.tsx",
  "SteakBillExplainer.tsx",
] as const;

function readSource(relativeToTravelDir: string): string {
  return readFileSync(join(__dirname, relativeToTravelDir), "utf8");
}

describe("steak guide widgets stay flat (no nested card shadows)", () => {
  it.each(FLAT_CHROME_FILES)("%s does not add a shadow class anywhere", (file) => {
    const source = readSource(file);
    expect(source).not.toMatch(/shadow-(sm|md|lg|xl|card)/);
  });

  it("ArticleStoryDeck's own card has no shadow layered on its border", () => {
    const source = readFileSync(
      join(__dirname, "../blog/ArticleStoryDeck.tsx"),
      "utf8",
    );
    expect(source).not.toMatch(/shadow-(sm|md|lg|xl|card)/);
  });

  it("BlogPostSectionView's sectionPanels mode uses a border-top divider, not a boxed panel", () => {
    const source = readFileSync(
      join(__dirname, "../blog/BlogPostSectionView.tsx"),
      "utf8",
    );
    // The old regression: a full bordered/shadowed/backgrounded panel per
    // section, which then contained more bordered/shadowed widget cards.
    expect(source).not.toMatch(/panelClass\s*=[\s\S]{0,120}shadow/);
    expect(source).toMatch(/border-t border-gray-100/);
  });

  it("BlogCallout does not stack a shadow on top of its border + tinted background", () => {
    const source = readFileSync(join(__dirname, "../blog/BlogCallout.tsx"), "utf8");
    expect(source).not.toMatch(/shadow-(sm|md|lg|xl|card)/);
  });
});
