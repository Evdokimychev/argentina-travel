/**
 * Данные и UI-копирайт для редакционных виджетов сборов в Патагонию.
 * Логика вынесена в компоненты src/components/travel/*, тексты — сюда,
 * чтобы копирайт был локализуемым и проверяемым тестами.
 *
 * Факт-checking: конкретные лекарства не называем (только «личные препараты
 * по назначению врача»); про воду из ручьёв даём предупреждение об
 * обеззараживании. Погода и открытие маршрутов уточняются перед поездкой.
 */

export type PackingScenario =
  | "city"
  | "day-hike"
  | "glacier"
  | "winter"
  | "road-trip"
  | "multi-day"
  | "with-children";

export type PackingSeason = "any" | "summer" | "winter";

export type PackingCategory =
  | "clothing"
  | "footwear"
  | "backpack"
  | "food-water"
  | "sun"
  | "tech"
  | "documents"
  | "first-aid"
  | "car"
  | "multiday-gear";

export type PackingItem = {
  id: string;
  label: string;
  category: PackingCategory;
  /**
   * Сценарии, в которых показываем вещь. Пустой массив/undefined = базовая
   * вещь для всех туристических сценариев, кроме снаряжения только для
   * многодневного трека (см. advancedOnly).
   */
  scenarios: PackingScenario[];
  /** Сезоны, для которых актуальна вещь. По умолчанию — любой. */
  seasons?: PackingSeason[];
  /**
   * Если true — прячем, пока не выбран сценарий «многодневный трек»
   * (или «с детьми» для детских вещей).
   */
  advancedOnly?: boolean;
  /** Русский заголовок группы для секций интерфейса. */
  group: string;
  note?: string;
};

export type PackingScenarioOption = {
  id: PackingScenario;
  label: string;
  description: string;
};

export type PackingSeasonOption = {
  id: PackingSeason;
  label: string;
};

export const PACKING_SCENARIO_OPTIONS: PackingScenarioOption[] = [
  {
    id: "city",
    label: "Города и базовый туризм",
    description:
      "Эль-Калафате, Ушуая, Барилоче: прогулки, кафе, музеи, короткие выезды к достопримечательностям.",
  },
  {
    id: "day-hike",
    label: "Однодневный трек",
    description: "Выход на тропу на несколько часов с возвращением в город к вечеру.",
  },
  {
    id: "glacier",
    label: "Ледник и ледовый мини-трек",
    description: "Перито-Морено, прогулки вдоль ледника и мини-трекинг по льду с гидом.",
  },
  {
    id: "winter",
    label: "Зимняя поездка",
    description: "Июнь–сентябрь: холод, снег, короткий световой день, горнолыжный сезон.",
  },
  {
    id: "road-trip",
    label: "Автопутешествие",
    description: "Аренда авто и длинные перегоны по Патагонии, включая Ruta 40 и участки грунта.",
  },
  {
    id: "multi-day",
    label: "Многодневный автономный трек",
    description: "Ночёвки в палатке, автономность и самостоятельное приготовление еды.",
  },
  {
    id: "with-children",
    label: "Поездка с детьми",
    description: "Дополнительные вещи, перекусы и запас одежды для детей.",
  },
];

export const PACKING_SEASON_OPTIONS: PackingSeasonOption[] = [
  { id: "any", label: "Любой сезон" },
  { id: "summer", label: "Лето (ноябрь–март)" },
  { id: "winter", label: "Зима (июнь–сентябрь)" },
];

export const PACKING_CATEGORY_LABELS: Record<PackingCategory, string> = {
  clothing: "Одежда",
  footwear: "Обувь",
  backpack: "Рюкзак и сумки",
  "food-water": "Еда и вода",
  sun: "Солнце и ветер",
  tech: "Электроника",
  documents: "Документы и деньги",
  "first-aid": "Аптечка и гигиена",
  car: "Для поездки на авто",
  "multiday-gear": "Снаряжение для трека",
};

// Русские заголовки групп — используются как секции в интерфейсе списка.
const GROUP_DOCUMENTS = "Документы и деньги";
const GROUP_LAYERS = "Одежда: система слоёв";
const GROUP_CLOTHING = "Остальная одежда";
const GROUP_FOOTWEAR = "Обувь";
const GROUP_BACKPACK = "Рюкзак и сумки";
const GROUP_SUN = "Защита от солнца и ветра";
const GROUP_FOOD = "Еда и вода";
const GROUP_TECH = "Электроника";
const GROUP_FIRST_AID = "Аптечка и гигиена";
const GROUP_CAR = "Для поездки на авто";
const GROUP_MULTIDAY = "Снаряжение для многодневного трека";
const GROUP_CHILDREN = "Для детей";

const WATER_SAFETY_NOTE =
  "Не пейте воду из ручьёв и рек без обеззараживания: даже прозрачная холодная вода может быть небезопасна.";

export const PATAGONIA_PACKING_ITEMS: PackingItem[] = [
  // ── Документы и деньги (базовые, любой сценарий) ──
  {
    id: "passport",
    label: "Загранпаспорт и копии (бумажная и в телефоне)",
    category: "documents",
    scenarios: [],
    group: GROUP_DOCUMENTS,
  },
  {
    id: "insurance",
    label: "Медицинская страховка с покрытием треккинга",
    category: "documents",
    scenarios: [],
    group: GROUP_DOCUMENTS,
    note: "Проверьте, что полис покрывает активный отдых и высоту, если планируете ледник или горы.",
  },
  {
    id: "cash-pesos",
    label: "Наличные песо и запасная банковская карта",
    category: "documents",
    scenarios: [],
    group: GROUP_DOCUMENTS,
    note: "В посёлках и на трассах связь и терминалы работают не всегда — держите запас наличных.",
  },
  {
    id: "bookings",
    label: "Брони жилья, билеты и подтверждения (офлайн-копии)",
    category: "documents",
    scenarios: [],
    group: GROUP_DOCUMENTS,
  },
  {
    id: "driver-license",
    label: "Водительские права (международного образца)",
    category: "documents",
    scenarios: ["road-trip"],
    group: GROUP_DOCUMENTS,
  },

  // ── Система слоёв (одежда) ──
  {
    id: "base-layer",
    label: "Термобельё (базовый слой), 1–2 комплекта",
    category: "clothing",
    scenarios: [],
    group: GROUP_LAYERS,
    note: "Синтетика или шерсть мериноса; хлопок в горах сохнет медленно и холодит.",
  },
  {
    id: "mid-fleece",
    label: "Флисовая кофта (средний слой)",
    category: "clothing",
    scenarios: [],
    group: GROUP_LAYERS,
  },
  {
    id: "insulation",
    label: "Утепляющая куртка (пуховик или синтепон)",
    category: "clothing",
    scenarios: [],
    group: GROUP_LAYERS,
  },
  {
    id: "shell-jacket",
    label: "Мембранная куртка от ветра и дождя",
    category: "clothing",
    scenarios: [],
    group: GROUP_LAYERS,
    note: "Ветер в Патагонии — главный фактор. Внешний слой нужен даже летом.",
  },
  {
    id: "shell-pants",
    label: "Непромокаемые брюки или ветрозащитные штаны",
    category: "clothing",
    scenarios: ["day-hike", "glacier", "winter", "multi-day"],
    group: GROUP_LAYERS,
  },
  {
    id: "warm-hat",
    label: "Тёплая шапка и бафф (шарф-труба)",
    category: "clothing",
    scenarios: [],
    group: GROUP_LAYERS,
  },
  {
    id: "gloves",
    label: "Перчатки (тонкие + тёплые)",
    category: "clothing",
    scenarios: ["day-hike", "glacier", "winter", "multi-day"],
    group: GROUP_LAYERS,
  },

  // ── Остальная одежда ──
  {
    id: "trekking-pants",
    label: "Треккинговые брюки (быстросохнущие)",
    category: "clothing",
    scenarios: ["day-hike", "glacier", "multi-day", "road-trip"],
    group: GROUP_CLOTHING,
  },
  {
    id: "casual-clothes",
    label: "Повседневная одежда для города и кафе",
    category: "clothing",
    scenarios: [],
    group: GROUP_CLOTHING,
  },
  {
    id: "socks-trek",
    label: "Треккинговые носки (несколько пар)",
    category: "clothing",
    scenarios: [],
    group: GROUP_CLOTHING,
  },
  {
    id: "thermal-tights",
    label: "Тёплые кальсоны/леггинсы под брюки",
    category: "clothing",
    scenarios: ["winter"],
    seasons: ["winter"],
    group: GROUP_CLOTHING,
  },
  {
    id: "swimwear",
    label: "Купальник (термы, отель, озёра)",
    category: "clothing",
    scenarios: ["city", "road-trip"],
    seasons: ["summer"],
    group: GROUP_CLOTHING,
  },

  // ── Обувь ──
  {
    id: "trekking-boots",
    label: "Треккинговые ботинки (разношенные заранее)",
    category: "footwear",
    scenarios: ["day-hike", "glacier", "multi-day"],
    group: GROUP_FOOTWEAR,
    note: "Не берите новую обувь на трек — высок риск мозолей.",
  },
  {
    id: "city-shoes",
    label: "Удобная обувь для города",
    category: "footwear",
    scenarios: [],
    group: GROUP_FOOTWEAR,
  },
  {
    id: "winter-boots",
    label: "Зимние утеплённые ботинки",
    category: "footwear",
    scenarios: ["winter"],
    seasons: ["winter"],
    group: GROUP_FOOTWEAR,
  },
  {
    id: "camp-sandals",
    label: "Лёгкие сандалии/тапки для лагеря",
    category: "footwear",
    scenarios: ["multi-day"],
    advancedOnly: true,
    group: GROUP_FOOTWEAR,
  },

  // ── Рюкзак и сумки ──
  {
    id: "daypack",
    label: "Дневной рюкзак 20–35 л",
    category: "backpack",
    scenarios: [],
    group: GROUP_BACKPACK,
  },
  {
    id: "rain-cover",
    label: "Дождевик/чехол на рюкзак",
    category: "backpack",
    scenarios: ["day-hike", "glacier", "multi-day", "road-trip"],
    group: GROUP_BACKPACK,
  },
  {
    id: "dry-bags",
    label: "Гермомешки или zip-пакеты для вещей",
    category: "backpack",
    scenarios: ["day-hike", "glacier", "multi-day"],
    group: GROUP_BACKPACK,
  },
  {
    id: "big-backpack",
    label: "Ходовой рюкзак 50–70 л",
    category: "multiday-gear",
    scenarios: ["multi-day"],
    advancedOnly: true,
    group: GROUP_BACKPACK,
  },

  // ── Защита от солнца и ветра ──
  {
    id: "sunglasses",
    label: "Солнцезащитные очки (категория 3–4 для ледника)",
    category: "sun",
    scenarios: [],
    group: GROUP_SUN,
  },
  {
    id: "sunscreen",
    label: "Солнцезащитный крем SPF 50+",
    category: "sun",
    scenarios: [],
    group: GROUP_SUN,
    note: "УФ-индекс на юге высокий даже в прохладную погоду.",
  },
  {
    id: "lip-balm",
    label: "Гигиеническая помада с SPF",
    category: "sun",
    scenarios: [],
    group: GROUP_SUN,
  },
  {
    id: "sun-hat",
    label: "Кепка или панама от солнца",
    category: "sun",
    scenarios: [],
    seasons: ["summer", "any"],
    group: GROUP_SUN,
  },

  // ── Еда и вода ──
  {
    id: "water-bottle",
    label: "Бутылка/фляга для воды 1 л",
    category: "food-water",
    scenarios: [],
    group: GROUP_FOOD,
    note: WATER_SAFETY_NOTE,
  },
  {
    id: "snacks",
    label: "Перекусы на тропу (орехи, батончики, сухофрукты)",
    category: "food-water",
    scenarios: ["day-hike", "glacier", "multi-day", "road-trip"],
    group: GROUP_FOOD,
  },
  {
    id: "thermos",
    label: "Термос с горячим напитком",
    category: "food-water",
    scenarios: ["day-hike", "glacier", "winter", "road-trip"],
    group: GROUP_FOOD,
  },
  {
    id: "water-purification",
    label: "Фильтр или средство для обеззараживания воды",
    category: "food-water",
    scenarios: ["multi-day"],
    advancedOnly: true,
    group: GROUP_FOOD,
    note: WATER_SAFETY_NOTE,
  },
  {
    id: "trek-food",
    label: "Раскладка еды на все дни трека",
    category: "food-water",
    scenarios: ["multi-day"],
    advancedOnly: true,
    group: GROUP_FOOD,
  },

  // ── Электроника ──
  {
    id: "phone-charger",
    label: "Телефон, зарядка и адаптер розеток (тип I)",
    category: "tech",
    scenarios: [],
    group: GROUP_TECH,
  },
  {
    id: "power-bank",
    label: "Внешний аккумулятор (повербанк)",
    category: "tech",
    scenarios: [],
    group: GROUP_TECH,
    note: "На холоде батареи разряжаются быстрее — держите технику ближе к телу.",
  },
  {
    id: "offline-maps",
    label: "Офлайн-карты и маршруты в телефоне",
    category: "tech",
    scenarios: ["day-hike", "glacier", "multi-day", "road-trip"],
    group: GROUP_TECH,
  },
  {
    id: "headlamp",
    label: "Налобный фонарь с запасными батарейками",
    category: "tech",
    scenarios: ["day-hike", "glacier", "winter", "multi-day"],
    group: GROUP_TECH,
  },
  {
    id: "camera",
    label: "Фотоаппарат/камера и карты памяти",
    category: "tech",
    scenarios: [],
    group: GROUP_TECH,
  },

  // ── Аптечка и гигиена ──
  {
    id: "personal-meds",
    label: "Личные лекарства по назначению врача (с запасом)",
    category: "first-aid",
    scenarios: [],
    group: GROUP_FIRST_AID,
    note: "Держите рецепты и лекарства в ручной клади; в маленьких посёлках аптек мало.",
  },
  {
    id: "first-aid-kit",
    label: "Базовая аптечка: пластыри, бинт, антисептик",
    category: "first-aid",
    scenarios: [],
    group: GROUP_FIRST_AID,
  },
  {
    id: "blister-care",
    label: "Пластыри и средства от мозолей",
    category: "first-aid",
    scenarios: ["day-hike", "glacier", "multi-day"],
    group: GROUP_FIRST_AID,
  },
  {
    id: "hygiene",
    label: "Гигиена: салфетки, антисептик для рук, зубная щётка",
    category: "first-aid",
    scenarios: [],
    group: GROUP_FIRST_AID,
  },
  {
    id: "toilet-kit",
    label: "Туалетный набор и пакеты для мусора (уносить с собой)",
    category: "first-aid",
    scenarios: ["multi-day"],
    advancedOnly: true,
    group: GROUP_FIRST_AID,
    note: "На тропе действует принцип «не оставляй следов»: весь мусор уносите с собой.",
  },

  // ── Для поездки на авто ──
  {
    id: "car-fuel-plan",
    label: "План заправок и запас топлива на длинные перегоны",
    category: "car",
    scenarios: ["road-trip"],
    group: GROUP_CAR,
    note: "Между посёлками заправки редки — планируйте топливо заранее.",
  },
  {
    id: "car-docs",
    label: "Документы на аренду и контакты прокатной компании",
    category: "car",
    scenarios: ["road-trip"],
    group: GROUP_CAR,
  },
  {
    id: "car-emergency",
    label: "Тёплые вещи и вода в машине на случай остановки",
    category: "car",
    scenarios: ["road-trip"],
    group: GROUP_CAR,
  },

  // ── Снаряжение для многодневного трека (только multi-day) ──
  {
    id: "tent",
    label: "Палатка, устойчивая к ветру",
    category: "multiday-gear",
    scenarios: ["multi-day"],
    advancedOnly: true,
    group: GROUP_MULTIDAY,
  },
  {
    id: "sleeping-bag",
    label: "Спальник с запасом по температуре",
    category: "multiday-gear",
    scenarios: ["multi-day"],
    advancedOnly: true,
    group: GROUP_MULTIDAY,
  },
  {
    id: "sleeping-pad",
    label: "Туристический коврик",
    category: "multiday-gear",
    scenarios: ["multi-day"],
    advancedOnly: true,
    group: GROUP_MULTIDAY,
  },
  {
    id: "stove",
    label: "Горелка, газ и лёгкая посуда",
    category: "multiday-gear",
    scenarios: ["multi-day"],
    advancedOnly: true,
    group: GROUP_MULTIDAY,
  },
  {
    id: "trekking-poles",
    label: "Треккинговые палки",
    category: "multiday-gear",
    scenarios: ["multi-day", "glacier"],
    group: GROUP_MULTIDAY,
  },

  // ── Для детей (only with-children) ──
  {
    id: "kids-layers",
    label: "Детская одежда по системе слоёв + запасной комплект",
    category: "clothing",
    scenarios: ["with-children"],
    advancedOnly: true,
    group: GROUP_CHILDREN,
  },
  {
    id: "kids-snacks",
    label: "Перекусы и вода для детей",
    category: "food-water",
    scenarios: ["with-children"],
    advancedOnly: true,
    group: GROUP_CHILDREN,
  },
  {
    id: "kids-sun",
    label: "Детский солнцезащитный крем и головной убор",
    category: "sun",
    scenarios: ["with-children"],
    advancedOnly: true,
    group: GROUP_CHILDREN,
  },
  {
    id: "kids-entertainment",
    label: "Игрушки/книги на долгие переезды",
    category: "documents",
    scenarios: ["with-children"],
    advancedOnly: true,
    group: GROUP_CHILDREN,
  },
];

export type LayerSystemItem = {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
};

export const LAYER_SYSTEM_ITEMS: LayerSystemItem[] = [
  {
    id: "base",
    title: "Базовый слой",
    summary: "Отводит влагу от тела и держит вас сухим.",
    bullets: [
      "Термобельё из синтетики или шерсти мериноса",
      "Хлопок не подходит: медленно сохнет и холодит",
      "Один комплект на день, второй — сухой на вечер",
    ],
  },
  {
    id: "mid",
    title: "Средний слой",
    summary: "Сохраняет тепло, его легко снять на подъёме.",
    bullets: [
      "Флисовая кофта или тонкий пуховик",
      "Регулируйте тепло, добавляя или снимая слой",
      "В холод — два средних слоя вместо одного толстого",
    ],
  },
  {
    id: "shell",
    title: "Внешний слой",
    summary: "Защищает от ветра и дождя — главное в Патагонии.",
    bullets: [
      "Мембранная куртка от ветра и осадков",
      "Капюшон, который регулируется и не слетает",
      "Ветрозащитные брюки на открытых участках",
    ],
  },
];

export type TripTypePriority = {
  scenario: PackingScenario;
  title: string;
  priorities: string[];
};

export const TRIP_TYPE_PRIORITIES: TripTypePriority[] = [
  {
    scenario: "city",
    title: "Города и базовый туризм",
    priorities: [
      "Мембранная куртка от ветра",
      "Удобная обувь для города",
      "Слои одежды под переменную погоду",
      "Документы и наличные песо",
    ],
  },
  {
    scenario: "day-hike",
    title: "Однодневный трек",
    priorities: [
      "Треккинговые ботинки",
      "Дневной рюкзак и вода",
      "Полный комплект слоёв + дождевик",
      "Перекусы и налобный фонарь",
    ],
  },
  {
    scenario: "glacier",
    title: "Ледник и ледовый мини-трек",
    priorities: [
      "Тёплые слои и перчатки",
      "Очки категории 3–4",
      "Крем SPF 50+",
      "Треккинговые ботинки под кошки гида",
    ],
  },
  {
    scenario: "winter",
    title: "Зимняя поездка",
    priorities: [
      "Утеплённая зимняя обувь",
      "Пуховик и термобельё",
      "Шапка, перчатки, бафф",
      "Запас на короткий световой день (фонарь)",
    ],
  },
  {
    scenario: "road-trip",
    title: "Автопутешествие",
    priorities: [
      "Права и документы на аренду",
      "План заправок на перегоны",
      "Тёплые вещи и вода в машине",
      "Офлайн-карты маршрута",
    ],
  },
  {
    scenario: "multi-day",
    title: "Многодневный автономный трек",
    priorities: [
      "Ходовой рюкзак 50–70 л",
      "Палатка, спальник, коврик",
      "Горелка и раскладка еды",
      "Обеззараживание воды",
    ],
  },
  {
    scenario: "with-children",
    title: "Поездка с детьми",
    priorities: [
      "Запасные комплекты детской одежды",
      "Перекусы и вода для детей",
      "Детский крем и головной убор",
      "Занятия на долгие переезды",
    ],
  },
];

export type DestinationPackingCard = {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
};

export const DESTINATION_PACKING_CARDS: DestinationPackingCard[] = [
  {
    id: "el-calafate",
    title: "Эль-Калафате",
    summary: "База для ледника Перито-Морено и озера Архентино.",
    bullets: [
      "Тёплые слои и ветрозащита для смотровых площадок",
      "Очки и крем SPF: отражение от льда усиливает солнце",
      "Удобная обувь для мостков вдоль ледника",
    ],
  },
  {
    id: "el-chalten",
    title: "Эль-Чальтен",
    summary: "Столица треккинга: маршруты к Фицрою и Серро-Торре.",
    bullets: [
      "Разношенные треккинговые ботинки",
      "Полный комплект слоёв + дождевик на день",
      "Вода, перекусы и налобный фонарь на длинные тропы",
    ],
  },
  {
    id: "ushuaia",
    title: "Ушуая",
    summary: "Самый южный город: парк Тьерра-дель-Фуэго и канал Бигля.",
    bullets: [
      "Ветро- и влагозащита: погода меняется быстро",
      "Тёплая шапка и перчатки даже летом",
      "Непромокаемая обувь для влажных троп",
    ],
  },
  {
    id: "bariloche",
    title: "Барилоче",
    summary: "Озёрный край и горнолыжный курорт зимой.",
    bullets: [
      "Летом — слои под переменную погоду и купальник для озёр",
      "Зимой — тёплая экипировка и утеплённая обувь",
      "Удобная обувь для прогулок и панорамных точек",
    ],
  },
  {
    id: "peninsula-valdes",
    title: "Полуостров Вальдес",
    summary: "Наблюдение за китами, пингвинами и морскими львами.",
    bullets: [
      "Ветрозащита от постоянного океанского ветра",
      "Бинокль и защита техники от пыли",
      "Крем и очки: открытые пространства без тени",
    ],
  },
];

export type SummerWinterRow = {
  aspect: string;
  summer: string;
  winter: string;
};

export const SUMMER_WINTER_ROWS: SummerWinterRow[] = [
  {
    aspect: "Сезон",
    summer: "Ноябрь–март",
    winter: "Июнь–сентябрь",
  },
  {
    aspect: "Погода днём",
    summer: "Прохладно и очень ветрено, солнце активное",
    winter: "Холодно, возможен снег и гололёд",
  },
  {
    aspect: "Верхняя одежда",
    summer: "Мембрана от ветра + тёплый средний слой",
    winter: "Пуховик, термобельё, ветрозащита",
  },
  {
    aspect: "Обувь",
    summer: "Треккинговые ботинки",
    winter: "Утеплённая непромокаемая обувь",
  },
  {
    aspect: "Световой день",
    summer: "Длинный, до позднего вечера",
    winter: "Короткий — нужен налобный фонарь",
  },
  {
    aspect: "Особое",
    summer: "Крем SPF 50+ и очки обязательны",
    winter: "Шапка, перчатки, запас тепла в машине",
  },
];

export type WhatNotToPackItem = {
  id: string;
  label: string;
  reason: string;
};

export const WHAT_NOT_TO_PACK: WhatNotToPackItem[] = [
  {
    id: "cotton",
    label: "Много хлопковой одежды",
    reason: "Медленно сохнет и холодит — плохо работает в ветреном сыром климате.",
  },
  {
    id: "new-boots",
    label: "Новая, не разношенная обувь",
    reason: "Гарантированные мозоли на первом же треке.",
  },
  {
    id: "umbrella",
    label: "Зонт",
    reason: "Бесполезен при сильном патагонском ветре — берите мембранную куртку.",
  },
  {
    id: "heavy-suitcase",
    label: "Тяжёлый жёсткий чемодан на треки",
    reason: "Неудобен на грунте и тропах; для активных дней нужен рюкзак.",
  },
  {
    id: "too-many-clothes",
    label: "Лишние комплекты «на всякий случай»",
    reason: "Система слоёв заменяет объём одежды — не перегружайте багаж.",
  },
  {
    id: "single-use-plastic",
    label: "Одноразовый пластик для троп",
    reason: "В парках действует принцип «не оставляй следов» — весь мусор придётся уносить.",
  },
];

export type CarryOnItem = {
  id: string;
  label: string;
  hint?: string;
};

export const CARRY_ON_ITEMS: CarryOnItem[] = [
  { id: "co-layers", label: "3 базовых слоя + 1 тёплый средний", hint: "Стирка в дороге вместо запаса" },
  { id: "co-shell", label: "Мембранная куртка (надеть в самолёт)" },
  { id: "co-pants", label: "2 брюк: треккинговые и повседневные" },
  { id: "co-socks", label: "3–4 пары носков и бельё" },
  { id: "co-boots", label: "Ботинки на себе, лёгкая обувь в багаж" },
  { id: "co-toiletries", label: "Гигиена в форматах до 100 мл", hint: "Требование ручной клади" },
  { id: "co-meds", label: "Личные лекарства и документы в ручной клади" },
  { id: "co-tech", label: "Телефон, зарядки, повербанк, адаптер" },
  { id: "co-water", label: "Пустая фляга — наполнить после досмотра", hint: WATER_SAFETY_NOTE },
];

// ── UI-копирайт виджетов ─────────────────────────────────────────────────

export const PACKING_LIST_UI = {
  ariaLabel: "Интерактивный список вещей в Патагонию",
  title: "Соберите свой список",
  hint: "Отметьте, что уже собрано. Фильтры помогают показать нужное под ваш формат поездки; полный список остаётся доступен без фильтров.",
  searchLabel: "Поиск по вещам",
  searchPlaceholder: "Например: куртка, вода, ботинки…",
  scenarioLabel: "Формат поездки",
  seasonLabel: "Сезон",
  progressLabel: "Собрано",
  resetLabel: "Сбросить",
  printLabel: "Распечатать",
  copyLabel: "Скопировать список",
  copiedLabel: "Список скопирован",
  emptyLabel: "Под выбранные фильтры ничего не нашлось. Измените формат поездки или сезон.",
  noteLabel: "Важно",
  storageKey: "ga-packing-list:patagonia",
} as const;

export const LAYER_SYSTEM_UI = {
  ariaLabel: "Система из трёх слоёв одежды для Патагонии",
  title: "Одевайтесь по системе слоёв",
  hint: "Три слоя работают вместе: базовый отводит влагу, средний греет, внешний защищает от ветра и дождя.",
} as const;

export const TRIP_TYPE_SELECTOR_UI = {
  ariaLabel: "Приоритетные вещи по формату поездки",
  title: "Что в приоритете для вашего формата",
  hint: "Выберите формат поездки — покажем вещи, о которых важно не забыть в первую очередь.",
  resultTitle: "В первую очередь возьмите",
} as const;

export const DESTINATION_CARDS_UI = {
  ariaLabel: "Акценты сборов по направлениям Патагонии",
  title: "Акценты по направлениям",
  hint: "Базовый список один, но у каждого направления есть свои приоритеты.",
} as const;

export const SUMMER_WINTER_UI = {
  ariaLabel: "Сравнение сборов летом и зимой",
  title: "Лето и зима: в чём разница",
  hint: "Что меняется в списке вещей в зависимости от сезона поездки.",
  aspectHeader: "Что сравниваем",
  summerHeader: "Лето (ноябрь–март)",
  winterHeader: "Зима (июнь–сентябрь)",
} as const;

export const WHAT_NOT_TO_PACK_UI = {
  ariaLabel: "Что не стоит брать в Патагонию",
  title: "Что лучше не брать",
  hint: "Эти вещи чаще мешают, чем помогают, — освободите место в багаже.",
} as const;

export const CARRY_ON_UI = {
  ariaLabel: "Схема ручной клади на 7–10 дней",
  title: "Ручная кладь на 7–10 дней",
  hint: "Система слоёв и стирка в дороге позволяют уложиться в ручную кладь даже на активную поездку.",
} as const;
