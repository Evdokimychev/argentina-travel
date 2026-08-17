#!/usr/bin/env node
/**
 * Content source matrix (Sprint 3 Content OS).
 *
 * Inventories public content families from existing file/KB inventories —
 * does not invent URLs and does not create a parallel editorial engine.
 *
 * Writes:
 *   - var/ops/content-source-matrix-last.json
 *   - docs/audit/content-source-matrix.csv
 *
 *   npm run content:source-matrix
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const OUT_JSON = path.join(root, "var/ops/content-source-matrix-last.json");
const OUT_CSV = path.join(root, "docs/audit/content-source-matrix.csv");

/** Soft cap for KB entity rows (Tier-1 = published). Archived excluded by default. */
const KB_ENTITY_CAP = Number(process.env.CONTENT_SOURCE_MATRIX_KB_CAP || 400);

const CSV_HEADER = [
  "family",
  "path",
  "slug",
  "entityType",
  "currentSource",
  "overrides",
  "canonicalOwner",
  "indexable",
  "action",
  "notes",
];

function readText(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function readJson(rel) {
  return JSON.parse(readText(rel));
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

/** Extract `slug: "…"` / `slug: '…'` occurrences (order preserved, unique). */
function extractSlugFields(source) {
  const out = [];
  const seen = new Set();
  for (const match of source.matchAll(/\bslug:\s*["']([^"']+)["']/g)) {
    const slug = match[1];
    if (seen.has(slug)) continue;
    seen.add(slug);
    out.push(slug);
  }
  return out;
}

/** Extract string literals from `export const NAME = [ ... ]`. */
function extractStringArray(source, constName) {
  const re = new RegExp(
    `export\\s+const\\s+${constName}\\s*(?::[^=]+)?=\\s*\\[([\\s\\S]*?)\\]`,
  );
  const block = source.match(re);
  if (!block) return [];
  return [...block[1].matchAll(/["']([^"']+)["']/g)].map((m) => m[1]);
}

/**
 * Extract top-level keys of `const NAME = { key: { … }, … }`.
 * Only records keys at brace depth 1 (skips nested object fields).
 */
function extractTopLevelObjectKeys(source, constName) {
  const re = new RegExp(
    `(?:export\\s+)?const\\s+${constName}\\s*(?::[^=]+)?=\\s*\\{`,
  );
  const start = source.search(re);
  if (start < 0) return [];
  const braceStart = source.indexOf("{", start);
  const keys = [];
  const seen = new Set();
  let depth = 0;
  let i = braceStart;
  while (i < source.length) {
    const ch = source[i];
    if (ch === "{") {
      depth += 1;
      i += 1;
      continue;
    }
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) break;
      i += 1;
      continue;
    }
    if (depth === 1) {
      const slice = source.slice(i);
      const m = slice.match(/^(?:["']([^"']+)["']|([A-Za-z0-9_-]+))\s*:/);
      if (m) {
        const key = m[1] || m[2];
        if (key && !seen.has(key)) {
          seen.add(key);
          keys.push(key);
        }
        i += m[0].length;
        continue;
      }
    }
    i += 1;
  }
  return keys;
}

function extractEditorialOverrideSlugs() {
  const dir = path.join(root, "src/data/blog-editorial");
  if (!fs.existsSync(dir)) return new Set();
  const slugs = new Set();
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith(".ts") || name === "index.ts" || name === "types.ts" || name === "helpers.ts") {
      continue;
    }
    const text = fs.readFileSync(path.join(dir, name), "utf8");
    // Cluster files export Record<string, EditorialOverride> with slug keys.
    for (const match of text.matchAll(/^\s*["']([^"']+)["']\s*:/gm)) {
      const key = match[1];
      if (key.includes("/") || key.includes(" ")) continue;
      slugs.add(key);
    }
  }
  return slugs;
}

function extractLegacyManualOverrideSlugs(blogTs) {
  const names = [
    "legacyManualOfficialSources",
    "legacyManualExcerptOverrides",
    "legacyManualReplacementSections",
    "legacyManualSectionOverrides",
    "legacyManualRemovedSections",
  ];
  const slugs = new Set();
  for (const name of names) {
    for (const key of extractTopLevelObjectKeys(blogTs, name)) {
      slugs.add(key);
    }
  }
  return slugs;
}

/** Parse RU_URL_DECISIONS for indexability hints (noindex/redirect/withheld). */
function loadPublicationBlocks() {
  const source = readText("src/lib/seo/publication-registry.ts");
  const blocks = [];
  const decisionRe =
    /\{\s*path:\s*["']([^"']+)["']\s*,\s*match:\s*["'](exact|prefix)["']\s*,\s*disposition:\s*["'](noindex|redirect|withheld)["']/g;
  for (const match of source.matchAll(decisionRe)) {
    blocks.push({
      path: match[1],
      match: match[2],
      disposition: match[3],
    });
  }
  return blocks;
}

function guessIndexable(pathname, blocks, { forced } = {}) {
  if (forced === "yes" || forced === "no" || forced === "unknown") return forced;
  for (const block of blocks) {
    if (block.match === "exact" && pathname === block.path) return "no";
    if (block.match === "prefix" && (pathname === block.path || pathname.startsWith(`${block.path}/`))) {
      return "no";
    }
  }
  if (pathname.startsWith("/organizer") || pathname.startsWith("/account")) return "no";
  return "yes";
}

function csvEscape(value) {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function row(partial) {
  return {
    family: partial.family,
    path: partial.path,
    slug: partial.slug ?? "",
    entityType: partial.entityType,
    currentSource: partial.currentSource,
    overrides: partial.overrides ?? "no",
    canonicalOwner: partial.canonicalOwner,
    indexable: partial.indexable,
    action: partial.action ?? "KEEP",
    notes: partial.notes ?? "",
  };
}

function uniqueByPath(rows) {
  const seen = new Set();
  const out = [];
  for (const item of rows) {
    const key = `${item.family}|${item.path}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function collectHomepage(blocks) {
  return [
    row({
      family: "homepage",
      path: "/",
      slug: "",
      entityType: "homepage",
      currentSource: "hybrid",
      overrides: "no",
      canonicalOwner: "CMS landing / site globals (Layer B)",
      indexable: guessIndexable("/", blocks),
      notes: "Tier-1 hub; composition from App Router + site globals",
    }),
  ];
}

function collectDestinations(blocks) {
  const rows = [
    row({
      family: "destinations",
      path: "/destinations",
      slug: "",
      entityType: "destination_hub",
      currentSource: "file",
      canonicalOwner: "Product content owner / Destination editor",
      indexable: guessIndexable("/destinations", blocks),
      notes: "Tier-1 hub",
    }),
  ];
  const destinationPages = exists("src/data/destination-pages.ts")
    ? readText("src/data/destination-pages.ts")
    : "";
  let slugs = extractTopLevelObjectKeys(destinationPages, "DESTINATION_CONTENT");
  if (slugs.length === 0 && exists("src/data/filters.ts")) {
    const filters = readText("src/data/filters.ts");
    const base = filters.match(
      /POPULAR_DESTINATIONS_BASE\s*=\s*\[([\s\S]*?)\];/,
    )?.[1] ?? "";
    slugs = [...base.matchAll(/\bid:\s*["']([^"']+)["']/g)].map((m) => m[1]);
  }

  for (const slug of slugs) {
    const pathName = `/destinations/${slug}`;
    rows.push(
      row({
        family: "destinations",
        path: pathName,
        slug,
        entityType: "destination",
        currentSource: "hybrid",
        overrides: "no",
        canonicalOwner: "KB entity + destination file/CMS document",
        indexable: guessIndexable(pathName, blocks),
        notes: "from DESTINATION_CONTENT / POPULAR_DESTINATIONS",
      }),
    );
  }
  return rows;
}

function collectPlaces(blocks) {
  const rows = [
    row({
      family: "places",
      path: "/places",
      slug: "",
      entityType: "place_hub",
      currentSource: "hybrid",
      canonicalOwner: "Destination editor (places repository / seed)",
      indexable: guessIndexable("/places", blocks),
      notes: "Tier-1 hub",
    }),
  ];
  const seed = readText("src/data/places-seed.ts");
  const slugs = extractSlugFields(seed);
  for (const slug of slugs) {
    const pathName = `/places/${slug}`;
    rows.push(
      row({
        family: "places",
        path: pathName,
        slug,
        entityType: "place",
        currentSource: "hybrid",
        overrides: "no",
        canonicalOwner: "CMS place resolver with places-seed fallback",
        indexable: guessIndexable(pathName, blocks),
        notes: "from PLACES_SEED",
      }),
    );
  }
  return rows;
}

function collectKb(blocks) {
  const rows = [
    row({
      family: "kb",
      path: "/baza-znaniy",
      slug: "",
      entityType: "kb_hub",
      currentSource: "kb",
      canonicalOwner: "Content editor (Layer A knowledge-base)",
      indexable: guessIndexable("/baza-znaniy", blocks),
      notes: "Tier-1 hub",
    }),
  ];

  if (exists("src/lib/knowledge-base/content.ts")) {
    const contentTs = readText("src/lib/knowledge-base/content.ts");
    const sectionSlugs = extractSlugFields(contentTs).filter((s) =>
      [
        "puteshestviya",
        "goroda-i-regiony",
        "zhizn-v-strane",
        "pereezd",
        "dokumenty",
        "finansy",
        "lichnyy-opyt",
      ].includes(s),
    );
    // Prefer stable KB_SECTIONS block — extract slug fields near KB_SECTIONS
    const sectionBlock = contentTs.match(
      /export const KB_SECTIONS[\s\S]*?\];/,
    )?.[0] ?? "";
    const fromBlock = extractSlugFields(sectionBlock);
    const sections = fromBlock.length > 0 ? fromBlock : sectionSlugs;
    for (const slug of sections) {
      const pathName = `/baza-znaniy/razdel/${slug}`;
      rows.push(
        row({
          family: "kb",
          path: pathName,
          slug,
          entityType: "kb_section",
          currentSource: "kb",
          canonicalOwner: "Content editor (Layer A)",
          indexable: guessIndexable(pathName, blocks),
          notes: "from KB_SECTIONS",
        }),
      );
    }
  }

  const manifest = readJson("content/knowledge-base/_index/manifest.json");
  const entities = Array.isArray(manifest.entities) ? manifest.entities : [];
  const published = entities.filter((e) => e.status === "published");
  const archivedCount = entities.filter((e) => e.status === "archived").length;
  const capped = published.slice(0, KB_ENTITY_CAP);
  const truncated = published.length > capped.length;

  for (const entity of capped) {
    const slug = entity.id;
    const pathName = `/baza-znaniy/${slug}`;
    const indexable =
      entity.site_ready === false
        ? "no"
        : guessIndexable(pathName, blocks, {
            forced: entity.site_ready === true ? "yes" : undefined,
          });
    rows.push(
      row({
        family: "kb",
        path: pathName,
        slug,
        entityType: `kb_${entity.type || "entity"}`,
        currentSource: "kb",
        overrides: "no",
        canonicalOwner: "content/knowledge-base/** (Layer A)",
        indexable,
        notes: entity.site_ready === true ? "site_ready" : "published",
      }),
    );
  }

  return {
    rows,
    meta: {
      manifestTotal: manifest.total_entities ?? entities.length,
      published: published.length,
      archivedExcluded: archivedCount,
      included: capped.length,
      truncated,
      cap: KB_ENTITY_CAP,
    },
  };
}

function collectImmigration(blocks) {
  const rows = [
    row({
      family: "immigration",
      path: "/immigration",
      slug: "",
      entityType: "immigration_hub",
      currentSource: "file",
      canonicalOwner: "Product content owner",
      indexable: guessIndexable("/immigration", blocks),
      notes: "Tier-1 hub; publication-registry prefix noindex",
    }),
  ];

  const topicsTs = readText("src/data/immigration-topics.ts");
  const topicOrder = extractStringArray(topicsTs, "IMMIGRATION_TOPIC_ORDER");
  for (const slug of topicOrder) {
    const pathName = `/immigration/${slug}`;
    rows.push(
      row({
        family: "immigration",
        path: pathName,
        slug,
        entityType: "immigration_topic",
        currentSource: "file",
        canonicalOwner: "src/data/immigration-* (content pages)",
        indexable: guessIndexable(pathName, blocks),
        notes: "from IMMIGRATION_TOPIC_ORDER",
      }),
    );
  }

  if (exists("src/data/immigration-content.ts")) {
    const pages = extractSlugFields(readText("src/data/immigration-content.ts"));
    for (const slug of pages) {
      if (topicOrder.includes(slug)) continue;
      const pathName = `/immigration/${slug}`;
      rows.push(
        row({
          family: "immigration",
          path: pathName,
          slug,
          entityType: "immigration_page",
          currentSource: "file",
          canonicalOwner: "src/data/immigration-content.ts",
          indexable: guessIndexable(pathName, blocks),
          notes: "from IMMIGRATION_PAGES",
        }),
      );
    }
  }

  return rows;
}

function collectGuides(blocks) {
  const rows = [
    row({
      family: "guides",
      path: "/guide",
      slug: "",
      entityType: "guide_hub",
      currentSource: "hybrid",
      canonicalOwner: "Guide editor (CMS guide resolver + src/data)",
      indexable: guessIndexable("/guide", blocks),
      notes: "Tier-1 hub",
    }),
  ];

  if (exists("src/data/guide-about-argentina.ts") || exists("src/data/guide-paths.ts")) {
    rows.push(
      row({
        family: "guides",
        path: "/guide/ob-argentine",
        slug: "ob-argentine",
        entityType: "guide_pillar",
        currentSource: "file",
        canonicalOwner: "src/data/guide-about-argentina.ts",
        indexable: guessIndexable("/guide/ob-argentine", blocks),
        notes: "GUIDE_ABOUT_ARGENTINA_PATH",
      }),
    );
  }

  const topics = extractSlugFields(readText("src/data/guide-topics.ts"));
  for (const slug of topics) {
    const pathName = `/guide/${slug}`;
    rows.push(
      row({
        family: "guides",
        path: pathName,
        slug,
        entityType: "guide_topic",
        currentSource: "hybrid",
        canonicalOwner: "Guide editor / CMS guide resolver",
        indexable: guessIndexable(pathName, blocks),
        notes: "from GUIDE_TOPICS",
      }),
    );
  }

  if (exists("src/data/guide-content.ts")) {
    const pageSlugs = extractSlugFields(readText("src/data/guide-content.ts"));
    for (const slug of pageSlugs) {
      if (topics.includes(slug) || slug === "ob-argentine") continue;
      const pathName = `/guide/${slug}`;
      rows.push(
        row({
          family: "guides",
          path: pathName,
          slug,
          entityType: "guide_page",
          currentSource: "file",
          canonicalOwner: "src/data/guide-content.ts",
          indexable: guessIndexable(pathName, blocks),
          notes: "from GUIDE_PAGES",
        }),
      );
    }
  }

  return rows;
}

function collectBlog(blocks) {
  const editorialSlugs = extractEditorialOverrideSlugs();
  const blogTs = exists("src/data/blog.ts") ? readText("src/data/blog.ts") : "";
  const legacyOverrideSlugs = blogTs ? extractLegacyManualOverrideSlugs(blogTs) : new Set();

  const rows = [
    row({
      family: "blog",
      path: "/blog",
      slug: "",
      entityType: "blog_hub",
      currentSource: "hybrid",
      canonicalOwner: "Blog editor (file catalog ∪ CMS merge)",
      indexable: guessIndexable("/blog", blocks),
      notes: "Tier-1 hub; see CONTENT_OWNERSHIP_CONTRACT blog precedence",
    }),
  ];

  if (exists("src/data/blog-hubs.ts")) {
    const hubsTs = readText("src/data/blog-hubs.ts");
    const hubsBlock = hubsTs.match(/export const BLOG_HUBS[\s\S]*?=\s*\[([\s\S]*?)\];/)?.[1] ?? "";
    const hubIds = [...hubsBlock.matchAll(/\bid:\s*["']([^"']+)["']/g)].map((m) => m[1]);
    for (const slug of [...new Set(hubIds)]) {
      const pathName = `/blog/hub/${slug}`;
      rows.push(
        row({
          family: "blog",
          path: pathName,
          slug,
          entityType: "blog_hub_page",
          currentSource: "file",
          canonicalOwner: "src/data/blog-hubs.ts (blogHubPath)",
          indexable: guessIndexable(pathName, blocks),
          notes: "from BLOG_HUBS",
        }),
      );
    }
  }

  const publishedSlugs = exists("src/data/blog-published-slugs.ts")
    ? extractStringArray(readText("src/data/blog-published-slugs.ts"), "BLOG_PUBLISHED_SLUGS")
    : [];

  // File-backed article modules (slug ≈ filename without .ts)
  const moduleDirs = ["src/data/blog-articles", "src/data/blog-manual-from-md"];
  const moduleSlugs = [];
  for (const dir of moduleDirs) {
    const abs = path.join(root, dir);
    if (!fs.existsSync(abs)) continue;
    for (const name of fs.readdirSync(abs)) {
      if (!name.endsWith(".ts") || name === "index.ts") continue;
      moduleSlugs.push(name.replace(/\.ts$/, ""));
    }
  }

  const legacyPostSlugs = blogTs
    ? extractSlugFields(blogTs.match(/legacyManualBlogPosts[\s\S]*?\];/)?.[0] ?? "")
    : [];

  const allSlugs = [...new Set([...publishedSlugs, ...moduleSlugs, ...legacyPostSlugs])];

  for (const slug of allSlugs) {
    const pathName = `/blog/${slug}`;
    const overrideNames = [];
    if (editorialSlugs.has(slug)) overrideNames.push("EDITORIAL_OVERRIDES");
    if (legacyOverrideSlugs.has(slug)) overrideNames.push("legacyManual*");
    rows.push(
      row({
        family: "blog",
        path: pathName,
        slug,
        entityType: "blog_post",
        currentSource: "hybrid",
        overrides: overrideNames.length > 0 ? overrideNames.join("|") : "no",
        canonicalOwner: "Blog file representation → CMS override when cutover/complete",
        indexable: guessIndexable(pathName, blocks),
        notes: publishedSlugs.includes(slug) ? "BLOG_PUBLISHED_SLUGS" : "file module / legacyManual",
      }),
    );
  }

  return {
    rows,
    meta: {
      publishedSlugs: publishedSlugs.length,
      moduleSlugs: moduleSlugs.length,
      editorialOverrides: editorialSlugs.size,
      legacyManualOverrides: legacyOverrideSlugs.size,
    },
  };
}

function collectFaq(blocks) {
  const itemCount = exists("src/data/faq.ts")
    ? [...readText("src/data/faq.ts").matchAll(/\bquestion:\s*["'`]/g)].length
    : 0;

  return [
    row({
      family: "faq",
      path: "/faq",
      slug: "",
      entityType: "faq_hub",
      currentSource: "file",
      canonicalOwner: "Product content owner (src/data/faq.ts)",
      indexable: guessIndexable("/faq", blocks),
      notes: `Tier-1 hub; ${itemCount} FAQ_ITEMS on one page (no separate routes)`,
    }),
  ];
}

function collectLandings(blocks) {
  const rows = [];

  // Commercial tour landings from STABLE_TOUR_LANDING_PATHS (file inventory).
  const indexability = readText("src/lib/seo/sitemap-indexability.ts");
  const stableBlock = indexability.match(
    /STABLE_TOUR_LANDING_PATHS\s*=\s*\[([\s\S]*?)\]/,
  )?.[1] ?? "";
  const stablePaths = [...stableBlock.matchAll(/["']([^"']+)["']/g)].map((m) => m[1]);

  for (const pathName of stablePaths) {
    const slug = pathName.replace(/^\/tours\//, "");
    rows.push(
      row({
        family: "landings",
        path: pathName,
        slug,
        entityType: "commercial_landing",
        currentSource: "file",
        canonicalOwner: "Marketplace / SEO (STABLE_TOUR_LANDING_PATHS)",
        indexable: guessIndexable(pathName, blocks),
        notes: "stable tour landing; not CMS /landing/*",
      }),
    );
  }

  // CMS landings are runtime-only (listPublishedLandingSlugs). Record the shell.
  rows.push(
    row({
      family: "landings",
      path: "/landing/[slug]",
      slug: "[slug]",
      entityType: "cms_landing_shell",
      currentSource: "cms",
      overrides: "no",
      canonicalOwner: "CMS landing documents (cmsOnly, no TS catalog)",
      indexable: "unknown",
      notes:
        "CMS-only family — slug list requires live Supabase; not invented offline",
    }),
  );

  return {
    rows,
    meta: {
      stableTourLandings: stablePaths.length,
      cmsLandingSlugsOffline: 0,
      cmsLandingNote:
        "Published /landing/* slugs come from listPublishedLandingSlugs at runtime; offline matrix keeps shell only.",
    },
  };
}

function main() {
  const blocks = loadPublicationBlocks();

  const kb = collectKb(blocks);
  const blog = collectBlog(blocks);
  const landings = collectLandings(blocks);

  const rows = uniqueByPath([
    ...collectHomepage(blocks),
    ...collectDestinations(blocks),
    ...collectPlaces(blocks),
    ...kb.rows,
    ...collectImmigration(blocks),
    ...collectGuides(blocks),
    ...blog.rows,
    ...collectFaq(blocks),
    ...landings.rows,
  ]);

  const byFamily = {};
  for (const item of rows) {
    byFamily[item.family] = (byFamily[item.family] ?? 0) + 1;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    ownershipContract: "docs/editorial/CONTENT_OWNERSHIP_CONTRACT.md",
    rowCount: rows.length,
    byFamily,
    caps: {
      kbEntityCap: KB_ENTITY_CAP,
      kb: kb.meta,
    },
    sources: {
      blog: blog.meta,
      landings: landings.meta,
      publicationRegistry: "src/lib/seo/publication-registry.ts",
      kbManifest: "content/knowledge-base/_index/manifest.json",
      placesSeed: "src/data/places-seed.ts",
      destinationContent: "src/data/destination-pages.ts",
    },
    note:
      "Generated inventory of public content families for Sprint 3. Prefer KEEP; do not treat this CSV as editable SSOT. Archived KB entities excluded unless CONTENT_SOURCE_MATRIX_KB_CAP raised and filter changed.",
    rows,
  };

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`);

  const csvLines = [
    CSV_HEADER.join(","),
    ...rows.map((item) => CSV_HEADER.map((key) => csvEscape(item[key])).join(",")),
  ];
  fs.mkdirSync(path.dirname(OUT_CSV), { recursive: true });
  fs.writeFileSync(OUT_CSV, `${csvLines.join("\n")}\n`);

  console.log(`content-source-matrix rows=${rows.length}`);
  console.log(`byFamily ${JSON.stringify(byFamily)}`);
  if (kb.meta.truncated) {
    console.log(
      `note: KB published capped at ${kb.meta.cap} (had ${kb.meta.published}; archived ${kb.meta.archivedExcluded} excluded)`,
    );
  } else {
    console.log(
      `kb published=${kb.meta.published} included archivedExcluded=${kb.meta.archivedExcluded}`,
    );
  }
  console.log(`Wrote ${path.relative(root, OUT_JSON)}`);
  console.log(`Wrote ${path.relative(root, OUT_CSV)}`);
}

main();
