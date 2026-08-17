#!/usr/bin/env node
/**
 * Print current KB manifest statistics (generated numbers, never hand-copied).
 * Writes var/ops/kb-manifest-stats-last.json and refreshes docs snapshot.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const manifestPath = path.join(root, "content/knowledge-base/_index/manifest.json");
const siteMapPath = path.join(root, "content/knowledge-base/_index/site-id-map.json");
const outJson = path.join(root, "var/ops/kb-manifest-stats-last.json");
const outMd = path.join(root, "docs/knowledge-base/CURRENT_STATS.md");

if (!fs.existsSync(manifestPath)) {
  console.error(`Missing manifest: ${manifestPath}`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const entities = Array.isArray(manifest.entities) ? manifest.entities : [];
const byStatus = {};
const bySiteReady = { true: 0, false: 0, null: 0 };

for (const entity of entities) {
  const status = String(entity.status ?? "unknown");
  byStatus[status] = (byStatus[status] ?? 0) + 1;
  if (entity.site_ready === true) bySiteReady.true += 1;
  else if (entity.site_ready === false) bySiteReady.false += 1;
  else bySiteReady.null += 1;
}

let siteMap = null;
if (fs.existsSync(siteMapPath)) {
  const raw = JSON.parse(fs.readFileSync(siteMapPath, "utf8"));
  siteMap = {
    generated: raw.generated ?? null,
    placeToKbCount: raw.place_to_kb ? Object.keys(raw.place_to_kb).length : 0,
  };
}

const report = {
  generatedAt: new Date().toISOString(),
  manifestGeneratedAt: manifest.generated_at ?? null,
  totalEntities: manifest.total_entities ?? entities.length,
  entitiesCounted: entities.length,
  byStatus,
  bySiteReady,
  editorialReadiness: manifest.editorial_readiness ?? null,
  siteIdMap: siteMap,
  note: "Numbers are derived from content/knowledge-base/_index/manifest.json. Do not hand-edit this snapshot.",
};

fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`);

fs.mkdirSync(path.dirname(outMd), { recursive: true });
const md = `# KB current stats (generated)

Generated: \`${report.generatedAt}\`  
Manifest \`generated_at\`: \`${report.manifestGeneratedAt}\`

| Metric | Value |
|--------|------:|
| Total entities | ${report.totalEntities} |
| site_ready=true | ${bySiteReady.true} |
| site_ready=false | ${bySiteReady.false} |
| site_ready=null | ${bySiteReady.null} |
| status=published | ${byStatus.published ?? 0} |
| status=archived | ${byStatus.archived ?? 0} |
| site_id_map place↔kb | ${siteMap?.placeToKbCount ?? 0} |

\`strict_ready\` (editorial_readiness): **${report.editorialReadiness?.strict_ready ?? "unknown"}**

Rebuild: \`node scripts/kb-manifest-stats.mjs\` (also via \`npm run content:quality\`).
`;
fs.writeFileSync(outMd, md);

console.log(
  `KB entities=${report.totalEntities} published=${byStatus.published ?? 0} archived=${byStatus.archived ?? 0} site_ready=${bySiteReady.true}`,
);
console.log(`Wrote ${path.relative(root, outJson)} and ${path.relative(root, outMd)}`);
