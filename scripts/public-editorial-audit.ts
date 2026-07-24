import fs from "node:fs";
import path from "node:path";

import { blogPosts } from "../src/data/blog";
import { SITE_NAV_SECTIONS } from "../src/data/site-nav";
import { filterIndexableBlogPosts } from "../src/lib/blog-utils";
import { getAllEntries } from "../src/lib/knowledge-base/content";
import { getPublicationIssues } from "../src/lib/knowledge-base/publication-quality";
import { flattenSiteNavSections } from "../src/lib/site-nav";
import {
  DEFAULT_SITE_MODULES,
  DEFAULT_SITE_NAVIGATION,
} from "../src/lib/cms/site-globals/normalize";
import { isPublicLinkEnabled } from "../src/lib/public-module-visibility";

const PUBLIC_ARTIFACT_RE =
  /(?:черновик из контент-плана|контент-план|требует редакторской вычитки|автоперевод|заглушка api|в разработке|когда подключим|chatgpt|openai|написано (?:ии|искусственным интеллектом)|ai-генерац)/i;
const UNLABELED_WIKILINK_RE = /\[\[([^\]|]+)\]\]/g;

const publicKb = getAllEntries();
const publicKbIds = new Set(publicKb.map((entry) => entry.id));
const publicBlog = filterIndexableBlogPosts(blogPosts);
const errors: string[] = [];

for (const entry of publicKb) {
  const issues = getPublicationIssues(entry);
  if (issues.length > 0) errors.push(`KB ${entry.id}: ${issues.join(", ")}`);
  const text = [entry.title, entry.summary, entry.body].filter(Boolean).join("\n");
  if (PUBLIC_ARTIFACT_RE.test(text)) errors.push(`KB ${entry.id}: служебная лексика`);
  for (const match of text.matchAll(UNLABELED_WIKILINK_RE)) {
    if (!publicKbIds.has(match[1].trim())) {
      errors.push(`KB ${entry.id}: ссылка на скрытую запись ${match[1].trim()}`);
    }
  }
}

for (const post of publicBlog) {
  const text = [
    post.title,
    post.excerpt,
    post.content,
    ...(post.sections ?? []).flatMap((section) => [section.title, section.body]),
  ].join("\n");
  if (PUBLIC_ARTIFACT_RE.test(text)) errors.push(`Blog ${post.slug}: служебная лексика`);
}

const publicNavLinks = flattenSiteNavSections(SITE_NAV_SECTIONS).filter((link) =>
  isPublicLinkEnabled(link.href, DEFAULT_SITE_NAVIGATION, DEFAULT_SITE_MODULES),
);
for (const link of publicNavLinks) {
  if (link.href.startsWith("/immigration")) {
    errors.push(`Navigation ${link.id}: юридический раздел не прошёл ревью`);
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  status: errors.length === 0 ? "passed" : "failed",
  publicKnowledgeBaseEntries: publicKb.length,
  publicBlogPosts: publicBlog.length,
  navigationLinks: publicNavLinks.length,
  errors,
};

const reportPath = path.join(process.cwd(), "var/ops/public-editorial-audit.json");
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
process.exit(errors.length === 0 ? 0 : 1);
