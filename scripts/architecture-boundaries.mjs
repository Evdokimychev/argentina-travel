#!/usr/bin/env node
/**
 * Lightweight architecture boundary check (Sprint 7).
 * Fails on obvious cross-layer leaks — not a full dependency-cruiser install.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const violations = [];

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (/\.(ts|tsx|mjs|js)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

const libFiles = walk(path.join(root, "src/lib"));
const importApp = /from\s+["']@\/app\//;
const clientTripster = /from\s+["']@\/lib\/tripster\//;

for (const file of libFiles) {
  const rel = path.relative(root, file);
  // Domain/application libs must not import App Router trees.
  if (rel.includes(`${path.sep}domain${path.sep}`) || rel.includes(`${path.sep}application${path.sep}`)) {
    const text = fs.readFileSync(file, "utf8");
    if (importApp.test(text)) {
      violations.push(`${rel}: domain/application must not import @/app`);
    }
  }
}

// Client components must not import server-only tripster internals with secrets patterns.
const componentFiles = walk(path.join(root, "src/components"));
for (const file of componentFiles) {
  const text = fs.readFileSync(file, "utf8").slice(0, 400);
  if (!text.includes('"use client"') && !text.includes("'use client'")) continue;
  const full = fs.readFileSync(file, "utf8");
  if (full.includes("SUPABASE_SERVICE_ROLE") || full.includes("createSupabaseAdminClient")) {
    violations.push(`${path.relative(root, file)}: client component imports admin/service-role surface`);
  }
  // Soft: tripster server client in client components is discouraged
  if (clientTripster.test(full) && full.includes("tripster-server")) {
    violations.push(`${path.relative(root, file)}: client imports tripster-server`);
  }
}

if (violations.length) {
  console.error("architecture:check FAILED");
  for (const v of violations) console.error(` - ${v}`);
  process.exit(1);
}

console.log("architecture:check OK");
