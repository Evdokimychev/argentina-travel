import type { GuidePillarContent, GuidePillarSection } from "@/types/guide-pillar";
import type { GuideTopicPage } from "@/types/guide-topic";

export type GuidePublicationIssue =
  | "missing_pillar"
  | "too_few_sections"
  | "thin_article"
  | "thin_section"
  | "duplicate_section_id"
  | "too_few_quick_facts"
  | "too_few_faq_items"
  | "missing_recommendation"
  | "invalid_link"
  | "invalid_widget";

const SUPPORTED_WIDGET_TYPES = new Set([
  "exchange-rates",
  "weather-panel",
  "season-matrix",
  "tourism-infographic",
  "tourism-timeline",
  "tour-embed",
]);

export function countGuideWords(value: string): number {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

export function guideSectionPlainText(section: GuidePillarSection): string {
  return [
    section.title,
    section.content,
    ...(section.subsections ?? []).flatMap((item) => [item.title, item.body]),
    ...(section.table?.headers ?? []),
    ...(section.table?.rows ?? []).flat(),
    ...(section.infoBoxes ?? []).flatMap((item) => [item.title, item.body]),
  ]
    .filter(Boolean)
    .join(" ");
}

export function guidePillarPlainWordCount(topic: GuideTopicPage, pillar: GuidePillarContent): number {
  return countGuideWords(
    [
      topic.intro,
      pillar.heroTitle,
      pillar.heroSubtitle,
      ...pillar.quickFacts.flatMap((item) => [item.label, item.headline, item.detail]),
      ...pillar.sections.map(guideSectionPlainText),
      ...pillar.faq.flatMap((item) => [item.question, item.answer]),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function isValidHref(href: string): boolean {
  return href.startsWith("/") || href.startsWith("#") || /^https:\/\//u.test(href);
}

export function getGuidePublicationIssues(topic: GuideTopicPage): GuidePublicationIssue[] {
  const pillar = topic.pillarPage;
  if (!pillar) return ["missing_pillar"];

  const issues: GuidePublicationIssue[] = [];
  if (pillar.sections.length < 5) issues.push("too_few_sections");
  if (guidePillarPlainWordCount(topic, pillar) < 300) issues.push("thin_article");
  if (
    pillar.sections.some(
      (section) =>
        countGuideWords(guideSectionPlainText(section)) < 25 &&
        !section.widgetSlot &&
        !section.table &&
        !section.subsections?.length &&
        !section.infoBoxes?.length,
    )
  ) {
    issues.push("thin_section");
  }

  const ids = [
    ...pillar.sections.map((section) => section.id),
    ...pillar.sections.flatMap((section) =>
      section.widgetSlot ? [section.widgetSlot.id] : [],
    ),
    ...(pillar.widgetSlots ?? []).map((slot) => slot.id),
  ];
  if (new Set(ids).size !== ids.length) issues.push("duplicate_section_id");
  if (pillar.quickFacts.length < 4) issues.push("too_few_quick_facts");
  if (pillar.faq.length < 8) issues.push("too_few_faq_items");
  if (pillar.partnerServices.length === 0) issues.push("missing_recommendation");

  const hrefs = [
    ...pillar.heroCtas.map((item) => item.href),
    ...pillar.partnerServices.map((item) => item.href),
    ...pillar.blogLinks.map((item) => item.href),
  ];
  if (hrefs.some((href) => !isValidHref(href))) issues.push("invalid_link");

  const slots = [
    ...(pillar.widgetSlots ?? []),
    ...pillar.sections.flatMap((section) => (section.widgetSlot ? [section.widgetSlot] : [])),
  ];
  if (
    slots.some(
      (slot) =>
        !SUPPORTED_WIDGET_TYPES.has(slot.type) ||
        (slot.type === "tour-embed" && !slot.tourEmbed),
    )
  ) {
    issues.push("invalid_widget");
  }

  return [...new Set(issues)];
}
