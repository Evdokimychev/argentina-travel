import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

describe("cabinet mobile P0 contract", () => {
  it("uses one mobile action slot on organizer editor routes", () => {
    const shell = read("src/components/organizer/OrganizerShell.tsx");
    const sidebar = read("src/components/organizer/OrganizerSidebar.tsx");
    const editorBar = read("src/components/organizer/TourEditorMobileBar.tsx");

    expect(shell).toContain("!isOrganizerEditorRoute(pathname) ? <OrganizerMobileNav /> : null");
    expect(sidebar).toContain('data-mobile-action-slot="organizer-primary"');
    expect(editorBar).toContain('data-mobile-action-slot="organizer-editor"');
  });

  it("keeps cabinet sticky surfaces aligned to the workspace viewport", () => {
    const tokens = read("src/lib/cabinet-ui.ts");
    const editor = read("src/components/organizer/OrganizerTourEditorView.tsx");

    expect(tokens).toContain('cabinetWorkspaceStickyTopClass = "top-0"');
    expect(tokens).toContain('cabinetWorkspaceStickyTopInsetClass = "top-4"');
    expect(editor).toContain("cabinetWorkspaceStickyTopClass");
    expect(editor).not.toContain("siteStickyBelowHeaderInsetClass");
    expect(editor).not.toContain("siteStickyBelowHeaderInset075Class");
  });

  it("exposes user roles and management actions without a mobile table", () => {
    const users = read("src/components/admin/views/UsersView.tsx");

    expect(users).toContain("data-mobile-user-directory");
    expect(users).toContain('cabinetTableWrapClass, "hidden md:block"');
    expect(users).toContain("Роли и доступ");
    expect(users).toContain("UserBlockButton");
  });

  it("uses a compact settings selector and one mobile save bar", () => {
    const settings = read("src/components/admin/views/SettingsView.tsx");

    expect(settings).toContain('id="mobile-settings-section"');
    expect(settings).toContain("data-mobile-settings-save-bar");
    expect(settings).toContain("Ещё действия");
    expect(settings).toContain('className="hidden gap-2 sm:grid sm:grid-cols-2 xl:grid-cols-3"');
    expect(settings.match(/data-mobile-settings-save-bar/g)).toHaveLength(1);
  });
});
