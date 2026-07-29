import { describe, expect, it } from "vitest";
import { completedDeleteMetadata, resolvePrivacyDeleteIdentity } from "./delete-automation";

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
