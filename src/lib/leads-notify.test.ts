import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { notifyLeadCaptured } from "@/lib/leads-notify";

const mocks = vi.hoisted(() => ({
  sendOperationalEmail: vi.fn(),
}));

vi.mock("@/lib/notifications/email-delivery", () => ({
  sendOperationalEmail: mocks.sendOperationalEmail,
}));

const ORIGINAL_ENV = { ...process.env };

describe("lead email provider result", () => {
  beforeEach(() => {
    mocks.sendOperationalEmail.mockReset();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("reports an accepted provider response", async () => {
    mocks.sendOperationalEmail.mockResolvedValue({
      status: "accepted",
      providerMessageId: "mail-123",
    });

    await expect(notifyLeadCaptured({ subject: "Новая заявка", html: "<p>Тест</p>" })).resolves.toEqual({
      status: "accepted",
      providerMessageId: "mail-123",
    });
  });

  it("reports HTTP failures instead of treating them as delivery", async () => {
    mocks.sendOperationalEmail.mockResolvedValue({ status: "failed", providerStatus: 422 });
    await expect(notifyLeadCaptured({ subject: "Новая заявка", html: "<p>Тест</p>" })).resolves.toEqual({
      status: "failed",
      providerStatus: 422,
    });
  });

  it("skips delivery when the optional provider is not configured", async () => {
    mocks.sendOperationalEmail.mockResolvedValue({ status: "skipped" });
    await expect(notifyLeadCaptured({ subject: "Новая заявка", html: "<p>Тест</p>" })).resolves.toEqual({
      status: "skipped",
    });
  });
});
