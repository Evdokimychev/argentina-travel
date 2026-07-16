import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("public detail status preflight", () => {
  it("checks dynamic detail slugs before a loading boundary can stream", () => {
    const middleware = readFileSync(join(process.cwd(), "src/middleware.ts"), "utf8");
    const route = readFileSync(
      join(
        process.cwd(),
        "src/app/api/public-detail-exists/[kind]/[slug]/route.ts",
      ),
      "utf8",
    );

    expect(middleware).toContain("rejectMissingPublicDetail");
    expect(middleware).toContain("response.status !== 404");
    expect(route).toContain("status: exists ? 204 : 404");
    expect(route).toContain("status: 503");
  });
});
