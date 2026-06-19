import {
  ADMIN_NAV_ITEMS,
  ADMIN_NAV_SECTION_LABELS,
} from "@/lib/admin/nav-config";
import type { AdminNavItem, AdminNavSectionId } from "@/types/admin";

export type AdminBreadcrumbItem = {
  label: string;
  href?: string;
};

const ADMIN_NAV_SECTION_HREFS: Record<AdminNavSectionId, string> = {
  dashboard: "/admin",
  operations: "/admin/operations",
  marketplace: "/admin/marketplace/tours",
  content: "/admin/content/documents",
  users: "/admin/users",
  analytics: "/admin/analytics",
  system: "/admin/system/settings",
};

const SEGMENT_LABELS: Record<string, string> = {
  preview: "Превью",
  documents: "Документы",
  "content-freshness": "Актуальность контента",
  bookings: "Бронирования",
  payments: "Платежи",
  leads: "Лиды",
  "privacy-requests": "Удаление данных",
  moderation: "Модерация",
  organizers: "Организаторы",
  tours: "Туры",
  excursions: "Экскурсии",
  settings: "Настройки",
  "feature-flags": "Флаги функций",
  "api-keys": "API-ключи",
  staff: "Команда",
  audit: "Журнал",
  funnels: "Воронки",
  "shop-orders": "Заказы магазина",
  reconciliation: "Сверка",
};

function findBestNavMatch(pathname: string): AdminNavItem | null {
  let best: AdminNavItem | null = null;
  for (const item of ADMIN_NAV_ITEMS) {
    const matches =
      pathname === item.href ||
      (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
    if (!matches) continue;
    if (!best || item.href.length > best.href.length) best = item;
  }
  return best;
}

function formatSegmentLabel(segment: string): string {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  if (segment.length > 16) return `${segment.slice(0, 8)}…${segment.slice(-4)}`;
  return segment;
}

export function resolveAdminBreadcrumbs(pathname: string): AdminBreadcrumbItem[] {
  if (pathname === "/admin") {
    return [{ label: "Панель" }];
  }

  const crumbs: AdminBreadcrumbItem[] = [{ label: "Панель", href: "/admin" }];
  const navItem = findBestNavMatch(pathname);

  if (!navItem) {
    const segments = pathname.replace(/^\/admin\/?/, "").split("/").filter(Boolean);
    let acc = "/admin";
    segments.forEach((segment, index) => {
      acc += `/${segment}`;
      const isLast = index === segments.length - 1;
      crumbs.push({
        label: formatSegmentLabel(segment),
        href: isLast ? undefined : acc,
      });
    });
    return crumbs;
  }

  if (navItem.section !== "dashboard") {
    crumbs.push({
      label: ADMIN_NAV_SECTION_LABELS[navItem.section],
      href: ADMIN_NAV_SECTION_HREFS[navItem.section],
    });
  }

  const rest = pathname.slice(navItem.href.length).replace(/^\/+/, "");
  if (!rest) {
    crumbs.push({ label: navItem.label });
    return crumbs;
  }

  crumbs.push({ label: navItem.label, href: navItem.href });

  const parts = rest.split("/").filter(Boolean);
  let acc = navItem.href;
  parts.forEach((part, index) => {
    acc += `/${part}`;
    const isLast = index === parts.length - 1;
    crumbs.push({
      label: formatSegmentLabel(part),
      href: isLast ? undefined : acc,
    });
  });

  return crumbs;
}
