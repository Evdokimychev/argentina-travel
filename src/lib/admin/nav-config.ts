import type { AdminNavItem, AdminNavSectionId } from "@/types/admin";

export const ADMIN_NAV_SECTION_LABELS: Record<AdminNavSectionId, string> = {
  dashboard: "Обзор",
  operations: "Операции",
  marketplace: "Маркетплейс",
  content: "Контент",
  users: "Пользователи",
  analytics: "Аналитика",
  system: "Система",
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    id: "dashboard",
    section: "dashboard",
    href: "/admin",
    label: "Панель",
    capability: "dashboard.view",
  },
  {
    id: "operations-leads",
    section: "operations",
    href: "/admin/operations/leads",
    label: "Лиды и заявки",
    description: "Подписки, контакты, консультации",
    capability: "operations.leads",
  },
  {
    id: "operations-bookings",
    section: "operations",
    href: "/admin/operations/bookings",
    label: "Бронирования",
    capability: "operations.bookings",
  },
  {
    id: "operations-shop",
    section: "operations",
    href: "/admin/operations/shop-orders",
    label: "Заказы магазина",
    capability: "operations.shop",
  },
  {
    id: "marketplace-tours",
    section: "marketplace",
    href: "/admin/marketplace/tours",
    label: "Туры",
    capability: "marketplace.tours",
  },
  {
    id: "marketplace-excursions",
    section: "marketplace",
    href: "/admin/marketplace/excursions",
    label: "Экскурсии",
    description: "Tripster / Sputnik8",
    capability: "marketplace.excursions",
  },
  {
    id: "marketplace-moderation",
    section: "marketplace",
    href: "/admin/marketplace/moderation",
    label: "Модерация",
    capability: "marketplace.moderation",
  },
  {
    id: "content-documents",
    section: "content",
    href: "/admin/content/documents",
    label: "Документы",
    capability: "content.edit",
  },
  {
    id: "users-list",
    section: "users",
    href: "/admin/users",
    label: "Пользователи",
    capability: "users.view",
  },
  {
    id: "analytics-overview",
    section: "analytics",
    href: "/admin/analytics",
    label: "Сводка",
    capability: "analytics.view",
  },
  {
    id: "system-settings",
    section: "system",
    href: "/admin/system/settings",
    label: "Настройки",
    capability: "system.settings",
    comingSoon: true,
  },
  {
    id: "system-audit",
    section: "system",
    href: "/admin/system/audit",
    label: "Журнал действий",
    capability: "system.audit",
  },
];

export function filterAdminNavItems(
  capabilities: readonly string[],
  options?: { includeComingSoon?: boolean }
): AdminNavItem[] {
  const includeComingSoon = options?.includeComingSoon ?? false;
  return ADMIN_NAV_ITEMS.filter((item) => {
    if (item.comingSoon && !includeComingSoon) return false;
    return (
      capabilities.includes("*") ||
      capabilities.includes(item.capability)
    );
  });
}

export function groupAdminNavItems(items: AdminNavItem[]): Map<AdminNavSectionId, AdminNavItem[]> {
  const groups = new Map<AdminNavSectionId, AdminNavItem[]>();
  for (const item of items) {
    const list = groups.get(item.section) ?? [];
    list.push(item);
    groups.set(item.section, list);
  }
  return groups;
}
