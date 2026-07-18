import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import {
  describeSearchCredential,
  fetchGoogleSearchPerformance,
  fetchYandexSearchPerformance,
} from "@/lib/seo/search-provider-clients";

describe("search provider clients", () => {
  it("validates and labels Google service-account credentials", () => {
    const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const secret = JSON.stringify({
      type: "service_account",
      client_email: "seo-reader@example.iam.gserviceaccount.com",
      private_key: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
    });
    expect(describeSearchCredential("google_search_console", secret)).toBe(
      "seo-reader@example.iam.gserviceaccount.com",
    );
  });

  it("rejects a non-Google token endpoint in a service-account file", () => {
    const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const secret = JSON.stringify({
      type: "service_account",
      client_email: "seo-reader@example.iam.gserviceaccount.com",
      private_key: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
      token_uri: "https://example.com/token",
    });
    expect(() => describeSearchCredential("google_search_console", secret)).toThrow(
      "неподдерживаемый адрес",
    );
  });

  it("normalizes Google query, page, country and device rows", async () => {
    const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "access" }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            rows: [
              {
                keys: ["2026-07-10", "туры в аргентину", "https://www.goargentina.ru/", "rus", "mobile"],
                clicks: 3,
                impressions: 30,
                ctr: 0.1,
                position: 7.4,
              },
            ],
          }),
          { status: 200 },
        ),
      );
    const rows = await fetchGoogleSearchPerformance({
      propertyUrl: "sc-domain:goargentina.ru",
      secret: JSON.stringify({
        type: "service_account",
        client_email: "seo-reader@example.iam.gserviceaccount.com",
        private_key: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
      }),
      dateFrom: "2026-07-01",
      dateTo: "2026-07-10",
      fetchImpl,
    });
    expect(rows).toEqual([
      expect.objectContaining({
        provider: "google_search_console",
        query: "туры в аргентину",
        page: "https://www.goargentina.ru/",
        impressions: 30,
        position: 7.4,
      }),
    ]);
  });

  it("discovers the matching Yandex host and returns popular queries", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ user_id: 42 }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            hosts: [{ host_id: "https:www.goargentina.ru:443", ascii_host_url: "https://www.goargentina.ru/" }],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            date_to: "2026-07-16T00:00:00Z",
            queries: [
              {
                query_text: "переезд в аргентину",
                indicators: { TOTAL_SHOWS: 50, TOTAL_CLICKS: 5, AVG_SHOW_POSITION: 8.2 },
              },
            ],
          }),
          { status: 200 },
        ),
      );
    const rows = await fetchYandexSearchPerformance({
      propertyUrl: "https://www.goargentina.ru/",
      secret: "12345678901234567890-token",
      fetchImpl,
    });
    expect(rows[0]).toEqual(
      expect.objectContaining({
        provider: "yandex_webmaster",
        query: "переезд в аргентину",
        metricDate: "2026-07-16",
        ctr: 0.1,
        position: 8.2,
      }),
    );
    expect(String(fetchImpl.mock.calls[2]?.[0])).toContain("search-queries/popular");
  });
});
