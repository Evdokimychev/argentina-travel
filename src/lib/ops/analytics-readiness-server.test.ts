import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";

const reportPath = path.join(process.cwd(), "var/ops/analytics-readiness-last.json");

describe("analytics-readiness-server", () => {
  let originalReport: string | null = null;

  beforeEach(() => {
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
  });

  it("fetchAnalyticsReadinessSnapshot parses script report JSON", async () => {
    const payload = {
      ok: true,
      ranAt: "2026-07-01T12:00:00.000Z",
      baseUrl: "https://www.goargentina.ru",
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
