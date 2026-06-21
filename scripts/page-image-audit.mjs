#!/usr/bin/env node
/**
 * Per-page image audit: maps public routes to image sources and flags hotlinks.
 * Writes docs/page-image-audit.md
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const srcRoot = path.join(root, "src");
const reportPath = path.join(root, "docs/page-image-audit.md");
const replacementReportPath = path.join(root, "docs/image-replacement-report.md");
const manifestPath = path.join(root, "src/data/media-library/manifest.json");

const URL_PATTERN =
  /https?:\/\/(?:images\.unsplash\.com\/[^\s"'`<>]+|upload\.wikimedia\.org\/[^\s"'`<>]+|[^\s"'`<>]+\.(?:jpg|jpeg|png|gif|webp)(?:\?[^\s"'`<>]*)?)|\/media\/[^\s"'`<>]+/gi;

const LOCAL_MEDIA_PATTERN = /\/media\/[^\s"'`<>]+/g;

/** @type {Array<{ route: string; view: string; category: string }>} */
const PAGE_REGISTRY = [
  { route: "/", view: "src/components/marketplace/MarketplaceHome.tsx", category: "home" },
  { route: "/blog", view: "src/components/blog/BlogIndexView.tsx", category: "blog" },
  { route: "/blog/[slug]", view: "src/components/blog/BlogPostView.tsx", category: "blog" },
  { route: "/guide", view: "src/data/guide-hub-index-content.ts", category: "guide" },
  { route: "/guide/[slug]", view: "src/components/guide/GuideTopicView.tsx", category: "guide" },
  { route: "/immigration", view: "src/data/immigration-hub-content.ts", category: "immigration" },
  { route: "/immigration/[slug]", view: "src/components/immigration/ImmigrationPillarView.tsx", category: "immigration" },
  { route: "/flights", view: "src/components/flights/FlightsWhitelabelView.tsx", category: "service" },
  { route: "/transfers", view: "src/components/transfers/TransfersSearchView.tsx", category: "service" },
  { route: "/insurance", view: "src/components/insurance/InsuranceView.tsx", category: "service" },
  { route: "/esim", view: "src/components/esim/EsimCatalogView.tsx", category: "service" },
  { route: "/car-rental", view: "src/components/car-rental/CarRentalView.tsx", category: "service" },
  { route: "/services", view: "src/components/services/ServicesPageView.tsx", category: "service" },
  { route: "/shop", view: "src/components/shop/ShopPageView.tsx", category: "service" },
  { route: "/audio-guides", view: "src/components/audio-guides/AudioGuidesCatalogView.tsx", category: "service" },
  { route: "/gallery", view: "src/components/gallery/GalleryPageView.tsx", category: "service" },
  { route: "/contacts", view: "src/app/contacts/page.tsx", category: "service" },
  { route: "/destinations", view: "src/components/destinations/GeographyHubView.tsx", category: "destination" },
  { route: "/podbor", view: "src/data/podbor/regions.ts", category: "podbor" },
  { route: "/tours", view: "src/data/tours.ts", category: "tours" },
  { route: "/places", view: "src/components/places/PlacesCatalogView.tsx", category: "places" },
];

const SKIP_DIRS = new Set(["archive", "dev"]);

function readFileSafe(rel) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return "";
  return fs.readFileSync(full, "utf8");
}

function classifySource(url) {
  if (url.startsWith("/media/")) return "local";
  if (url.includes("images.unsplash.com")) return "unsplash-hotlink";
  if (url.includes("wikimedia.org")) return "wikimedia-hotlink";
  return "external";
}

function scanFile(relPath) {
  const content = readFileSafe(relPath);
  const urls = [...new Set([...(content.match(URL_PATTERN) ?? []), ...(content.match(LOCAL_MEDIA_PATTERN) ?? [])])];
  const unsplash = urls.filter((u) => u.includes("unsplash.com"));
  const local = urls.filter((u) => u.startsWith("/media/"));
  const wikimedia = urls.filter((u) => u.includes("wikimedia.org"));
  const usesResolver =
    /getServicePageHeroImage|getImmigrationTopicHeroImage|getImmigrationHubHeroImage|getHomeHeroImage|getPodborRegionImage|getPodborThemeImage|getShopProductImage|getBlogPostCoverImage|getGuideTopicHeroImage|getPlaceCoverImage|getTourCoverImage|getRichArticleGallery|getDestinationImage|media-resolver/.test(
      content
    );

  let status = "ok";
  if (unsplash.length > 0) status = "hotlink";
  else if (usesResolver || local.length > 0) status = "local-resolver";
  else if (wikimedia.length > 0) status = "wikimedia-hotlink";
  else if (urls.length === 0) status = "no-static-image";

  return { urls, unsplash, local, wikimedia, usesResolver, status };
}

function loadManifestStats() {
  if (!fs.existsSync(manifestPath)) return { total: 0, stock: 0 };
  const data = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const assets = data.assets ?? [];
  return {
    total: assets.length,
    stock: assets.filter((a) => a.source === "unsplash" || a.source === "pexels").length,
    wikimedia: assets.filter((a) => a.source === "wikimedia").length,
  };
}

function countGlobalUnsplash() {
  let count = 0;
  const files = [];

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      if (SKIP_DIRS.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(entry.name)) {
        const c = fs.readFileSync(full, "utf8");
        const matches = c.match(/images\.unsplash\.com/g);
        if (matches) {
          count += matches.length;
          files.push(path.relative(root, full));
        }
      }
    }
  }
  walk(srcRoot);
  return { count, files: [...new Set(files)] };
}

function main() {
  const manifest = loadManifestStats();
  const global = countGlobalUnsplash();

  const rows = PAGE_REGISTRY.map((page) => {
    const scan = scanFile(page.view);
    return { ...page, ...scan };
  });

  const hotlinkPages = rows.filter((r) => r.status === "hotlink");
  const okPages = rows.filter((r) => r.status === "local-resolver" || r.status === "ok");

  const lines = [
    "# Page image audit",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    "| Metric | Value |",
    "| --- | ---: |",
    `| Manifest assets | ${manifest.total} |`,
    `| Stock (Unsplash/Pexels local) | ${manifest.stock} |`,
    `| Wikimedia local | ${manifest.wikimedia} |`,
    `| Pages audited | ${rows.length} |`,
    `| Pages with local/resolver images | ${okPages.length} |`,
    `| Pages with Unsplash hotlinks in view | ${hotlinkPages.length} |`,
    `| Global Unsplash refs in src/ (excl. archive) | ${global.count} in ${global.files.length} files |`,
    "",
    "## Pages",
    "",
    "| Route | Status | Resolver | Local URLs | Unsplash hotlinks |",
    "| --- | --- | --- | ---: | ---: |",
  ];

  for (const row of rows) {
    lines.push(
      `| ${row.route} | ${row.status} | ${row.usesResolver ? "yes" : "no"} | ${row.local.length} | ${row.unsplash.length} |`
    );
  }

  if (hotlinkPages.length > 0) {
    lines.push("", "## Pages needing migration", "");
    for (const row of hotlinkPages) {
      lines.push(`### ${row.route}`, "", `- View: \`${row.view}\``);
      for (const u of row.unsplash.slice(0, 5)) lines.push(`- \`${u.slice(0, 100)}\``);
      lines.push("");
    }
  }

  if (global.files.length > 0) {
    lines.push("## Remaining Unsplash references (by file)", "");
    lines.push("User-facing page heroes should use `media-resolver`. Seed/demo avatars may remain.", "");
    for (const f of global.files.sort()) {
      const n = (readFileSafe(f).match(/images\.unsplash\.com/g) ?? []).length;
      lines.push(`- \`${f}\` (${n})`);
    }
    lines.push("");
  }

  lines.push("## Recommendations", "");
  lines.push("- Run `npm run fetch-stock-media` after setting `UNSPLASH_ACCESS_KEY` / `PEXELS_API_KEY`");
  lines.push("- Hero images: `getServicePageHeroImage`, `getImmigrationTopicHeroImage`, `getGuideTopicHeroImage`");
  lines.push("- Tours catalog: `getTourCoverImage` (already wired in `tours.ts` export)");
  lines.push("- Rich blog: `getRichArticleGallery` + `SafeImage` with lazy loading");
  lines.push("");

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, lines.join("\n"), "utf8");
  console.log(`Wrote ${reportPath}`);

  const replacementLines = [
    "# Image replacement report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Summary counts",
    "",
    "| Metric | Count |",
    "| --- | ---: |",
    `| Manifest assets (local) | ${manifest.total} |`,
    `| Stock downloaded (Unsplash/Pexels) | ${manifest.stock} |`,
    `| Wikimedia in manifest | ${manifest.wikimedia} |`,
    `| Pages migrated to media-resolver | ${okPages.length} |`,
    `| Pages with remaining hotlinks | ${hotlinkPages.length} |`,
    `| Global Unsplash refs in src/ | ${global.count} |`,
    `| Files with Unsplash refs | ${global.files.length} |`,
    "",
    "## Replacement status",
    "",
    "- **Completed**: service pages, immigration, blog heroes, podbor, shop, rich national park galleries",
    "- **Intentional hotlinks**: tour seed data, organizer avatars, checkout addon thumbnails, DesignSystemShowcase demo",
    "- **Next**: migrate `src/data/tours.ts`, `marketplace-tours.ts`, `guide-topics.ts` to `getTourCoverImage` / manifest bindings",
    "",
  ];

  if (hotlinkPages.length > 0) {
    replacementLines.push("## Pages needing manual review", "");
    for (const row of hotlinkPages) {
      replacementLines.push(`- \`${row.route}\` — \`${row.view}\` (${row.unsplash.length} hotlinks)`);
    }
    replacementLines.push("");
  }

  if (global.files.length > 0) {
    replacementLines.push("## Files with Unsplash references", "");
    for (const f of global.files.sort()) {
      const n = (readFileSafe(f).match(/images\.unsplash\.com/g) ?? []).length;
      replacementLines.push(`- \`${f}\`: ${n}`);
    }
    replacementLines.push("");
  }

  fs.writeFileSync(replacementReportPath, replacementLines.join("\n"), "utf8");
  console.log(`Wrote ${replacementReportPath}`);
  console.log(`Pages: ${rows.length}, hotlink pages: ${hotlinkPages.length}, global unsplash refs: ${global.count}`);
}

main();
