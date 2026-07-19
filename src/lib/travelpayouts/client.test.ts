import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTravelpayoutsPartnerLinks } from "@/lib/travelpayouts/client";

const MARKER = 434047;
const TRS = 427300;

function responseBody(
  links: Array<{
    url: string;
    code: string;
    partner_url?: string;
    message?: string;
  }>,
  overrides: Record<string, unknown> = {}
) {
  return {
    code: "success",
    status: 200,
    result: {
      trs: TRS,
      marker: MARKER,
      shorten: true,
      links,
    },
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Travelpayouts Links API client", () => {
  beforeEach(() => {
    vi.stubEnv("TRAVELPAYOUTS_API_KEY", "test-key");
    vi.stubEnv("TRAVELPAYOUTS_MARKER", String(MARKER));
    vi.stubEnv("TRAVELPAYOUTS_TRS", String(TRS));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns only a complete successful response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(
        responseBody([
          {
            url: "https://tp.media/r?marker=434047",
            partner_url: "https://tp.media/r?marker=434047",
            code: "success",
          },
        ])
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await createTravelpayoutsPartnerLinks([
      { url: "https://experience.tripster.ru/experience/1/", subId: "tripster:test:1" },
    ]);

    expect(result).toEqual([
      {
        url: "https://tp.media/r?marker=434047",
        partnerUrl: "https://tp.media/r?marker=434047",
        code: "success",
        message: undefined,
      },
    ]);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("rejects an empty or malformed success payload", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ code: "success", status: 200 })));

    await expect(
      createTravelpayoutsPartnerLinks([{ url: "https://youtravel.me/tours/1" }])
    ).rejects.toMatchObject({ status: 502 });
  });

  it("rejects partial per-link failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          responseBody([
            { url: "https://tp.media/r?one", code: "success" },
            { url: "https://youtravel.me/tours/2", code: "failed", message: "unsupported" },
          ])
        )
      )
    );

    await expect(
      createTravelpayoutsPartnerLinks([
        { url: "https://youtravel.me/tours/1" },
        { url: "https://youtravel.me/tours/2" },
      ])
    ).rejects.toThrow("Travelpayouts link 2 failed: unsupported");
  });

  it("rejects a response with a mismatched link count", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(responseBody([{ url: "https://tp.media/r?one", code: "success" }]))
      )
    );

    await expect(
      createTravelpayoutsPartnerLinks([
        { url: "https://www.sputnik8.com/tour/1" },
        { url: "https://www.sputnik8.com/tour/2" },
      ])
    ).rejects.toThrow("mismatched links payload");
  });

  it("rejects attribution identifiers from another account", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          responseBody([{ url: "https://tp.media/r?one", code: "success" }], {
            result: {
              trs: TRS,
              marker: 999,
              shorten: true,
              links: [{ url: "https://tp.media/r?one", code: "success" }],
            },
          })
        )
      )
    );

    await expect(
      createTravelpayoutsPartnerLinks([{ url: "https://experience.tripster.ru/experience/1/" }])
    ).rejects.toThrow("mismatched attribution identifiers");
  });

  it("aborts a request after the configured timeout", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError"))
          );
        })
      )
    );

    await expect(
      createTravelpayoutsPartnerLinks(
        [{ url: "https://experience.tripster.ru/experience/1/" }],
        { timeoutMs: 5 }
      )
    ).rejects.toMatchObject({ status: 504 });
  });
});
