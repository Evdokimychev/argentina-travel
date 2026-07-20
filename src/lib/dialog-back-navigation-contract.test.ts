import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("dialog back-navigation contract", () => {
  it("preserves the Next.js history state and does not undo a link navigation", () => {
    const source = readFileSync(
      join(process.cwd(), "src/hooks/useDialogBackClose.ts"),
      "utf8",
    );

    expect(source).toContain("...(window.history.state ?? {})");
    expect(source).toContain("[DIALOG_BACK_STATE_KEY]: entryId");
    expect(source).toContain("window.history.state?.[DIALOG_BACK_STATE_KEY] === entryId");
    expect(source).toContain("export function navigateAfterDialogClose");
    expect(source).toContain('window.addEventListener("popstate", onPopState, { once: true })');
    expect(source).toContain('window.matchMedia("(max-width: 767px)").matches');
    expect(source).toContain('!window.matchMedia("(max-width: 767px)").matches');
    expect(source).not.toContain("window.history.pushState({ __dialogBackClose: true }");
  });

  it("connects the global search dialog to mobile back navigation", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/SiteSearch.tsx"),
      "utf8",
    );

    expect(source).toContain("useDialogBackClose(open, handleOpenChange)");
    expect(source).toContain("navigateAfterDialogClose");
  });
});
