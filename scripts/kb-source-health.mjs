#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  captureCandidateContext,
  finalizeCandidateEvidence,
} from "./lib/candidate-evidence.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentPath = path.join(root, "content/knowledge-base/_index/content.json");
const reportPath = path.join(root, "var/ops/kb-source-health-last.json");
const concurrency = 8;
const timeoutMs = 15_000;

export function isHealthyHttpStatus(status) {
  return status >= 200 && status < 400;
}

export function selectSourceTargets(content, { includeLegacy = false } = {}) {
  const byUrl = new Map();
  for (const entry of content?.entities ?? []) {
    for (const source of entry.sources ?? []) {
      const url = typeof source?.url === "string" ? source.url.trim() : "";
      if (!/^https?:\/\//i.test(url)) continue;
      const migrated = Boolean(source.id && source.authority && source.checked_at);
      if (!includeLegacy && !migrated) continue;
      const reference = {
        entryId: entry.id,
        sourceId: source.id ?? null,
        authority: source.authority ?? null,
        declaredStatus: source.url_status ?? null,
        declaredCheckedAt: source.checked_at ?? null,
      };
      const existing = byUrl.get(url);
      if (existing) existing.references.push(reference);
      else byUrl.set(url, { url, references: [reference] });
    }
  }
  return [...byUrl.values()].sort((a, b) => a.url.localeCompare(b.url));
}

async function probeOnce(url) {
  const response = await fetch(url, {
    method: "GET",
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      accept: "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.5",
      range: "bytes=0-2047",
      "user-agent": "GoArgentina editorial source health/1.0 (+https://www.goargentina.ru)",
    },
  });
  await response.body?.cancel().catch(() => undefined);
  return {
    status: response.status,
    finalUrl: response.url,
    contentType: response.headers.get("content-type"),
  };
}

async function probe(target) {
  let lastError = null;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const result = await probeOnce(target.url);
      if (isHealthyHttpStatus(result.status)) {
        return { ...target, ...result, ok: true, attempt, error: null };
      }
      lastError = `HTTP ${result.status}`;
      if (result.status < 500 && result.status !== 429) {
        return { ...target, ...result, ok: false, attempt, error: lastError };
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }
  return {
    ...target,
    status: null,
    finalUrl: null,
    contentType: null,
    ok: false,
    attempt: 2,
    error: lastError ?? "unknown fetch failure",
  };
}

async function probeAll(targets) {
  const results = new Array(targets.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, Math.max(targets.length, 1)) }, async () => {
    while (cursor < targets.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await probe(targets[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

export async function main(argv = process.argv.slice(2)) {
  const supported = new Set(["--all", "--check"]);
  const unknown = argv.filter((arg) => !supported.has(arg));
  if (unknown.length > 0) throw new Error(`Unknown arguments: ${unknown.join(", ")}`);

  const content = JSON.parse(fs.readFileSync(contentPath, "utf8"));
  const candidateContext = captureCandidateContext(root);
  const includeLegacy = argv.includes("--all");
  const targets = selectSourceTargets(content, { includeLegacy });
  const results = await probeAll(targets);
  const failed = results.filter((result) => !result.ok);
  const candidateEvidence = finalizeCandidateEvidence(root, candidateContext, {
    environment: "source-health-network",
  });
  const report = {
    schemaVersion: 1,
    ...candidateEvidence,
    generatedAt: new Date().toISOString(),
    scope: includeLegacy ? "all-http-sources" : "migrated-provenance-sources",
    sourceIndexGeneratedAt: content.generated_at ?? null,
    summary: {
      urls: results.length,
      passed: results.length - failed.length,
      failed: failed.length,
    },
    results,
  };
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(
    `[kb-source-health] scope=${report.scope} passed=${report.summary.passed}/${report.summary.urls} failed=${failed.length}`,
  );
  console.log(`[kb-source-health] report=${path.relative(root, reportPath)}`);

  if (
    argv.includes("--check") &&
    (results.length === 0 ||
      failed.length > 0 ||
      candidateEvidence.evidenceIntegrity.status !== "passed")
  ) {
    process.exitCode = 1;
  }
  return report;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
