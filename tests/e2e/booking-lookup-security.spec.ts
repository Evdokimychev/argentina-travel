import { expect, test } from "@playwright/test";

test.describe("secure guest booking lookup", () => {
  test("never returns bookings for an email-only request", async ({ request }) => {
    const response = await request.post("/api/bookings/lookup", {
      data: { email: `unknown-${Date.now()}@example.com` },
    });
    expect(response.status()).toBe(202);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.message).toContain("Если для этого адреса есть заявки");
    expect(body).not.toHaveProperty("bookings");
  });

  test("requires a purpose-bound lookup session for results", async ({ request }) => {
    const response = await request.get("/api/bookings/lookup/results");
    expect(response.status()).toBe(401);
    expect(await response.json()).not.toHaveProperty("bookings");
  });

  test("shows neutral OTP step without revealing email existence", async ({ page }) => {
    await page.goto("/booking/find");
    await page.getByLabel("Email из заявки").fill(`unknown-${Date.now()}@example.com`);
    await page.getByRole("button", { name: "Получить код" }).click();
    await expect(page.getByLabel("Код из письма")).toBeVisible();
    await expect(page.getByText("Если для этого адреса есть заявки")).toBeVisible();
    await expect(page.getByText("Заявок по этому email не найдено")).toHaveCount(0);
  });
});
