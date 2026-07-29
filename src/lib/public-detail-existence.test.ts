import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  classifyPartnerError,
  partnerOk,
  partnerUnavailable,
} from "@/lib/partner-source-result";
import { requireHealthyTourSlugSnapshot } from "@/lib/public-detail-existence";

describe("public detail existence contracts", () => {
  it("keeps middleware free of self-HEAD existence preflight", () => {
    const middleware = readFileSync(join(process.cwd(), "src/middleware.ts"), "utf8");
    expect(middleware).not.toContain("rejectMissingPublicDetail");
    expect(middleware).not.toContain("/api/public-detail-exists/");
    expect(middleware).toContain("matchUrlRedirectEdge");
  });

  it("maps three-state existence to 204/404/503 without long negative CDN cache on unavailable", () => {
    const route = readFileSync(
      join(
        process.cwd(),
        "src/app/api/public-detail-exists/[kind]/[slug]/route.ts",
      ),
      "utf8",
    );
    const existence = readFileSync(
      join(process.cwd(), "src/lib/public-detail-existence.ts"),
      "utf8",
    );

    expect(existence).toContain('status: "exists"');
    expect(existence).toContain('status: "missing"');
    expect(existence).toContain('status: "unavailable"');
    expect(route).toContain('case "exists"');
    expect(route).toContain('case "missing"');
    expect(route).toContain('case "unavailable"');
    expect(route).toContain('status: 503');
    expect(route).toContain('"Cache-Control": "no-store"');
    expect(route).not.toContain("status: exists ? 204 : 404");
  });

  it("never stores a degraded tour-slug snapshot as a successful cache value", () => {
    expect(() =>
      requireHealthyTourSlugSnapshot({
        snapshotId: "n0:t-unavail:y0",
        slugs: new Set(),
        unavailableReasons: ["tripster:quota"],
      }),
    ).toThrow("public_tour_slug_snapshot_unavailable:tripster:quota");

    const healthy = {
      snapshotId: "n1:t1:y1",
      slugs: new Set(["known-tour"]),
      unavailableReasons: [],
    };
    expect(requireHealthyTourSlugSnapshot(healthy)).toBe(healthy);
  });
});

describe("partner source result", () => {
  it("classifies egress quota as quota and keeps ok/unavailable distinct", () => {
    expect(classifyPartnerError(new Error("exceed_egress_quota 402"))).toBe("quota");
    expect(partnerOk(["a"]).status).toBe("ok");
    const unavailable = partnerUnavailable("timeout", "timed out");
    expect(unavailable.status).toBe("unavailable");
    if (unavailable.status === "unavailable") {
      expect(unavailable.retryable).toBe(true);
    }
  });
});
