import { describe, expect, it } from "vitest";
import { normalizeSiteError } from "@/lib/site-feedback/normalize-error";

describe("normalizeSiteError", () => {
  it("maps network failures to offline hint", () => {
    const result = normalizeSiteError(new Error("Failed to fetch"));
    expect(result.title).toBe("Нет связи с сервером");
  });

  it("maps service unavailable errors", () => {
    const result = normalizeSiteError(new Error("exceed_egress_quota"));
    expect(result.title).toBe("Сервис временно недоступен");
  });

  it("maps rate limit errors", () => {
    const result = normalizeSiteError(new Error("429 Too Many Requests"));
    expect(result.title).toBe("Слишком много запросов");
  });

  it("merges context overrides", () => {
    const result = normalizeSiteError(new Error("Failed to fetch"), {
      title: "Каталог недоступен",
    });
    expect(result.title).toBe("Каталог недоступен");
  });
});
