import { expect, test } from "@playwright/test";

test.describe("Авторизация", () => {
  test("форма входа доступна и корректно помещается на мобильном экране", async ({ page }) => {
    await page.route("**/api/auth/lookup-email", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: '{"status":"found"}' });
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await page.getByRole("button", { name: "Войти в профиль" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Войдите или зарегистрируйтесь" })).toBeVisible();
    const email = dialog.getByLabel("Email");
    await expect(email).toBeVisible();
    await expect(email).toHaveAttribute("autocomplete", "username");
    await expect(dialog.getByLabel("Пароль", { exact: true })).toHaveCount(0);
    await expect(dialog.getByText("Я принимаю условия")).toHaveCount(0);

    await email.fill("owner@example.com");
    await dialog.getByRole("button", { name: "Продолжить", exact: true }).click();
    const password = dialog.getByLabel("Пароль", { exact: true });
    await expect(password).toBeVisible();
    await expect(password).toHaveAttribute("autocomplete", "current-password");

    const bounds = await dialog.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(844);
  });

  test("просроченная ссылка восстановления показывает понятный следующий шаг", async ({ page }) => {
    await page.goto("/?auth=sign-in&error=expired-link");
    await page.waitForURL("**/auth/error?reason=expired-link");

    await expect(page.getByText("Ссылка больше не действует")).toBeVisible();
    await expect(page.getByRole("link", { name: "Запросить новое письмо" })).toBeVisible();
  });

  test("ссылка восстановления открывает нужный шаг и показывает серверный countdown", async ({ page }) => {
    await page.route("**/api/auth/request-password-reset", async (route) => {
      await route.fulfill({
        status: 429,
        headers: { "Retry-After": "42" },
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            code: "AUTH_RESET_RATE_LIMITED",
            retryAfter: 42,
            message: "Повторная отправка будет доступна через 42 секунды.",
          },
        }),
      });
    });

    await page.goto("/?auth=sign-in&step=forgot-password");
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Восстановление пароля" })).toBeVisible();
    await dialog.getByLabel("Email").fill("owner@example.com");
    await dialog.getByRole("button", { name: "Отправить ссылку" }).click();
    await expect(dialog.getByText("Повторная отправка будет доступна через 42 секунд.")).toBeVisible();
    await expect(dialog.getByRole("button", { name: /Повторить через \d+ с/ })).toBeDisabled();
  });

  test("форма нового пароля без recovery-сессии не принимает пароль", async ({ page }) => {
    await page.goto("/account/update-password");
    await expect(page.getByRole("heading", { name: "Новый пароль" })).toBeVisible();
    await expect(page.getByText("Ссылка больше не действует")).toBeVisible();
    await expect(page.getByLabel("Новый пароль")).toHaveCount(0);
  });
});
