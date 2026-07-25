#!/usr/bin/env tsx
/**
 * Editorial design-system audit.
 * Usage: npm run editorial:audit
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { blogPosts } from "@/data/blog";
import { auditEditorialPost } from "@/editorial/utilities/audit";
import { listEditorialRegistryEntries } from "@/editorial/registry/definitions";
import { listTypedBlockSlugs } from "@/data/blog-typed-blocks";

const args = new Set(process.argv.slice(2));
const strict = args.has("--strict");
const slugFilter = [...args].find((arg) => arg.startsWith("--slug="))?.slice("--slug=".length);

const posts = slugFilter
  ? blogPosts.filter((post) => post.slug === slugFilter)
  : blogPosts;

const findings = posts.flatMap((post) => auditEditorialPost(post));
const errors = findings.filter((item) => item.level === "error");
const warnings = findings.filter((item) => item.level === "warning");

const report = {
  generatedAt: new Date().toISOString(),
  postsScanned: posts.length,
  registrySize: listEditorialRegistryEntries().length,
  typedBlockSlugs: listTypedBlockSlugs(),
  errorCount: errors.length,
  warningCount: warnings.length,
  findings: findings.slice(0, 500),
};

const outDir = join(process.cwd(), "var/audit/editorial-design-system");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "editorial-audit.json"), JSON.stringify(report, null, 2));

console.log(`Editorial audit: ${posts.length} posts, ${errors.length} errors, ${warnings.length} warnings`);
console.log(`Registry entries: ${report.registrySize}`);
console.log(`Typed-block pilots: ${report.typedBlockSlugs.join(", ")}`);
console.log(`Report: ${join(outDir, "editorial-audit.json")}`);

if (errors.length > 0) {
  for (const error of errors.slice(0, 30)) {
    console.error(
      `[error] ${error.slug ?? "?"} / ${error.sectionTitle ?? "-"} / ${error.code}: ${error.message}`,
    );
  }
}

if (strict && errors.length > 0) {
  process.exit(1);
}
