import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function source(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("admin draft safety contracts", () => {
  it("keeps settings and feature flag baselines separate from dirty drafts", () => {
    const settings = source("src/components/admin/views/SettingsView.tsx");
    const flags = source("src/components/admin/views/FeatureFlagsView.tsx");

    expect(settings).toContain("mergeServerDraftsPreservingDirty");
    expect(settings).toContain("savedValues={baselines[definition.key]");
    expect(settings).toContain("useUnsavedChangesGuard(changedKeys.length > 0)");
    expect(flags).toContain("mergeServerDraftsPreservingDirty");
    expect(flags).toContain("setBaselines(nextBaselines)");
  });

  it("guards CMS navigation and uses fail-closed tab-scoped recovery", () => {
    const editor = source("src/components/admin/views/ContentDocumentEditorView.tsx");
    const guard = source("src/hooks/useUnsavedChangesGuard.ts");

    expect(editor).toContain("readSessionDraft<CmsEditorDraft>(sessionStorage");
    expect(editor).toContain("writeSessionDraft(sessionStorage");
    expect(editor).toContain("Есть несохранённые изменения");
    expect(editor).not.toContain("localStorage");
    expect(guard).toContain('window.addEventListener("beforeunload"');
    expect(guard).toContain('window.addEventListener("popstate"');
    expect(guard).toContain('document.addEventListener("click"');
  });

  it("points the empty moderation queue at the real tour catalog", () => {
    const moderation = source("src/components/admin/views/ModerationView.tsx");
    expect(moderation).toContain('href: "/admin/marketplace/tours"');
    expect(moderation).not.toContain('href: "/admin/tours"');
  });
});
