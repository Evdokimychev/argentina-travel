import { describe, expect, it } from "vitest";
import {
  contentFingerprint,
  contentSimilarity,
  detectLocation,
  evaluateEditorial,
  normalizeRawItem,
} from "@/lib/ingestion/content-intelligence";
import type { IngestionSourceRecord } from "@/types/ingestion";

const source: IngestionSourceRecord = {
  id: "source-1", legacyKey: null, name: "Test", sourceType: "website", status: "active",
  description: null, language: "ru", region: "Argentina", categories: [], connectionConfig: {},
  credentialRef: null, scheduleKind: "manual", scheduleExpression: null, enabled: true,
  priority: 50, trustLevel: 75, legalNotes: null, rateLimitPerMinute: 30,
  retryPolicy: { maxAttempts: 3, baseDelaySeconds: 60, maxDelaySeconds: 3600 }, timeoutSeconds: 30,
  checkpoint: {}, ownerUserId: null, lastRunAt: null, lastSuccessAt: null, nextRunAt: null,
  lastError: null, lastTestedAt: null, lastTestOk: null,
  createdAt: "2026-07-19T00:00:00Z", updatedAt: "2026-07-19T00:00:00Z",
};

describe("ingestion content intelligence", () => {
  it("normalizes, classifies and locates a useful Argentina article", () => {
    const document = normalizeRawItem({
      externalId: "mendoza", rawFormat: "html", title: "Маршрут по Мендосе",
      sourceUrl: "https://example.com/mendoza", publishedAt: "2026-07-01T00:00:00Z",
      rawContent: "Мендоса — винный регион Аргентины.\n\nКак добраться: автобус идёт 3 часа. Стоимость билета лучше проверить перед поездкой.",
    }, source);
    const decision = evaluateEditorial(document, source.trustLevel, 1, new Date("2026-07-19T00:00:00Z"));
    expect(document.province).toBe("Mendoza");
    expect(document.city).toBe("Mendoza");
    expect(document.category).toBe("transport");
    expect(decision.reasons).toEqual([]);
    expect(decision.score).toBeGreaterThanOrEqual(45);
  });

  it("rejects short unrelated text and keeps stable fingerprints", () => {
    const document = normalizeRawItem({ externalId: "x", rawFormat: "text", title: "Новость", rawContent: "Короткий текст." }, source);
    const decision = evaluateEditorial(document, 50);
    expect(decision.status).toBe("rejected");
    expect(decision.reasons).toContain("argentina_relevance_not_found");
    expect(contentFingerprint("Ёлка", "https://a.test Привет")).toBe(contentFingerprint("Елка", "Привет"));
  });

  it("detects near duplicate bodies", () => {
    expect(contentSimilarity(
      "Путешествие по Аргентине начинается в Буэнос-Айресе и продолжается в Мендосе",
      "Путешествие по Аргентине начинается в Буэнос-Айресе и затем продолжается в Мендосе",
    )).toBeGreaterThan(0.5);
    expect(detectLocation("Поездка в Ушуайю и на Огненную землю")).toEqual({ province: "Tierra del Fuego", city: "Ushuaia" });
  });
});
