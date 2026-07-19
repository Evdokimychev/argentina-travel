import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  attachPublicReadOnlyEvidence,
  observeReadOnlyTraffic,
  type ReadOnlyTraffic,
} from "./helpers/public-readonly-evidence";

const baseUrl = process.env.STAGING_ACCEPTANCE_BASE_URL!;
const partnerBadge = /Партнёр (?:Tripster|YouTravel\.me)/i;

async function gotoPublic(page: Page, path: string) {
  const response = await page.goto(path, { waitUntil: "domcontentloaded", timeout: 90_000 });
  expect(response, `No response for ${path}`).not.toBeNull();
  expect(response!.status(), `HTTP ${response!.status()} for ${path}`).toBeLessThan(400);
  await expect(page.locator("body")).toBeVisible();
  return response!;
}

async function tourCandidates(page: Page, partner: boolean): Promise<string[]> {
  await gotoPublic(page, "/tours");
  for (let batch = 0; batch < 10; batch += 1) {
    const loadMore = page.getByRole("button", { name: /Показать ещё \d+/ }).first();
    if (!(await loadMore.isVisible().catch(() => false))) break;
    const countBefore = await page.locator("article").count();
    await loadMore.click();
    await expect(page.locator("article")).not.toHaveCount(countBefore);
  }
  const cards = page.locator("article");
  await expect(cards.first(), "Tour catalog has no public cards").toBeVisible();
  const candidates: string[] = [];
  for (let index = 0, count = await cards.count(); index < count; index += 1) {
    const card = cards.nth(index);
    const text = await card.innerText();
    if (partnerBadge.test(text) !== partner) continue;
    const href = await card.locator('a[aria-label^="Открыть тур:"]').getAttribute("href");
    if (href?.startsWith("/tours/")) candidates.push(href);
  }
  return [...new Set(candidates)];
}

async function firstEnabledOption(select: Locator): Promise<string | null> {
  const options = select.locator("option:not([disabled])");
  for (let index = 0, count = await options.count(); index < count; index += 1) {
    const value = await options.nth(index).getAttribute("value");
    if (value) return value;
  }
  return null;
}

async function attach(
  page: Page,
  request: Parameters<typeof attachPublicReadOnlyEvidence>[0]["request"],
  testInfo: Parameters<typeof attachPublicReadOnlyEvidence>[0]["testInfo"],
  journeyId: "J01" | "J02" | "J03",
  traffic: ReadOnlyTraffic,
  browser: Record<string, unknown>,
) {
  await attachPublicReadOnlyEvidence({
    page,
    request,
    testInfo,
    journeyId,
    traffic,
    browser,
  });
}

test.describe("Sprint 0A public read-only journeys", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("[J01] Гость: главная → каталог → фильтры → карточка", async ({ page, request }, testInfo) => {
    const traffic = observeReadOnlyTraffic(page, baseUrl);
    await gotoPublic(page, "/");

    const catalogLink = page.locator(
      'a[href="/tours"]:visible, a[href^="/tours?"]:visible',
    ).first();
    await expect(catalogLink, "Homepage has no visible catalog entry point").toBeVisible();
    await catalogLink.click();
    await expect(page).toHaveURL(/\/tours(?:\?|$)/);

    const cards = page.locator("article");
    await expect(cards.first(), "Catalog has no tour cards before filtering").toBeVisible();
    const beforeCount = await cards.count();

    await page.getByRole("button", { name: "Виды отдыха", exact: true }).click();
    const filterPopover = page.locator('[data-radix-popper-content-wrapper]:visible').last();
    const activity = filterPopover.locator("ul button:not([disabled])").first();
    await expect(activity, "No enabled activity filter is available").toBeVisible();
    const activityLabel = (await activity.innerText()).trim();
    await activity.click();
    await filterPopover.getByRole("button", { name: "Применить", exact: true }).click();
    await expect(page).toHaveURL(/[?&]activity=/);
    await expect(cards.first(), "Filter returned no public tour card").toBeVisible();

    const detailLink = cards.first().locator('a[aria-label^="Открыть тур:"]');
    const detailHref = await detailLink.getAttribute("href");
    expect(detailHref).toMatch(/^\/tours\//);
    await detailLink.click();
    await expect(page).toHaveURL(/\/tours\/[^/?#]+/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await attach(page, request, testInfo, "J01", traffic, {
      startPath: "/",
      catalogPath: "/tours",
      filter: activityLabel,
      cardsBeforeFilter: beforeCount,
      detailPath: detailHref,
    });
  });

  test("[J02] Гость: native тур → дата → CTA", async ({ page, request }, testInfo) => {
    const traffic = observeReadOnlyTraffic(page, baseUrl);
    const candidates = await tourCandidates(page, false);
    expect(candidates.length, "Catalog has no native tour candidates").toBeGreaterThan(0);

    let selected: { href: string; dateValue: string; cta: string } | null = null;
    for (const href of candidates.slice(0, 12)) {
      const response = await gotoPublic(page, href);
      if (response.status() >= 400) continue;
      const booking = page.locator("#booking");
      if (!(await booking.isVisible().catch(() => false))) continue;
      const dateSelect = booking.locator('select[id$="-date-select"]').first();
      if ((await dateSelect.count()) === 0) continue;
      const dateValue = await firstEnabledOption(dateSelect);
      if (!dateValue) continue;
      await dateSelect.selectOption(dateValue);
      const cta = booking.getByRole("button", {
        name: /Оставить заявку|Запросить расчёт|Встать в лист ожидания/i,
      }).first();
      if (!(await cta.isVisible().catch(() => false))) continue;
      selected = { href, dateValue, cta: (await cta.innerText()).trim() };
      break;
    }

    expect(selected, "No native scheduled tour exposes a selectable date and internal CTA").not.toBeNull();
    await expect(page.locator("#booking")).toBeVisible();

    await attach(page, request, testInfo, "J02", traffic, {
      productSource: "goargentina",
      bookingInteraction: "date-selected; CTA-visible; CTA-not-submitted",
      ...selected!,
    });
  });

  test("[J03] Партнёрский checkout только до безопасного handoff", async ({ page, request }, testInfo) => {
    const traffic = observeReadOnlyTraffic(page, baseUrl);
    const candidates = await tourCandidates(page, true);
    expect(candidates.length, "Catalog has no partner tour candidates").toBeGreaterThan(0);

    let handoff: { href: string; ctaHref: string; partner: string } | null = null;
    for (const href of candidates.slice(0, 12)) {
      await gotoPublic(page, href);
      const booking = page.locator("#booking");
      if (!(await booking.isVisible().catch(() => false))) continue;

      const dateOption = booking.getByRole("radio").filter({ visible: true }).first();
      const dateVisible = await dateOption
        .waitFor({ state: "visible", timeout: 20_000 })
        .then(() => true)
        .catch(() => false);
      if (!dateVisible || !(await dateOption.isEnabled().catch(() => false))) continue;
      await dateOption.click();

      const cta = booking.getByRole("link", { name: /Перейти к бронированию/i }).first();
      if (!(await cta.isVisible().catch(() => false))) continue;
      const ctaHref = await cta.getAttribute("href");
      if (!ctaHref) continue;

      await cta.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole("button", { name: "Подтвердить и забронировать" })).toBeVisible();
      expect(traffic.forbiddenWrites, "Opening preview must not create a partner order").toEqual([]);
      expect(new URL(page.url()).origin).toBe(new URL(baseUrl).origin);
      handoff = {
        href,
        ctaHref: safeHandoffHref(ctaHref),
        partner: partnerBadge.test(await page.locator("body").innerText())
          ? (await page.locator("body").innerText()).match(partnerBadge)?.[0] ?? "partner"
          : "partner",
      };
      break;
    }

    expect(handoff, "No partner tour reached the local confirmation preview safely").not.toBeNull();
    await attach(page, request, testInfo, "J03", traffic, {
      ...handoff!,
      handoffLevel: "local-confirmation-preview-only",
      confirmButtonClicked: false,
      externalNavigation: false,
      partnerOrderWriteObserved: false,
    });
  });
});

function safeHandoffHref(value: string): string {
  try {
    const url = new URL(value, baseUrl);
    return url.origin === new URL(baseUrl).origin ? `${url.pathname}${url.search}` : url.origin;
  } catch {
    return "invalid";
  }
}
