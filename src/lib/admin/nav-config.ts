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
    id: "operations-hub",
    section: "operations",
    href: "/admin/operations",
    label: "Операции",
    description: "Командный центр и приоритеты",
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
    id: "operations-privacy",
    section: "operations",
    href: "/admin/operations/privacy-requests",
    label: "Запросы на удаление",
    description: "GDPR: очередь удаления данных",
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
    id: "operations-payments",
    section: "operations",
    href: "/admin/operations/payments",
    label: "Платежи",
    capability: "operations.bookings",
  },
  {
    id: "operations-reconciliation",
    section: "operations",
    href: "/admin/operations/reconciliation",
    label: "Сверка платежей",
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
    id: "marketplace-organizers",
    section: "marketplace",
    href: "/admin/marketplace/organizers",
    label: "Организаторы",
    description: "Анкеты и допуск в кабинет",
    capability: "marketplace.moderation",
  },
  {
    id: "marketplace-experts",
    section: "marketplace",
    href: "/admin/marketplace/experts",
    label: "Эксперты",
    description: "Локальные гиды и консультанты",
    capability: "marketplace.moderation",
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
    id: "content-media",
    section: "content",
    href: "/admin/media",
    label: "Медиатека",
    description: "Manifest assets — heroes, gallery, stock",
    capability: "content.edit",
  },
  {
    id: "content-translations",
    section: "content",
    href: "/admin/content/translations",
    label: "Переводы",
    description: "Покрытие ES/EN и очереди перевода",
    capability: "content.edit",
  },
  {
    id: "content-freshness",
    section: "content",
    href: "/admin/content-freshness",
    label: "Актуальность",
    description: "Контроль сроков проверки материалов",
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
    id: "analytics-funnels",
    section: "analytics",
    href: "/admin/analytics/funnels",
    label: "Воронки",
    description: "Воронка, когорты и экспорт",
    capability: "analytics.view",
  },
  {
    id: "system-settings",
    section: "system",
    href: "/admin/system/settings",
    label: "Настройки",
    capability: "system.settings",
  },
  {
    id: "system-feature-flags",
    section: "system",
    href: "/admin/feature-flags",
    label: "Флаги функций",
    description: "Rollout и A/B-эксперименты",
    capability: "system.settings",
  },
  {
    id: "system-api-keys",
    section: "system",
    href: "/admin/system/api-keys",
    label: "API-ключи",
    description: "Публичное API v1 для партнёров",
    capability: "system.settings",
  },
  {
    id: "system-staff",
    section: "system",
    href: "/admin/system/staff",
    label: "Команда",
    description: "Роли и доступ администраторов",
    capability: "users.manage",
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
