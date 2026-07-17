import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth-mode", () => ({
  isSupabaseAuthEnabled: () => false,
}));

import { POST } from "./route";

describe("password reset route", () => {
  it("rate-limits repeated requests before invoking the auth provider", async () => {
    const ip = `198.51.100.${Math.floor(Math.random() * 200) + 1}`;
    const request = () =>
      new Request("https://goargentina.ru/api/auth/request-password-reset", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": ip,
        },
        body: JSON.stringify({ email: "traveler@example.com" }),
      });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect((await POST(request())).status).toBe(503);
    }

    const limited = await POST(request());
    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toBeTruthy();
  });
});
