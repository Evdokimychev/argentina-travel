export type ServiceItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  href: string;
  external?: boolean;
};

export type ServiceCategory = {
  id: string;
  title: string;
  description: string;
  items: ServiceItem[];
};

export const SERVICES_HUB_INTRO =
  "Партнёрские сервисы и заявки на помощь с перелётами, трансферами, страхованием и визовой поддержкой. Мы не продаём билеты и не оформляем документы — только направляем к партнёрам или связываем с менеджером.";

export const SERVICES_HUB_DISCLAIMER =
  "Информация носит справочный характер. Argentina Travel не является турагентом, страховой компанией или миграционным консультантом. Бронирование и оплата — на сайтах партнёров или по отдельному согласованию с менеджером.";

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: "flights",
    title: "Авиабилеты",
    description: "Поиск и сравнение маршрутов в Аргентину и внутренние перелёты.",
    items: [
      {
        id: "flights-compare",
        slug: "flight-search",
        title: "Сравнить авиабилеты",
        description: "Агрегатор маршрутов в Буэнос-Айрес и региональные хабы.",
        href: "/flights",
      },
      {
        id: "flights-request",
        slug: "flight-request",
        title: "Заявка на подбор перелёта",
        description: "Менеджер поможет с датами и стыковками внутри Аргентины.",
        href: "/contacts?service=flight-request",
      },
    ],
  },
  {
    id: "transfers",
    title: "Трансферы",
    description: "Аэропорт, между городами и до отелей в популярных регионах.",
    items: [
      {
        id: "transfers-search",
        slug: "transfer-search",
        title: "Найти трансфер",
        description: "Аэропорт, отель и между городами — поиск через партнёра Intui.",
        href: "/transfers",
      },
      {
        id: "transfers-airport",
        slug: "airport-transfer",
        title: "Трансфер из аэропорта EZE",
        description: "Буэнос-Айрес и пригороды — быстрый поиск из Эсейсы.",
        href: "/transfers?from=eze&to=ba-center",
      },
      {
        id: "transfers-patagonia",
        slug: "patagonia-transfer",
        title: "Трансферы в Патагонии",
        description: "Эль-Калафате, Чалten, Барилоче — индивидуальные и групповые.",
        href: "/contacts?service=patagonia-transfer",
      },
    ],
  },
  {
    id: "insurance",
    title: "Страхование",
    description: "Медицинская страховка для поездки и активных туров.",
    items: [
      {
        id: "insurance-travel",
        slug: "travel-insurance",
        title: "Туристическая страховка",
        description: "Покрытие медицины и эвакуации — онлайн через партнёра Travelpayouts.",
        href: "/insurance",
      },
      {
        id: "insurance-request",
        slug: "insurance-request",
        title: "Помощь с выбором полиса",
        description: "Расскажите о маршруте — подскажем тип покрытия.",
        href: "/contacts?service=insurance-request",
      },
    ],
  },
  {
    id: "car-rental",
    title: "Аренда авто",
    description: "Прокат автомобиля для самостоятельных поездок по регионам Аргентины.",
    items: [
      {
        id: "car-rental-search",
        slug: "car-rental",
        title: "Найти автомобиль",
        description: "Сравнение классов и условий аренды через партнёра LocalRent.",
        href: "/car-rental",
      },
      {
        id: "car-rental-regions",
        slug: "car-rental-regions",
        title: "Для поездок по регионам",
        description: "Патагония, Мендоса и северо-запад — где авто удобнее общественного транспорта.",
        href: "/car-rental",
      },
    ],
  },
  {
    id: "connectivity",
    title: "Связь и интернет",
    description: "eSIM для поездки — интернет сразу после прилёта без поиска SIM.",
    items: [
      {
        id: "esim-catalog",
        slug: "esim",
        title: "eSIM Airalo",
        description: "Пакеты мобильного интернета для Аргентины и региона.",
        href: "/esim",
      },
      {
        id: "esim-argentina",
        slug: "esim-argentina",
        title: "eSIM для Аргентины",
        description: "Локальные и региональные пакеты — активация до вылета.",
        href: "/esim?country=argentina",
      },
    ],
  },
  {
    id: "audio-guides",
    title: "Аудиогиды",
    description: "Самостоятельные аудиомаршруты по городу — в удобном темпе и без группы.",
    items: [
      {
        id: "audio-guides-catalog",
        slug: "audio-guides",
        title: "Каталог аудиогидов",
        description: "WeGoTrip: Буэнос-Айрес и другие города через мобильное приложение.",
        href: "/audio-guides",
      },
      {
        id: "audio-guides-ba",
        slug: "audio-guides-ba",
        title: "Буэнос-Айрес",
        description: "Recoleta, центр и музеи — аудиомаршруты на русском и английском.",
        href: "/audio-guides?city=buenos-aires",
      },
    ],
  },
  {
    id: "visa-support",
    title: "Визовая поддержка",
    description: "Консультации по въезду, продлению и видам ВНЖ — не юридические услуги.",
    items: [
      {
        id: "visa-materials",
        slug: "visa-materials",
        title: "Материалы по въезду",
        description: "Визы, документы и обзор ВНЖ на платформе.",
        href: "/immigration",
      },
      {
        id: "visa-consult",
        slug: "visa-consult",
        title: "Запрос консультации",
        description: "Свяжем с партнёром-миграционным консультантом.",
        href: "/contacts?service=visa-consult",
      },
    ],
  },
];

export function getServiceBySlug(slug: string): ServiceItem | undefined {
  for (const category of SERVICE_CATEGORIES) {
    const item = category.items.find((entry) => entry.slug === slug);
    if (item) return item;
  }
  return undefined;
}
