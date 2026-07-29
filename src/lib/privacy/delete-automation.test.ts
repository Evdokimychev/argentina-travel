import { describe, expect, it, vi } from "vitest";
import {
  completedDeleteMetadata,
  resolvePrivacyDeleteIdentity,
  settlePrivacyDeleteOperation,
} from "./delete-automation";

describe("completedDeleteMetadata", () => {
  it("retains only operational deletion evidence", () => {
    const metadata = completedDeleteMetadata({
      processingStartedAt: "2026-07-15T10:00:00.000Z",
      completedAt: "2026-07-15T10:01:00.000Z",
      bookingsAnonymized: 2,
      sessionsRevoked: 1,
      relatedRowsDeleted: 12,
      commerceRowsAnonymized: 4,
    });

    expect(metadata).toEqual({
      processingStartedAt: "2026-07-15T10:00:00.000Z",
      completedAt: "2026-07-15T10:01:00.000Z",
      bookingsAnonymized: 2,
      sessionsRevoked: 1,
      relatedRowsDeleted: 12,
      commerceRowsAnonymized: 4,
    });
    expect(JSON.stringify(metadata)).not.toContain("email");
    expect(JSON.stringify(metadata)).not.toContain("fullName");
  });
});

describe("resolvePrivacyDeleteIdentity", () => {
  it("recovers the original identity from request metadata after partial anonymization", () => {
    expect(resolvePrivacyDeleteIdentity(
      { email: null, first_name: "Удалён", last_name: "пользователь" },
      { email: "reader@example.com", fullName: "Original Reader" },
    )).toEqual({
      email: "reader@example.com",
      name: "Original Reader",
    });
  });

  it("prefers the current profile identity before anonymization", () => {
    expect(resolvePrivacyDeleteIdentity(
      { email: "current@example.com", first_name: "Current", last_name: "Reader" },
      { email: "stale@example.com", fullName: "Stale Reader" },
    )).toEqual({
      email: "current@example.com",
      name: "Current Reader",
    });
  });
});

describe("settlePrivacyDeleteOperation", () => {
  it("marks a destructive processing failure once and skips completion notification", async () => {
    const markFailed = vi.fn().mockResolvedValue(null);
    const notifyCompleted = vi.fn();

    await expect(settlePrivacyDeleteOperation({
      perform: async () => {
        throw new Error("profile anonymization failed");
      },
      markFailed,
      notifyCompleted,
    })).resolves.toEqual({ ok: false, error: "profile anonymization failed" });

    expect(markFailed).toHaveBeenCalledOnce();
    expect(markFailed).toHaveBeenCalledWith("profile anonymization failed");
    expect(notifyCompleted).not.toHaveBeenCalled();
  });

  it("keeps a completed deletion successful when its notification fails", async () => {
    const markFailed = vi.fn().mockResolvedValue(null);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(settlePrivacyDeleteOperation({
      perform: async () => ({ requestId: "privacy-1" }),
      markFailed,
      notifyCompleted: async () => {
        throw new Error("email provider unavailable");
      },
    })).resolves.toEqual({ ok: true });

    expect(markFailed).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(
      "[privacy_delete_completion_notification_failed]",
      { error: "email provider unavailable" },
    );
    consoleError.mockRestore();
  });

  it("reports a lost processing CAS without overwriting the newer terminal state", async () => {
    const notifyCompleted = vi.fn();

    await expect(settlePrivacyDeleteOperation({
      perform: async () => {
        throw new Error("completion state changed");
      },
      markFailed: async () => "request status is no longer processing",
      notifyCompleted,
    })).resolves.toEqual({
      ok: false,
      error: "completion state changed; additionally failed to mark request as failed: request status is no longer processing",
    });

    expect(notifyCompleted).not.toHaveBeenCalled();
  });
});
