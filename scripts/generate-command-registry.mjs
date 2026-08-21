#!/usr/bin/env node
/**
 * Generate command registry + golden-path view from package.json + taxonomy map.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const scripts = pkg.scripts ?? {};

/** @type {Record<string, string>} */
const taxonomy = {
  dev: "GOLDEN_PATH",
  "dev:clean": "GOLDEN_PATH",
  "audit:quick": "GOLDEN_PATH",
  "release:gate": "GOLDEN_PATH",
  "quality:static": "CI",
  "quality:contracts": "CI",
  "quality:content": "CI",
  "quality:security": "CI",
  "quality:commerce": "CI",
  "quality:journeys": "CI",
  "quality:production": "CI",
  audit: "RELEASE",
  "production-smoke": "RELEASE",
  "inventory:generate": "DIAGNOSTIC",
  "inventory:check": "CI",
  "architecture:check": "CI",
  "modules:lifecycle": "DIAGNOSTIC",
  "commands:registry": "DIAGNOSTIC",
  "content:crawl": "DIAGNOSTIC",
  "content:audit": "DIAGNOSTIC",
  "content:fix": "DIAGNOSTIC",
};

const aliases = [
  { keep: "content:audit", also: ["content:crawl", "content:fix"] },
  { keep: "release:gate", also: ["quality:static", "quality:contracts", "quality:content", "quality:security", "quality:commerce", "quality:journeys", "quality:production"] },
];

const rows = Object.keys(scripts)
  .sort()
  .map((name) => ({
    name,
    command: scripts[name],
    class: taxonomy[name] ?? inferClass(name),
  }));

function inferClass(name) {
  if (name.startsWith("quality:") || name.startsWith("test:") || name.includes("audit")) return "CI";
  if (name.includes("migrate") || name.includes("sync") || name.includes("cutover")) return "MIGRATION";
  if (name.includes("verify") || name.includes("smoke") || name.includes("gate")) return "RELEASE";
  if (name.startsWith("dev")) return "GOLDEN_PATH";
  return "DIAGNOSTIC";
}

const outDir = path.join(root, "docs/project-governance");
fs.mkdirSync(outDir, { recursive: true });
const payload = {
  generatedAt: new Date().toISOString(),
  scriptCount: rows.length,
  goldenPath: rows.filter((r) => r.class === "GOLDEN_PATH").map((r) => r.name),
  byClass: rows.reduce((acc, row) => {
    (acc[row.class] ??= []).push(row.name);
    return acc;
  }, {}),
  aliases,
  scripts: rows,
};

fs.writeFileSync(path.join(outDir, "COMMAND_REGISTRY.json"), JSON.stringify(payload, null, 2) + "\n");
fs.writeFileSync(
  path.join(outDir, "GOLDEN_PATH.md"),
  `# Golden developer / agent path

Use these first — do not scan all ${rows.length} npm scripts.

\`\`\`bash
npm run dev              # local app
npm run audit:quick      # tsc + lint + unit (fast confidence)
npm run release:gate     # full release matrix (same evidence as CI verify core)
npm run production-smoke # against SMOKE_BASE_URL / production
\`\`\`

Domain deep-dives stay available as \`npm run quality:<group>\` (aliases into \`release:gate --group\`).

Generated: ${payload.generatedAt}
`,
);

console.log(`commands:registry wrote ${rows.length} scripts`);
