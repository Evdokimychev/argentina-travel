import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  submitContact: vi.fn(),
  submitNewsletter: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  getClientIp: () => "127.0.0.1",
  checkRateLimit: vi.fn().mockResolvedValue({ ok: true }),
  checkSecurityRateLimit: vi.fn().mockResolvedValue({ ok: true }),
}));
vi.mock("@/lib/site-settings-server", () => ({
  fetchSiteFeatures: vi.fn().mockResolvedValue({ allowOrganizerSignup: true }),
  fetchSiteForms: vi.fn().mockResolvedValue({
    contactEnabled: true,
    newsletterEnabled: true,
  }),
}));
vi.mock("@/lib/forms/captcha-server", () => ({
  verifyGuestFormProtection: vi.fn().mockResolvedValue({ ok: true }),
}));
vi.mock("@/lib/lead-capture", async () => {
  const actual = await vi.importActual<typeof import("@/lib/lead-capture")>("@/lib/lead-capture");
  return {
    ...actual,
    submitContact: mocks.submitContact,
    submitNewsletter: mocks.submitNewsletter,
  };
});

import { POST as postContact } from "@/app/api/contact/route";
import { POST as postNewsletter } from "@/app/api/newsletter/route";
import { LeadCaptureError } from "@/lib/lead-capture";

describe("public lead capture routes", () => {
  beforeEach(() => {
    mocks.submitContact.mockReset().mockResolvedValue(undefined);
    mocks.submitNewsletter.mockReset().mockResolvedValue(undefined);
  });

  it("rejects organizer applications on the contact inbox", async () => {
    const response = await postContact(
      new Request("https://www.goargentina.ru/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "organizer_application",
          name: "Анна",
          email: "anna@example.com",
          message: "Хочу публиковать туры по Патагонии и вести группу.",
        }),
      })
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "USE_ORGANIZER_APPLICATIONS",
    });
    expect(mocks.submitContact).not.toHaveBeenCalled();
  });

  it("rejects an invalid contact kind before persistence", async () => {
    const response = await postContact(
      new Request("https://www.goargentina.ru/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "admin_override",
          name: "Анна",
          email: "anna@example.com",
        }),
      })
    );
    expect(response.status).toBe(400);
    expect(mocks.submitContact).not.toHaveBeenCalled();
  });

  it("normalizes a valid tour inquiry and stores a same-origin page path", async () => {
    const response = await postContact(
      new Request("https://www.goargentina.ru/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "general",
          name: " Анна ",
          email: " ANNA@example.com ",
          tourSlug: "patagonia",
          pageUrl: "https://www.goargentina.ru/tours/patagonia",
        }),
      })
    );
    expect(response.status).toBe(200);
    expect(mocks.submitContact).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "tour_inquiry",
        name: "Анна",
        email: "anna@example.com",
        pageUrl: "/tours/patagonia",
      })
    );
  });

  it("rejects oversized newsletter input and normalizes a valid subscription", async () => {
    const oversized = await postNewsletter(
      new Request("https://www.goargentina.ru/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: `${"x".repeat(4_100)}@example.com` }),
      })
    );
    expect(oversized.status).toBe(400);
    expect(mocks.submitNewsletter).not.toHaveBeenCalled();

    const valid = await postNewsletter(
      new Request("https://www.goargentina.ru/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: " Reader@Example.com ", source: "footer" }),
      })
    );
    expect(valid.status).toBe(200);
    expect(mocks.submitNewsletter).toHaveBeenCalledWith({
      email: "reader@example.com",
      source: "footer",
      locale: null,
    });
  });

  it("does not expose database errors to public clients", async () => {
    mocks.submitContact.mockRejectedValueOnce(
      new LeadCaptureError('relation "contact_submissions" does not exist', "database")
    );
    const contactResponse = await postContact(
      new Request("https://www.goargentina.ru/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Анна", email: "anna@example.com" }),
      })
    );
    expect(contactResponse.status).toBe(500);
    await expect(contactResponse.json()).resolves.toEqual({
      error: "Не удалось сохранить обращение. Попробуйте позже.",
    });

    mocks.submitNewsletter.mockRejectedValueOnce(
      new LeadCaptureError("duplicate index internals", "database")
    );
    const newsletterResponse = await postNewsletter(
      new Request("https://www.goargentina.ru/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "reader@example.com" }),
      })
    );
    expect(newsletterResponse.status).toBe(500);
    await expect(newsletterResponse.json()).resolves.toEqual({
      error: "Не удалось оформить подписку. Попробуйте позже.",
    });
  });
});
