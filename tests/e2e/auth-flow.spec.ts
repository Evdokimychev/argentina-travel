import { expect, test } from "@playwright/test";

test.describe("Авторизация", () => {
  test("форма входа доступна и корректно помещается на мобильном экране", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await page.getByRole("button", { name: "Войти в профиль" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Войдите или зарегистрируйтесь" })).toBeVisible();
    await expect(dialog.getByLabel("Email")).toBeVisible();
    await expect(dialog.getByLabel("Пароль", { exact: true })).toBeVisible();

    const bounds = await dialog.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(844);
  });

  test("просроченная ссылка восстановления показывает понятный следующий шаг", async ({ page }) => {
    await page.goto("/auth/callback");
    await page.waitForURL(/error=expired-link/);
    await page.waitForURL(url => !url.searchParams.has("error"));

    await expect(page.getByText("Ссылка больше не действует")).toBeVisible();
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});
