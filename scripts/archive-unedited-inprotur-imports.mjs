#!/usr/bin/env node

/**
 * Consolidate untouched INPROTUR import stubs into the canonical regional hubs.
 *
 * The imported records remain in the repository for provenance and media rights,
 * but public URLs redirect to an edited Russian guide instead of exposing a
 * one-sentence foreign-language placeholder.
 *
 * Usage:
 *   node scripts/archive-unedited-inprotur-imports.mjs          # dry run
 *   node scripts/archive-unedited-inprotur-imports.mjs --apply  # write files
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const auditPath = path.join(root, "var/ops/content-audit.json");
const apply = process.argv.includes("--apply");

const redirectByRegion = {
  "buenos-aires-province": "buenos-aires-province",
  cuyo: "cuyo",
  litoral: "litoral",
  noa: "noa",
  pampa: "pampa",
  patagonia: "patagonia",
  "tierra-del-fuego": "tierra-del-fuego",
};

const canonicalOverrides = {
  "arte-urbano-en-buenos-aires": "buenos-aires",
  "buenos-aires-tradicional": "buenos-aires",
  "cordero-patagonico": "kuhnya",
  "campo-del-cielo-y-saenz-pena": "campo-del-cielo",
  "el-mate": "mate",
  "el-vino-malbec": "kuhnya",
  "gastronomia-portena": "kuhnya",
  "museos-de-buenos-aires": "buenos-aires",
  "parque-nacional-iguazu-patrimonio-de-la-humanidad": "iguazu",
  "parque-nacional-los-glaciares-patrimonio-de-la-humanidad": "los-glasiares",
  "pinguinos-en-punta-tombo": "punta-tombo",
  "reserva-natural-ibera": "ibera",
  "salinas-grandes-jujuy": "salinas-grandes",
  "tango-en-buenos-aires": "tango",
  "teatro-y-literatura-en-buenos-aires": "gid-po-kulture",
  "vida-nocturna-en-buenos-aires": "razvlecheniya-i-nochnaya-zhizn",
};

function issueCode(issue) {
  return issue.code ?? issue.type ?? issue.issue;
}

function replaceScalar(frontmatter, key, value) {
  const line = new RegExp(`^${key}:.*$`, "m");
  if (line.test(frontmatter)) {
    return frontmatter.replace(line, `${key}: ${value}`);
  }
  return `${frontmatter.trimEnd()}\n${key}: ${value}\n`;
}

function archiveEntry(raw, redirectTo) {
  const closing = raw.indexOf("\n---", 4);
  if (!raw.startsWith("---\n") || closing === -1) {
    throw new Error("Frontmatter boundaries not found");
  }

  let frontmatter = raw.slice(4, closing);
  frontmatter = replaceScalar(frontmatter, "status", "archived");
  frontmatter = replaceScalar(frontmatter, "site_ready", "false");
  frontmatter = replaceScalar(frontmatter, "redirect_to", redirectTo);
  frontmatter = replaceScalar(
    frontmatter,
    "archive_reason",
    '"Неотредактированная однотемная карточка импорта объединена с каноническим русскоязычным региональным материалом; исходник и атрибуция сохранены для редакционного архива."',
  );

  return `---\n${frontmatter.trimEnd()}\n${raw.slice(closing)}`;
}

const audit = JSON.parse(fs.readFileSync(auditPath, "utf8"));
const candidates = audit.entries.filter(
  (entry) =>
    entry.sourceType === "inprotur" &&
    entry.publicationStatus !== "archived" &&
    (entry.issues.some((issue) => issueCode(issue) === "non_russian_summary") ||
      (entry.entityType === "attraction" &&
        entry.issues.some((issue) =>
          ["machine_translation_marker", "not_publication_ready"].includes(issueCode(issue)),
        ))),
);

const changed = [];
for (const entry of candidates) {
  const redirectTo = canonicalOverrides[entry.id] ?? redirectByRegion[entry.regionId];
  if (!redirectTo) {
    throw new Error(`No redirect target for ${entry.id} (${entry.regionId ?? "no region"})`);
  }
  if (redirectTo === entry.id) {
    throw new Error(`Self redirect for ${entry.id}`);
  }

  const sourcePath = path.join(root, entry.sourcePath);
  const raw = fs.readFileSync(sourcePath, "utf8");
  const next = archiveEntry(raw, redirectTo);
  if (next !== raw) {
    changed.push({ id: entry.id, redirectTo, sourcePath: entry.sourcePath });
    if (apply) fs.writeFileSync(sourcePath, next);
  }
}

const totals = changed.reduce((acc, item) => {
  acc[item.redirectTo] = (acc[item.redirectTo] ?? 0) + 1;
  return acc;
}, {});

console.log(
  JSON.stringify(
    {
      mode: apply ? "apply" : "dry-run",
      candidates: candidates.length,
      changed: changed.length,
      redirects: totals,
    },
    null,
    2,
  ),
);
