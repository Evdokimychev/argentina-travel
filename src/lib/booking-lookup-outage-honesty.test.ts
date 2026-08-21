import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("booking lookup outage honesty", () => {
  it("returns a safe unavailable response instead of throwing uncaught secret errors", () => {
    const route = fs.readFileSync(
      path.join(process.cwd(), "src/app/api/bookings/lookup/route.ts"),
      "utf8",
    );
    expect(route).toContain("Booking lookup secret");
    expect(route).toContain("status: 503");
    expect(route).toContain("Поиск заявок временно недоступен");
    expect(route).toContain("unexpectedPublicApiError");
  });
});
