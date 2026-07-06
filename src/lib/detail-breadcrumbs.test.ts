import { describe, expect, it } from "vitest";
import {
  buildContentPageBreadcrumbItems,
  buildDetailBreadcrumbItems,
  buildForumThreadBreadcrumbItems,
  buildTwoLevelBreadcrumbItems,
} from "@/lib/detail-breadcrumbs";
import type { ContentPage } from "@/types/content-page";

describe("detail-breadcrumbs", () => {
  it("builds three-level chain for tour detail", () => {
    const items = buildDetailBreadcrumbItems(undefined, "tours", {
      name: "Патагония и ледники",
      path: "/tours/patagonia-glaciers",
    });
    expect(items).toHaveLength(3);
    expect(items[0]?.name).toBe("Главная");
    expect(items[1]?.path).toBe("/tours");
    expect(items[2]?.name).toBe("Патагония и ледники");
  });

  it("builds two-level chain for FAQ", () => {
    const items = buildTwoLevelBreadcrumbItems(undefined, {
      labelKey: "nav.faq",
      path: "/faq",
      fallback: "Частые вопросы",
    });
    expect(items).toHaveLength(2);
    expect(items[1]?.name).toBe("Частые вопросы");
  });

  it("builds guide content page breadcrumbs", () => {
    const page: ContentPage = {
      section: "guide",
      slug: "visa-argentina",
      title: "Виза в Аргентину",
      description: "Кратко о визах",
      category: "Визы",
      updatedAt: "2026-01-01",
      sections: [],
    };
    const items = buildContentPageBreadcrumbItems(undefined, page);
    expect(items).toHaveLength(3);
    expect(items[1]?.path).toBe("/guide");
    expect(items[2]?.path).toBe("/guide/visa-argentina");
  });

  it("builds forum thread chain with category hub", () => {
    const items = buildForumThreadBreadcrumbItems(
      undefined,
      { title: "Иммиграция", slug: "immigration" },
      { title: "Как получить DNI", path: "/forum/immigration/thread-1" },
    );
    expect(items).toHaveLength(3);
    expect(items[1]?.name).toBe("Иммиграция");
    expect(items[2]?.path).toBe("/forum/immigration/thread-1");
  });
});
