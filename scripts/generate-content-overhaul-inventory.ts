/* eslint-disable @typescript-eslint/no-explicit-any -- heterogeneous legacy content registries are normalized at runtime */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { blogPosts } from "../src/data/blog";
import { DESTINATION_PAGES } from "../src/data/destination-pages";
import { GUIDE_TOPIC_LIST } from "../src/data/guide-topics";
import { LEGAL_DOCUMENTS } from "../src/data/legal-content";
import {
  COLLECTIONS_SEED,
  ITINERARIES_SEED,
  PLACES_SEED,
} from "../src/data/places-seed";
import { getAllContentPages } from "../src/lib/content-pages";

const root = path.resolve(import.meta.dirname, "..");
const outputDir = path.join(root, "docs/content-overhaul");
const baselineDate = "2026-07-15";

const publicRoutePrefixes = new Set([
  "about",
  "audio-guides",
  "baza-znaniy",
  "blog",
  "car-rental",
  "collections",
  "contacts",
  "destinations",
  "esim",
  "excursions",
  "experts",
  "faq",
  "flights",
  "forum",
  "gallery",
  "guide",
  "immigration",
  "insurance",
  "itineraries",
  "join",
  "legal",
  "map",
  "mapa-argentina",
  "organizers",
  "places",
  "podbor",
  "services",
  "shop",
  "tours",
  "transfers",
]);

type AnyRecord = Record<string, any>;

type InventoryItem = {
  id: string;
  sourceSystem: string;
  sourcePath: string;
  type: string;
  url: string;
  locale: string;
  title: string;
  status: string;
  author: string;
  editor: string;
  reviewer: string;
  publishedAt: string;
  updatedAt: string;
  lastFactCheckedAt: string;
  nextReviewAt: string;
  wordCount: number;
  heroMedia: string;
  inlineMediaCount: number;
  sourceCount: number | "";
  claimCount: number | "";
  internalLinks: number;
  externalLinks: number;
  searchIndexed: boolean;
  canonical: string;
  qualityScore: number;
  action: string;
  owner: string;
  notes: string;
  summary: string;
  body: string;
  aliases: string[];
  outgoingUrls: string[];
  hubPath: string;
  sitemapExpected: boolean;
  mapVisible: boolean | "";
  revisionHistory: string;
  translationStatus: string;
  sensitive: boolean;
  missingPrimarySource: boolean;
  reviewDue: boolean;
  siteReady: boolean | null;
  metadataScore: number;
  depthScore: number;
  sourcesScore: number;
  freshnessScore: number;
  mediaScore: number;
  relationsScore: number;
};

const readJson = (relativePath: string) =>
  JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));

const contentIndex = readJson("content/knowledge-base/_index/content.json")
  .entities as AnyRecord[];

function flattenText(value: any): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(flattenText).join(" ");
  if (typeof value === "object") return Object.values(value).map(flattenText).join(" ");
  return "";
}

function wordCount(value: string): number {
  return value
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[`*_#>|\[\](){}]/g, " ")
    .split(/\s+/u)
    .filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function urlsFrom(value: string): string[] {
  return unique(
    (value.match(/(?:https?:\/\/[^\s)\]>'"]+|\/(?!\/)[a-zA-Zа-яА-ЯёЁ0-9_\-[\]/.]+(?:\?[^\s)\]>'"]*)?)/gu) ?? [])
      .map((url) => url.replace(/[.,;:!?]+$/u, "")),
  );
}

function internalPath(url: string): string | null {
  let value = url.trim();
  if (/^https?:\/\/(?:www\.)?goargentina\.ru\//i.test(value)) {
    value = value.replace(/^https?:\/\/(?:www\.)?goargentina\.ru/i, "");
  }
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  const clean = value.split(/[?#]/)[0].replace(/\/$/, "") || "/";
  if (clean === "/") return clean;
  const prefix = clean.split("/")[1];
  if (!publicRoutePrefixes.has(prefix)) return null;
  return clean;
}

function externalUrls(value: string): string[] {
  return urlsFrom(value).filter((url) => /^https?:\/\//i.test(url) && !/goargentina\.ru/i.test(url));
}

function normalized(value: string): string {
  return value
    .toLocaleLowerCase("ru")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value).replace(/\r?\n/g, " ");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function writeCsv(fileName: string, headers: string[], rows: AnyRecord[]) {
  const lines = [headers.map(csvCell).join(",")];
  for (const row of rows) lines.push(headers.map((header) => csvCell(row[header])).join(","));
  fs.writeFileSync(path.join(outputDir, fileName), `${lines.join("\n")}\n`);
}

function isPublicKb(entry: AnyRecord): boolean {
  if (entry.status !== "published" || entry.site_ready === false) return false;
  const editorial = entry.editorial ?? {};
  if (editorial.review_due || editorial.missing_media_rights) return false;
  if (
    editorial.sensitive &&
    (editorial.missing_sources || editorial.missing_primary_source || editorial.missing_reviewer)
  ) return false;
  const visible = `${entry.title ?? ""} ${entry.summary ?? ""}`;
  if (/\b(?:placeholder|lorem ipsum|todo|tbd|undefined|null)\b/i.test(visible)) return false;
  if (/(?=[\p{L}\p{M}-]*\p{Script=Latin})(?=[\p{L}\p{M}-]*\p{Script=Cyrillic})[\p{L}\p{M}-]+/u.test(visible)) return false;
  return true;
}

const thresholds: Record<string, number> = {
  attraction: 500,
  national_park: 500,
  city: 500,
  region: 800,
  route: 800,
  transport: 600,
  guide: 600,
  faq: 120,
  author_tip: 150,
  blog: 400,
  guide_topic: 400,
  immigration: 600,
  content_page: 500,
  destination: 500,
  place: 500,
  collection: 120,
  itinerary: 200,
  legal: 300,
};

function calculateQuality(item: Omit<InventoryItem, "qualityScore" | "action" | "metadataScore" | "depthScore" | "sourcesScore" | "freshnessScore" | "mediaScore" | "relationsScore">) {
  const threshold = thresholds[item.type] ?? 400;
  const metadataScore = Math.round(
    10 * [item.id, item.title, item.summary, item.status].filter(Boolean).length / 4,
  );
  const depthScore = Math.min(25, Math.round((item.wordCount / threshold) * 25));
  const sourcesScore = item.sourceCount === ""
    ? 0
    : item.sensitive
      ? item.sourceCount >= 2 && !item.missingPrimarySource ? 20 : item.sourceCount >= 1 ? 8 : 0
      : item.sourceCount >= 1 ? 20 : 0;
  const freshnessScore = item.lastFactCheckedAt
    ? item.reviewDue ? 3 : 15
    : item.updatedAt ? 7 : item.publishedAt ? 5 : 0;
  const mediaScore = (item.heroMedia ? 10 : 0) + (item.inlineMediaCount > 0 ? 5 : 0);
  const relationsScore = item.internalLinks >= 2 ? 15 : item.internalLinks === 1 ? 8 : 0;
  return {
    metadataScore,
    depthScore,
    sourcesScore,
    freshnessScore,
    mediaScore,
    relationsScore,
    qualityScore:
      metadataScore + depthScore + sourcesScore + freshnessScore + mediaScore + relationsScore,
  };
}

function finalizeItem(
  input: Omit<InventoryItem, "qualityScore" | "action" | "metadataScore" | "depthScore" | "sourcesScore" | "freshnessScore" | "mediaScore" | "relationsScore">,
): InventoryItem {
  const scores = calculateQuality(input);
  let action = "KEEP";
  if (input.sensitive && (input.missingPrimarySource || input.reviewDue || !input.reviewer)) {
    action = "LEGAL_REVIEW";
  } else if (["stub", "backlog", "draft", "planned"].includes(input.status)) {
    action = "EXPAND";
  } else if (scores.qualityScore < 45) {
    action = "DEEP_REWRITE";
  } else if (scores.qualityScore < 65) {
    action = "EXPAND";
  } else if (scores.qualityScore < 80) {
    action = "LIGHT_EDIT";
  }
  return { ...input, ...scores, action };
}

function baseInput(overrides: Partial<InventoryItem>): Omit<InventoryItem, "qualityScore" | "action" | "metadataScore" | "depthScore" | "sourcesScore" | "freshnessScore" | "mediaScore" | "relationsScore"> {
  return {
    id: "",
    sourceSystem: "",
    sourcePath: "",
    type: "",
    url: "",
    locale: "ru",
    title: "",
    status: "published",
    author: "",
    editor: "",
    reviewer: "",
    publishedAt: "",
    updatedAt: "",
    lastFactCheckedAt: "",
    nextReviewAt: "",
    wordCount: 0,
    heroMedia: "",
    inlineMediaCount: 0,
    sourceCount: "",
    claimCount: "",
    internalLinks: 0,
    externalLinks: 0,
    searchIndexed: false,
    canonical: "",
    owner: "unassigned",
    notes: "",
    summary: "",
    body: "",
    aliases: [],
    outgoingUrls: [],
    hubPath: "",
    sitemapExpected: false,
    mapVisible: "",
    revisionHistory: "none_in_static_source",
    translationStatus: "ru_only",
    sensitive: false,
    missingPrimarySource: false,
    reviewDue: false,
    siteReady: null,
    ...overrides,
  };
}

function makeKbItems(): InventoryItem[] {
  return contentIndex.map((entry) => {
    const body = String(entry.body ?? "");
    const related = (entry.related ?? []).map((id: string) => `/baza-znaniy/${id}`);
    const rawUrls = urlsFrom(`${body} ${flattenText(entry.sources)}`);
    const outgoingUrls = unique([
      ...related,
      ...rawUrls.map(internalPath).filter((value): value is string => Boolean(value)),
    ]);
    const external = unique([
      ...(entry.sources ?? []).map((source: AnyRecord) => source.url).filter(Boolean),
      ...externalUrls(body),
    ]);
    const gallery = entry.media?.gallery ?? [];
    const sourcePath = `content/knowledge-base/${entry.id ? findKbPath(entry.id) : ""}`;
    const publicEntry = isPublicKb(entry);
    return finalizeItem(baseInput({
      id: `kb:${entry.id}`,
      sourceSystem: "knowledge_base_markdown",
      sourcePath,
      type: entry.type,
      url: `/baza-znaniy/${entry.id}`,
      title: entry.title ?? "",
      status: entry.status ?? "",
      reviewer: entry.reviewer ?? "",
      lastFactCheckedAt: entry.last_verified ?? "",
      nextReviewAt: entry.editorial?.review_due_at ?? "",
      wordCount: entry.editorial?.word_count ?? wordCount(body),
      heroMedia: entry.media?.hero?.url ?? "",
      inlineMediaCount: gallery.length,
      sourceCount: entry.sources?.length ?? 0,
      claimCount: "",
      internalLinks: outgoingUrls.length,
      externalLinks: external.length,
      searchIndexed: publicEntry,
      canonical: `/baza-znaniy/${entry.id}`,
      notes: `confidence=${entry.confidence ?? ""}; site_sections=${(entry.site_sections ?? []).join("|")}`,
      summary: entry.summary ?? "",
      body,
      aliases: entry.aliases ?? [],
      outgoingUrls,
      hubPath: "/baza-znaniy",
      sitemapExpected: publicEntry,
      mapVisible: ["city", "national_park", "attraction"].includes(entry.type) && Boolean(entry.coordinates) && publicEntry,
      revisionHistory: "git_history",
      sensitive: Boolean(entry.editorial?.sensitive),
      missingPrimarySource: Boolean(entry.editorial?.missing_primary_source),
      reviewDue: Boolean(entry.editorial?.review_due),
      siteReady: entry.site_ready ?? null,
    }));
  });
}

const kbPathById = new Map(
  (readJson("content/knowledge-base/_index/manifest.json").entities as AnyRecord[])
    .map((entry) => [entry.id, entry.path]),
);

function findKbPath(id: string): string {
  return kbPathById.get(id) ?? `${id}.md`;
}

function structuredInternalUrls(value: any): string[] {
  const urls: string[] = [];
  const visit = (node: any) => {
    if (node == null) return;
    if (typeof node === "string") {
      for (const candidate of urlsFrom(node)) {
        const internal = internalPath(candidate);
        if (internal) urls.push(internal);
      }
      return;
    }
    if (Array.isArray(node)) return node.forEach(visit);
    if (typeof node === "object") Object.values(node).forEach(visit);
  };
  visit(value);
  return unique(urls);
}

function makeBlogItems(): InventoryItem[] {
  return (blogPosts as AnyRecord[]).map((post) => {
    const body = flattenText([post.excerpt, post.sections, post.content]);
    const structured = structuredInternalUrls([post.relatedResources, post.tourEmbeds, post.sections]);
    const external = externalUrls(body);
    const status = post.noIndex ? "draft" : "published";
    const media = [post.image, ...(post.gallery ?? [])].filter(Boolean);
    return finalizeItem(baseInput({
      id: `blog:${post.slug}`,
      sourceSystem: post.noIndex ? "blog_content_plan" : "static_blog",
      sourcePath: post.noIndex ? "src/data/blog-content-plan.ts" : "src/data/blog.ts",
      type: "blog",
      url: `/blog/${post.slug}`,
      title: post.title ?? "",
      status,
      author: post.author ?? "",
      publishedAt: post.date ?? "",
      updatedAt: post.dateModified ?? post.date ?? "",
      wordCount: wordCount(body),
      heroMedia: post.image ?? "",
      inlineMediaCount: Math.max(0, media.length - 1),
      sourceCount: external.length,
      internalLinks: structured.length,
      externalLinks: external.length,
      searchIndexed: !post.noIndex,
      canonical: `/blog/${post.slug}`,
      notes: `category=${post.category ?? ""}; editorialReviewed=${post.editorialReviewed ?? "unknown"}`,
      summary: post.excerpt ?? "",
      body,
      aliases: post.tags ?? [],
      outgoingUrls: structured,
      hubPath: "/blog",
      sitemapExpected: !post.noIndex,
      revisionHistory: "git_history_or_cms_runtime",
      translationStatus: "ru_only",
    }));
  });
}

function makeGuideItems(): InventoryItem[] {
  return (GUIDE_TOPIC_LIST as AnyRecord[]).map((topic) => {
    const body = flattenText([topic.intro, topic.sections]);
    const structured = structuredInternalUrls([
      topic.sections,
      topic.serviceCards,
      topic.tourRecommendations,
      topic.relatedArticles,
      topic.relatedDestinations,
    ]);
    const external = externalUrls(body);
    return finalizeItem(baseInput({
      id: `guide-topic:${topic.slug}`,
      sourceSystem: "guide_topics_static",
      sourcePath: "src/data/guide-topics.ts",
      type: "guide_topic",
      url: `/guide/${topic.slug}`,
      title: topic.title ?? "",
      wordCount: wordCount(body),
      heroMedia: typeof topic.heroImage === "string" ? topic.heroImage : topic.heroImage?.src ?? "",
      sourceCount: external.length,
      internalLinks: structured.length,
      externalLinks: external.length,
      searchIndexed: true,
      canonical: `/guide/${topic.slug}`,
      summary: topic.shortDescription ?? topic.intro ?? "",
      body,
      outgoingUrls: structured,
      hubPath: "/guide",
      sitemapExpected: true,
      revisionHistory: "git_history",
    }));
  });
}

function makeContentPageItems(): InventoryItem[] {
  return (getAllContentPages() as AnyRecord[]).map((page) => {
    const body = flattenText([page.description, page.sections]);
    const structured = structuredInternalUrls([page.sections, page.relatedLinks]);
    const external = externalUrls(body);
    const type = page.section === "immigration" ? "immigration" : "content_page";
    const url = `/${page.section}/${page.slug}`;
    return finalizeItem(baseInput({
      id: `content-page:${page.section}:${page.slug}`,
      sourceSystem: "content_pages_static",
      sourcePath: page.section === "immigration" ? "src/data/immigration-content.ts" : "src/data/guide-content.ts",
      type,
      url,
      title: page.title ?? "",
      updatedAt: page.updatedAt ?? "",
      wordCount: wordCount(body),
      heroMedia: page.heroImage ?? "",
      sourceCount: external.length,
      internalLinks: structured.length,
      externalLinks: external.length,
      searchIndexed: true,
      canonical: url,
      summary: page.description ?? "",
      body,
      outgoingUrls: structured,
      hubPath: `/${page.section}`,
      sitemapExpected: true,
      revisionHistory: "git_history_or_cms_runtime",
      sensitive: page.section === "immigration",
      missingPrimarySource: page.section === "immigration" && external.length === 0,
    }));
  });
}

function makeDestinationItems(): InventoryItem[] {
  return (DESTINATION_PAGES as AnyRecord[]).map((destination) => {
    const body = flattenText([
      destination.intro,
      destination.highlights,
      destination.bestSeason,
      destination.idealDuration,
      destination.howToGetThere,
      destination.travelTips,
    ]);
    const outgoingUrls = structuredInternalUrls(body);
    const url = `/destinations/${destination.id}`;
    return finalizeItem(baseInput({
      id: `destination:${destination.id}`,
      sourceSystem: "destination_static",
      sourcePath: "src/data/destination-pages.ts",
      type: "destination",
      url,
      title: destination.name ?? "",
      wordCount: wordCount(body),
      heroMedia: destination.image ?? "",
      inlineMediaCount: destination.gallery?.length ?? 0,
      sourceCount: externalUrls(body).length,
      internalLinks: outgoingUrls.length,
      externalLinks: externalUrls(body).length,
      searchIndexed: true,
      canonical: url,
      summary: destination.description ?? "",
      body,
      aliases: destination.keywords ?? [],
      outgoingUrls,
      hubPath: "/destinations",
      sitemapExpected: true,
      mapVisible: false,
      revisionHistory: "git_history_or_cms_runtime",
    }));
  });
}

function makePlaceItems(): InventoryItem[] {
  return (PLACES_SEED as AnyRecord[]).map((place) => {
    const body = flattenText([
      place.shortDescription,
      place.fullDescription,
      place.history,
      place.interestingFacts,
      place.howToGetThere,
      place.nearbyHighlights,
      place.faq,
    ]);
    const outgoingUrls = structuredInternalUrls(body);
    const external = unique([place.website, ...externalUrls(body)].filter(Boolean));
    const url = `/places/${place.slug}`;
    return finalizeItem(baseInput({
      id: `place:${place.slug}`,
      sourceSystem: "places_static",
      sourcePath: "src/data/places-seed.ts",
      type: "place",
      url,
      title: place.name ?? "",
      wordCount: wordCount(body),
      heroMedia: place.coverImage ?? "",
      inlineMediaCount: place.gallery?.length ?? 0,
      sourceCount: external.length,
      internalLinks: outgoingUrls.length,
      externalLinks: external.length,
      searchIndexed: true,
      canonical: url,
      summary: place.shortDescription ?? "",
      body,
      aliases: [place.city, place.province, ...(place.tags ?? [])].filter(Boolean),
      outgoingUrls,
      hubPath: "/places",
      sitemapExpected: true,
      mapVisible: Number.isFinite(place.latitude) && Number.isFinite(place.longitude),
      revisionHistory: "git_history_or_cms_runtime",
      notes: `source=${place.source ?? ""}; category=${place.category ?? ""}`,
    }));
  });
}

function makeCollectionItems(): InventoryItem[] {
  return (COLLECTIONS_SEED as AnyRecord[]).map((collection) => {
    const body = flattenText([collection.subtitle, collection.description]);
    const outgoingUrls = (collection.placeSlugs ?? []).map((slug: string) => `/places/${slug}`);
    const url = `/collections/${collection.slug}`;
    return finalizeItem(baseInput({
      id: `collection:${collection.slug}`,
      sourceSystem: "collections_static",
      sourcePath: "src/data/places-seed.ts",
      type: "collection",
      url,
      title: collection.title ?? "",
      wordCount: wordCount(body),
      heroMedia: collection.coverImage ?? "",
      sourceCount: externalUrls(body).length,
      internalLinks: outgoingUrls.length,
      externalLinks: externalUrls(body).length,
      searchIndexed: false,
      canonical: url,
      summary: collection.subtitle ?? collection.description ?? "",
      body,
      aliases: collection.tags ?? [],
      outgoingUrls,
      hubPath: "/collections",
      sitemapExpected: true,
      revisionHistory: "git_history_or_cms_runtime",
    }));
  });
}

function makeItineraryItems(): InventoryItem[] {
  return (ITINERARIES_SEED as AnyRecord[]).map((itinerary) => {
    const body = flattenText([itinerary.subtitle, itinerary.description, itinerary.stops]);
    const outgoingUrls = unique(
      (itinerary.stops ?? [])
        .map((stop: AnyRecord) => stop.placeSlug ? `/places/${stop.placeSlug}` : null)
        .filter(Boolean),
    ) as string[];
    const url = `/itineraries/${itinerary.slug}`;
    return finalizeItem(baseInput({
      id: `itinerary:${itinerary.slug}`,
      sourceSystem: "itineraries_static",
      sourcePath: "src/data/places-seed.ts",
      type: "itinerary",
      url,
      title: itinerary.title ?? "",
      wordCount: wordCount(body),
      heroMedia: itinerary.coverImage ?? "",
      sourceCount: externalUrls(body).length,
      internalLinks: outgoingUrls.length,
      externalLinks: externalUrls(body).length,
      searchIndexed: false,
      canonical: url,
      summary: itinerary.subtitle ?? itinerary.description ?? "",
      body,
      aliases: itinerary.tags ?? [],
      outgoingUrls,
      hubPath: "/itineraries",
      sitemapExpected: true,
      revisionHistory: "git_history_or_cms_runtime",
    }));
  });
}

function makeLegalItems(): InventoryItem[] {
  return (Object.values(LEGAL_DOCUMENTS) as AnyRecord[]).map((document) => {
    const body = flattenText(document.sections);
    const outgoingUrls = structuredInternalUrls(document.sections);
    const external = externalUrls(body);
    const url = `/legal/${document.slug}`;
    return finalizeItem(baseInput({
      id: `legal:${document.slug}`,
      sourceSystem: "legal_static",
      sourcePath: "src/data/legal-content.ts",
      type: "legal",
      url,
      title: document.title ?? "",
      updatedAt: document.updatedAt ?? "",
      wordCount: wordCount(body),
      sourceCount: external.length,
      internalLinks: outgoingUrls.length,
      externalLinks: external.length,
      searchIndexed: true,
      canonical: url,
      summary: document.description ?? "",
      body,
      outgoingUrls,
      hubPath: "",
      sitemapExpected: true,
      revisionHistory: "git_history",
      sensitive: true,
      missingPrimarySource: external.length === 0,
      notes: "legal-adjacent public copy; reviewer field is absent in static model",
    }));
  });
}

const inventory = [
  ...makeKbItems(),
  ...makeBlogItems(),
  ...makeGuideItems(),
  ...makeContentPageItems(),
  ...makeDestinationItems(),
  ...makePlaceItems(),
  ...makeCollectionItems(),
  ...makeItineraryItems(),
  ...makeLegalItems(),
].sort((a, b) => a.url.localeCompare(b.url, "ru") || a.id.localeCompare(b.id, "ru"));

const byUrl = new Map<string, InventoryItem[]>();
for (const item of inventory) byUrl.set(item.url, [...(byUrl.get(item.url) ?? []), item]);

const inventoryUrlSet = new Set(inventory.map((item) => item.url));
const incomingByUrl = new Map<string, Set<string>>();
for (const item of inventory) {
  for (const target of item.outgoingUrls) {
    const clean = internalPath(target);
    if (!clean) continue;
    const sources = incomingByUrl.get(clean) ?? new Set<string>();
    sources.add(item.url);
    incomingByUrl.set(clean, sources);
  }
}

function charBigrams(value: string): Set<string> {
  const text = normalized(value).replace(/\s+/g, " ");
  const result = new Set<string>();
  for (let index = 0; index < text.length - 1; index += 1) result.add(text.slice(index, index + 2));
  return result;
}

function diceSimilarity(a: string, b: string): number {
  const left = charBigrams(a);
  const right = charBigrams(b);
  if (left.size === 0 || right.size === 0) return 0;
  let overlap = 0;
  for (const token of left) if (right.has(token)) overlap += 1;
  return (2 * overlap) / (left.size + right.size);
}

const duplicateRows: AnyRecord[] = [];
const duplicatePairKeys = new Set<string>();

function addDuplicate(left: InventoryItem, right: InventoryItem, method: string, similarity: number, classification: string) {
  const ids = [left.id, right.id].sort();
  const key = `${ids.join("|")}|${method}`;
  if (duplicatePairKeys.has(key)) return;
  duplicatePairKeys.add(key);
  duplicateRows.push({
    duplicate_group: normalized(left.title || left.url).slice(0, 80),
    left_id: left.id,
    left_url: left.url,
    left_source: left.sourcePath,
    right_id: right.id,
    right_url: right.url,
    right_source: right.sourcePath,
    detection_method: method,
    similarity: similarity.toFixed(3),
    classification,
    risk: left.url === right.url ? "high" : "medium",
    recommended_action: "HUMAN_REVIEW",
    evidence: left.url === right.url
      ? "Один публичный URL собирается из нескольких статических источников."
      : `Совпадение заголовков: «${left.title}» / «${right.title}».`,
  });
}

for (const items of byUrl.values()) {
  if (items.length < 2) continue;
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      addDuplicate(items[i], items[j], "same_public_url", 1, "competing_source_layers");
    }
  }
}

const titleGroups = new Map<string, InventoryItem[]>();
for (const item of inventory) {
  const key = normalized(item.title);
  if (key) titleGroups.set(key, [...(titleGroups.get(key) ?? []), item]);
}
for (const items of titleGroups.values()) {
  if (items.length < 2) continue;
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      addDuplicate(items[i], items[j], "exact_normalized_title", 1, "cross_layer_parallel_entity");
    }
  }
}

const bodyGroups = new Map<string, InventoryItem[]>();
for (const item of inventory) {
  const key = normalized(item.body);
  if (key.length < 300) continue;
  bodyGroups.set(key, [...(bodyGroups.get(key) ?? []), item]);
}
for (const items of bodyGroups.values()) {
  if (items.length < 2) continue;
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      addDuplicate(items[i], items[j], "exact_normalized_body", 1, "exact_content_duplicate");
    }
  }
}

const titleCandidates = inventory.filter((item) => normalized(item.title).length >= 12);
for (let i = 0; i < titleCandidates.length; i += 1) {
  for (let j = i + 1; j < titleCandidates.length; j += 1) {
    const left = titleCandidates[i];
    const right = titleCandidates[j];
    if (normalized(left.title) === normalized(right.title)) continue;
    const similarity = diceSimilarity(left.title, right.title);
    if (similarity >= 0.88) {
      addDuplicate(left, right, "title_dice_bigrams", similarity, "near_duplicate_candidate");
    }
  }
}

const duplicateIds = new Set(duplicateRows.flatMap((row) => [row.left_id, row.right_id]));
for (const item of inventory) {
  if (!duplicateIds.has(item.id)) continue;
  if (item.action === "KEEP") item.action = "HUMAN_REVIEW";
}

function routeFromPage(filePath: string): string {
  const relative = path.relative(path.join(root, "src/app"), filePath).replace(/\\/g, "/");
  const segments = relative
    .replace(/\/page\.(?:ts|tsx)$/, "")
    .replace(/^page\.(?:ts|tsx)$/, "")
    .split("/")
    .filter(Boolean)
    .filter((segment) => !/^\(.+\)$/.test(segment));
  return `/${segments.join("/")}`.replace(/\/$/, "") || "/";
}

function walk(directory: string): string[] {
  const result: string[] = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...walk(fullPath));
    else result.push(fullPath);
  }
  return result;
}

const excludedPublicRoute = /^\/(?:admin|api|account|auth|organizer|profile|booking|favorites|trip-prep|trip|dev|maintenance|yandex-verification)(?:\/|$)/;
const pageFiles = walk(path.join(root, "src/app"))
  .filter((file) => /\/page\.(?:ts|tsx)$/.test(file))
  .map((file) => ({ file, route: routeFromPage(file) }))
  .filter(({ route }) => !excludedPublicRoute.test(route))
  .sort((a, b) => a.route.localeCompare(b.route));

const explicitStaticSitemapHubs = new Set([
  "/",
  "/baza-znaniy",
  "/blog",
  "/collections",
  "/destinations",
  "/guide",
  "/immigration",
  "/itineraries",
  "/places",
]);

const explicitDynamicRouteCounts = new Map<string, number>([
  ["/baza-znaniy/razdel/[slug]", 7],
]);

function routeRecords(pattern: string): InventoryItem[] {
  const regex = new RegExp(`^${pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\[[^/]+\\\]/g, "[^/]+")}$`);
  return inventory.filter((item) => regex.test(item.url));
}

function routeKind(route: string): string {
  if (/^\/(?:baza-znaniy|blog|guide|immigration|destinations|places|collections|itineraries|mapa-argentina|map|faq)/.test(route)) return "editorial";
  if (/^\/(?:tours|excursions|experts|organizers|shop)/.test(route)) return "marketplace";
  if (/^\/forum/.test(route)) return "community";
  if (/^\/(?:flights|transfers|insurance|esim|car-rental|audio-guides|services)/.test(route)) return "service";
  return "public_static";
}

const routeRows = pageFiles.map(({ file, route }) => {
  const records = routeRecords(route);
  const publicRecords = records.filter((item) => item.status === "published" && item.sitemapExpected);
  const dynamic = route.includes("[");
  const examples = publicRecords.slice(0, 3).map((item) => item.url);
  const sourceSystems = unique(records.map((item) => item.sourceSystem));
  const indexed = publicRecords.length > 0 || explicitStaticSitemapHubs.has(route) || explicitDynamicRouteCounts.has(route);
  return {
    route_pattern: route,
    route_kind: routeKind(route),
    page_source: path.relative(root, file),
    content_sources: sourceSystems.join("|"),
    repository_record_count: publicRecords.length || explicitDynamicRouteCounts.get(route) || (dynamic ? "" : 1),
    public_url_examples: examples.join("|"),
    sitemap_expected: indexed ? "yes" : dynamic ? "unknown_or_runtime" : "not_asserted_for_static_route",
    search_coverage: publicRecords.some((item) => item.searchIndexed) ? "yes" : "no_or_not_observed",
    edit_surface: sourceSystems.length ? "static_data_or_cms_resolver" : "page_component_or_runtime_provider",
    evidence: path.relative(root, file),
    notes: dynamic && records.length === 0
      ? "Данные приходят из runtime/API либо статический реестр не найден этим baseline-сканером."
      : "",
  };
});

const thinRows = inventory
  .filter((item) => item.wordCount < (thresholds[item.type] ?? 400))
  .map((item) => {
    const threshold = thresholds[item.type] ?? 400;
    return {
      id: item.id,
      type: item.type,
      url: item.url,
      title: item.title,
      status: item.status,
      word_count: item.wordCount,
      threshold,
      gap_words: threshold - item.wordCount,
      quality_score: item.qualityScore,
      severity: item.wordCount < threshold * 0.25 ? "high" : item.wordCount < threshold * 0.6 ? "medium" : "low",
      recommended_action: item.status === "draft" ? "EXPAND" : item.wordCount < threshold * 0.5 ? "DEEP_REWRITE" : "EXPAND",
      source_path: item.sourcePath,
      evidence: `word_count=${item.wordCount}; type_threshold=${threshold}`,
    };
  })
  .sort((a, b) => b.gap_words - a.gap_words || a.url.localeCompare(b.url));

const orphanRows = inventory
  .filter((item) => item.searchIndexed || item.sitemapExpected)
  .map((item) => {
    const incoming = incomingByUrl.get(item.url)?.size ?? 0;
    const hubCoverage = Boolean(item.hubPath);
    const reasons = [
      incoming === 0 ? "no_explicit_inbound_link" : "",
      item.outgoingUrls.length === 0 ? "no_related_or_outgoing_link" : "",
      !hubCoverage ? "no_hub_path_in_source_model" : "",
      !item.sitemapExpected ? "not_expected_in_sitemap" : "",
    ].filter(Boolean);
    return {
      id: item.id,
      type: item.type,
      url: item.url,
      title: item.title,
      inbound_internal_links: incoming,
      outgoing_internal_links: item.outgoingUrls.length,
      hub_path: item.hubPath,
      hub_coverage: hubCoverage ? "yes" : "no",
      sitemap_expected: item.sitemapExpected ? "yes" : "no",
      orphan_status: reasons.length ? "needs_review" : "connected",
      orphan_reasons: reasons.join("|"),
      source_path: item.sourcePath,
      evidence: "Статические ссылки и структурированные related-поля; runtime/CMS ссылки не сканировались.",
    };
  })
  .filter((row) => row.orphan_status === "needs_review")
  .sort((a, b) => b.orphan_reasons.localeCompare(a.orphan_reasons) || a.url.localeCompare(b.url));

const relatedRows = inventory.map((item) => {
  const broken = item.outgoingUrls.filter((target) => {
    const clean = internalPath(target);
    if (!clean) return false;
    if (inventoryUrlSet.has(clean)) return false;
    return !pageFiles.some(({ route }) => {
      const regex = new RegExp(`^${route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\[[^/]+\\\]/g, "[^/]+")}$`);
      return regex.test(clean);
    });
  });
  const inbound = incomingByUrl.get(item.url)?.size ?? 0;
  const assessment = broken.length > 0
    ? "broken_targets"
    : item.outgoingUrls.length === 0
      ? "no_related_content"
      : inbound === 0
        ? "no_inbound_links"
        : "connected";
  return {
    id: item.id,
    type: item.type,
    url: item.url,
    title: item.title,
    outgoing_internal_links: item.outgoingUrls.length,
    incoming_internal_links: inbound,
    broken_outgoing_links: broken.length,
    broken_targets: broken.join("|"),
    hub_path: item.hubPath,
    assessment,
    recommended_action: assessment === "connected" ? "KEEP" : "HUMAN_REVIEW",
    source_path: item.sourcePath,
  };
});

type GapDefinition = {
  area: string;
  question: string;
  queries: string[];
  expected: string[];
  priority: string;
};

const firstTripQuestions: GapDefinition[] = [
  ["Когда ехать в Аргентину", ["когда ехать", "сезоны и климат"], ["сезон", "регион"], "P0"],
  ["Сколько дней нужно", ["сколько дней", "маршрут"], ["день", "маршрут"], "P0"],
  ["Какие регионы выбрать", ["туристические регионы", "куда поехать"], ["регион", "сезон"], "P0"],
  ["Как долететь", ["как добраться", "перелет"], ["аэропорт", "пересад"], "P0"],
  ["Как покупать внутренние перелёты", ["внутренние авиаперелеты", "внутренние рейсы"], ["багаж", "покуп"], "P0"],
  ["Как переехать между EZE и AEP", ["стыковка aep eze", "eze aep"], ["трансфер", "время"], "P0"],
  ["Какие документы нужны", ["документы для въезда", "документы поездка"], ["паспорт", "въезд"], "P0"],
  ["Нужна ли страховка", ["страховка", "здоровье"], ["страхов", "экстр"], "P0"],
  ["Как платить", ["как платить", "деньги"], ["карта", "налич"], "P0"],
  ["Какой курс использовать", ["курс валют", "обмен валюты"], ["курс", "источник"], "P0"],
  ["Что делать с российскими банковскими картами", ["карты рф", "российские карты"], ["карта", "альтернатив"], "P0"],
  ["Где менять валюту законно и безопасно", ["как менять валюту", "обмен валюты"], ["обмен", "безопас"], "P0"],
  ["Где жить в Буэнос-Айресе", ["где жить", "районы буэнос айреса"], ["район", "жиль"], "P0"],
  ["Как работает SUBE", ["sube"], ["пополн", "транспорт"], "P0"],
  ["Безопасно ли путешествовать", ["безопасность аргентина", "безопасно ли"], ["риск", "экстр"], "P0"],
  ["Как устроена мобильная связь", ["esim и связь", "мобильная связь"], ["sim", "покрыт"], "P0"],
  ["Что взять", ["что взять", "подготовка к поездке"], ["документ", "одеж"], "P1"],
  ["Как путешествовать по Патагонии", ["патагон", "маршрут патагония"], ["сезон", "транспорт"], "P0"],
  ["Как посетить Игуасу", ["игуасу"], ["добраться", "билет"], "P0"],
  ["Как организовать винную поездку в Мендосу", ["мендоса", "винный"], ["вин", "транспорт"], "P1"],
  ["Как посетить северо-запад", ["северо запад", "noa"], ["маршрут", "высот"], "P1"],
  ["Как путешествовать без испанского", ["без испанского", "язык"], ["фраз", "перевод"], "P1"],
  ["Что делать при экстренной ситуации", ["экстренные номера", "экстренная ситуация"], ["номер", "полици"], "P0"],
  ["Как пользоваться медициной", ["система здравоохранения", "медицина"], ["экстр", "страхов"], "P0"],
  ["Как спланировать бюджет", ["бюджет поездки", "сколько денег"], ["жиль", "транспорт"], "P0"],
].map(([question, queries, expected, priority]) => ({ area: "first_trip", question, queries, expected, priority })) as GapDefinition[];

const relocationQuestions: GapDefinition[] = [
  ["С чего начать переезд", ["гид релоканта", "переезд с чего начать"], ["шаг", "документ"], "P0"],
  ["Как выбрать основание", ["основания внж", "виды внж"], ["основан", "огранич"], "P0"],
  ["Какие документы приготовить до выезда", ["документы до выезда", "документы для внж"], ["апостил", "справк"], "P0"],
  ["Что апостилировать", ["апостиль"], ["документ", "срок"], "P0"],
  ["Что переводить", ["перевод документов"], ["перевод", "легал"], "P0"],
  ["Как пользоваться RADEX", ["radex"], ["заяв", "документ"], "P0"],
  ["Что такое precaria", ["precaria", "прекария"], ["статус", "срок"], "P0"],
  ["Как получить DNI", ["dni"], ["документ", "получ"], "P0"],
  ["Как получить CUIL/CUIT", ["cuil cuit", "cuil", "cuit"], ["номер", "оформ"], "P0"],
  ["Как открыть банковский счёт", ["банковский счет"], ["документ", "банк"], "P0"],
  ["Как арендовать жильё", ["аренда жилья", "как снять квартиру"], ["договор", "гарант"], "P0"],
  ["Как пользоваться медициной после переезда", ["система здравоохранения", "медицина"], ["резидент", "страхов"], "P0"],
  ["Как устроены налоги", ["налоги", "monotributo"], ["arca", "резидент"], "P0"],
  ["Когда возникает налоговое резидентство", ["налоговое резидентство"], ["день", "резидент"], "P0"],
  ["Как получить постоянную резиденцию", ["постоянная резиденция", "пмж"], ["услов", "документ"], "P0"],
  ["Как получить гражданство", ["гражданство"], ["процедур", "документ"], "P0"],
  ["Как рождение ребёнка влияет на статус семьи", ["роды в аргентине", "ребенок гражданство"], ["родител", "резидент"], "P0"],
  ["Как сохранить резиденцию", ["сохранить резиденцию", "потеря резиденции"], ["выезд", "срок"], "P0"],
  ["Как проверить статус дела", ["статус дела", "radex"], ["статус", "заяв"], "P1"],
  ["Где получать официальную информацию", ["официальные ссылки", "миграционная служба"], ["argentina", "migraciones"], "P0"],
].map(([question, queries, expected, priority]) => ({ area: "relocation", question, queries, expected, priority })) as GapDefinition[];

const tierADestinations: [string, string[]][] = [
  ["Аргентина — обзор страны", ["об аргентине", "аргентина обзор"]],
  ["Буэнос-Айрес", ["буэнос айрес", "buenos aires"]],
  ["Тигре и дельта Параны", ["тигре", "delta del parana"]],
  ["Пуэрто-Игуасу", ["пуэрто игуасу", "puerto iguazu"]],
  ["Водопады Игуасу", ["водопады игуасу", "cataratas del iguazu"]],
  ["Мендоса", ["мендоса", "mendoza"]],
  ["Долина Уко", ["долина уко", "valle de uco"]],
  ["Барилоче", ["барилоче", "bariloche"]],
  ["Вилья-ла-Ангостура", ["вилья ла ангостура", "villa la angostura"]],
  ["Сан-Мартин-де-лос-Андес", ["сан мартин де лос андес", "san martin de los andes"]],
  ["Эль-Калафате", ["эль калафате", "el calafate"]],
  ["Эль-Чалтен", ["эль чалтен", "el chalten"]],
  ["Ушуайя", ["ушуайя", "ushuaia"]],
  ["Пуэрто-Мадрин", ["пуэрто мадрин", "puerto madryn"]],
  ["Полуостров Вальдес", ["полуостров вальдес", "peninsula valdes"]],
  ["Сальта", ["сальта", "salta"]],
  ["Жужуй", ["жужуй", "jujuy"]],
  ["Пурмамарка", ["пурмамарка", "purmamarca"]],
  ["Умауака", ["умауака", "humahuaca"]],
  ["Кафайяте", ["кафайяте", "cafayate"]],
  ["Кордова", ["кордова", "cordoba"]],
  ["Росарио", ["росарио", "rosario"]],
  ["Мар-дель-Плата", ["мар дель плата", "mar del plata"]],
  ["Эстерос-дель-Ибера", ["эстерос дель ибера", "esteros del ibera"]],
  ["Сан-Хуан", ["сан хуан", "san juan"]],
  ["Исчигуаласто", ["исчигуаласто", "ischigualasto"]],
  ["Ла-Риоха", ["ла риоха", "la rioja"]],
  ["Талампая", ["талампая", "talampaya"]],
  ["Тукуман", ["тукуман", "tucuman"]],
  ["Эскель", ["эскель", "esquel"]],
  ["Национальный парк Лос-Алерсес", ["лос алерсес", "los alerces"]],
  ["Эль-Больсон", ["эль больсон", "el bolson"]],
  ["Сан-Рафаэль", ["сан рафаэль", "san rafael"]],
  ["Сан-Игнасио-Мини", ["сан игнасио мини", "san ignacio mini"]],
  ["Посадас", ["посадас", "posadas"]],
  ["Катамарка и Пуна", ["катамарка", "пуна", "catamarca"]],
];

const tierAGaps: GapDefinition[] = tierADestinations.map(([question, queries]) => ({
  area: "tier_a_destination",
  question,
  queries,
  expected: ["добраться", "сезон", "маршрут", "бюджет", "источник"],
  priority: "P1",
}));

function candidateScore(item: InventoryItem, queries: string[], area: string): number {
  const title = normalized(`${item.title} ${item.aliases.join(" ")}`);
  const summary = normalized(item.summary);
  let score = 0;
  for (const query of queries.map(normalized)) {
    const tokens = query.split(" ").filter(Boolean);
    if (title.includes(query)) score += 140;
    else if (tokens.length > 1 && tokens.every((token) => title.includes(token))) score += 120;
    else if (summary.includes(query)) score += 60;
    else if (tokens.length > 1 && tokens.every((token) => summary.includes(token))) score += 40;
  }
  if (item.status === "published") score += 30;
  else score -= 60;
  if (area === "first_trip" && ["guide", "transport", "route", "guide_topic", "content_page", "region"].includes(item.type)) score += 20;
  if (area === "relocation" && ["guide", "immigration", "content_page", "faq"].includes(item.type)) score += 20;
  if (area === "tier_a_destination" && ["city", "region", "national_park", "attraction", "destination", "place"].includes(item.type)) score += 20;
  return score + item.qualityScore / 100;
}

const gapRows = [...firstTripQuestions, ...relocationQuestions, ...tierAGaps].map((definition) => {
  const candidates = inventory
    .map((item) => ({ item, score: candidateScore(item, definition.queries, definition.area) }))
    .filter(({ score }) => score >= 30)
    .sort((a, b) => b.score - a.score || b.item.qualityScore - a.item.qualityScore)
    .slice(0, 5)
    .map(({ item }) => item);
  const canonical = candidates[0];
  const body = normalized(canonical?.body ?? "");
  const missingSections = definition.expected.filter((term) => !body.includes(normalized(term)));
  const action = !canonical
    ? "CREATE"
    : canonical.status !== "published"
      ? "EXPAND"
      : ["LEGAL_REVIEW", "DEEP_REWRITE", "EXPAND", "LIGHT_EDIT"].includes(canonical.action)
        ? canonical.action
        : canonical.qualityScore < 50
          ? "DEEP_REWRITE"
          : missingSections.length >= Math.ceil(definition.expected.length / 2)
            ? "EXPAND"
            : "KEEP";
  return {
    gap_area: definition.area,
    user_question: definition.question,
    existing_answer: candidates.map((item) => item.url).join("|"),
    quality: canonical?.qualityScore ?? 0,
    canonical_page: canonical?.url ?? "",
    missing_sections: missingSections.join("|"),
    required_action: action,
    priority: definition.priority,
    evidence: canonical
      ? `${canonical.sourcePath}; deterministic title/summary match`
      : "Совпадение по заголовку или summary в текущем inventory не найдено.",
  };
});

const qualityRows = inventory.map((item) => ({
  id: item.id,
  type: item.type,
  url: item.url,
  title: item.title,
  metadata_score_10: item.metadataScore,
  depth_score_25: item.depthScore,
  sources_score_20: item.sourcesScore,
  freshness_score_15: item.freshnessScore,
  media_score_15: item.mediaScore,
  relations_score_15: item.relationsScore,
  quality_score_100: item.qualityScore,
  action: item.action,
  evidence: `words=${item.wordCount}; sources=${item.sourceCount}; hero=${Boolean(item.heroMedia)}; internal_links=${item.internalLinks}`,
  source_path: item.sourcePath,
}));

const actionRows = inventory.map((item) => {
  const reasons = [
    item.status !== "published" ? `status=${item.status}` : "",
    item.qualityScore < 80 ? `quality=${item.qualityScore}` : "",
    duplicateIds.has(item.id) ? "duplicate_candidate" : "",
    item.sensitive && !item.reviewer ? "sensitive_without_reviewer" : "",
    item.missingPrimarySource ? "missing_primary_source" : "",
    item.reviewDue ? "review_due" : "",
  ].filter(Boolean);
  return {
    id: item.id,
    type: item.type,
    url: item.url,
    title: item.title,
    action: item.action,
    priority: item.action === "LEGAL_REVIEW" ? "P0" : item.qualityScore < 45 ? "P1" : item.action === "KEEP" ? "P3" : "P2",
    owner: item.owner,
    status: "open",
    reason: reasons.join("|") || "baseline_quality_pass",
    source_path: item.sourcePath,
    evidence: `content-quality-score.csv#${item.id}`,
  };
});

const inventoryRows = inventory.map((item) => ({
  id: item.id,
  type: item.type,
  url: item.url,
  locale: item.locale,
  title: item.title,
  status: item.status,
  author: item.author,
  editor: item.editor,
  reviewer: item.reviewer,
  published_at: item.publishedAt,
  updated_at: item.updatedAt,
  last_fact_checked_at: item.lastFactCheckedAt,
  next_review_at: item.nextReviewAt,
  word_count: item.wordCount,
  hero_media: item.heroMedia,
  inline_media_count: item.inlineMediaCount,
  source_count: item.sourceCount,
  claim_count: item.claimCount,
  internal_links: item.internalLinks,
  external_links: item.externalLinks,
  search_indexed: item.searchIndexed ? "yes" : "no",
  canonical: item.canonical,
  quality_score: item.qualityScore,
  action: item.action,
  owner: item.owner,
  notes: item.notes,
  source_system: item.sourceSystem,
  source_path: item.sourcePath,
  edit_surface: item.revisionHistory.includes("cms") ? "static_source_with_cms_resolver" : "repository",
  revision_history: item.revisionHistory,
  translation_status: item.translationStatus,
  map_visible: item.mapVisible === "" ? "unknown" : item.mapVisible ? "yes" : "no",
  related_content_count: item.outgoingUrls.length,
}));

const geographyRows = contentIndex
  .filter((entry) => ["city", "region", "national_park", "attraction"].includes(entry.type))
  .map((entry) => {
    const aliases = entry.aliases ?? [];
    const cyrillicAliases = aliases.filter((alias: string) => /\p{Script=Cyrillic}/u.test(alias));
    const latinAliases = aliases.filter((alias: string) => /\p{Script=Latin}/u.test(alias));
    return {
      id: entry.id,
      preferred_ru: entry.title ?? "",
      official_es: entry.title_es ?? "",
      common_ru_aliases: cyrillicAliases.join("|"),
      latin_aliases: latinAliases.join("|"),
      search_aliases: unique([entry.title_es, ...aliases].filter(Boolean)).join("|"),
      forbidden_variants: "",
      pronunciation_note: "",
      entity_type: entry.type,
      region_id: entry.region_id ?? "",
      province: entry.province ?? "",
      coordinates: entry.coordinates ? `${entry.coordinates.lat},${entry.coordinates.lng}` : "",
      source_path: `content/knowledge-base/${findKbPath(entry.id)}`,
      evidence: "content/knowledge-base/_index/content.json",
    };
  })
  .sort((a, b) => a.preferred_ru.localeCompare(b.preferred_ru, "ru"));

const terminologyRows = [
  ["руководство / путеводитель", "guide", "", "Пользовательский материал с практическими объяснениями."],
  ["советы / рекомендации", "tips", "", "Практические рекомендации без обещания результата."],
  ["статья", "post", "", "Отдельный редакционный материал."],
  ["раздел", "section", "", "Смысловая часть страницы или материала."],
  ["стоимость / цена", "price", "", "Денежное значение с валютой и единицей измерения."],
  ["бронирование", "booking", "", "Оформление заявки или заказа."],
  ["поиск", "search", "", "Поиск материалов или услуг."],
  ["сравнение", "comparison", "", "Сопоставление вариантов по понятным критериям."],
  ["преимущества", "benefits", "", "Сильные стороны варианта; только с объяснением критериев."],
  ["обзор", "overview", "", "Вводный материал о теме."],
  ["обновление", "update", "", "Существенное изменение материала или данных."],
  ["поддержка", "support", "", "Помощь пользователю."],
  ["отзыв / обратная связь", "feedback", "", "Комментарий пользователя или ответ редакции."],
  ["рекомендуемое / избранное", "featured", "", "Редакционно выделенный материал с понятным основанием."],
  ["песо", "peso|pesos", "ARS", "Название валюты в русском тексте; ISO-код допустим при неоднозначности."],
  ["Буэнос-Айрес", "Buenos Aires в русском тексте", "Buenos Aires", "Официальная русская форма; испанская допустима при первом упоминании и в поисковых aliases."],
  ["Патагония", "Patagonia в русском тексте", "Patagonia", "Официальная русская форма; латинская форма хранится как поисковый alias."],
  ["ВНЖ / ПМЖ", "residencia без пояснения", "residencia", "Русские сокращения не смешиваются с испанским термином без пояснения."],
  ["DNI", "", "DNI", "Официальный аргентинский идентификатор; при первом упоминании требуется пояснение."],
  ["RADEX", "", "RADEX", "Официальный термин миграционной процедуры; при первом упоминании требуется пояснение."],
  ["MERVAL", "", "MERVAL", "Официальный финансовый термин; при первом упоминании требуется пояснение."],
  ["jus soli", "", "jus soli", "Устоявшийся правовой термин; требуется пояснение по-русски."],
].map(([preferred, avoid, allowed, definition]) => ({
  preferred_ru: preferred,
  avoid,
  allowed_original: allowed,
  definition,
  context: "public_ru_content",
  source: ".cursor/rules/editorial-standard.mdc",
  status: "canonical",
}));

fs.mkdirSync(outputDir, { recursive: true });

writeCsv("content-inventory.csv", Object.keys(inventoryRows[0]), inventoryRows);
writeCsv("content-route-matrix.csv", Object.keys(routeRows[0]), routeRows);
writeCsv("content-gap-map.csv", Object.keys(gapRows[0]), gapRows);
writeCsv("content-quality-score.csv", Object.keys(qualityRows[0]), qualityRows);
writeCsv("content-action-plan.csv", Object.keys(actionRows[0]), actionRows);
writeCsv("duplicate-content-report.csv", Object.keys(duplicateRows[0] ?? {
  duplicate_group: "", left_id: "", left_url: "", left_source: "", right_id: "", right_url: "", right_source: "", detection_method: "", similarity: "", classification: "", risk: "", recommended_action: "", evidence: "",
}), duplicateRows);
writeCsv("thin-content-report.csv", Object.keys(thinRows[0] ?? {
  id: "", type: "", url: "", title: "", status: "", word_count: "", threshold: "", gap_words: "", quality_score: "", severity: "", recommended_action: "", source_path: "", evidence: "",
}), thinRows);
writeCsv("orphan-content-report.csv", Object.keys(orphanRows[0] ?? {
  id: "", type: "", url: "", title: "", inbound_internal_links: "", outgoing_internal_links: "", hub_path: "", hub_coverage: "", sitemap_expected: "", orphan_status: "", orphan_reasons: "", source_path: "", evidence: "",
}), orphanRows);
writeCsv("geography-glossary.csv", Object.keys(geographyRows[0]), geographyRows);
writeCsv("terminology-glossary.csv", Object.keys(terminologyRows[0]), terminologyRows);
writeCsv("related-content-report.csv", Object.keys(relatedRows[0]), relatedRows);

const typeCounts = Object.entries(
  inventory.reduce<Record<string, number>>((counts, item) => {
    counts[item.type] = (counts[item.type] ?? 0) + 1;
    return counts;
  }, {}),
).sort((a, b) => b[1] - a[1]);

const kbTypeCounts = Object.entries(
  contentIndex.reduce<Record<string, number>>((counts, entry) => {
    counts[entry.type] = (counts[entry.type] ?? 0) + 1;
    return counts;
  }, {}),
).sort((a, b) => b[1] - a[1]);

const kbStatusCounts = Object.entries(
  contentIndex.reduce<Record<string, number>>((counts, entry) => {
    counts[entry.status ?? "unknown"] = (counts[entry.status ?? "unknown"] ?? 0) + 1;
    return counts;
  }, {}),
).sort((a, b) => b[1] - a[1]);

const taxonomy = `# Таксономия публичного контента

Baseline: ${baselineDate}. Этот документ описывает фактические словари и параллельные контентные слои репозитория; он не заменяет исходную схему базы знаний.

## Каноническая база знаний

Источник истины для enum и управляемых словарей: \`content/knowledge-base/SCHEMA.md\` и \`content/knowledge-base/TAXONOMY.md\`.

| type | записей | папка / правило |
|---|---:|---|
${kbTypeCounts.map(([type, count]) => `| \`${type}\` | ${count} | см. \`content/knowledge-base/TAXONOMY.md\` |`).join("\n")}

Статусы на дату baseline: ${kbStatusCounts.map(([status, count]) => `\`${status}\` — ${count}`).join("; ")}.

Канонические \`site_sections\` (7):

- \`puteshestviya-po-argentine\`;
- \`goroda-i-regiony\`;
- \`zhizn-v-strane\`;
- \`pereezd-v-argentinu\`;
- \`dokumenty-i-legalizatsiya\`;
- \`finansy-i-ekonomika\`;
- \`lichnyy-opyt\`.

Макрорегионы: \`caba\`, \`buenos-aires-province\`, \`patagonia\`, \`cuyo\`, \`noa\`, \`litoral\`, \`pampa\`, \`tierra-del-fuego\`.

## Параллельные публичные модели

| слой | записей | публичный маршрут | источник |
|---|---:|---|---|
${typeCounts.map(([type, count]) => {
  const sample = inventory.find((item) => item.type === type)!;
  return `| \`${type}\` | ${count} | \`${sample.hubPath || sample.url}\` | \`${sample.sourcePath}\` |`;
}).join("\n")}

Эти модели нельзя считать одним enum: одинаковые города, места и темы встречаются в нескольких слоях. Совпадения зафиксированы в \`duplicate-content-report.csv\`; объединение требует выбора канонического источника и redirect-плана.

## Правила нормализации

1. Публичная русская форма географического названия берётся из \`geography-glossary.csv.preferred_ru\`.
2. Испанские и латинские формы хранятся как aliases для поиска, а не как отдельные сущности.
3. \`Collection\` не является регионом, \`Destination\` не является конкретным \`Place\`.
4. Практическое evergreen-знание относится к базе знаний / Guide; блог сохраняет авторскую или журнальную роль.
5. Поля \`status\`, \`site_ready\`, \`last_verified\`, \`sources\`, \`related\` не заменяются оценкой word count.
6. Новые значения enum сначала добавляются в \`content/knowledge-base/TAXONOMY.md\`, затем в контент и индексы.

## Evidence

- \`content/knowledge-base/_index/content.json\` — ${contentIndex.length} фактических записей.
- \`src/lib/site-search-index-server.ts\` — фактические слои единого поиска.
- \`src/lib/sitemap-urls.ts\` — фактическая сборка sitemap.
- \`content-route-matrix.csv\` — ${routeRows.length} публичных page routes, найденных в \`src/app\`.
`;
fs.writeFileSync(path.join(outputDir, "taxonomy.md"), taxonomy);

let commit = "unknown";
let dirty = "unknown";
try {
  commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  dirty = execFileSync("git", ["status", "--short"], { cwd: root, encoding: "utf8" }).trim() ? "yes" : "no";
} catch {
  // Evidence remains explicit if git metadata is unavailable.
}

const publicKbCount = contentIndex.filter(isPublicKb).length;
const readme = `# Baseline-инвентаризация контента

Дата снимка: ${baselineDate}
Commit: \`${commit}\`
Worktree изменён на момент записи evidence (включая сгенерированные файлы): **${dirty}**

## Охват

- Контентных записей: **${inventory.length}** в ${typeCounts.length} типах/слоях.
- Markdown-записей базы знаний: **${contentIndex.length}**; проходят текущий repository publication gate: **${publicKbCount}**.
- Публичных page routes в \`src/app\`: **${routeRows.length}**.
- Кандидатов в дубли: **${duplicateRows.length}** пар.
- Тонких материалов по типовым порогам: **${thinRows.length}**.
- Материалов с неполной статической связанностью: **${orphanRows.length}**.
- Вопросов и Tier A направлений в gap map: **${gapRows.length}**.

## Методика

Генератор \`scripts/generate-content-overhaul-inventory.ts\` читает только реальные репозиторные источники: сгенерированный индекс базы знаний, статические реестры блога, guide, immigration, destinations, places, collections, itineraries и legal, а также файловое дерево \`src/app\`. Повторный запуск:

\`./node_modules/.bin/tsx scripts/generate-content-overhaul-inventory.ts\`

Гранулярность \`content-inventory.csv\`: одна строка = одна контентная запись в конкретном source layer. Поэтому одинаковый публичный URL может появиться более одного раза — это не ошибка CSV, а evidence конкурирующих источников.

### Quality score

Детерминированная структурная оценка, не экспертная оценка фактической истины:

- метаданные — 10;
- достаточность объёма для типа — 25;
- источники — 20;
- актуальность — 15;
- медиа — 15;
- внутренние связи — 15.

Порог thin content зависит от типа и хранится в генераторе. Word count не используется как единственный критерий публикации.

### Дубли

Проверяются одинаковый публичный URL, точный нормализованный заголовок, точное нормализованное тело и близость заголовков по Dice similarity для символьных биграмм (порог 0,88). Это candidate generation: строки нельзя автоматически удалять или объединять.

### Orphan и related

Учитываются явные внутренние URL и структурированные \`related\`, \`relatedResources\`, place slugs в подборках и остановки маршрутов. Runtime-ссылки из CMS, БД, API, навигации после fetch и внешние backlinks не входят в baseline. Поэтому \`needs_review\` означает отсутствие доказательства в статическом срезе, а не доказанную недоступность страницы.

### Gap map

Покрывает 25 вопросов первой поездки, 20 вопросов переезда и 36 Tier A направлений из мастер-промпта. Кандидат выбирается детерминированно по совпадению заголовка/aliases/summary; полнота разделов проверяется простым наличием терминов в теле. Финальный редакционный review обязателен.

## Ограничения

1. Supabase/CMS runtime, удалённые API, production HTML, аналитика, backlinks и фактический sitemap не запрашивались в этом независимом блоке.
2. \`source_count=0\` у статического слоя означает «источник не найден в этой модели», а не обязательно отсутствие источника в CMS runtime.
3. \`search_indexed\` и \`sitemap_expected\` отражают repository wiring в \`src/lib/site-search-index-server.ts\` и \`src/lib/sitemap-urls.ts\`, а не production crawl.
4. Поля owner/editor/reviewer не заполняются вымышленными людьми; при отсутствии данных используется \`unassigned\` или пустое значение.
5. Загрузчик табличного artifact runtime не ответил в этой сессии. CSV созданы воспроизводимым repo-native генератором без сторонних библиотек; формат RFC 4180 проверяется отдельным парсером.

## Состав артефактов

- \`content-inventory.csv\` — все найденные записи и обязательные поля мастер-промпта;
- \`content-route-matrix.csv\` — публичные route templates и их источники;
- \`content-gap-map.csv\` — вопросы, найденные ответы, пробелы и действия;
- \`content-quality-score.csv\` — компоненты структурной оценки;
- \`content-action-plan.csv\` — ровно одно действие на каждую запись;
- \`duplicate-content-report.csv\`, \`thin-content-report.csv\`, \`orphan-content-report.csv\` — диагностические реестры;
- \`geography-glossary.csv\`, \`terminology-glossary.csv\`, \`taxonomy.md\` — словари и фактическая архитектура;
- \`related-content-report.csv\` — исходящие, входящие и сломанные статические связи.
`;
fs.writeFileSync(path.join(outputDir, "README.md"), readme);

console.log(JSON.stringify({
  generated: baselineDate,
  inventory: inventory.length,
  routes: routeRows.length,
  gaps: gapRows.length,
  duplicates: duplicateRows.length,
  thin: thinRows.length,
  orphan: orphanRows.length,
  geography: geographyRows.length,
}, null, 2));
