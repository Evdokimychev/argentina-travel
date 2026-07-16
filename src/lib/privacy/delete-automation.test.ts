import { describe, expect, it } from "vitest";
import { completedDeleteMetadata } from "./delete-automation";

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
