import type {
  SiteModulesGlobal,
  SiteNavigationGlobal,
  SitePublicModuleId,
} from "@/types/site-globals";

export type ProductModuleId =
  | SitePublicModuleId
  | "home"
  | "routeBuilder"
  | "contacts"
  | "bookingLookup"
  | "account"
  | "favorites"
  | "bookings"
  | "apartments"
  | "carRental"
  | "transfers"
  | "hotels"
  | "integrations";

export type ProductModuleGroup =
  | "core"
  | "content"
  | "sales"
  | "community"
  | "services"
  | "system";

export type ProductModuleStatus =
  | "active"
  | "disabled"
  | "not_published"
  | "hidden_from_navigation"
  | "not_configured"
  | "dependency_unavailable"
  | "unavailable";

export type ProductModuleDefinition = {
  id: ProductModuleId;
  label: string;
  description: string;
  group: ProductModuleGroup;
  publicPath: string | null;
  adminPath: string;
  codeAvailable: boolean;
  publicModuleId?: SitePublicModuleId;
  navigationKey?: keyof SiteNavigationGlobal;
  lifecycleSource?: "settings" | "travel_mode" | "system";
  dependencies?: ProductModuleId[];
  discoverable?: boolean;
};

export type ProductModuleSnapshot = ProductModuleDefinition & {
  status: ProductModuleStatus;
  activated: boolean;
  configured: boolean;
  published: boolean;
  visibleInNavigation: boolean;
  publicAvailable: boolean;
  includedInSearch: boolean;
  includedInSitemap: boolean;
  reason: string | null;
};

const settingsModule = (
  definition: Omit<ProductModuleDefinition, "codeAvailable" | "lifecycleSource">,
): ProductModuleDefinition => ({
  ...definition,
  codeAvailable: true,
  lifecycleSource: "settings",
});

export const PRODUCT_MODULE_REGISTRY: readonly ProductModuleDefinition[] = [
  {
    id: "home",
    label: "Главная страница",
    description: "Основная точка входа на сайт и его ключевые предложения.",
    group: "core",
    publicPath: "/",
    adminPath: "/admin/system/settings?tab=appearance",
    codeAvailable: true,
    lifecycleSource: "system",
  },
  settingsModule({
    id: "tours",
    publicModuleId: "tours",
    navigationKey: "showTours",
    label: "Туры",
    description: "Каталог собственных и партнёрских туров, подбор и бронирование.",
    group: "sales",
    publicPath: "/tours",
    adminPath: "/admin/marketplace/tours",
  }),
  settingsModule({
    id: "excursions",
    publicModuleId: "excursions",
    navigationKey: "showExcursions",
    label: "Экскурсии",
    description: "Каталог экскурсий и честный переход к партнёрскому бронированию.",
    group: "sales",
    publicPath: "/excursions",
    adminPath: "/admin/marketplace/excursions",
  }),
  settingsModule({
    id: "destinations",
    publicModuleId: "destinations",
    navigationKey: "showDestinations",
    label: "Направления и регионы",
    description: "Посадочные страницы регионов и ключевых направлений Аргентины.",
    group: "content",
    publicPath: "/destinations",
    adminPath: "/admin/content/documents",
    dependencies: ["geography"],
  }),
  settingsModule({
    id: "places",
    publicModuleId: "places",
    navigationKey: "showPlaces",
    label: "Города и достопримечательности",
    description: "Места, коллекции, маршруты и интерактивная карта.",
    group: "content",
    publicPath: "/places",
    adminPath: "/admin/content/map",
    dependencies: ["geography"],
  }),
  settingsModule({
    id: "geography",
    publicModuleId: "geography",
    navigationKey: "showGeography",
    label: "География",
    description: "Общий модуль направлений, мест, коллекций и карты.",
    group: "content",
    publicPath: "/destinations",
    adminPath: "/admin/content/map",
  }),
  settingsModule({
    id: "guide",
    publicModuleId: "guide",
    navigationKey: "showGuide",
    label: "Путеводитель",
    description: "Практические материалы для подготовки поездки.",
    group: "content",
    publicPath: "/guide",
    adminPath: "/admin/content/documents",
  }),
  settingsModule({
    id: "gallery",
    publicModuleId: "gallery",
    navigationKey: "showGallery",
    label: "Галерея",
    description: "Публичная подборка фотографий и медиаматериалов.",
    group: "content",
    publicPath: "/gallery",
    adminPath: "/admin/media",
  }),
  settingsModule({
    id: "immigration",
    publicModuleId: "immigration",
    navigationKey: "showImmigration",
    label: "Переезд и иммиграция",
    description: "Публичный справочник о ВНЖ, документах и переезде без юридических гарантий.",
    group: "content",
    publicPath: "/immigration",
    adminPath: "/admin/modules",
  }),
  settingsModule({
    id: "knowledgeBase",
    publicModuleId: "knowledgeBase",
    navigationKey: "showKnowledgeBase",
    label: "База знаний",
    description: "Опубликованные справочные материалы; контент ведётся отдельным редакционным процессом.",
    group: "content",
    publicPath: "/baza-znaniy",
    adminPath: "/admin/content/knowledge",
  }),
  settingsModule({
    id: "journal",
    publicModuleId: "journal",
    navigationKey: "showJournal",
    label: "Журнал",
    description: "Редакционные статьи, авторы, комментарии и рекомендации.",
    group: "content",
    publicPath: "/blog",
    adminPath: "/admin/content/documents",
  }),
  settingsModule({
    id: "forum",
    publicModuleId: "forum",
    navigationKey: "showForum",
    label: "Форум",
    description: "Публичные обсуждения и административная модерация.",
    group: "community",
    publicPath: "/forum",
    adminPath: "/admin/content/forum",
  }),
  settingsModule({
    id: "shop",
    publicModuleId: "shop",
    navigationKey: "showShop",
    label: "Магазин",
    description: "Цифровые и физические товары, заявки и статусы заказов.",
    group: "sales",
    publicPath: "/shop",
    adminPath: "/admin/content/shop",
  }),
  settingsModule({
    id: "services",
    publicModuleId: "services",
    navigationKey: "showServices",
    label: "Сервисы",
    description: "Единая витрина транспорта, жилья, связи и партнёрских услуг.",
    group: "services",
    publicPath: "/services",
    adminPath: "/admin/system/settings?tab=commerce",
  }),
  settingsModule({
    id: "about",
    publicModuleId: "about",
    navigationKey: "showAbout",
    label: "О проекте",
    description: "Информация о продукте и принципах работы.",
    group: "core",
    publicPath: "/about",
    adminPath: "/admin/system/settings?tab=marketing",
  }),
  {
    id: "routeBuilder",
    label: "Подбор маршрута",
    description: "Пошаговый подбор тура по интересам путешественника.",
    group: "sales",
    publicPath: "/podbor",
    adminPath: "/admin/marketplace/tours",
    codeAvailable: true,
    lifecycleSource: "system",
    dependencies: ["tours"],
  },
  {
    id: "contacts",
    label: "Контакты и формы",
    description: "Контактные данные, обратная связь и защита гостевых форм.",
    group: "core",
    publicPath: "/contacts",
    adminPath: "/admin/system/settings?tab=marketing",
    codeAvailable: true,
    lifecycleSource: "system",
  },
  {
    id: "bookingLookup",
    label: "Поиск заявки",
    description: "Безопасный поиск бронирования гостем.",
    group: "sales",
    publicPath: "/booking/find",
    adminPath: "/admin/operations/bookings",
    codeAvailable: true,
    lifecycleSource: "system",
    discoverable: false,
  },
  {
    id: "account",
    label: "Личный кабинет",
    description: "Профиль туриста, уведомления и персональные действия.",
    group: "core",
    publicPath: "/profile",
    adminPath: "/admin/users",
    codeAvailable: true,
    lifecycleSource: "system",
    discoverable: false,
  },
  {
    id: "favorites",
    label: "Избранное",
    description: "Сохранённые туры, экскурсии и места пользователя.",
    group: "core",
    publicPath: "/profile/favorites",
    adminPath: "/admin/users",
    codeAvailable: true,
    lifecycleSource: "system",
    dependencies: ["account"],
    discoverable: false,
  },
  {
    id: "bookings",
    label: "Бронирования",
    description: "Заявки, статусы и коммуникация туриста с командой.",
    group: "sales",
    publicPath: "/profile/bookings",
    adminPath: "/admin/operations/bookings",
    codeAvailable: true,
    lifecycleSource: "system",
    dependencies: ["account"],
    discoverable: false,
  },
  {
    id: "apartments",
    label: "Апартаменты",
    description: "Каталог или заявка на подбор жилья в зависимости от выбранного режима.",
    group: "services",
    publicPath: "/apartments",
    adminPath: "/admin/marketplace/apartments",
    codeAvailable: true,
    lifecycleSource: "travel_mode",
  },
  {
    id: "carRental",
    label: "Аренда автомобилей",
    description: "Партнёрская аренда или подготовка собственного каталога.",
    group: "services",
    publicPath: "/car-rental",
    adminPath: "/admin/marketplace/mobility",
    codeAvailable: true,
    lifecycleSource: "travel_mode",
  },
  {
    id: "transfers",
    label: "Трансферы",
    description: "Партнёрский поиск или заявка менеджеру.",
    group: "services",
    publicPath: "/transfers",
    adminPath: "/admin/marketplace/mobility",
    codeAvailable: true,
    lifecycleSource: "travel_mode",
  },
  {
    id: "hotels",
    label: "Отели",
    description: "Будущая вертикаль; публичный маршрут пока не заявлен.",
    group: "services",
    publicPath: null,
    adminPath: "/admin/modules",
    codeAvailable: false,
    lifecycleSource: "travel_mode",
  },
  {
    id: "integrations",
    label: "Интеграции",
    description: "Партнёрские API, почта, аналитика, карты и платежи.",
    group: "system",
    publicPath: null,
    adminPath: "/admin/system/settings?tab=marketing",
    codeAvailable: true,
    lifecycleSource: "system",
  },
] as const;

function resolveTravelMode(
  id: ProductModuleId,
  modules: SiteModulesGlobal,
): { activated: boolean; configured: boolean; published: boolean; reason: string | null } {
  if (id === "apartments") {
    const activated = modules.apartmentsMode !== "disabled";
    return {
      activated,
      configured: modules.apartmentsMode === "native_request" || modules.apartmentsMode === "request",
      published: modules.apartmentsMode === "native_request",
      reason: activated && modules.apartmentsMode !== "native_request"
        ? "Сейчас доступен подбор по заявке; собственный каталог ещё не опубликован."
        : null,
    };
  }
  if (id === "carRental") {
    const activated = modules.carRentalMode !== "disabled";
    return { activated, configured: activated, published: activated, reason: null };
  }
  if (id === "transfers") {
    const activated = modules.transfersMode !== "disabled";
    return { activated, configured: activated, published: activated, reason: null };
  }
  const activated = modules.hotelsMode !== "disabled";
  return {
    activated,
    configured: false,
    published: false,
    reason: "Публичный маршрут и рабочий сценарий ещё не реализованы.",
  };
}

export function resolveProductModuleSnapshots(
  navigation: SiteNavigationGlobal,
  modules: SiteModulesGlobal,
): ProductModuleSnapshot[] {
  const snapshots = PRODUCT_MODULE_REGISTRY.map((definition): ProductModuleSnapshot => {
    if (definition.lifecycleSource === "settings" && definition.publicModuleId) {
      const state = modules.publicModules[definition.publicModuleId];
      const navigationRequested = definition.navigationKey
        ? navigation[definition.navigationKey] === true
        : true;
      const publicAvailable = definition.codeAvailable && state.activated && state.published;
      const visibleInNavigation = publicAvailable && navigationRequested;
      const status: ProductModuleStatus = !definition.codeAvailable
        ? "unavailable"
        : !state.activated
          ? "disabled"
          : !state.published
            ? "not_published"
            : !navigationRequested
              ? "hidden_from_navigation"
              : "active";
      return {
        ...definition,
        status,
        activated: state.activated,
        configured: true,
        published: state.published,
        visibleInNavigation,
        publicAvailable,
        includedInSearch: publicAvailable && state.includeInSearch,
        includedInSitemap: publicAvailable && state.includeInSitemap,
        reason:
          status === "disabled"
            ? "Модуль отключён владельцем сайта. Данные сохранены."
            : status === "not_published"
              ? "Модуль активирован, но публичная страница не опубликована."
              : status === "hidden_from_navigation"
                ? "Публичный URL работает, но ссылка скрыта из меню."
                : null,
      };
    }

    if (definition.lifecycleSource === "travel_mode") {
      const state = resolveTravelMode(definition.id, modules);
      const publicAvailable = definition.codeAvailable && state.activated && state.published;
      return {
        ...definition,
        status: !definition.codeAvailable
          ? "unavailable"
          : !state.activated
            ? "disabled"
            : !state.configured
              ? "not_configured"
              : !state.published
                ? "not_published"
                : "active",
        activated: state.activated,
        configured: state.configured,
        published: state.published,
        visibleInNavigation: publicAvailable,
        publicAvailable,
        includedInSearch: publicAvailable,
        includedInSitemap: publicAvailable,
        reason: state.reason,
      };
    }

    const discoverable = definition.discoverable !== false;
    return {
      ...definition,
      status: definition.codeAvailable ? "active" : "unavailable",
      activated: definition.codeAvailable,
      configured: definition.codeAvailable,
      published: Boolean(definition.publicPath && definition.codeAvailable),
      visibleInNavigation: Boolean(definition.publicPath && definition.codeAvailable),
      publicAvailable: Boolean(definition.publicPath && definition.codeAvailable),
      includedInSearch: Boolean(definition.publicPath && definition.codeAvailable && discoverable),
      includedInSitemap: Boolean(definition.publicPath && definition.codeAvailable && discoverable),
      reason: definition.codeAvailable ? null : "Код или обязательная инфраструктура отсутствуют.",
    };
  });

  const byId = new Map(snapshots.map((snapshot) => [snapshot.id, snapshot]));
  return snapshots.map((snapshot) => {
    const missingDependency = snapshot.dependencies?.find(
      (id) => !byId.get(id)?.publicAvailable,
    );
    if (!missingDependency || !snapshot.publicAvailable) return snapshot;
    return {
      ...snapshot,
      status: "dependency_unavailable",
      publicAvailable: false,
      visibleInNavigation: false,
      includedInSearch: false,
      includedInSitemap: false,
      reason: `Недоступна зависимость: ${byId.get(missingDependency)?.label ?? missingDependency}.`,
    };
  });
}
