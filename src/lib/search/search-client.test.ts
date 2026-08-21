import { afterEach, describe, expect, it, vi } from "vitest";
import {
  dedupeSearchHits,
  fetchSiteSearch,
  mergeSearchAbortSignals,
} from "@/lib/search/search-client";
import type { SearchHit } from "@/lib/search/types";

function hit(overrides: Partial<SearchHit>): SearchHit {
  return {
    id: "result",
    kind: "blog",
    kindLabel: "Блог",
    title: "Malbec в Мендосе",
    url: "/blog/malbec",
    score: 10,
    ...overrides,
  };
}

describe("dedupeSearchHits", () => {
  it("keeps the first ranked result for duplicate titles and URLs", () => {
    const results = dedupeSearchHits([
      hit({ id: "best", url: "/blog/food-malbec" }),
      hit({ id: "same-title", url: "/blog/wine-malbec", score: 9 }),
      hit({ id: "same-url", title: "Другое название", url: "/blog/food-malbec", score: 8 }),
      hit({ id: "unique", title: "Винодельни Мендосы", url: "/blog/wineries", score: 7 }),
    ]);

    expect(results.map((result) => result.id)).toEqual(["best", "unique"]);
  });
});

describe("mergeSearchAbortSignals", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("aborts on timeout without marking the caller signal aborted", () => {
    vi.useFakeTimers();
    const caller = new AbortController();
    const { signal, cleanup } = mergeSearchAbortSignals(caller.signal, 100);

    expect(signal.aborted).toBe(false);
    vi.advanceTimersByTime(100);
    expect(signal.aborted).toBe(true);
    expect(caller.signal.aborted).toBe(false);
    cleanup();
  });

  it("propagates caller abort to the merged signal", () => {
    const caller = new AbortController();
    const { signal, cleanup } = mergeSearchAbortSignals(caller.signal, 60_000);
    caller.abort();
    expect(signal.aborted).toBe(true);
    cleanup();
  });
});

describe("fetchSiteSearch timeout", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("rejects when the live search exceeds the client timeout", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          const signal = init?.signal;
          if (!signal) return;
          signal.addEventListener(
            "abort",
            () => reject(Object.assign(new Error("Aborted"), { name: "AbortError" })),
            { once: true },
          );
        });
      }),
    );

    const pending = fetchSiteSearch("Патагония", { timeoutMs: 50 });
    const expectation = expect(pending).rejects.toMatchObject({ name: "AbortError" });
    await vi.advanceTimersByTimeAsync(50);
    await expectation;
  });
});
