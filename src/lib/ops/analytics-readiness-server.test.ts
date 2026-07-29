import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";

const { getGitSha } = vi.hoisted(() => ({ getGitSha: vi.fn(() => "1234567890abcdef") }));

vi.mock("@/lib/monitoring/build-info", () => ({ getGitSha }));

const reportPath = path.join(process.cwd(), "var/ops/analytics-readiness-last.json");

describe("analytics-readiness-server", () => {
  let originalReport: string | null = null;
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://www.goargentina.ru";
    getGitSha.mockReturnValue("1234567890abcdef");
    if (fs.existsSync(reportPath)) {
      originalReport = fs.readFileSync(reportPath, "utf8");
    }
  });

  afterEach(() => {
    if (originalReport != null) {
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
      fs.writeFileSync(reportPath, originalReport, "utf8");
    } else if (fs.existsSync(reportPath)) {
      fs.unlinkSync(reportPath);
    }
    vi.resetModules();
    if (originalSiteUrl == null) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  });

  it("fetchAnalyticsReadinessSnapshot parses script report JSON", async () => {
    const payload = {
      ok: true,
      generatedAt: new Date().toISOString(),
      ranAt: new Date().toISOString(),
      baseUrl: "https://www.goargentina.ru",
      gitSha: "1234567",
      checks: [
        {
          id: "live:gtm",
          label: "Live GTM snippet",
          status: "ok",
          message: "found",
          category: "live",
        },
      ],
      summary: { ok: 1, warn: 0, fail: 0, skip: 0 },
      gtmEventsCount: 17,
      conversionsRecommended: ["booking_submit", "contact_form_submit", "newsletter_subscribe"],
    };

    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

    const { fetchAnalyticsReadinessSnapshot } = await import("@/lib/ops/analytics-readiness-server");
    const snapshot = fetchAnalyticsReadinessSnapshot();

    expect(snapshot.source).toBe("script");
    expect(snapshot.ok).toBe(true);
    expect(snapshot.gtmEventsCount).toBe(17);
    expect(snapshot.conversionsRecommended).toEqual([
      "booking_submit",
      "contact_form_submit",
      "newsletter_subscribe",
    ]);
    expect(snapshot.checks[0]?.id).toBe("live:gtm");
  });

  it("rejects a stale report instead of showing it as current", async () => {
    const payload = {
      ok: true,
      generatedAt: "2026-07-01T12:00:00.000Z",
      ranAt: "2026-07-01T12:00:00.000Z",
      baseUrl: "https://www.goargentina.ru",
      gitSha: "1234567890abcdef",
      checks: [],
      summary: { ok: 1, warn: 0, fail: 0, skip: 0 },
    };
    fs.writeFileSync(reportPath, `${JSON.stringify(payload)}\n`, "utf8");

    const { fetchAnalyticsReadinessSnapshot } = await import("@/lib/ops/analytics-readiness-server");
    const snapshot = fetchAnalyticsReadinessSnapshot();

    expect(snapshot.source).toBe("stale");
    expect(snapshot.ok).toBe(false);
    expect(snapshot.checks[0]?.id).toBe("script:evidence-rejected");
  });

  it("rejects reports from another host or deployment", async () => {
    const generatedAt = new Date().toISOString();
    const payload = {
      ok: true,
      generatedAt,
      ranAt: generatedAt,
      baseUrl: "https://preview.example.com",
      gitSha: "abcdef1234567890",
      checks: [],
      summary: { ok: 1, warn: 0, fail: 0, skip: 0 },
    };
    fs.writeFileSync(reportPath, `${JSON.stringify(payload)}\n`, "utf8");

    const { fetchAnalyticsReadinessSnapshot } = await import("@/lib/ops/analytics-readiness-server");
    const snapshot = fetchAnalyticsReadinessSnapshot();

    expect(snapshot.source).toBe("invalid");
    expect(snapshot.checks[0]?.message).toContain("base_url_mismatch");
    expect(snapshot.checks[0]?.message).toContain("git_sha_mismatch");
  });

  it("fetchAnalyticsReadinessSnapshot returns missing placeholder when report absent", async () => {
    if (fs.existsSync(reportPath)) {
      fs.unlinkSync(reportPath);
    }

    const { fetchAnalyticsReadinessSnapshot } = await import("@/lib/ops/analytics-readiness-server");
    const snapshot = fetchAnalyticsReadinessSnapshot();

    expect(snapshot.source).toBe("missing");
    expect(snapshot.ok).toBe(false);
    expect(snapshot.checks.some((check) => check.id === "script:missing")).toBe(true);
  });
});
