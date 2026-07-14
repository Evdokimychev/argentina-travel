#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), ".next/static");
const forbidden = ["demo123", "argentina-travel-auth-users"];
const findings = [];

function walk(directory) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(target);
    } else if (entry.name.endsWith(".js")) {
      const source = fs.readFileSync(target, "utf8");
      for (const marker of forbidden) {
        if (source.includes(marker)) findings.push(`${path.relative(process.cwd(), target)}: ${marker}`);
      }
    }
  }
}

walk(root);
if (findings.length > 0) {
  console.error(`Demo authentication leaked into production client bundle:\n${findings.join("\n")}`);
  process.exit(1);
}
console.log("Production client bundle contains no demo authentication adapter markers");
