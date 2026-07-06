import { blocksToPlainText } from "@/lib/cms/page-builder/block-normalize";
import { htmlToPlainText, plainTextFromRichContent } from "@/lib/rich-text";
import type { BlogPost } from "@/types";
import type { ContentPage, ContentSection } from "@/types/content-page";
import type { GuidePillarContent } from "@/types/guide-pillar";
import type { GuideTopicPage } from "@/types/guide-topic";
import type { GuideAboutArgentinaContent } from "@/data/guide-about-argentina";
import type { TravelHubContent } from "@/types/guide-travel-hub";
import type { KbEntry } from "@/lib/knowledge-base/types";

function joinParts(parts: Array<string | undefined | null>): string {
  return parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join("\n\n");
}

/** Plain text for Yandex Metrika content analytics (`text` in JSON-LD). */
export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/^---[\s\S]*?---\n?/m, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function contentSectionPlainText(section: ContentSection): string {
  const parts: string[] = [];
  if (section.heading?.trim()) parts.push(section.heading.trim());
  if (section.blocks?.length) parts.push(blocksToPlainText(section.blocks));
  if (section.html?.trim()) parts.push(htmlToPlainText(section.html));
  else if (section.paragraphs?.length) parts.push(section.paragraphs.join("\n\n"));
  if (section.list?.length) parts.push(section.list.join("\n"));
  return joinParts(parts);
}

export function contentPagePlainText(page: ContentPage): string {
  return joinParts([
    page.description,
    ...page.sections.map((section) => contentSectionPlainText(section)),
  ]);
}

export function blogPostPlainText(post: BlogPost): string {
  const parts: string[] = [post.excerpt, plainTextFromRichContent(post.content)];

  for (const section of post.sections ?? []) {
    parts.push(section.title, section.body);
    if (section.blocks?.length) parts.push(blocksToPlainText(section.blocks));
  }

  return joinParts(parts);
}

export function guideTopicPlainText(topic: GuideTopicPage): string {
  return joinParts([
    topic.shortDescription,
    topic.intro,
    ...topic.sections.map((section) => joinParts([section.heading, section.body])),
  ]);
}

export function guidePillarPlainText(
  pillar: GuidePillarContent,
  extras?: { intro?: string; heroSubtitle?: string },
): string {
  const parts: Array<string | undefined | null> = [extras?.heroSubtitle, extras?.intro];

  for (const section of pillar.sections) {
    parts.push(section.title, section.content);
    for (const subsection of section.subsections ?? []) {
      parts.push(subsection.title, subsection.body);
    }
    for (const box of section.infoBoxes ?? []) {
      parts.push(`${box.title}\n${box.body}`);
    }
  }

  for (const item of pillar.faq) {
    parts.push(`${item.question}\n${item.answer}`);
  }

  return joinParts(parts);
}

export function kbEntryPlainText(entry: KbEntry): string {
  return joinParts([entry.summary, markdownToPlainText(entry.body)]);
}

export function guideAboutArgentinaPlainText(content: GuideAboutArgentinaContent): string {
  return joinParts([
    content.heroSubtitle,
    content.intro,
    content.geography.heading,
    content.geography.body,
    content.whyVisit.heading,
    content.whyVisit.bullets.join("\n"),
    ...content.regions.flatMap((region) => [
      region.title,
      region.summary,
      region.highlights.join("\n"),
    ]),
    ...content.itineraries.flatMap((itinerary) => [
      itinerary.title,
      itinerary.duration,
      itinerary.stops.join("\n"),
      itinerary.note,
    ]),
    ...content.practicalCards.flatMap((card) => [card.title, card.body]),
    content.neighborCountries.heading,
    content.neighborCountries.body,
    ...content.faq.map((item) => `${item.question}\n${item.answer}`),
    content.disclaimer,
  ]);
}

export function travelHubPlainText(hub: TravelHubContent): string {
  return joinParts([
    hub.heroSubtitle,
    ...hub.transportModes.flatMap((mode) => [
      mode.title,
      mode.summary,
      mode.airlineIntro,
      mode.note,
      ...(mode.airlines?.flatMap((airline) => [airline.name, airline.route]) ?? []),
    ]),
    ...hub.airports.flatMap((airport) => [airport.name, airport.description]),
    hub.domesticAirlinesIntro,
    hub.domesticRoutesIntro,
    hub.patagoniaNote,
    hub.entryDocsIntro,
    hub.entryVisaFree?.summary,
    ...(hub.entryVisaFree?.rules ?? []),
    ...hub.tips.flatMap((tip) => [tip.title, tip.body]),
    ...hub.faq.map((item) => `${item.question}\n${item.answer}`),
  ]);
}
