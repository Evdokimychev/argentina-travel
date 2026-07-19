import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function routeFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);
    return entry.isDirectory()
      ? routeFiles(filePath)
      : entry.isFile() && entry.name === "route.ts"
        ? [filePath]
        : [];
  });
}

describe("admin API authentication boundary", () => {
  it("protects every admin route and keeps the session response private", () => {
    const routes = routeFiles("src/app/api/admin");
    expect(routes.length).toBeGreaterThan(80);

    for (const path of routes) {
      const source = readFileSync(path, "utf8");
      if (path.endsWith("/session/route.ts")) {
        expect(source).toContain("loadSessionUserFromSupabase");
        expect(source).toContain('"Cache-Control": "private, no-store"');
        expect(source).not.toContain("Supabase is not configured");
        expect(source).not.toContain("Unauthorized");
        continue;
      }
      expect(source, path).toMatch(
        /authorizeAdminRequest|authorizeStaffManagementRequest|authorizeShopCatalogOwner/,
      );
    }
  });
});
