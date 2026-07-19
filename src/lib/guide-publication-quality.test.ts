import { describe, expect, it } from "vitest";
import { EKONOMIKA_PILLAR } from "@/data/guide-pillar-ekonomika";
import { KUHNYA_PILLAR } from "@/data/guide-pillars/culture-life";
import { mergeGuideTopicWithCmsPage } from "@/lib/cms/guide-resolver";
import {
  getGuideCmsSourcePage,
  getGuideCmsSourcePages,
} from "@/lib/cms/guide-topic-source";
import {
  getGuidePublicationIssues,
  guidePillarPlainWordCount,
} from "@/lib/guide-publication-quality";
import { getAllGuideTopics, getGuideTopicBySlug } from "@/lib/guide-topics";
import type { ContentPage } from "@/types/content-page";

describe("guide publication quality", () => {
  it("keeps every core guide topic above the publication baseline", () => {
    const failures = getAllGuideTopics()
      .map((topic) => ({ slug: topic.slug, issues: getGuidePublicationIssues(topic) }))
      .filter((item) => item.issues.length > 0);

    expect(failures).toEqual([]);
  });

  it("keeps the Argentina cuisine guide substantial and practical", () => {
    const topic = getGuideTopicBySlug("kukhnya");
    expect(topic).toBeDefined();
    expect(KUHNYA_PILLAR.sections).toHaveLength(7);
    expect(KUHNYA_PILLAR.sections.filter((section) => section.table)).toHaveLength(2);
    expect(KUHNYA_PILLAR.practicalTips).toBeDefined();
    expect(guidePillarPlainWordCount(topic!, KUHNYA_PILLAR)).toBeGreaterThan(1_000);

    const visibleText = JSON.stringify(KUHNYA_PILLAR);
    expect(visibleText).not.toMatch(/\$\d|USD\/день|neighborhood grill|street food/iu);
  });

  it("does not advertise widget types that render as an empty block", () => {
    expect(EKONOMIKA_PILLAR.widgetSlots).toEqual([
      expect.objectContaining({ id: "widget-exchange-rates", type: "exchange-rates" }),
    ]);
  });
});

describe("core guide CMS override", () => {
  it("exposes every core topic to the existing admin import flow", () => {
    const sourcePages = getGuideCmsSourcePages();
    const sourceSlugs = new Set(sourcePages.map((page) => page.slug));
    for (const topic of getAllGuideTopics()) expect(sourceSlugs.has(topic.slug)).toBe(true);
    expect(sourceSlugs.size).toBe(sourcePages.length);

    const cuisine = getGuideCmsSourcePage("kukhnya");
    expect(cuisine?.sections).toHaveLength(KUHNYA_PILLAR.sections.length);
    expect(
      cuisine?.sections.some((section) =>
        section.blocks?.some((block) => block.type === "table"),
      ),
    ).toBe(true);
  });

  it("replaces the editable editorial body without dropping pillar features", () => {
    const topic = getGuideTopicBySlug("kukhnya");
    expect(topic?.pillarPage).toBeDefined();
    const cmsPage: ContentPage = {
      slug: "kukhnya",
      section: "guide",
      title: "Кухня Аргентины — редакционная версия",
      description: "Обновлённое описание из админки.",
      category: "Культура",
      updatedAt: "2026-07-18",
      sections: [
        { heading: "Новый раздел", paragraphs: ["Проверенный редактором текст."] },
      ],
      relatedLinks: [
        { label: "Культура", href: "/guide/kultura", description: "Связанная тема" },
      ],
    };

    const merged = mergeGuideTopicWithCmsPage(topic!, cmsPage);
    expect(merged.title).toBe(cmsPage.title);
    expect(merged.shortDescription).toBe(cmsPage.description);
    expect(merged.cmsPage?.sections).toEqual(cmsPage.sections);
    expect(merged.pillarPage).toBe(topic!.pillarPage);
    expect(merged.pillarPage?.faq).toHaveLength(KUHNYA_PILLAR.faq.length);
    expect(merged.relatedArticles).toContainEqual(
      expect.objectContaining({ href: "/guide/kultura" }),
    );
  });

  it("ignores an empty CMS body instead of blanking the guide", () => {
    const topic = getGuideTopicBySlug("kukhnya")!;
    const emptyPage: ContentPage = {
      slug: "kukhnya",
      section: "guide",
      title: "Пустой материал",
      description: "",
      category: "Культура",
      updatedAt: "2026-07-18",
      sections: [],
    };

    expect(mergeGuideTopicWithCmsPage(topic, emptyPage)).toBe(topic);
  });
});
