import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SITE_FOOTER_NAV } from "@/data/site-links";
import { SITE_NAV_SECTIONS } from "@/data/site-nav";
import { DEFAULT_SITE_MODULES, DEFAULT_SITE_NAVIGATION } from "@/lib/cms/site-globals/normalize";
import {
  PRODUCT_MODULE_REGISTRY,
  resolveProductModuleSnapshots,
} from "@/lib/modules/registry";
import { flattenSiteNavSections } from "@/lib/site-nav";

const APP_ROOT = path.join(process.cwd(), "src/app");

function collectPageFiles(directory = APP_ROOT): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectPageFiles(absolute);
    return entry.name === "page.tsx" ? [absolute] : [];
  });
}

function pageFileToPattern(file: string): RegExp {
  const relative = path.relative(APP_ROOT, path.dirname(file));
  const route = relative === "" ? "/" : `/${relative}`;
  const pattern = route
    .split("/")
    .filter((segment) => segment && !/^\(.+\)$/.test(segment))
    .map((segment) => {
      if (/^\[\[\.\.\..+\]\]$/.test(segment)) return "(?:.*)?";
      if (/^\[\.\.\..+\]$/.test(segment)) return ".+";
      if (/^\[.+\]$/.test(segment)) return "[^/]+";
      return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("/");
  return new RegExp(`^/${pattern}/?$`.replace("^//", "^/"));
}

const pagePatterns = collectPageFiles().map(pageFileToPattern);

function cleanInternalPath(href: string): string | null {
  if (!href.startsWith("/") || href.startsWith("//")) return null;
  return new URL(href, "https://www.goargentina.ru").pathname;
}

function hasPage(href: string): boolean {
  const pathname = cleanInternalPath(href);
  return pathname ? pagePatterns.some((pattern) => pattern.test(pathname)) : true;
}

describe("module and navigation route consistency", () => {
  it("keeps every public navigation link connected to a real page", () => {
    const hrefs = [
      ...flattenSiteNavSections(SITE_NAV_SECTIONS).map((link) => link.href),
      ...SITE_FOOTER_NAV.map((link) => link.href),
    ];
    const broken = hrefs.filter((href) => cleanInternalPath(href) && !hasPage(href));
    expect(broken).toEqual([]);
  });

  it("keeps every available module connected to real public and admin pages", () => {
    const broken = PRODUCT_MODULE_REGISTRY.flatMap((module) => {
      const issues: string[] = [];
      if (module.codeAvailable && module.publicPath && !hasPage(module.publicPath)) {
        issues.push(`${module.id}:public:${module.publicPath}`);
      }
      if (module.codeAvailable && !hasPage(module.adminPath)) {
        issues.push(`${module.id}:admin:${module.adminPath}`);
      }
      return issues;
    });
    expect(broken).toEqual([]);
  });

  it("keeps the immigration regression fixed and statically generated", () => {
    const hub = readFileSync(path.join(APP_ROOT, "immigration/page.tsx"), "utf8");
    const detail = readFileSync(path.join(APP_ROOT, "immigration/[slug]/page.tsx"), "utf8");
    const nextConfig = readFileSync(path.join(process.cwd(), "next.config.ts"), "utf8");

    expect(hub).not.toContain("notFound();");
    expect(detail).toContain("getAllImmigrationTopics()");
    expect(detail).toContain("<ImmigrationPillarView topic={topic} />");
    expect(nextConfig).toContain('source: "/migration"');
    expect(nextConfig).toContain('destination: "/immigration"');
  });

  it("marks dependent modules unavailable when their parent is disabled", () => {
    const modules = {
      ...DEFAULT_SITE_MODULES,
      publicModules: {
        ...DEFAULT_SITE_MODULES.publicModules,
        geography: {
          ...DEFAULT_SITE_MODULES.publicModules.geography,
          activated: false,
        },
      },
    };
    const snapshots = resolveProductModuleSnapshots(DEFAULT_SITE_NAVIGATION, modules);

    expect(snapshots.find((module) => module.id === "destinations")?.status).toBe(
      "dependency_unavailable",
    );
    expect(snapshots.find((module) => module.id === "places")?.publicAvailable).toBe(false);
  });
});
