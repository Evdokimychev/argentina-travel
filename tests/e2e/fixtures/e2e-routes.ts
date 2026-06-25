import fs from "node:fs";
import path from "node:path";

export type RouteCategory = "public" | "auth" | "cabinet" | "embed" | "booking";

export type E2ERoute = {
  path: string;
  label?: string;
  category: RouteCategory;
  skipHorizontalScroll?: boolean;
  expectAuthWall?: boolean;
};

const REPO_ROOT = path.resolve(__dirname, "../../..");
const APP_DIR = path.join(REPO_ROOT, "src/app");

/** Routes excluded from the manifest (tokens, maintenance, dev-only). */
const SKIP_PATTERN_REGEXES = [
  /^\/maintenance$/,
  /^\/dev\//,
  /\/\[token\]/,
  /^\/booking\/pay\//,
  /^\/booking\/travelers\//,
  /^\/trip\//,
];

/** Dynamic patterns we cannot resolve without live DB / API. */
const SKIP_UNRESOLVED_PATTERNS = [
  /^\/admin\/content\/documents\/\[id\]/,
  /^\/organizer\/tours\/\[id\]/,
  /^\/organizer\/bookings\/\[id\]/,
  /^\/organizer\/waitlist\/\[id\]/,
  /^\/organizer\/articles\/\[id\]/,
  /^\/profile\/bookings\/\[id\]/,
  /^\/forum\/\[category\]\/\[threadId\]/,
  /^\/forum\/\[category\]$/,
  /^\/audio-guides\/\[id\]$/,
  /^\/excursions\/guide\/\[guideId\]$/,
  /^\/excursions\/\[slug\]$/,
  /^\/excursions\/city\/\[citySlug\]$/,
  /^\/blog\/author\/\[slug\]$/,
];

const SLUG_BY_PARENT: Record<string, string> = {
  tours: "patagonia-glaciers",
  blog: "buenos-aires-rajony",
  destinations: "patagonia",
  places: "iguazu-falls",
  guide: "sezony-i-klimat",
  collections: "patagonia-highlights",
  immigration: "dokumenty-dlya-vyezda",
  legal: "privacy",
  itineraries: "patagonia-classic-10-days",
  shop: "patagonia-pdf-guide",
  experts: "maria-iguazu",
  organizers: "ivan-evdokimychev",
};

const SEGMENT_DEFAULTS: Record<string, string> = {
  "[hubId]": "national-parks",
  "[route]": "mow-bue",
};

/** Extra public routes not always discovered by the scanner. */
const CURATED_EXTRAS: E2ERoute[] = [
  { path: "/blog/natsionalnyy-park-iguasu", category: "public" },
  { path: "/blog/hub/national-parks", category: "public" },
  { path: "/blog/authors", category: "public" },
  { path: "/guide/ob-argentine", category: "public" },
  { path: "/map", category: "public", label: "legacy redirect → /mapa-argentina" },
  { path: "/podbor", category: "public" },
];

function filePathToRoutePattern(relativePath: string): string {
  const withoutPage = relativePath.replace(/\/page\.tsx$/, "").replace(/^page\.tsx$/, "");
  if (!withoutPage) return "/";
  return `/${withoutPage.split(path.sep).join("/")}`;
}

function shouldSkipPattern(pattern: string): boolean {
  return (
    SKIP_PATTERN_REGEXES.some((regex) => regex.test(pattern)) ||
    SKIP_UNRESOLVED_PATTERNS.some((regex) => regex.test(pattern))
  );
}

function resolveDynamicSegment(segment: string, parentSegments: string[]): string | null {
  if (segment === "[slug]") {
    const parent = parentSegments.at(-1) ?? "";
    return SLUG_BY_PARENT[parent] ?? null;
  }
  return SEGMENT_DEFAULTS[segment] ?? null;
}

function expandRoutePattern(pattern: string): string | null {
  if (shouldSkipPattern(pattern)) return null;
  if (!pattern.includes("[")) return pattern;

  const segments = pattern.split("/").filter(Boolean);
  const resolved: string[] = [];

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index]!;
    if (segment.startsWith("[")) {
      const value = resolveDynamicSegment(segment, segments.slice(0, index));
      if (!value) return null;
      resolved.push(value);
    } else {
      resolved.push(segment);
    }
  }

  return `/${resolved.join("/")}`;
}

function scanAppRoutePatterns(): string[] {
  const patterns: string[] = [];

  function walk(directory: string) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name === "page.tsx") {
        patterns.push(filePathToRoutePattern(path.relative(APP_DIR, fullPath)));
      }
    }
  }

  walk(APP_DIR);
  return patterns;
}

function categorizeRoute(routePath: string): RouteCategory {
  if (
    routePath.startsWith("/profile") ||
    routePath.startsWith("/admin") ||
    routePath.startsWith("/organizer")
  ) {
    return "cabinet";
  }
  if (routePath.startsWith("/embed")) return "embed";
  if (routePath.startsWith("/booking")) return "booking";
  if (routePath.startsWith("/auth")) return "auth";
  return "public";
}

export function buildE2ERoutes(): E2ERoute[] {
  const routes = new Map<string, E2ERoute>();

  for (const pattern of scanAppRoutePatterns()) {
    const expanded = expandRoutePattern(pattern);
    if (!expanded) continue;

    const category = categorizeRoute(expanded);
    routes.set(expanded, {
      path: expanded,
      label: pattern !== expanded ? pattern : undefined,
      category,
      expectAuthWall: category === "cabinet",
    });
  }

  for (const extra of CURATED_EXTRAS) {
    if (!routes.has(extra.path)) {
      routes.set(extra.path, extra);
    }
  }

  return [...routes.values()].sort((left, right) => left.path.localeCompare(right.path));
}

export const E2E_ROUTES = buildE2ERoutes();
export const PUBLIC_ROUTES = E2E_ROUTES.filter((route) => !route.expectAuthWall);
export const AUTH_WALL_ROUTES = E2E_ROUTES.filter((route) => route.expectAuthWall);
export const ROUTE_COUNT = E2E_ROUTES.length;
