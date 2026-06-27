#!/usr/bin/env tsx
/**
 * Audit tour listings for geography mismatches.
 *
 * Usage:
 *   tsx scripts/audit-tour-locations.ts
 *   npm run geo:audit-tours
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateTourLocation } from "../src/lib/geo/validation";
import { resolveTourPrimaryLocation } from "../src/lib/geo/format";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

type AuditTour = {
  id: string;
  title: string;
  destination: string;
  region: string;
  country: string;
  cities: string[];
};

function loadToursFromSeed(): AuditTour[] {
  const seedPath = path.join(root, "prisma/seed-data/tours.json");
  if (!fs.existsSync(seedPath)) return [];

  const raw = JSON.parse(fs.readFileSync(seedPath, "utf8")) as Array<Record<string, unknown>>;
  if (!Array.isArray(raw)) return [];

  return raw.map((tour, index) => {
    const geography = (tour.geography ?? {}) as Record<string, unknown>;
    return {
      id: String(tour.id ?? tour.slug ?? index),
      title: String(tour.title ?? ""),
      destination: String(tour.destination ?? geography.destination ?? ""),
      region: String(tour.region ?? geography.region ?? ""),
      country: String(tour.country ?? geography.country ?? "Аргентина"),
      cities: Array.isArray(tour.cities)
        ? tour.cities.map(String)
        : Array.isArray(geography.cities)
          ? geography.cities.map(String)
          : [],
    };
  });
}

function scanStaticTourFiles(): AuditTour[] {
  const toursDir = path.join(root, "src/data/tours");
  if (!fs.existsSync(toursDir)) return [];

  const tours: AuditTour[] = [];
  for (const file of fs.readdirSync(toursDir).filter((f) => f.endsWith(".ts"))) {
    const content = fs.readFileSync(path.join(toursDir, file), "utf8");
    const destination = content.match(/destination:\s*["']([^"']+)["']/)?.[1];
    const region = content.match(/region:\s*["']([^"']+)["']/)?.[1];
    if (destination || region) {
      tours.push({
        id: file.replace(/\.ts$/, ""),
        title: file,
        destination: destination ?? "",
        region: region ?? "",
        country: "Аргентина",
        cities: [],
      });
    }
  }
  return tours;
}

function main() {
  const tours = [...loadToursFromSeed(), ...scanStaticTourFiles()];
  const mismatches: Array<{
    id: string;
    title: string;
    destination: string;
    region: string;
    suggestedPrimary: string;
    warnings: string[];
  }> = [];

  for (const tour of tours) {
    const warnings = validateTourLocation(tour);
    if (warnings.length === 0) continue;

    const primary = resolveTourPrimaryLocation(tour);
    mismatches.push({
      id: tour.id,
      title: tour.title,
      destination: tour.destination,
      region: tour.region,
      suggestedPrimary: primary.primary,
      warnings: warnings.map((w) => w.message),
    });
  }

  console.log(`\nGeo audit: ${tours.length} tours scanned, ${mismatches.length} mismatches\n`);

  if (mismatches.length === 0) {
    console.log("No geography mismatches found.");
    process.exit(0);
  }

  for (const item of mismatches) {
    console.log(`— ${item.id}: ${item.title}`);
    console.log(`  destination: ${item.destination || "—"} | region: ${item.region || "—"}`);
    console.log(`  suggested: ${item.suggestedPrimary}`);
    for (const warning of item.warnings) {
      console.log(`  ⚠ ${warning}`);
    }
    console.log("");
  }

  process.exit(1);
}

main();
