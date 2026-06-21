#!/usr/bin/env node
/**
 * Generates sectional blog posts from docs/articles/*.md (cornerstone guides).
 * Preserves markdown prose verbatim; maps ## headings to BlogPostSection titles.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = path.resolve(import.meta.dirname, "..");
const DOCS = path.join(ROOT, "docs", "articles");
const OUT = path.join(ROOT, "src/data/blog-manual-from-md");

/** @type {Array<{ md: string; category: string; replacesSlug?: string; featured?: boolean }>} */
const MANUAL_ARTICLES = [
  {
    md: "Маршрут-по-Аргентине-2-недели.md",
    category: "Маршруты",
    featured: true,
  },
  {
    md: "Маршруты-10-дней-и-3-недели.md",
    category: "Маршруты",
  },
  {
    md: "Маршруты-Дорога-семи-озёр-и-Рута-40.md",
    category: "Маршруты",
  },
  {
    md: "Транспорт-Внутренние-авиабилеты.md",
    category: "Путеводитель",
  },
  {
    md: "Транспорт-Как-добраться-из-России-СНГ.md",
    category: "Путеводитель",
  },
  {
    md: "Деньги-Бюджет-поездки-по-Аргентине.md",
    category: "Путеводитель",
  },
  {
    md: "Деньги-Стоимость-жизни-Буэнос-Айрес.md",
    category: "Путеводитель",
  },
  {
    md: "Деньги-как-менять-валюту-Аргентина.md",
    category: "Путеводитель",
  },
  {
    md: "Города-Буэнос-Айрес-районы.md",
    category: "Путеводитель",
    replacesSlug: "buenos-aires-neighborhoods",
  },
  {
    md: "Города-Мендоса-винный-гид.md",
    category: "Туры",
    replacesSlug: "mendoza-wine-route",
  },
  {
    md: "Переезд-ВНЖ-Аргентины-все-пути.md",
    category: "Иммиграция",
    featured: true,
  },
  {
    md: "Переезд-Виза-цифрового-кочевника.md",
    category: "Иммиграция",
  },
  {
    md: "Переезд-DNI-и-CUIL-пошагово.md",
    category: "Иммиграция",
  },
  {
    md: "Переезд-Гражданство-Аргентины.md",
    category: "Иммиграция",
  },
  {
    md: "Переезд-Банковский-счёт-и-финансы.md",
    category: "Иммиграция",
  },
];

function escapeTs(str) {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n/g, "\\n")
    .replace(/"/g, '\\"');
}

function parseSeoMeta(content) {
  const slugMatch = content.match(/\*\*URL Slug:\*\*\s*\n`([^`]+)`/);
  const titleMatch = content.match(/\*\*SEO Title[^*]*\*\*\s*\n`([^`]+)`/);
  const descMatch = content.match(/\*\*Meta Description[^*]*\*\*\s*\n`([^`]+)`/);
  const keywordsMatch = content.match(/\*\*Ключевые запросы:\*\*\s*\n([^\n#]+)/);

  return {
    slug: slugMatch?.[1]?.trim() ?? "",
    seoTitle: titleMatch?.[1]?.trim() ?? "",
    excerpt: descMatch?.[1]?.trim() ?? "",
    tags: keywordsMatch?.[1]
      ? keywordsMatch[1]
          .split(";")
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 8)
      : [],
  };
}

function parseRelatedResources(content) {
  const m = content.match(/### Внутренние перелинковки\n([\s\S]*?)(?=\n---|\n##|$)/);
  if (!m?.[1]) return [];

  const items = [];
  for (const line of m[1].split("\n")) {
    const match = line.match(/^-\s+(.+?)\s+—\s+`(\/[^`]+)`/);
    if (!match) continue;
    const label = match[1].trim();
    const href = match[2].trim();
    let type = "guide";
    if (href.startsWith("/blog/")) type = "blog";
    else if (href.startsWith("/immigration/")) type = "immigration";
    else if (href.startsWith("/tours/")) type = "tour";
    items.push({ label, href, type });
  }
  return items;
}

function parseManualMd(content) {
  const lines = content.split("\n");
  let i = 0;

  const title = lines[i]?.replace(/^#\s+/, "").trim() ?? "";
  i++;

  while (i < lines.length && lines[i]?.trim() === "") i++;

  const introLines = [];
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("## ")) break;
    if (line.startsWith("---")) {
      i++;
      break;
    }
    introLines.push(line);
    i++;
  }

  const sections = [];
  if (introLines.join("\n").trim()) {
    sections.push({ title: "Введение", body: introLines.join("\n").trim() });
  }

  while (i < lines.length) {
    if (lines[i]?.startsWith("## ")) {
      const sectionTitle = lines[i].replace(/^##\s+/, "").trim();
      i++;
      if (sectionTitle.startsWith("SEO-блок")) break;

      const bodyLines = [];
      while (i < lines.length && !lines[i].startsWith("## ") && !lines[i].startsWith("---")) {
        bodyLines.push(lines[i]);
        i++;
      }
      const body = bodyLines.join("\n").trim();
      if (body) sections.push({ title: sectionTitle, body });
    } else if (lines[i]?.startsWith("---")) {
      i++;
    } else {
      i++;
    }
  }

  return { title, sections };
}

function estimateReadMinutes(sections) {
  const words = sections.map((s) => s.body).join(" ").split(/\s+/).length;
  return Math.min(28, Math.max(8, Math.round(words / 140)));
}

function generatePost(config, index) {
  const mdPath = path.join(DOCS, config.md);
  const content = fs.readFileSync(mdPath, "utf8");
  const mdChecksum = crypto.createHash("sha256").update(content).digest("hex").slice(0, 16);
  const parsed = parseManualMd(content);
  const seo = parseSeoMeta(content);
  const relatedResources = parseRelatedResources(content);
  const readTimeMinutes = estimateReadMinutes(parsed.sections);

  if (!seo.slug) {
    throw new Error(`Missing URL Slug in ${config.md}`);
  }

  const exportName = seo.slug.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "");
  const sectionsTs = parsed.sections
    .map(
      (s) =>
        `      {\n        title: "${escapeTs(s.title)}",\n        body:\n          "${escapeTs(s.body)}",\n      }`,
    )
    .join(",\n");

  const tagsTs =
    seo.tags.length > 0
      ? `\n    tags: [${seo.tags.map((t) => `"${escapeTs(t)}"`).join(", ")}],`
      : "";

  const relatedTs =
    relatedResources.length > 0
      ? `\n    relatedResources: [\n${relatedResources
          .map(
            (r) =>
              `      { label: "${escapeTs(r.label)}", href: "${escapeTs(r.href)}", type: "${r.type}" as const },`,
          )
          .join("\n")}\n    ],`
      : "";

  const featuredTs = config.featured ? `\n    featured: true,\n    cardVariant: "featured" as const,` : "";

  const replacesTs = config.replacesSlug
    ? `\n/** Replaces manual slug \`${config.replacesSlug}\` */\n`
    : "";

  return `${replacesTs}// Generated from docs/articles/${config.md} — md-checksum: ${mdChecksum}
import type { BlogPost } from "@/types";

export const ${exportName}Post: BlogPost = {
  id: "md-${seo.slug}",
  slug: "${escapeTs(seo.slug)}",
  title: "${escapeTs(parsed.title)}",
  seoTitle: "${escapeTs(seo.seoTitle || parsed.title)}",
  excerpt: "${escapeTs(seo.excerpt)}",
  sections: [
${sectionsTs}
  ],
  content: "",
  author: "",
  authorBio: "",
  date: "2026-06-21",
  dateModified: "2026-06-21",
  image: "",
  category: "${escapeTs(config.category)}",
  readTimeMinutes: ${readTimeMinutes},
  readTime: "",${tagsTs}${featuredTs}
  editorialReviewed: true,${relatedTs}
};
`;
}

function generateIndex(exports) {
  const imports = exports
    .map((e) => `import { ${e.exportName}Post } from "./${e.file}";`)
    .join("\n");

  const posts = exports.map((e) => `  ${e.exportName}Post`).join(",\n");

  const replaced = MANUAL_ARTICLES.filter((a) => a.replacesSlug)
    .map((a) => `  "${a.replacesSlug}",`)
    .join("\n");

  return `import type { BlogPost } from "@/types";

${imports}

export const REPLACED_MANUAL_SLUGS = new Set<string>([
${replaced}
]);

export const manualPostsFromMd: BlogPost[] = [
${posts},
];
`;
}

const checkMode = process.argv.includes("--check");
let driftCount = 0;

if (!checkMode && !fs.existsSync(OUT)) {
  fs.mkdirSync(OUT, { recursive: true });
}

/** @type {Array<{ file: string; exportName: string; slug: string }>} */
const exports = [];

for (const [index, config] of MANUAL_ARTICLES.entries()) {
  const ts = generatePost(config, index);
  const slugMatch = ts.match(/slug: "([^"]+)"/);
  const slug = slugMatch?.[1] ?? config.md;
  const exportName = slug.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "");
  const file = `${slug}.ts`;
  const outPath = path.join(OUT, file);

  exports.push({ file: file.replace(/\.ts$/, ""), exportName, slug });

  if (checkMode) {
    const existing = fs.existsSync(outPath) ? fs.readFileSync(outPath, "utf8") : "";
    if (existing !== ts) {
      console.error(`DRIFT: ${file} (MD docs/articles/${config.md})`);
      driftCount += 1;
    } else {
      console.log(`OK ${file}`);
    }
    continue;
  }
  fs.writeFileSync(outPath, ts, "utf8");
  console.log(`Wrote ${file}`);
}

const indexTs = generateIndex(exports);
const indexPath = path.join(OUT, "index.ts");

if (checkMode) {
  const existingIndex = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, "utf8") : "";
  if (existingIndex !== indexTs) {
    console.error("DRIFT: index.ts");
    driftCount += 1;
  } else {
    console.log("OK index.ts");
  }
  if (driftCount > 0) {
    console.error(`${driftCount} file(s) out of sync — run: node scripts/sync-blog-manual-posts-from-md.mjs`);
    process.exit(1);
  }
  console.log("All manual blog posts in sync with MD sources.");
} else {
  fs.writeFileSync(indexPath, indexTs, "utf8");
  console.log("Wrote index.ts");
}
