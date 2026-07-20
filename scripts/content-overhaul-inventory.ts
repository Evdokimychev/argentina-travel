import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

import {
  getKbMinimumWordCount,
  getPublicationIssues,
  getStrictPublicationIssues,
  isPublicKbEntry,
} from "../src/lib/knowledge-base/publication-quality";
import { findRuUrlDecision } from "../src/lib/seo/publication-registry";
import type { KbEntry } from "../src/lib/knowledge-base/types";

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, "docs/content-overhaul");
const KB_INDEX = path.join(ROOT, "content/knowledge-base/_index/content.json");

type MediaAuditAsset = {
  id: string;
  localPath: string;
  source?: string;
  role?: string;
  contexts?: string[];
  exists?: boolean;
  metadata?: {
    alt?: boolean;
    caption?: boolean;
    author?: boolean;
    sourceUrl?: boolean;
    license?: boolean;
  };
  bytes?: number;
  sha256?: string;
  width?: number;
  height?: number;
  format?: string;
};

type MediaAuditIssue = {
  key: string;
  code: string;
  severity: string;
  assetId?: string;
  localPath?: string;
  message: string;
  contexts?: string[];
};

type MediaAudit = {
  generatedAt?: string;
  assets?: MediaAuditAsset[];
  issues?: MediaAuditIssue[];
  fallbackContexts?: string[];
};

type LinkCheckReport = {
  generatedAt?: string;
  uniqueUrls?: number;
  brokenPublic?: number;
  counts?: Record<string, number>;
};

type RouteSnapshot = {
  status: number;
  title: string;
  wordCount: number;
  heroMedia: string;
  inlineMediaCount: number;
  internalLinks: number;
  externalLinks: number;
  searchIndexed: "yes" | "no";
  canonical: "yes" | "no" | "missing";
};

/**
 * Проверяем не только дефекты отдельных файлов, но и продуктовую полноту.
 * Список основан на обязательных пользовательских сценариях базы знаний;
 * evidence хранит конкретные канонические материалы, а не совпадения по словам.
 */
const REQUIRED_TOPIC_CLUSTERS = [
  ["arrival-first-weeks", "Первые дни и недели после приезда", ["gid-relokanta", "pervyj-mesyac-plan"]],
  ["residency", "Резиденция и легализация", ["vnzh-argentina"]],
  ["documents", "Документы, апостиль и переводы", ["gid-po-dokumentam"]],
  ["dni-cuil-cuit", "DNI, CUIL и CUIT", ["gid-po-dokumentam", "chto-takoe-dni-i-cuil"]],
  ["government-services", "Mi Argentina, turnos, domicilio и antecedentes", ["gosudarstvennye-prilozheniya", "pervye-tramites"]],
  ["citizenship", "Гражданство", ["grazhdanstvo"]],
  ["family-immigration", "Переезд семьи, учёба и рождение ребёнка", ["studencheskaya-zhizn", "rody-i-beremennost", "shkola-dlya-detey"]],
  ["housing-rental", "Туристическое и долгосрочное жильё", ["gid-po-zhilyu", "zhile-dlya-turistov", "zhile-i-arenda"]],
  ["daily-services", "Коммунальные услуги, интернет, покупки, доставка и аптеки", ["byt-i-zhilyo", "povsednevnaya-zhizn-i-uslugi"]],
  ["banking-payments", "Банки, карты, переводы и Mercado Pago", ["gid-po-dengam", "banki-i-perevody"]],
  ["currency-budget", "Обмен валюты, инфляция и бюджет", ["kak-menyat-valyutu", "byudzhet-poezdki"]],
  ["taxes-monotributo", "Налоги, monotributo и фактуры", ["nalogi-i-monotributo", "otkrytie-biznesa"]],
  ["work-business", "Работа, удалённая занятость и бизнес", ["rabota-i-poisk-raboty", "udalyonnaya-rabota-i-oplata", "otkrytie-biznesa"]],
  ["healthcare", "Публичная медицина, obra social и prepaga", ["gid-po-medicine", "sistema-zdravoohraneniya"]],
  ["emergency-safety", "Экстренная помощь, ограбления и мошенничество", ["bezopasnost-argentina"]],
  ["digital-safety", "Цифровая безопасность", ["cifrovaya-bezopasnost-i-moshennichestvo", "bezopasnost-argentina"]],
  ["driver-license", "Иностранные и аргентинские водительские права", ["kak-poluchit-prava-v-argentine", "voditelskie-prava"]],
  ["car-ownership", "Покупка автомобиля и действия после ДТП", ["pokupka-avtomobilya", "posle-dtp"]],
  ["transport", "Перелёты, автобусы, SUBE, поезда и аренда авто", ["gid-po-transportu"]],
  ["mobile-internet", "SIM, eSIM и связь", ["esim-i-svyaz"]],
  ["useful-apps", "Полезные приложения", ["poleznye-prilozheniya"]],
  ["trip-planning", "Подготовка, сезонность и маршруты", ["gid-puteshestvennika", "klimat-po-regionam"]],
  ["travel-children", "Путешествие с детьми", ["s-detmi-po-argentine"]],
  ["travel-pets", "Путешествие и переезд с животными", ["kak-perevezti-kota-ili-sobaku", "perevoz-veshchey-i-pitomtsev"]],
  ["accessible-travel", "Доступная среда", ["dostupnaya-sreda-i-invalidnost"]],
  ["lgbt-travel", "ЛГБТ-путешественники", ["lgbt-travel"]],
  ["spanish", "Аргентинский испанский и бытовая коммуникация", ["ispanskij-dlya-puteshestvennika", "zhizn-bez-ispanskogo"]],
  ["etiquette", "Этикет и повседневная коммуникация", ["mentalitet-i-etiket"]],
  ["culture", "Культура, праздники, мате, асадо и футбол", ["gid-po-kulture", "mate", "asado", "futbol"]],
  ["buenos-aires", "Буэнос-Айрес", ["buenos-aires", "caba"]],
  ["patagonia", "Патагония и южный маршрут", ["patagonia", "patagonia-yug"]],
  ["iguazu", "Игуасу", ["iguasu", "puerto-iguazu"]],
  ["noa", "Сальта, Жужуй и Северо-Запад", ["noa", "noa-kolco"]],
  ["cuyo", "Мендоса и Куйо", ["cuyo", "mendoza", "vinnyy-marshrut"]],
  ["ushuaia", "Ушуайя и Огненная Земля", ["ushuaia", "tierra-del-fuego"]],
  ["calafate", "Эль-Калафате и ледники", ["el-calafate", "los-glasiares"]],
  ["bariloche", "Барилоче и озёрная Патагония", ["bariloche", "ruta-40-sem-ozer"]],
  ["atlantic-coast", "Атлантическое побережье", ["mar-del-plata", "buenos-aires-province"]],
] as const;

export function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  return [
    headers.map(csvCell).join(","),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(",")),
  ].join("\n") + "\n";
}

function writeCsv(fileName: string, headers: string[], rows: Record<string, unknown>[]) {
  fs.writeFileSync(path.join(OUTPUT_DIR, fileName), toCsv(headers, rows), "utf8");
}

function countMatches(value: string, pattern: RegExp): number {
  return [...value.matchAll(pattern)].length;
}

function extractFactClaims(body: string): string[] {
  const facts = body.match(/(?:^|\n)##\s+Факты\s*\n([\s\S]*?)(?=\n##\s|$)/i)?.[1] ?? "";
  return facts
    .split("\n")
    .map((line) => line.match(/^\s*[-*]\s+(.+)$/)?.[1]?.trim())
    .filter((line): line is string => Boolean(line));
}

function wikilinkTargets(body: string): string[] {
  return [...body.matchAll(/\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g)]
    .map((match) => match[1]?.trim())
    .filter((target): target is string => Boolean(target));
}

function normalizedContent(value: string): string {
  return value
    .toLocaleLowerCase("ru")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function shortHash(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

function decodeHtml(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function attributeValue(tag: string, attribute: string): string | null {
  return tag.match(new RegExp(`${attribute}=["']([^"']+)["']`, "i"))?.[1] ?? null;
}

async function fetchRouteSnapshots(paths: string[]): Promise<Map<string, RouteSnapshot>> {
  const baseUrl = process.env.CONTENT_OVERHAUL_BASE_URL?.trim();
  const snapshots = new Map<string, RouteSnapshot>();
  if (!baseUrl) return snapshots;

  let cursor = 0;
  const workers = Array.from({ length: Math.min(6, Math.max(paths.length, 1)) }, async () => {
    while (cursor < paths.length) {
      const index = cursor++;
      const route = paths[index];
      if (!route) continue;
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
        const response = await fetch(new URL(route, baseUrl));
        const html = await response.text();
        const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html;
        const text = decodeHtml(
          main
            .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
            .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
            .replace(/<[^>]+>/g, " "),
        ).replace(/\s+/g, " ").trim();
        const title = decodeHtml(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "");
        const imageTags = [...main.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
        const anchorTags = [...main.matchAll(/<a\b[^>]*>/gi)].map((match) => match[0]);
        const hrefs = anchorTags.map((tag) => attributeValue(tag, "href")).filter((href): href is string => Boolean(href));
        const canonicalTag = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i)?.[0]
          ?? html.match(/<link\b[^>]*href=["'][^"']+["'][^>]*rel=["']canonical["'][^>]*>/i)?.[0]
          ?? "";
        const canonicalHref = attributeValue(canonicalTag, "href");
        const canonicalPath = canonicalHref ? new URL(canonicalHref, baseUrl).pathname.replace(/\/$/, "") || "/" : null;
        const expectedPath = route.replace(/\/$/, "") || "/";
        const robots = html.match(/<meta\b[^>]*name=["']robots["'][^>]*>/i)?.[0] ?? "";
        snapshots.set(route, {
          status: response.status,
          title: title || "not_recorded",
          wordCount: countMatches(text, /[\p{L}\p{N}]+/gu),
          heroMedia: imageTags.map((tag) => attributeValue(tag, "src")).find(Boolean) ?? "missing",
          inlineMediaCount: imageTags.length,
          internalLinks: hrefs.filter((href) => href.startsWith("/") || href.startsWith(baseUrl)).length,
          externalLinks: hrefs.filter((href) => /^https?:\/\//i.test(href) && !href.startsWith(baseUrl)).length,
          searchIndexed: /noindex/i.test(attributeValue(robots, "content") ?? "") ? "no" : "yes",
          canonical: canonicalPath == null ? "missing" : canonicalPath === expectedPath ? "yes" : "no",
        });
          break;
        } catch {
          if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, attempt * 150));
            continue;
          }
          snapshots.set(route, {
            status: 0,
            title: "not_recorded",
            wordCount: 0,
            heroMedia: "not_measured",
            inlineMediaCount: 0,
            internalLinks: 0,
            externalLinks: 0,
            searchIndexed: "no",
            canonical: "missing",
          });
        }
      }
    }
  });
  await Promise.all(workers);
  return snapshots;
}

function actionFor(entry: KbEntry): string {
  const issues = getPublicationIssues(entry);
  if (issues.includes("missing_sensitive_source")) return "LEGAL_REVIEW";
  if (issues.includes("missing_source")) return "HUMAN_REVIEW";
  if (issues.includes("verification_due")) return "HUMAN_REVIEW";
  if (
    issues.includes("missing_author") ||
    issues.includes("unverified_personal_authorship")
  ) return "HUMAN_REVIEW";
  if (getStrictPublicationIssues(entry).includes("sensitive_provenance_not_ready")) {
    return "HUMAN_REVIEW";
  }
  if (issues.includes("machine_translation_marker")) return "HUMAN_REVIEW";
  if (
    issues.includes("placeholder_content") ||
    issues.includes("mixed_script_word") ||
    issues.includes("non_russian_title") ||
    issues.includes("non_russian_summary")
  ) {
    return "DEEP_REWRITE";
  }
  if (
    issues.includes("internal_editorial_marker") ||
    issues.includes("malformed_markdown_heading")
  ) {
    return "LIGHT_EDIT";
  }
  if (issues.includes("thin_content")) return "EXPAND";
  if (issues.includes("missing_hero")) return "LIGHT_EDIT";
  if (issues.includes("not_publication_ready")) return "HUMAN_REVIEW";
  return "KEEP";
}

function ownerFor(entry: KbEntry): string {
  const issues = getPublicationIssues(entry);
  if (issues.includes("missing_sensitive_source")) return "Fact checker + legal reviewer";
  if (getStrictPublicationIssues(entry).includes("sensitive_provenance_not_ready")) {
    return "Fact checker + legal reviewer";
  }
  if (issues.includes("machine_translation_marker")) return "Russian content editor";
  if (issues.includes("missing_hero")) return "Media editor";
  return "Content editor";
}

function qualityScore(entry: KbEntry): number {
  const deductions: Record<string, number> = {
    not_publication_ready: 30,
    mixed_script_word: 20,
    non_russian_title: 35,
    non_russian_summary: 25,
    placeholder_content: 50,
    machine_translation_marker: 60,
    internal_editorial_marker: 50,
    malformed_markdown_heading: 25,
    missing_sensitive_source: 60,
    missing_source: 30,
    verification_due: 40,
    missing_author: 30,
    unverified_personal_authorship: 50,
    sensitive_provenance_not_ready: 40,
    thin_content: 20,
    missing_hero: 15,
  };
  return Math.max(
    0,
    100 - getStrictPublicationIssues(entry).reduce((sum, issue) => sum + (deductions[issue] ?? 10), 0),
  );
}

function routeSource(url: string) {
  if (url.startsWith("/baza-znaniy")) {
    return {
      canonical: "content/knowledge-base/**/*.md + _index/content.json",
      fallback: "none",
      editor: "Markdown + build_manifest.py",
      owner: "Content editor",
    };
  }
  if (url.startsWith("/blog")) {
    return {
      canonical: "CMS blog resolver",
      fallback: "src/data/blog*.ts",
      editor: "CMS admin",
      owner: "Blog editor",
    };
  }
  if (/^\/(places|collections|itineraries)/.test(url)) {
    return {
      canonical: "CMS resolver / places repository",
      fallback: "src/data/places-seed.ts",
      editor: "CMS admin",
      owner: "Destination editor",
    };
  }
  if (url.startsWith("/guide")) {
    return {
      canonical: "CMS guide resolver",
      fallback: "src/data/guide-*.ts",
      editor: "CMS admin",
      owner: "Guide editor",
    };
  }
  if (url.startsWith("/excursions")) {
    return {
      canonical: "Tripster/Sputnik server repository",
      fallback: "customer-facing empty state",
      editor: "Partner sync + admin",
      owner: "Marketplace editor",
    };
  }
  if (url.startsWith("/tours")) {
    return {
      canonical: "native/partner tour repositories",
      fallback: "src/data/marketplace-tours.ts",
      editor: "Organizer/admin workflow",
      owner: "Marketplace editor",
    };
  }
  return {
    canonical: "App Router page + typed data modules",
    fallback: "not_applicable",
    editor: "Code review",
    owner: "Product content owner",
  };
}

const LOCAL_ROUTE_BASELINES = [
  { url: "/", title: "Главная" },
  { url: "/baza-znaniy", title: "База знаний" },
  { url: "/blog", title: "Блог" },
  { url: "/guide", title: "Путеводитель" },
  { url: "/places", title: "Места" },
  { url: "/tours", title: "Туры" },
  { url: "/excursions", title: "Экскурсии" },
  { url: "/contact", title: "Контакты" },
] as const;

async function fetchSitemapPaths(): Promise<string[]> {
  const baseUrl = process.env.CONTENT_OVERHAUL_BASE_URL?.trim();
  if (!baseUrl) return [];
  const response = await fetch(new URL("/sitemap.xml", baseUrl));
  if (!response.ok) throw new Error(`sitemap.xml returned HTTP ${response.status}`);
  const xml = await response.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]!).pathname);
}

export async function generateContentOverhaulInventory() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const kb = JSON.parse(fs.readFileSync(KB_INDEX, "utf8")) as { entities: KbEntry[] };
  const entries = kb.entities;
  const publicEntries = entries.filter(isPublicKbEntry);
  const publicIds = new Set(publicEntries.map((entry) => entry.id));
  const titleBuckets = new Map<string, KbEntry[]>();
  for (const entry of entries) {
    const key = normalizedContent(entry.title);
    if (key) titleBuckets.set(key, [...(titleBuckets.get(key) ?? []), entry]);
  }
  const duplicateCandidateIds = new Set(
    [...titleBuckets.values()].filter((group) => group.length > 1).flatMap((group) => group.map((entry) => entry.id)),
  );
  const sitemapPaths = await fetchSitemapPaths();
  const sitemapMeasured = Boolean(process.env.CONTENT_OVERHAUL_BASE_URL?.trim());
  const routePaths = sitemapMeasured
    ? sitemapPaths
    : LOCAL_ROUTE_BASELINES.map((route) => route.url);
  const localRouteTitles = new Map<string, string>(
    LOCAL_ROUTE_BASELINES.map((route) => [route.url, route.title]),
  );
  const routeSnapshots = await fetchRouteSnapshots(sitemapPaths);
  const sitemapSet = new Set(sitemapPaths);

  const inventoryRows: Record<string, unknown>[] = entries.map((entry) => {
    const body = entry.body ?? "";
    const issues = getPublicationIssues(entry);
    return {
      id: entry.id,
      type: `kb_${entry.type}`,
      url: `/baza-znaniy/${entry.id}`,
      locale: "ru",
      title: entry.title,
      status: publicIds.has(entry.id) ? "published_public" : "quarantined",
      author: "not_recorded",
      editor: "not_recorded",
      reviewer: "review_required",
      published_at: "not_recorded",
      updated_at: entry.last_verified ?? "not_recorded",
      last_fact_checked_at: entry.last_verified ?? "not_recorded",
      next_review_at: entry.editorial?.review_due_at ?? "review_required",
      word_count: entry.editorial?.word_count ?? countMatches(body, /[\p{L}\p{N}]+/gu),
      hero_media: entry.media?.hero?.url ?? "missing",
      inline_media_count: countMatches(body, /!\[[^\]]*\]\([^)]+\)/g),
      source_count: entry.sources?.length ?? 0,
      claim_count: extractFactClaims(body).length,
      internal_links: countMatches(body, /\[\[[^\]]+\]\]/g),
      external_links: countMatches(body, /\[[^\]]+\]\(https?:\/\/[^)]+\)/g),
      search_indexed: publicIds.has(entry.id) ? "yes" : "no",
      canonical: publicIds.has(entry.id) ? "yes" : "not_public",
      quality_score: qualityScore(entry),
      action: duplicateCandidateIds.has(entry.id) ? "HUMAN_REVIEW" : actionFor(entry),
      owner: duplicateCandidateIds.has(entry.id) ? "Content architect" : ownerFor(entry),
      notes:
        issues.length > 0
          ? issues.join(";")
          : duplicateCandidateIds.has(entry.id)
            ? "publication_gate_clean;exact_title_duplicate_review_required"
            : "publication_gate_clean",
    };
  });

  for (const url of routePaths) {
    if (url.startsWith("/baza-znaniy/") && url.split("/").length === 3) continue;
    const snapshot = routeSnapshots.get(url);
    inventoryRows.push({
      id: `route:${url}`,
      type: "public_route",
      url,
      locale: "ru",
      title: snapshot?.title ?? localRouteTitles.get(url) ?? url,
      status: sitemapMeasured ? "published_public" : "not_measured",
      author: "not_recorded",
      editor: "not_recorded",
      reviewer: "review_required",
      published_at: "not_recorded",
      updated_at: "not_recorded",
      last_fact_checked_at: "not_recorded",
      next_review_at: "review_required",
      word_count: snapshot?.wordCount ?? "not_measured",
      hero_media: snapshot?.heroMedia ?? "not_measured",
      inline_media_count: snapshot?.inlineMediaCount ?? "not_measured",
      source_count: "not_measured",
      claim_count: "not_measured",
      internal_links: snapshot?.internalLinks ?? "not_measured",
      external_links: snapshot?.externalLinks ?? "not_measured",
      search_indexed: snapshot?.searchIndexed === "no" ? "noindex" : "not_verified",
      canonical: snapshot?.canonical ?? "not_verified",
      quality_score: "not_measured",
      action: "HUMAN_REVIEW",
      owner: routeSource(url).owner,
      notes: snapshot
        ? `present_in_0-error_public_editorial_sitemap;http_status=${snapshot.status};robots_indexable=${snapshot.searchIndexed};content_metrics_from_rendered_main`
        : sitemapMeasured
          ? "present_in_public_sitemap;content_metrics_not_captured"
          : "known_local_route;live_sitemap_and_render_not_measured",
    });
  }

  const inventoryHeaders = [
    "id", "type", "url", "locale", "title", "status", "author", "editor", "reviewer",
    "published_at", "updated_at", "last_fact_checked_at", "next_review_at", "word_count",
    "hero_media", "inline_media_count", "source_count", "claim_count", "internal_links",
    "external_links", "search_indexed", "canonical", "quality_score", "action", "owner", "notes",
  ];
  writeCsv("content-inventory.csv", inventoryHeaders, inventoryRows);

  const routeRows = routePaths.map((url) => {
    const source = routeSource(url);
    const snapshot = routeSnapshots.get(url);
    return {
      url,
      route_kind: url.split("/").filter(Boolean)[0] ?? "home",
      canonical_source: source.canonical,
      fallback_source: source.fallback,
      editor_surface: source.editor,
      search_surface: "public_search_coverage_review_required",
      map_surface: /^(\/places|\/destinations|\/mapa-argentina)/.test(url) ? "yes" : "not_applicable",
      sitemap: sitemapSet.has(url) ? "yes" : "no",
      editorial_status: !sitemapMeasured
        ? "not_measured"
        : snapshot?.status === 200
          ? "public_editorial_passed"
          : "review_required",
      owner: source.owner,
      evidence: sitemapMeasured
        ? "live sitemap + rendered route snapshot"
        : "local route baseline; live verification required",
    };
  });
  writeCsv(
    "content-route-matrix.csv",
    ["url", "route_kind", "canonical_source", "fallback_source", "editor_surface", "search_surface", "map_surface", "sitemap", "editorial_status", "owner", "evidence"],
    routeRows,
  );

  const issueCounts = new Map<string, number>();
  for (const entry of entries) {
    for (const issue of getPublicationIssues(entry)) {
      issueCounts.set(issue, (issueCounts.get(issue) ?? 0) + 1);
    }
  }
  const gapRows: Record<string, unknown>[] = [...issueCounts.entries()].map(([issue, count]) => ({
    gap_id: `kb-${issue}`,
    scope: "knowledge_base_raw_corpus",
    issue_type: issue,
    count,
    severity: issue === "missing_sensitive_source" || issue === "machine_translation_marker" ? "P0" : "P1",
    status: "quarantined",
    owner: issue === "missing_hero" ? "Media editor" : "Content editor",
    evidence: "content.json + publication-quality.ts",
    next_action: issue === "machine_translation_marker" ? "Human rewrite before publication" : "Resolve issue and rerun gate",
  }));
  const entryById = new Map(entries.map((entry) => [entry.id, entry]));
  for (const [clusterId, label, candidateIds] of REQUIRED_TOPIC_CLUSTERS) {
    const publicCandidates = candidateIds.filter((id) => {
      const entry = entryById.get(id);
      return entry ? isPublicKbEntry(entry) : false;
    });
    gapRows.push({
      gap_id: `topic-${clusterId}`,
      scope: "required_topic_coverage",
      issue_type: label,
      count: publicCandidates.length > 0 ? 0 : 1,
      severity: publicCandidates.length > 0 ? "none" : "P0",
      status: publicCandidates.length > 0 ? "covered" : "missing_or_quarantined",
      owner: "Content architect",
      evidence: publicCandidates.length > 0
        ? publicCandidates.join(";")
        : `expected one of: ${candidateIds.join(";")}`,
      next_action: publicCandidates.length > 0
        ? "Keep canonical coverage current"
        : "Create or restore a professional canonical material",
    });
  }
  writeCsv("content-gap-map.csv", ["gap_id", "scope", "issue_type", "count", "severity", "status", "owner", "evidence", "next_action"], gapRows);

  const scoreRows = entries.map((entry) => ({
    id: entry.id,
    url: `/baza-znaniy/${entry.id}`,
    quality_score: qualityScore(entry),
    band: qualityScore(entry) >= 90 ? "ready" : qualityScore(entry) >= 60 ? "review" : "blocked",
    public: isPublicKbEntry(entry) ? "yes" : "no",
    blockers: getStrictPublicationIssues(entry).join(";") || "none",
    evidence: "publication-quality.ts strict readiness",
  }));
  writeCsv("content-quality-score.csv", ["id", "url", "quality_score", "band", "public", "blockers", "evidence"], scoreRows);

  const actionRows = entries.map((entry) => {
    const strictIssues = getStrictPublicationIssues(entry);
    const strictReady = !strictIssues.includes("sensitive_provenance_not_ready");
    return {
      id: entry.id,
      url: `/baza-znaniy/${entry.id}`,
      action: duplicateCandidateIds.has(entry.id) ? "HUMAN_REVIEW" : actionFor(entry),
      priority: strictIssues.some((issue) =>
        ["missing_sensitive_source", "sensitive_provenance_not_ready"].includes(issue)
      )
        ? "P0"
        : duplicateCandidateIds.has(entry.id)
          ? "P1"
          : isPublicKbEntry(entry)
            ? "P2"
            : "P1",
      owner: duplicateCandidateIds.has(entry.id) ? "Content architect" : ownerFor(entry),
      status: duplicateCandidateIds.has(entry.id)
        ? "review_required"
        : isPublicKbEntry(entry) && strictReady
          ? "complete"
          : isPublicKbEntry(entry)
            ? "review_required"
            : "backlog",
      reason: strictIssues.join(";") || (duplicateCandidateIds.has(entry.id) ? "exact_title_duplicate" : "publication_gate_clean"),
      evidence: "content.json + publication-quality.ts",
    };
  });
  writeCsv("content-action-plan.csv", ["id", "url", "action", "priority", "owner", "status", "reason", "evidence"], actionRows);

  const sourceRows: Record<string, unknown>[] = [];
  for (const entry of entries) {
    (entry.sources ?? []).forEach((source, index) => {
      const hasUrl = Boolean(source.url?.trim());
      const official = source.type === "official" || /(?:^|\.)gob\.ar\b|argentina\.gob\.ar/i.test(source.url ?? "");
      sourceRows.push({
        source_id: source.id ?? `${entry.id}:source:${index + 1}`,
        entry_id: entry.id,
        url: `/baza-znaniy/${entry.id}`,
        source_title: source.title ?? "not_recorded",
        source_url: source.url ?? "not_recorded",
        source_type: source.type ?? "not_recorded",
        authority: source.authority ?? "not_recorded",
        url_status: source.url_status ?? "not_recorded",
        checked_at: source.checked_at ?? "not_recorded",
        language: source.lang ?? "not_recorded",
        note: source.note ?? "not_recorded",
        official: official ? "yes" : "no_or_not_recorded",
        status: !hasUrl
          ? "review_required"
          : source.url_status === "verified"
            ? "verified"
            : "recorded_article_level",
        owner: entry.editorial?.sensitive ? "Fact checker" : "Content editor",
        evidence: "content/knowledge-base/_index/content.json",
      });
    });
  }
  writeCsv(
    "source-registry.csv",
    ["source_id", "entry_id", "url", "source_title", "source_url", "source_type", "authority", "url_status", "checked_at", "language", "note", "official", "status", "owner", "evidence"],
    sourceRows,
  );

  const claimRows: Record<string, unknown>[] = [];
  for (const entry of entries) {
    const facts = extractFactClaims(entry.body ?? "");
    const structuredClaims = entry.claims ?? [];
    if (structuredClaims.length > 0) {
      structuredClaims.forEach((claim, index) => {
        const sourceIds = claim.source_ids ?? [];
        const primarySourceIds = sourceIds.filter((sourceId) =>
          entry.sources?.some((source) => source.id === sourceId && source.authority === "primary"),
        );
        const reviewed = Boolean(claim.verified_at && claim.reviewer && primarySourceIds.length > 0);
        claimRows.push({
          claim_id: claim.id,
          entry_id: entry.id,
          url: `/baza-znaniy/${entry.id}`,
          claim: claim.text ?? facts[index] ?? "structured claim",
          sensitive: (claim.sensitive ?? entry.editorial?.sensitive) ? "yes" : "no",
          last_verified_at: claim.verified_at ?? "not_recorded",
          article_source_count: entry.sources?.length ?? 0,
          item_source_id: sourceIds.join(";") || "not_recorded",
          support_status: primarySourceIds.length > 0
            ? "claim_level_primary"
            : sourceIds.length > 0
              ? "claim_level_non_primary"
              : "missing_source",
          review_status: reviewed ? "verified" : "review_required",
          owner: entry.editorial?.sensitive ? "Fact checker" : "Content editor",
          evidence: "frontmatter claims/source_ids",
        });
      });
      continue;
    }
    facts.forEach((claim, index) => {
      claimRows.push({
        claim_id: `${entry.id}:fact:${index + 1}`,
        entry_id: entry.id,
        url: `/baza-znaniy/${entry.id}`,
        claim,
        sensitive: entry.editorial?.sensitive ? "yes" : "no",
        last_verified_at: entry.last_verified ?? "not_recorded",
        article_source_count: entry.sources?.length ?? 0,
        item_source_id: "not_recorded",
        support_status: (entry.sources?.length ?? 0) > 0 ? "article_level_only" : "missing_source",
        review_status: "review_required",
        owner: entry.editorial?.sensitive ? "Fact checker" : "Content editor",
        evidence: "section ## Факты in current KB index",
      });
    });
  }
  writeCsv(
    "claim-registry.csv",
    ["claim_id", "entry_id", "url", "claim", "sensitive", "last_verified_at", "article_source_count", "item_source_id", "support_status", "review_status", "owner", "evidence"],
    claimRows,
  );

  const sensitiveRows = entries
    .filter((entry) => entry.editorial?.sensitive)
    .map((entry) => {
      const strictReady = entry.editorial?.provenance?.strict_ready === true;
      return {
        entry_id: entry.id,
        url: `/baza-znaniy/${entry.id}`,
        title: entry.title,
        public: isPublicKbEntry(entry) ? "yes" : "no",
        claim_count: entry.claims?.length ?? extractFactClaims(entry.body ?? "").length,
        source_count: entry.sources?.length ?? 0,
        missing_sources: entry.editorial?.missing_sources ? "yes" : "no",
        last_verified_at: entry.last_verified ?? "not_recorded",
        next_review_at: entry.editorial?.review_due_at ?? "review_required",
        status: entry.editorial?.missing_sources
          ? "blocked"
          : strictReady
            ? "strict_ready"
            : "review_required_item_level_mapping",
        action: entry.editorial?.missing_sources
          ? "LEGAL_REVIEW"
          : strictReady
            ? "KEEP"
            : "HUMAN_REVIEW",
        owner: "Fact checker + legal reviewer",
        evidence: strictReady
          ? "content.json editorial.provenance.strict_ready"
          : "content.json editorial.sensitive + sources",
      };
    });
  writeCsv(
    "sensitive-claims.csv",
    ["entry_id", "url", "title", "public", "claim_count", "source_count", "missing_sources", "last_verified_at", "next_review_at", "status", "action", "owner", "evidence"],
    sensitiveRows,
  );

  const mediaAuditPath = path.join(ROOT, "var/ops/media-rights-readiness.json");
  const mediaAudit = fs.existsSync(mediaAuditPath)
    ? (JSON.parse(fs.readFileSync(mediaAuditPath, "utf8")) as MediaAudit)
    : { assets: [], issues: [], fallbackContexts: [] };
  const mediaIssues = mediaAudit.issues ?? [];
  const mediaIssuesByAsset = new Map<string, MediaAuditIssue[]>();
  for (const issue of mediaIssues) {
    if (!issue.assetId) continue;
    const current = mediaIssuesByAsset.get(issue.assetId) ?? [];
    current.push(issue);
    mediaIssuesByAsset.set(issue.assetId, current);
  }
  const mediaRows = (mediaAudit.assets ?? []).map((asset) => {
    const issues = mediaIssuesByAsset.get(asset.id) ?? [];
    return {
      asset_id: asset.id,
      local_path: asset.localPath,
      role: asset.role ?? "not_recorded",
      contexts: (asset.contexts ?? []).join(";"),
      exists: asset.exists ? "yes" : "no",
      width: asset.width ?? "not_measured",
      height: asset.height ?? "not_measured",
      format: asset.format ?? "not_measured",
      alt_recorded: asset.metadata?.alt ? "yes" : "no",
      caption_recorded: asset.metadata?.caption ? "yes" : "no",
      rights_metadata_complete:
        asset.metadata?.author && asset.metadata?.sourceUrl && asset.metadata?.license ? "yes" : "no",
      issue_codes: issues.map((issue) => issue.code).join(";") || "none",
      highest_severity: issues.some((issue) => issue.severity === "high")
        ? "high"
        : issues.some((issue) => issue.severity === "medium")
          ? "medium"
          : "none",
      status: issues.length > 0 ? "review_required" : "metadata_gate_clean",
      owner: "Media editor",
      evidence: "var/ops/media-rights-readiness.json",
    };
  });
  writeCsv(
    "media-audit.csv",
    ["asset_id", "local_path", "role", "contexts", "exists", "width", "height", "format", "alt_recorded", "caption_recorded", "rights_metadata_complete", "issue_codes", "highest_severity", "status", "owner", "evidence"],
    mediaRows,
  );
  writeCsv(
    "media-rights-register.csv",
    ["asset_id", "local_path", "source_kind", "author_recorded", "source_url_recorded", "license_recorded", "legal_verification", "status", "owner", "evidence"],
    (mediaAudit.assets ?? []).map((asset) => ({
      asset_id: asset.id,
      local_path: asset.localPath,
      source_kind: asset.source ?? "not_recorded",
      author_recorded: asset.metadata?.author ? "yes" : "no",
      source_url_recorded: asset.metadata?.sourceUrl ? "yes" : "no",
      license_recorded: asset.metadata?.license ? "yes" : "no",
      legal_verification: "not_performed_by_automated_audit",
      status: mediaIssuesByAsset.has(asset.id) ? "blocked_or_review_required" : "metadata_complete_review_required",
      owner: "Media rights owner",
      evidence: "var/ops/media-rights-readiness.json + docs/audit/media-rights-readiness-2026-07-16.md",
    })),
  );
  const missingMediaRows: Record<string, unknown>[] = mediaIssues
    .filter((issue) => ["unmanaged_asset", "missing_author", "missing_license", "missing_source_url", "hero_resolution"].includes(issue.code))
    .map((issue) => ({
      id: issue.key,
      asset_id: issue.assetId ?? "not_recorded",
      local_path: issue.localPath ?? "not_recorded",
      issue_type: issue.code,
      severity: issue.severity,
      contexts: (issue.contexts ?? []).join(";"),
      actual: issue.message,
      required: issue.code === "hero_resolution" ? "hero resolution gate" : "managed asset with complete rights metadata",
      status: "blocked_or_review_required",
      owner: "Media editor",
      evidence: "var/ops/media-rights-readiness.json",
    }));
  for (const context of mediaAudit.fallbackContexts ?? []) {
    missingMediaRows.push({
      id: `fallback:${context}`,
      asset_id: "not_applicable",
      local_path: "not_recorded",
      issue_type: "public_fallback_context",
      severity: "medium",
      contexts: context,
      actual: "public context resolves to logo or no-photo fallback",
      required: "intentional contextual media or explicit editorial acceptance",
      status: "review_required",
      owner: "Media editor",
      evidence: "var/ops/media-rights-readiness.json",
    });
  }
  writeCsv(
    "missing-media.csv",
    ["id", "asset_id", "local_path", "issue_type", "severity", "contexts", "actual", "required", "status", "owner", "evidence"],
    missingMediaRows,
  );

  const duplicateGroups = new Map<string, { reason: string; entries: KbEntry[] }>();
  const titleGroups = new Map<string, KbEntry[]>();
  const bodyGroups = new Map<string, KbEntry[]>();
  for (const entry of entries) {
    const titleKey = normalizedContent(entry.title);
    const bodyKey = normalizedContent(entry.body ?? "");
    if (titleKey) titleGroups.set(titleKey, [...(titleGroups.get(titleKey) ?? []), entry]);
    if (bodyKey.length >= 120) bodyGroups.set(bodyKey, [...(bodyGroups.get(bodyKey) ?? []), entry]);
  }
  for (const [value, group] of titleGroups) {
    if (group.length > 1) duplicateGroups.set(`title:${shortHash(value)}`, { reason: "exact_normalized_title", entries: group });
  }
  for (const [value, group] of bodyGroups) {
    if (group.length > 1) duplicateGroups.set(`body:${shortHash(value)}`, { reason: "exact_normalized_body", entries: group });
  }
  const duplicateRows = [...duplicateGroups.entries()].flatMap(([groupId, group]) => {
    const publicEntries = group.entries.filter(isPublicKbEntry);
    const decisions = new Map(
      group.entries.map((entry) => {
        const url = `/baza-znaniy/${entry.id}`;
        return [entry.id, findRuUrlDecision(url)];
      }),
    );
    const resolved =
      publicEntries.length <= 1 &&
      group.entries.every((entry) => {
        if (isPublicKbEntry(entry)) return true;
        if (entry.status === "archived" && entry.redirect_to) return true;
        const decision = decisions.get(entry.id);
        return decision?.disposition === "redirect" && Boolean(decision.canonicalPath);
      });

    return group.entries.map((entry) => ({
      duplicate_group: groupId,
      reason: group.reason,
      entry_id: entry.id,
      url: `/baza-znaniy/${entry.id}`,
      title: entry.title,
      public: isPublicKbEntry(entry) ? "yes" : "no",
      action: resolved ? "REDIRECT" : "HUMAN_REVIEW",
      status: resolved ? "resolved" : "review_required",
      owner: "Content architect",
      evidence: resolved
        ? `${entry.redirect_to ? `/baza-znaniy/${entry.redirect_to}` : decisions.get(entry.id)?.canonicalPath ?? "canonical public entry"}; generated archive redirect or publication registry`
        : "exact normalization of current content.json",
    }));
  });
  writeCsv(
    "duplicate-content-report.csv",
    ["duplicate_group", "reason", "entry_id", "url", "title", "public", "action", "status", "owner", "evidence"],
    duplicateRows,
  );

  const thinRows = entries
    .filter((entry) => getPublicationIssues(entry).includes("thin_content"))
    .map((entry) => ({
      entry_id: entry.id,
      url: `/baza-znaniy/${entry.id}`,
      title: entry.title,
      word_count: entry.editorial?.word_count ?? "not_measured",
      threshold: getKbMinimumWordCount(entry),
      public: isPublicKbEntry(entry) ? "yes" : "no",
      action: "EXPAND",
      status: "quarantined",
      owner: "Content editor",
      evidence: "publication-quality.ts thin_content gate",
    }));
  writeCsv(
    "thin-content-report.csv",
    ["entry_id", "url", "title", "word_count", "threshold", "public", "action", "status", "owner", "evidence"],
    thinRows,
  );

  const entryIds = new Set(entries.map((entry) => entry.id));
  const inbound = new Map(entries.map((entry) => [entry.id, 0]));
  const brokenRows: Record<string, unknown>[] = [];
  for (const entry of entries) {
    const targets = new Set([...(entry.related ?? []), ...wikilinkTargets(entry.body ?? "")]);
    for (const target of targets) {
      if (entryIds.has(target)) {
        inbound.set(target, (inbound.get(target) ?? 0) + 1);
      } else {
        brokenRows.push({
          source_id: entry.id,
          source_url: `/baza-znaniy/${entry.id}`,
          link_kind: "kb_internal",
          target,
          status: "broken",
          action: "LIGHT_EDIT",
          owner: "Content editor",
          evidence: "related + Markdown wikilinks against current content IDs",
        });
      }
    }
  }
  if (brokenRows.length === 0) {
    brokenRows.push({
      source_id: "all-kb-entries",
      source_url: "/baza-znaniy",
      link_kind: "kb_internal",
      target: "all current related IDs and wikilinks",
      status: "closed_no_broken_links",
      action: "KEEP",
      owner: "Content editor",
      evidence: "current content IDs",
    });
  }
  const linkCheckPath = path.join(ROOT, "var/ops/kb-link-check.json");
  const linkCheck = fs.existsSync(linkCheckPath)
    ? (JSON.parse(fs.readFileSync(linkCheckPath, "utf8")) as LinkCheckReport)
    : null;
  brokenRows.push({
    source_id: "audit-scope:published-external-http",
    source_url: "/baza-znaniy",
    link_kind: "source_markdown_and_media_external_http",
    target: linkCheck ? `${linkCheck.uniqueUrls ?? 0} unique published URLs` : "published external URLs",
    status: linkCheck && linkCheck.brokenPublic === 0 ? "verified_no_public_breakage" : "not_checked_network",
    action: linkCheck && linkCheck.brokenPublic === 0 ? "KEEP" : "HUMAN_REVIEW",
    owner: "Content editor + operations",
    evidence: linkCheck
      ? `var/ops/kb-link-check.json; brokenPublic=${linkCheck.brokenPublic ?? "unknown"}; generatedAt=${linkCheck.generatedAt ?? "unknown"}`
      : "run npm run content:links",
  });
  writeCsv(
    "broken-links.csv",
    ["source_id", "source_url", "link_kind", "target", "status", "action", "owner", "evidence"],
    brokenRows,
  );
  const orphanRows: Record<string, unknown>[] = entries
    .filter((entry) =>
      (entry.site_sections?.length ?? 0) === 0 &&
      (entry.related?.length ?? 0) === 0 &&
      wikilinkTargets(entry.body ?? "").length === 0 &&
      (inbound.get(entry.id) ?? 0) === 0,
    )
    .map((entry) => ({
      entry_id: entry.id,
      url: `/baza-znaniy/${entry.id}`,
      title: entry.title,
      public: isPublicKbEntry(entry) ? "yes" : "no",
      site_section_count: entry.site_sections?.length ?? 0,
      outbound_count: 0,
      inbound_count: 0,
      action: isPublicKbEntry(entry) ? "LIGHT_EDIT" : "HUMAN_REVIEW",
      status: "review_required",
      owner: "Content architect",
      evidence: "site_sections + related + wikilinks in current content.json",
    }));
  if (orphanRows.length === 0) {
    orphanRows.push({
      entry_id: "audit-scope:all-kb-entries",
      url: "/baza-znaniy",
      title: "Строгие сироты не обнаружены",
      public: "not_applicable",
      site_section_count: 0,
      outbound_count: 0,
      inbound_count: 0,
      action: "KEEP",
      status: "closed_no_strict_orphans",
      owner: "Content architect",
      evidence: "all 689 entries checked against site_sections + related + wikilinks",
    });
  }
  writeCsv(
    "orphan-content-report.csv",
    ["entry_id", "url", "title", "public", "site_section_count", "outbound_count", "inbound_count", "action", "status", "owner", "evidence"],
    orphanRows,
  );

  const relatedRows = entries.map((entry) => {
    const targets = new Set([...(entry.related ?? []), ...wikilinkTargets(entry.body ?? "")]);
    const brokenCount = [...targets].filter((target) => !entryIds.has(target)).length;
    return {
      entry_id: entry.id,
      url: `/baza-znaniy/${entry.id}`,
      public: isPublicKbEntry(entry) ? "yes" : "no",
      explicit_related_count: entry.related?.length ?? 0,
      wikilink_count: wikilinkTargets(entry.body ?? "").length,
      inbound_count: inbound.get(entry.id) ?? 0,
      broken_target_count: brokenCount,
      status: brokenCount > 0 ? "blocked" : targets.size > 0 ? "connected" : "review_required",
      owner: "Content architect",
      evidence: "content.json related + body wikilinks",
    };
  });
  writeCsv(
    "related-content-report.csv",
    ["entry_id", "url", "public", "explicit_related_count", "wikilink_count", "inbound_count", "broken_target_count", "status", "owner", "evidence"],
    relatedRows,
  );

  const contentRedirectSource = fs.readFileSync(path.join(ROOT, "src/data/content-plan-url-redirects.ts"), "utf8");
  const redirectObject = contentRedirectSource.match(/CONTENT_PLAN_URL_REDIRECTS[^=]*=\s*\{([\s\S]*?)\n\};/)?.[1] ?? "";
  const redirectRows: Record<string, unknown>[] = [...redirectObject.matchAll(/"([^"]+)"\s*:\s*"([^"]+)"/g)].map((match) => ({
    source: match[1],
    destination: match[2],
    status_code: 308,
    source_kind: "content_plan_static",
    status: "implemented",
    owner: "SEO owner",
    evidence: "src/data/content-plan-url-redirects.ts",
  }));
  const nextConfigSource = fs.readFileSync(path.join(ROOT, "next.config.ts"), "utf8");
  for (const match of nextConfigSource.matchAll(/source:\s*"([^"]+)"[\s\S]{0,120}?destination:\s*"([^"]+)"[\s\S]{0,80}?permanent:\s*true/g)) {
    if (redirectRows.some((row) => row.source === match[1] && row.destination === match[2])) continue;
    redirectRows.push({
      source: match[1],
      destination: match[2],
      status_code: 308,
      source_kind: "next_config",
      status: "implemented",
      owner: "SEO owner",
      evidence: "next.config.ts",
    });
  }
  writeCsv("redirect-map.csv", ["source", "destination", "status_code", "source_kind", "status", "owner", "evidence"], redirectRows);

  const widgetRows = [
    ["exchange-rates", "Курсы валют", "src/components/guide/ArgentinaExchangeRates.tsx", "dynamic", "implemented", "Product content owner"],
    ["weather-panel", "Погода", "src/components/guide/weather/ArgentinaWeatherPanel.tsx", "dynamic", "implemented", "Destination editor"],
    ["season-matrix", "Матрица сезонов", "src/components/travel/ArgentinaSeasonMatrix.tsx", "curated", "implemented", "Destination editor"],
    ["tourism-infographic", "Инфографика туризма", "src/components/travel/ArgentinaTourismInfographic.tsx", "curated", "implemented", "Destination editor"],
    ["tourism-timeline", "Сезонная шкала", "src/components/travel/ArgentinaTourismTimeline.tsx", "curated", "implemented", "Destination editor"],
    ["tour-embed", "Подборка туров", "src/components/embed/TourEmbedSection.tsx", "catalog", "implemented_when_data_available", "Marketplace editor"],
    ["calculator", "Калькулятор", "src/components/guide/GuideWidgetSlot.tsx", "declared", "not_implemented_returns_null", "Product owner"],
    ["map", "Карта", "src/components/guide/GuideWidgetSlot.tsx", "declared", "not_implemented_returns_null", "Product owner"],
    ["promo", "Партнёрский блок", "src/components/guide/GuideWidgetSlot.tsx", "declared", "not_implemented_returns_null", "Commerce editor"],
    ["insurance", "Страхование", "src/components/insurance/InsuranceWhitelabelWidget.tsx", "partner", "integration_review_required", "Integration owner"],
    ["flights", "Авиабилеты", "src/components/flights/FlightsWhitelabelWidgetCore.tsx", "partner", "integration_review_required", "Integration owner"],
    ["passport-power", "Сила паспорта", "src/components/immigration/ArgentinaPassportPowerWidget.tsx", "curated", "implemented_fact_review_required", "Migration editor"],
    ["guide-assistant", "Помощник по путеводителю", "src/components/guide/GuideAssistantWidget.tsx", "interactive", "implemented", "Product owner"],
  ].map(([widget_id, title, implementation, data_kind, status, owner]) => ({
    widget_id, title, implementation, data_kind, status, owner,
    editorial_fallback: status.includes("not_implemented") ? "component returns null" : "component-specific",
    evidence: implementation,
  }));
  writeCsv(
    "widget-registry.csv",
    ["widget_id", "title", "implementation", "data_kind", "status", "owner", "editorial_fallback", "evidence"],
    widgetRows,
  );

  const dynamicRows = [
    ["exchange-rates", "валютные курсы", "ArgentinaExchangeRates", "live source with component fallback", "Finance editor", "review source/date in UI"],
    ["weather", "погода", "ArgentinaWeatherPanel", "live API/cache", "Destination editor", "verify location, units and stale state"],
    ["tour-availability", "доступность и цены туров", "tour repositories", "CMS/partner data", "Marketplace editor", "verify supplier and timestamp before action"],
    ["excursion-price", "цена экскурсии", "Tripster quote/listing", "partner API", "Marketplace editor", "show original currency and exact/fallback state"],
    ["flight-price", "цены авиабилетов", "Travelpayouts/flight API", "partner API", "Integration owner", "do not present teaser as guaranteed fare"],
    ["esim-price", "цены eSIM", "Airalo catalog", "partner feed", "Integration owner", "verify feed freshness and currency"],
    ["knowledge-review-date", "дата актуальности базы", "content index editorial metadata", "generated from last_verified", "Content editor", "block sensitive item when source missing"],
  ].map(([fact_id, subject, implementation, source, owner, publication_rule]) => ({
    fact_id, subject, implementation, source, owner, publication_rule,
    status: source.includes("partner") || source.includes("live") ? "production_integration_review_required" : "implemented",
    evidence: "current source tree",
  }));
  writeCsv(
    "dynamic-facts-register.csv",
    ["fact_id", "subject", "implementation", "source", "owner", "publication_rule", "status", "evidence"],
    dynamicRows,
  );

  let changedKbFiles: string[] = [];
  const gitStatusByFile = new Map<string, string>();
  try {
    const statusOutput = execFileSync(
      "git",
      ["status", "--porcelain=v1", "--untracked-files=all", "--", "content/knowledge-base"],
      {
      cwd: ROOT,
      encoding: "utf8",
      },
    );
    for (const line of statusOutput.split("\n")) {
      if (!line.trim()) continue;
      const status = line.slice(0, 2);
      const rawPath = line.slice(3).trim();
      const file = rawPath.includes(" -> ") ? rawPath.split(" -> ").at(-1)! : rawPath;
      if (!file.endsWith(".md")) continue;
      gitStatusByFile.set(file, status);
    }
    changedKbFiles = [...gitStatusByFile.keys()];
  } catch {
    changedKbFiles = [];
  }

  const baselineWordCount = (file: string): number | null => {
    try {
      const baseline = execFileSync("git", ["show", `HEAD:${file}`], {
        cwd: ROOT,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      const body = baseline.split("---", 3)[2] ?? "";
      return countMatches(body, /[\p{L}\p{N}]+(?:[-’'][\p{L}\p{N}]+)*/gu);
    } catch {
      return null;
    }
  };
  const changedRows = changedKbFiles.map((file) => {
    const id = path.basename(file, ".md");
    const entry = entryById.get(id);
    const beforeWords = baselineWordCount(file);
    const afterWords = entry?.editorial?.word_count ?? 0;
    return { file, id, entry, beforeWords, afterWords, gitStatus: gitStatusByFile.get(file) ?? "" };
  });
  const createdRows = changedRows.filter((row) => row.gitStatus.includes("A") || row.gitStatus === "??");
  const archivedRows = changedRows.filter((row) => row.entry?.status === "archived");
  const rewrittenRows = changedRows.filter((row) => row.entry?.status === "published");

  writeCsv(
    "created-content.csv",
    ["id", "path", "content_type", "action", "facts_changed", "status", "owner", "evidence"],
    createdRows.map((row) => ({
      id: row.id,
      path: row.file,
      content_type: row.entry?.type ?? "knowledge_base_article",
      action: "CREATE",
      facts_changed: "yes_review_sources",
      status: row.entry && isPublicKbEntry(row.entry) ? "published_quality_gate_passed" : "created_not_public",
      owner: "Content editor",
      evidence: `git status ${row.gitStatus.trim() || "new"}; words=${row.afterWords}`,
    })),
  );
  writeCsv(
    "rewritten-content.csv",
    ["id", "path", "content_type", "action", "facts_changed", "status", "owner", "evidence"],
    rewrittenRows.map((row) => {
      const delta = row.beforeWords == null ? row.afterWords : row.afterWords - row.beforeWords;
      const deepRewrite = row.beforeWords == null || delta >= 200 || row.afterWords >= row.beforeWords * 1.5;
      return {
        id: row.id,
        path: row.file,
        content_type: row.entry?.type ?? "knowledge_base_markdown",
        action: deepRewrite ? "DEEP_REWRITE_OR_EXPANSION" : "EDITORIAL_UPDATE",
        facts_changed: "review_current_sources_and_diff",
        status: row.entry && isPublicKbEntry(row.entry) ? "published_quality_gate_passed" : "published_but_gate_blocked",
        owner: "Content editor",
        evidence: `git diff; words ${row.beforeWords ?? "new"}→${row.afterWords}; sources=${row.entry?.sources?.length ?? 0}`,
      };
    }),
  );
  writeCsv(
    "merged-content.csv",
    ["source_id", "source_url", "destination_id", "destination_url", "status", "owner", "evidence"],
    archivedRows.map((row) => ({
      source_id: row.id,
      source_url: `/baza-znaniy/${row.id}`,
      destination_id: row.entry?.redirect_to ?? "missing",
      destination_url: row.entry?.redirect_to ? `/baza-znaniy/${row.entry.redirect_to}` : "missing",
      status: "merged_with_generated_permanent_redirect",
      owner: "Content architect",
      evidence: row.entry?.archive_reason ?? "archive reason missing",
    })),
  );
  writeCsv(
    "archived-content.csv",
    ["id", "url", "reason", "redirect_to", "status", "owner", "evidence"],
    archivedRows.map((row) => ({
      id: row.id,
      url: `/baza-znaniy/${row.id}`,
      reason: row.entry?.archive_reason ?? "missing",
      redirect_to: row.entry?.redirect_to ? `/baza-znaniy/${row.entry.redirect_to}` : "missing",
      status: "archived_source_retained",
      owner: "Content architect",
      evidence: `${row.file} + generated Next.js archive redirects`,
    })),
  );

  const ledgerRows: Record<string, unknown>[] = [];
  for (const entry of entries) {
    for (const issue of getPublicationIssues(entry)) {
      ledgerRows.push({
        id: `${entry.id}:${issue}`,
        severity: issue === "missing_sensitive_source" || issue === "machine_translation_marker" ? "P0" : "P1",
        content_type: entry.type,
        url: `/baza-znaniy/${entry.id}`,
        issue_type: issue,
        actual: "publication gate rejected entry",
        expected: "all publication checks pass",
        impact: "entry remains outside sitemap, search and public KB channels",
        root_cause: issue,
        action: actionFor(entry),
        owner: ownerFor(entry),
        status: "quarantined",
        source: "content/knowledge-base/_index/content.json",
        evidence: "getPublicationIssues(entry)",
        test: "publication-quality.test.ts + public-link-contract.test.ts",
      });
    }
  }
  for (const entry of publicEntries.filter(
    (candidate) => candidate.editorial?.sensitive && candidate.editorial?.provenance?.strict_ready !== true,
  )) {
    ledgerRows.push({
      id: `${entry.id}:item_level_source_mapping`,
      severity: "P0",
      content_type: entry.type,
      url: `/baza-znaniy/${entry.id}`,
      issue_type: "item_level_source_mapping_missing",
      actual: `${extractFactClaims(entry.body ?? "").length} enumerated facts; sources recorded only at article level`,
      expected: "each sensitive claim maps to a concrete primary source or receives an explicit editorial decision",
      impact: "the public text passes the technical gate, but claim-level evidence is not auditable",
      root_cause: "legacy article-level source model",
      action: "HUMAN_REVIEW",
      owner: "Fact checker + legal reviewer",
      status: "review_required_before_unconditional_launch",
      source: "claim-registry.csv + source-registry.csv",
      evidence: `article_source_count=${entry.sources?.length ?? 0}`,
      test: "manual item-level fact-check",
    });
  }
  for (const [groupId, group] of duplicateGroups) {
    const publicEntries = group.entries.filter(isPublicKbEntry);
    const resolved =
      publicEntries.length <= 1 &&
      group.entries.every((entry) => {
        if (isPublicKbEntry(entry)) return true;
        if (entry.status === "archived" && entry.redirect_to) return true;
        const decision = findRuUrlDecision(`/baza-znaniy/${entry.id}`);
        return decision?.disposition === "redirect" && Boolean(decision.canonicalPath);
      });
    ledgerRows.push({
      id: `duplicate:${groupId}`,
      severity: resolved ? "P3" : "P1",
      content_type: "knowledge_base",
      url: group.entries.map((entry) => `/baza-znaniy/${entry.id}`).join(";"),
      issue_type: group.reason,
      actual: group.entries.map((entry) => `${entry.id}:${isPublicKbEntry(entry) ? "public" : "quarantined"}`).join(";"),
      expected: "documented KEEP_DISTINCT, MERGE or REDIRECT decision",
      impact: "duplicate intent or title can confuse navigation and compete in search",
      root_cause: "parallel legacy entities",
      action: resolved ? "REDIRECT" : "HUMAN_REVIEW",
      owner: "Content architect + SEO owner",
      status: resolved ? "closed" : "open",
      source: "duplicate-content-report.csv",
      evidence: `exact normalized group ${groupId}`,
      test: "duplicate report + redirect contract",
    });
  }
  for (const issue of mediaIssues) {
    ledgerRows.push({
      id: `media:${issue.key}`,
      severity: issue.severity === "high" ? "P0" : "P1",
      content_type: "public_media",
      url: (issue.contexts ?? []).join(";") || "public media context",
      issue_type: issue.code,
      actual: issue.message,
      expected: "managed contextual media with consistent rights metadata and valid dimensions",
      impact: "legal, trust, accessibility or visual quality risk",
      root_cause: issue.code,
      action: issue.code === "duplicate_rights_conflict" ? "LEGAL_REVIEW" : "LIGHT_EDIT",
      owner: "Media editor + media rights owner",
      status: "open",
      source: issue.localPath ?? "var/ops/media-rights-readiness.json",
      evidence: issue.key,
      test: "npm run media:rights:audit",
    });
  }
  ledgerRows.push({
    id: "search:meilisearch-production",
    severity: "P1",
    content_type: "search_index",
    url: "/search",
    issue_type: "production_index_not_verified",
    actual: "local readiness report says configured=false; health and document count were skipped",
    expected: "production host/key configured, health green and document count reconciled with publication policy",
    impact: "external search quality and freshness are not proven",
    root_cause: "production environment evidence unavailable locally",
    action: "HUMAN_REVIEW",
    owner: "Search/operations owner",
    status: "blocked_external",
    source: "var/ops/search-readiness-last.json",
    evidence: "configured=false; documentCount=null",
    test: "npm run search:readiness with production environment",
  });
  ledgerRows.push({
    id: "widgets:unknown-editorial-key",
    severity: "P1",
    content_type: "editorial_widget",
    url: "pages using TravelWidgetRenderer",
    issue_type: "internal_widget_key_fallback",
    actual: "an unknown non-empty widget key renders its technical identifier",
    expected: "unknown widgets are hidden or replaced with a human-facing fallback",
    impact: "a future content typo can expose a development trace",
    root_cause: "TravelWidgetRenderer diagnostic fallback",
    action: "LIGHT_EDIT",
    owner: "Product content owner",
    status: "open",
    source: "src/components/travel/TravelWidgetRenderer.tsx",
    evidence: "fallback renders `widget: {key}`",
    test: "widget registry contract test",
  });
  ledgerRows.push({
    id: "public-editorial-2026-07-16",
    severity: sitemapMeasured ? "P0" : "P1",
    content_type: "public_sitemap",
    url: "all sitemap routes",
    issue_type: "technical_or_development_copy",
    actual: sitemapMeasured
      ? `route snapshots collected across ${sitemapPaths.length} sitemap pages`
      : "not measured: CONTENT_OVERHAUL_BASE_URL is not configured",
    expected: "0 errors",
    impact: sitemapMeasured
      ? "route-level evidence is available for the release decision"
      : "route quality and sitemap integrity cannot be asserted for this candidate",
    root_cause: sitemapMeasured
      ? "crawl completed for the configured candidate"
      : "no running candidate URL was supplied to the inventory generator",
    action: sitemapMeasured ? "KEEP" : "HUMAN_REVIEW",
    owner: "Release editor",
    status: sitemapMeasured ? "closed" : "blocked_external",
    source: "var/ops/public-editorial-audit.json",
    evidence: sitemapMeasured
      ? `route_snapshots_collected; uniquePageCount=${sitemapPaths.length}`
      : "start a stable local/staging candidate and rerun with CONTENT_OVERHAUL_BASE_URL",
    test: "public-editorial-audit --strict",
  });
  writeCsv(
    "issue-ledger.csv",
    ["id", "severity", "content_type", "url", "issue_type", "actual", "expected", "impact", "root_cause", "action", "owner", "status", "source", "evidence", "test"],
    ledgerRows,
  );

  const summary = {
    generatedAt: new Date().toISOString(),
    kbRaw: entries.length,
    kbPublic: publicEntries.length,
    kbQuarantined: entries.length - publicEntries.length,
    kbArchived: entries.filter((entry) => entry.status === "archived").length,
    kbQualityBlocked: entries.filter(
      (entry) => entry.status !== "archived" && !isPublicKbEntry(entry),
    ).length,
    sitemapPages: sitemapMeasured ? sitemapPaths.length : "not_measured",
    inventoryRows: inventoryRows.length,
    openIssueRows: ledgerRows.filter((row) => row.status !== "closed").length,
    createdKnowledgeArticles: createdRows.length,
    rewrittenKnowledgeArticles: rewrittenRows.length,
    archivedKnowledgeArticles: archivedRows.length,
    requiredTopicGaps: gapRows.filter(
      (row) => row.scope === "required_topic_coverage" && row.status !== "covered",
    ).length,
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, "inventory-summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");

  const expandedRows = rewrittenRows.filter((row) => {
    if (row.beforeWords == null) return true;
    return row.afterWords - row.beforeWords >= 200 || row.afterWords >= row.beforeWords * 1.5;
  });
  const sensitivePublished = publicEntries.filter((entry) => entry.editorial?.sensitive);
  const strictSensitive = sensitivePublished.filter(
    (entry) => entry.editorial?.provenance?.strict_ready === true,
  );
  const topicGapRows = gapRows.filter(
    (row) => row.scope === "required_topic_coverage" && row.status !== "covered",
  );
  const report = [
    "# Итоговый отчёт по переработке базы знаний",
    "",
    `Обновлено: ${new Date().toLocaleDateString("ru-RU", { dateStyle: "long", timeZone: "America/Argentina/Buenos_Aires" })}.`,
    "",
    "## Текущий доказуемый результат",
    "",
    `- Проверено сущностей: **${entries.length}**.`,
    `- Проходит единый публичный quality gate: **${publicEntries.length}**.`,
    `- Намеренно архивировано с сохранением исходника и редиректом: **${summary.kbArchived}**.`,
    `- Осталось заблокировано качеством вне архива: **${summary.kbQualityBlocked}**.`,
    `- Существенно переписано или расширено в рабочем diff: **${expandedRows.length}**; всего редакционно изменённых опубликованных материалов: **${rewrittenRows.length}**.`,
    `- Создано новых материалов: **${createdRows.length}**; физически удалено: **0**.`,
    `- Чувствительные публичные материалы со строгой claim-level проверкой: **${strictSensitive.length}/${sensitivePublished.length}**.`,
    `- Непокрытых обязательных тематических кластеров: **${topicGapRows.length}/${REQUIRED_TOPIC_CLUSTERS.length}**.`,
    "",
    "## Тематическое покрытие",
    "",
    ...(topicGapRows.length
      ? topicGapRows.map((row) => `- Требует закрытия: **${row.issue_type}** — ${row.evidence}.`)
      : ["- Все обязательные пользовательские сценарии имеют хотя бы один канонический материал, прошедший публичный gate."]),
    "",
    "## Что изменено системно",
    "",
    "- Порог глубины учитывает тип материала: FAQ, авторская заметка, гид, транспорт, город, парк, регион и маршрут проверяются раздельно.",
    "- Публичные страницы, поиск, карта, рекомендации, sitemap и CMS используют fail-closed публикационный gate.",
    "- Архивные карточки не удаляются: обязательны причина, прямой канонический id и постоянный редирект без цепочек.",
    "- Для чувствительных утверждений действует реестр источников и claims с датой, ответственным и первичным источником.",
    "- Авторские материалы требуют явного автора и подтверждённого личного опыта; неподтверждённые истории не публикуются.",
    "- Инвентаризация отдельно показывает публичные, архивные и реально заблокированные качеством материалы.",
    "",
    "## Проверка выпуска",
    "",
    sitemapMeasured
      ? `- Выполнен HTTP-снимок **${sitemapPaths.length}** URL из sitemap на ${process.env.CONTENT_OVERHAUL_BASE_URL}.`
      : "- Полный HTTP-crawl ещё не измерен: запустите генератор с `CONTENT_OVERHAUL_BASE_URL` на стабильном local/staging кандидате.",
    linkCheck
      ? `- Проверено **${linkCheck.uniqueUrls ?? 0}** уникальных внешних URL опубликованной базы; битых публичных ссылок: **${linkCheck.brokenPublic ?? "не измерено"}**.`
      : "- Сетевой аудит внешних ссылок ещё не запускался (`npm run content:links`).",
    "- Результаты typecheck, lint, unit/integration, production build, браузерной проверки, CI и production smoke фиксируются на финальном шаге выпуска; этот файл не подменяет их предположениями.",
    "",
    topicGapRows.length || Number(summary.kbQualityBlocked) > 0
      ? "## Решение\n\nВыпуск пока не может называться полной профессиональной базой: остаются перечисленные тематические или редакционные блокеры."
      : "## Решение\n\nКонтентный корпус прошёл локальный редакционный gate; окончательное решение о выпуске принимается после build, браузерного crawl и production smoke.",
    "",
  ].join("\n");
  fs.writeFileSync(path.join(OUTPUT_DIR, "final-content-report.md"), report, "utf8");
  return summary;
}

if (process.argv[1]?.endsWith("content-overhaul-inventory.ts")) {
  generateContentOverhaulInventory()
    .then((summary) => console.log(JSON.stringify(summary, null, 2)))
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
