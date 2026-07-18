import fs from "node:fs";
import path from "node:path";
import { blogPosts } from "@/data/blog";
import { getBlogRichArticle } from "@/data/blog-articles";
import { getBlogEditorialIssues, isSensitiveBlogPost } from "@/lib/blog-editorial-readiness";
import { filterIndexableBlogPosts } from "@/lib/blog-utils";

const root = process.cwd();
const publicPosts = filterIndexableBlogPosts(blogPosts);
const entries = publicPosts.map((post) => {
  const richArticle = post.richArticleId ? getBlogRichArticle(post.richArticleId) : null;
  const issues = getBlogEditorialIssues(post, richArticle ? JSON.stringify(richArticle) : "");
  return {
    slug: post.slug,
    title: post.title,
    category: post.category,
    sensitive: isSensitiveBlogPost(post),
    dateModified: post.dateModified ?? null,
    status: issues.length === 0 ? "passed" : "failed",
    issues: issues.map((issue) => issue.code),
  };
});

const failed = entries.filter((entry) => entry.status === "failed");
const sensitive = entries.filter((entry) => entry.sensitive);
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: "public-indexable-blog",
  status: failed.length === 0 ? "passed" : "failed",
  summary: {
    total: entries.length,
    passed: entries.length - failed.length,
    failed: failed.length,
    sensitive: sensitive.length,
    sensitivePassed: sensitive.filter((entry) => entry.status === "passed").length,
  },
  entries,
};

const output = path.join(root, "var/ops/blog-editorial-readiness.json");
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report.summary, null, 2));
console.log(`Blog editorial readiness: ${report.status}. Report: ${path.relative(root, output)}`);

if (process.argv.includes("--strict") && report.status !== "passed") process.exitCode = 1;
