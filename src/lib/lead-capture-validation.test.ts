import { describe, expect, it } from "vitest";
import {
  LeadCaptureValidationError,
  normalizeContactRequest,
  normalizeContactSubmission,
  normalizeNewsletterSubmission,
  readLimitedJson,
} from "@/lib/lead-capture-validation";

describe("lead capture validation", () => {
  it("normalizes a newsletter subscription", () => {
    expect(
      normalizeNewsletterSubmission({
        email: "  Reader@Example.com ",
        source: "blog_article",
        locale: "ru-RU",
      })
    ).toEqual({ email: "reader@example.com", source: "blog_article", locale: "ru-RU" });
  });

  it("rejects invalid newsletter fields", () => {
    expect(() => normalizeNewsletterSubmission({ email: "reader@invalid" })).toThrow(
      "Проверьте формат email."
    );
    expect(() =>
      normalizeNewsletterSubmission({ email: "reader@example.com", source: "footer\nBcc:test" })
    ).toThrow("недопустимые служебные символы");
    expect(() =>
      normalizeNewsletterSubmission({ email: "reader@example.com", locale: "not a locale" })
    ).toThrow("Некорректный код языка.");
  });

  it("normalizes contact data and keeps only a same-origin page path", () => {
    expect(
      normalizeContactRequest(
        {
          kind: "tour_inquiry",
          name: " Анна ",
          email: " ANNA@example.com ",
          message: " Хочу уточнить даты ",
          context: { topic: "dates" },
          pageUrl: "https://www.goargentina.ru/tours/patagonia?from=contact",
          tourSlug: "patagonia",
        },
        "https://www.goargentina.ru/api/contact"
      )
    ).toEqual({
      kind: "tour_inquiry",
      name: "Анна",
      email: "anna@example.com",
      phone: null,
      message: "Хочу уточнить даты",
      context: { topic: "dates" },
      pageUrl: "/tours/patagonia?from=contact",
      tourSlug: "patagonia",
      productSlug: null,
      serviceSlug: null,
      organizerApplication: false,
    });
  });

  it("rejects external page links, invalid kinds and missing contacts", () => {
    expect(() =>
      normalizeContactRequest(
        { name: "Анна", email: "anna@example.com", pageUrl: "https://evil.example/phishing" },
        "https://www.goargentina.ru/api/contact"
      )
    ).toThrow("Адрес страницы должен относиться к этому сайту.");
    expect(() =>
      normalizeContactRequest({ kind: "unknown", name: "Анна", email: "anna@example.com" })
    ).toThrow("Некорректный тип обращения.");
    expect(() => normalizeContactRequest({ name: "Анна" })).toThrow(
      "Укажите email или телефон."
    );
  });

  it("rejects oversized or unsafe context", () => {
    expect(() =>
      normalizeContactRequest({
        name: "Анна",
        email: "anna@example.com",
        message: "x".repeat(4_001),
      })
    ).toThrow("Сообщение: не более 4000 символов.");

    const unsafeContext = JSON.parse('{"__proto__":{"polluted":true}}') as unknown;
    expect(() =>
      normalizeContactRequest({
        name: "Анна",
        email: "anna@example.com",
        context: unsafeContext,
      })
    ).toThrow("Некорректное поле в контексте обращения.");
  });

  it("requires a kind for an internal contact submission", () => {
    expect(() =>
      normalizeContactSubmission({ name: "Анна", email: "anna@example.com" })
    ).toThrow("Не указан тип обращения.");
  });

  it("rejects malformed and oversized request bodies", async () => {
    await expect(
      readLimitedJson(new Request("https://example.test", { method: "POST", body: "{" }), 100)
    ).rejects.toBeInstanceOf(LeadCaptureValidationError);
    await expect(
      readLimitedJson(
        new Request("https://example.test", {
          method: "POST",
          body: JSON.stringify({ value: "x".repeat(200) }),
        }),
        100
      )
    ).rejects.toThrow("Запрос слишком большой.");
  });
});
