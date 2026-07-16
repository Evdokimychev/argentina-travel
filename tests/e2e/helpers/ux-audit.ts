import fs from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";

const REPO_ROOT = path.resolve(__dirname, "../../..");
export const UX_AUDIT_VIOLATIONS_PATH = path.join(
  REPO_ROOT,
  "var/ops/e2e-ux-audit-violations.ndjson",
);
export const UX_AUDIT_JSON_PATH = path.join(REPO_ROOT, "var/ops/e2e-ux-audit-last.json");
export const UX_AUDIT_BACKLOG_PATH = path.join(REPO_ROOT, "docs/sprint-4-backlog-e2e.md");

export type UxCheckType =
  | "horizontal-scroll"
  | "viewport-overflow"
  | "modal-close-button"
  | "navigation"
  | "auth-wall"
  | "page-load";

export type UxViolationSeverity = "critical" | "high" | "medium" | "low";

export type UxViolation = {
  id?: string;
  route: string;
  viewport: string;
  check: UxCheckType;
  severity: UxViolationSeverity;
  message: string;
  samples?: string[];
  testTitle?: string;
};

export type UxAuditReport = {
  runAt: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    violations: number;
  };
  violations: UxViolation[];
};

const HORIZONTAL_SCROLL_TOLERANCE_PX = 1;

export function ensureUxAuditDirs(): void {
  fs.mkdirSync(path.dirname(UX_AUDIT_VIOLATIONS_PATH), { recursive: true });
}

export function resetUxAuditViolationsFile(): void {
  ensureUxAuditDirs();
  fs.writeFileSync(UX_AUDIT_VIOLATIONS_PATH, "");
}

export function appendUxViolation(violation: UxViolation): void {
  ensureUxAuditDirs();
  fs.appendFileSync(UX_AUDIT_VIOLATIONS_PATH, `${JSON.stringify(violation)}\n`, "utf8");
}

export function readUxViolationsFromFile(): UxViolation[] {
  if (!fs.existsSync(UX_AUDIT_VIOLATIONS_PATH)) return [];
  const lines = fs
    .readFileSync(UX_AUDIT_VIOLATIONS_PATH, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line) => JSON.parse(line) as UxViolation);
}

export async function waitForPageStable(page: Page, hydrationMs = 400): Promise<void> {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(hydrationMs);
}

async function retryAfterClientNavigation<T>(page: Page, evaluate: () => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await evaluate();
    } catch (error) {
      const isNavigationRace =
        error instanceof Error && /execution context was destroyed|cannot find context/i.test(error.message);
      if (!isNavigationRace || attempt === 2) throw error;
      await page.waitForLoadState("domcontentloaded").catch(() => undefined);
      await page.waitForTimeout(250);
    }
  }
  throw new Error("Page evaluation did not stabilize after navigation");
}

export async function hasHorizontalScroll(page: Page): Promise<{ overflow: boolean; delta: number }> {
  return retryAfterClientNavigation(page, () =>
    page.evaluate((tolerance) => {
      const root = document.documentElement;
      const body = document.body;
      const scrollWidth = Math.max(root.scrollWidth, body.scrollWidth);
      const clientWidth = root.clientWidth;
      const delta = scrollWidth - clientWidth;
      return { overflow: delta > tolerance, delta };
    }, HORIZONTAL_SCROLL_TOLERANCE_PX),
  );
}

export type ViewportOverflowSample = {
  tag: string;
  id: string;
  className: string;
  right: number;
  left: number;
  viewportWidth: number;
};

export async function findViewportOverflows(
  page: Page,
  maxSamples = 10,
): Promise<ViewportOverflowSample[]> {
  return retryAfterClientNavigation(page, () =>
    page.evaluate(
      ({ maxSamples: limit, tolerance }) => {
      const viewportWidth = window.innerWidth;
      const samples: ViewportOverflowSample[] = [];

      const elements = document.querySelectorAll("body *");
      for (const element of elements) {
        if (!(element instanceof HTMLElement)) continue;
        if (samples.length >= limit) break;

        const style = window.getComputedStyle(element);
        if (style.display === "none" || style.visibility === "hidden") continue;
        if (style.position === "fixed" || style.position === "sticky") continue;
        if (element.getAttribute("aria-hidden") === "true") continue;

        const rect = element.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) continue;

        const rightOverflow = rect.right - viewportWidth;
        const leftOverflow = -rect.left;
        if (rightOverflow <= tolerance && leftOverflow <= tolerance) continue;

        // A card/table may legitimately extend beyond the viewport inside a
        // clipped or horizontally scrollable carousel. The document-level
        // horizontal-scroll check still catches a real page overflow, while
        // this check focuses on elements that escape their layout boundary.
        let boundary = element.parentElement;
        let containedByOverflowBoundary = false;
        while (boundary && boundary !== document.body && boundary !== document.documentElement) {
          const boundaryStyle = window.getComputedStyle(boundary);
          if (/^(auto|scroll|hidden|clip)$/.test(boundaryStyle.overflowX)) {
            containedByOverflowBoundary = true;
            break;
          }
          boundary = boundary.parentElement;
        }
        if (containedByOverflowBoundary) continue;

        // Skip off-screen elements intentionally translated away (e.g. closed drawers).
        if (rect.right < -tolerance || rect.left > viewportWidth + tolerance) continue;

        samples.push({
          tag: element.tagName.toLowerCase(),
          id: element.id,
          className: element.className.slice(0, 120),
          right: Math.round(rect.right),
          left: Math.round(rect.left),
          viewportWidth,
        });
      }

      return samples;
    },
      { maxSamples, tolerance: HORIZONTAL_SCROLL_TOLERANCE_PX },
    ),
  );
}

export async function assertModalCloseButton(page: Page): Promise<boolean> {
  const dialogs = page.locator('[role="dialog"]:visible');
  const count = await dialogs.count();
  if (count === 0) return false;

  for (let index = 0; index < count; index += 1) {
    const dialog = dialogs.nth(index);
    const closeByLabel = dialog.getByRole("button", { name: /закрыть|close/i });
    const closeByDataState = dialog.locator('button[data-state="open"]').filter({
      has: page.locator("svg"),
    });

    const hasClose =
      (await closeByLabel.count()) > 0 ||
      (await dialog.locator('button[aria-label*="Закрыть"], button[aria-label*="Close"]').count()) >
        0 ||
      (await closeByDataState.count()) > 0;

    if (!hasClose) return false;
  }

  return true;
}

export async function expectAuthWall(page: Page): Promise<boolean> {
  const candidates = [
    page.getByRole("dialog").filter({ hasText: /войдите|вход|авторизац|нет доступа/i }),
    page.getByRole("heading", {
      name: /личный кабинет|войдите|вход|авторизация|кабинет организатора|админ/i,
    }),
    page.getByRole("button", { name: /^войти(?: в профиль)?$/i }),
    page.getByText(/нет доступа|требуется авторизация/i),
  ];
  const deadline = Date.now() + 10_000;

  while (Date.now() < deadline) {
    for (const candidate of candidates) {
      if (await candidate.first().isVisible().catch(() => false)) return true;
    }
    await page.waitForTimeout(250);
  }

  return false;
}

export function severityForCheck(check: UxCheckType): UxViolationSeverity {
  switch (check) {
    case "horizontal-scroll":
    case "viewport-overflow":
    case "navigation":
      return "critical";
    case "modal-close-button":
      return "high";
    case "auth-wall":
      return "medium";
    default:
      return "low";
  }
}

export function formatViolationSamples(samples: ViewportOverflowSample[]): string[] {
  return samples.map(
    (sample) =>
      `<${sample.tag}${sample.id ? `#${sample.id}` : ""}> left=${sample.left}px right=${sample.right}px (${sample.className.slice(0, 60)})`,
  );
}

export function viewportNameFromProject(projectName: string): "mobile" | "desktop" {
  return projectName.includes("mobile") ? "mobile" : "desktop";
}

export function parseUxAuditTestTitle(title: string): {
  route?: string;
  check?: UxCheckType;
} | null {
  const match = title.match(/^\[ux-audit\]\s+(\S+)\s+([\w-]+)$/);
  if (!match) return null;
  return {
    route: match[1],
    check: match[2] as UxCheckType,
  };
}

export function assignViolationIds(violations: UxViolation[]): UxViolation[] {
  return violations.map((violation, index) => ({
    ...violation,
    id: violation.id ?? `UX-E2E-${String(index + 1).padStart(3, "0")}`,
  }));
}

export function buildBacklogMarkdown(report: UxAuditReport): string {
  const lines: string[] = [
    "# Sprint 4 — E2E UX backlog (автогенерация)",
    "",
    "> **Автоматически обновляется** репортёром Playwright `sprint-backlog-reporter` после `npm run test:e2e:ux-audit`.",
    "> Ручные правки в секции «Автоматические находки» будут перезаписаны при следующем прогоне.",
    "",
    "## Как запускать",
    "",
    "```bash",
    "npm run test:e2e:ux-audit",
    "```",
    "",
    "Отчёт JSON: `var/ops/e2e-ux-audit-last.json`",
    "",
    "## Легенда severity",
    "",
    "| Уровень | Критерий |",
    "|---------|----------|",
    "| **Critical** | Горизонтальный скролл, элементы вне viewport, навигация |",
    "| **High** | Модалки без кнопки закрытия |",
    "| **Medium** | Auth-wall не отображается на защищённых маршрутах |",
    "| **Low** | Прочие регрессии загрузки страницы |",
    "",
    "## Связанные документы",
    "",
    "- [Sprint 1 UX/UI аудит](./sprint-1-ux-ui-audit.md) — UX-001…UX-031",
    "- Нумерация E2E-находок: **UX-E2E-001+**",
    "",
    "---",
    "",
    "## Автоматические находки",
    "",
  ];

  if (report.violations.length === 0) {
    lines.push(
      `_Последний прогон (${report.runAt}): нарушений не обнаружено._`,
      "",
    );
    return lines.join("\n").trimEnd();
  }

  lines.push(
    `**Последний прогон:** ${report.runAt}`,
    "",
    `**Итого нарушений:** ${report.violations.length}`,
    "",
  );

  for (const violation of report.violations) {
    lines.push(
      `### ${violation.id} — ${violation.check}`,
      "",
      "| | |",
      "|---|---|",
      `| **Severity** | ${violation.severity} |`,
      `| **Маршрут** | \`${violation.route}\` |`,
      `| **Viewport** | ${violation.viewport} |`,
      `| **Проверка** | ${violation.check} |`,
      `| **Описание** | ${violation.message} |`,
      "",
    );
    if (violation.samples?.length) {
      lines.push("**Примеры элементов:**", "");
      for (const sample of violation.samples.slice(0, 5)) {
        lines.push(`- ${sample}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n").trimEnd();
}
