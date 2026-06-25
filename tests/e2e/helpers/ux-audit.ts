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

export async function hasHorizontalScroll(page: Page): Promise<{ overflow: boolean; delta: number }> {
  return page.evaluate((tolerance) => {
    const root = document.documentElement;
    const body = document.body;
    const scrollWidth = Math.max(root.scrollWidth, body.scrollWidth);
    const clientWidth = root.clientWidth;
    const delta = scrollWidth - clientWidth;
    return { overflow: delta > tolerance, delta };
  }, HORIZONTAL_SCROLL_TOLERANCE_PX);
}

export type ViewportOverflowSample = {
  tag: string;
  id: string;
  className: string;
  right: number;
  bottom: number;
  viewportWidth: number;
  viewportHeight: number;
};

export async function findViewportOverflows(
  page: Page,
  maxSamples = 10,
): Promise<ViewportOverflowSample[]> {
  return page.evaluate(
    ({ maxSamples: limit, tolerance }) => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
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
        const bottomOverflow = rect.bottom - viewportHeight;
        if (rightOverflow <= tolerance && bottomOverflow <= tolerance) continue;

        // Skip off-screen elements intentionally translated away (e.g. closed drawers).
        if (rect.right < -tolerance || rect.bottom < -tolerance) continue;
        if (rect.left > viewportWidth + tolerance || rect.top > viewportHeight + tolerance) continue;

        samples.push({
          tag: element.tagName.toLowerCase(),
          id: element.id,
          className: element.className.slice(0, 120),
          right: Math.round(rect.right),
          bottom: Math.round(rect.bottom),
          viewportWidth,
          viewportHeight,
        });
      }

      return samples;
    },
    { maxSamples, tolerance: HORIZONTAL_SCROLL_TOLERANCE_PX },
  );
}

export async function assertModalCloseButton(page: Page): Promise<boolean> {
  const dialogs = page.locator('[role="dialog"]');
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
  const loginButton = page.getByRole("button", { name: /войти/i });
  const loginHeading = page.getByRole("heading", {
    name: /личный кабинет|вход|авторизация|кабинет организатора|админ/i,
  });
  return (await loginButton.count()) > 0 || (await loginHeading.count()) > 0;
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
      `<${sample.tag}${sample.id ? `#${sample.id}` : ""}> right=${sample.right}px bottom=${sample.bottom}px (${sample.className.slice(0, 60)})`,
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
    return lines.join("\n");
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

  return lines.join("\n");
}
