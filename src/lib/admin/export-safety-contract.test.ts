import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const routes = [
  "src/app/api/admin/bookings/export/route.ts",
  "src/app/api/admin/shop/orders/export/route.ts",
  "src/app/api/admin/leads/export/route.ts",
];

describe("admin CSV exports", () => {
  it.each(routes)("pages every row and protects spreadsheet cells in %s", (path) => {
    const source = readFileSync(path, "utf8");
    expect(source).toContain("collectAdminExportRows");
    expect(source).toContain(".range(from, to)");
    expect(source).toContain("escapeCsvCell");
    expect(source).not.toMatch(/\.limit\((200|500)\)/);
    expect(source).not.toContain("error.message");
    expect(source).toContain('"Cache-Control": "private, no-store"');
    expect(source).toContain('"X-Content-Type-Options": "nosniff"');
  });
});
