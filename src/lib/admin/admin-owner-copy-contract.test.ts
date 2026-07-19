import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("owner-facing admin copy", () => {
  it("describes editorial helpers without provider or implementation labels", () => {
    const readiness = source("src/lib/integrations/admin-readiness.ts");
    const linksPanel = source("src/components/admin/cms/BlogInternalLinksPreview.tsx");
    const linkSuggestions = source("src/lib/blog-ai-link-suggestions.ts");

    expect(readiness).toContain('label: "Редакционные помощники"');
    expect(readiness).not.toContain('label: "AI-функции"');
    expect(linksPanel).toContain("Дополнительные подсказки");
    expect(linksPanel).not.toContain("AI-подсказки");
    expect(linksPanel).not.toContain("без OpenAI");
    expect(linkSuggestions).not.toContain("Рекомендация ИИ");
  });

  it("keeps media and publishing controls free of developer instructions", () => {
    const media = source("src/components/admin/views/MediaLibraryView.tsx");
    const operations = source("src/components/admin/cms/CmsOpsPanel.tsx");

    for (const forbidden of ["CMS uploads", "Sync manifest", "npm run", "Поиск по id, alt, автору, pageId", "auto-sync"]) {
      expect(media).not.toContain(forbidden);
    }
    for (const forbidden of ["Postgres/static", "MEILISEARCH_*", "npm run", "Админка и API доступны"]) {
      expect(operations).not.toContain(forbidden);
    }
    expect(media).toContain("Загружено вручную");
    expect(operations).toContain("Панель управления");
  });

  it("explains tour availability as an owner workflow", () => {
    const availability = source("src/components/organizer/TourGroupDatesBlock.tsx");

    expect(availability).toContain("Доступность для бронирования");
    expect(availability).not.toContain("слоты из базы");
    expect(availability).not.toContain("даты из черновика");
    expect(availability).not.toContain("Инвентарь в базе");
  });
});
