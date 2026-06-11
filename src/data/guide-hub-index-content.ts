import { GUIDE_INDEX_INTRO, GUIDE_TOPICS } from "@/data/guide-topics";
import { guideTopicHref } from "@/lib/guide-topics";
import type { GuideIndexHubContent } from "@/types/guide-index-hub";

const PRACTICE_SLUGS = [
  "kak-dobratsya",
  "gde-zhit",
  "transport",
  "svyaz",
  "ekonomika-i-dengi",
  "bezopasnost",
] as const;

const TRAVEL_SLUGS = ["turistskie-regiony", "dostoprimechatelnosti", "pogoda-i-sezonnost"] as const;

const COUNTRY_SLUGS = ["yazyk", "kultura", "istoriya", "kukhnya", "shopping"] as const;

function topicItem(slug: string) {
  const topic = GUIDE_TOPICS[slug];
  if (!topic) throw new Error(`Missing guide topic: ${slug}`);
  return {
    slug,
    title: topic.title,
    description: topic.shortDescription,
    href: guideTopicHref(slug),
  };
}

const FAQ: GuideIndexHubContent["faq"] = [
  {
    question: "С чего начать планирование поездки в Аргентину?",
    answer:
      "Определите регионы (Патагония, BA, север), сезон и длительность. Затем — перелёты и внутренняя логистика, жильё, страховка и бюджет. Путеводитель разбит на 14 тем: от «Как добраться» до денег и безопасности.",
  },
  {
    question: "Сколько времени нужно на первую поездку?",
    answer:
      "Минимум 10–14 дней для BA + один регион (Патагония, Iguazú или Mendoza). Классика «BA + Patagonia + водопады» — 3–4 недели. Внутренние перелёты экономят дни на длинных расстояниях.",
  },
  {
    question: "Когда лучше ехать в Аргентину?",
    answer:
      "Патагония — ноябрь–март (лето южного полушария). Буэнос-Айрес приятен круглый год; осень (март–май) — один из лучших периодов. Iguazú и северо-запад комфортнее весной и осенью.",
  },
  {
    question: "Нужна ли виза россиянам?",
    answer:
      "Граждане РФ и ряда стран СНГ въезжают без визы на срок до 90 дней. Нужен загранпаспорт, медстраховка на весь срок (с 2025 года), обратный или onward билет. Подробнее — в разделе иммиграции и «Как добраться».",
  },
  {
    question: "Какой бюджет заложить на поездку?",
    answer:
      "Зависит от стиля: BA и регионы при «синем» курсе доступны; туры на платформе — в USD. Заложите перелёты, внутренние рейсы, жильё, еду, экскурсии и страховку. Раздел «Экономика и деньги» — про курсы, карты и обмен.",
  },
  {
    question: "Как добраться из России и Европы?",
    answer:
      "Чаще всего с одной пересадкой через Стамбул, Доху или Мадрид. Международные рейсы прилетают в Ezeiza (EZE) или Aeroparque (AEP). Внутри страны — Aerolíneas, Flybondi, Jetsmart.",
  },
  {
    question: "Нужна ли медстраховка?",
    answer:
      "Да — с 2025 года обязательна для туристического въезда (DNU 366/2025). Полис или travel assistance с покрытием на всей территории Аргентины на весь заявленный срок. Для активных туров в Патагонии — расширенное покрытие.",
  },
  {
    question: "Безопасно ли путешествовать по Аргентине?",
    answer:
      "При базовой осмотрительности — да. Основной риск в BA — карманники; в туристических районах днём спокойнее. На тропах — погода и подготовка. См. тему «Безопасность» и PDF-путеводитель по BA.",
  },
  {
    question: "Стоит ли брать тур или ехать самостоятельно?",
    answer:
      "Самостоятельно — гибко, но нужно время на логистику и язык. Авторские туры на платформе включают маршрут, гида, часто жильё и трансферы — удобно для Патагонии, Iguazú и винодельни. Можно комбинировать: BA самостоятельно + тур в регион.",
  },
  {
    question: "Как платить в Аргентине — наличные или карта?",
    answer:
      "Карты работают, но курс конвертации может быть невыгодным. Многие туристы меняют USD в проверенных обменниках для лучшего курса. Туры на платформе — в USD. Подробно — в «Экономика и деньги».",
  },
  {
    question: "Какие регионы включить в маршрут первый раз?",
    answer:
      "Классика: Буэнос-Айрес (3–5 дней), Эль-Калафате и Перито-Морено, опционально Iguazú или Mendoza. Для треккинга — El Chaltén и Барилоче. Обзор — в «Туристические регионы» и каталоге направлений.",
  },
  {
    question: "Где искать актуальную информацию перед вылетом?",
    answer:
      "Официально — migraciones.gob.ar, консульство Аргентины. Путеводитель на платформе обновляется регулярно; перед поездкой сверяйте правила въезда, курсы и сезоны. Вопросы по турам — через контакты или WhatsApp.",
  },
];

export const GUIDE_HUB: GuideIndexHubContent = {
  heroTitle: "Путеводитель по Аргентине",
  heroSubtitle:
    "14 тем для планирования поездки: перелёты, регионы, деньги, культура и безопасность — с турами и сервисами на платформе.",
  heroImage: "https://images.unsplash.com/photo-1483728642387-6bc3bd38dafc?w=1920&q=80",
  heroCtas: [
    {
      label: "✈️ Как добраться",
      href: "/guide/kak-dobratsya",
      variant: "primary",
    },
    {
      label: "🗺 Регионы",
      href: "#topics-travel",
      variant: "secondary",
    },
    {
      label: "🎫 Туры",
      href: "/tours",
      variant: "tertiary",
    },
  ],
  quickFacts30: [
    { emoji: "🌎", label: "Масштаб", headline: "8 туристических регионов", detail: "От BA и Patagonia до Iguazú и Salta — туры на платформе" },
    { emoji: "📚", label: "Темы", headline: "14 разделов путеводителя", detail: "Въезд, деньги, связь, регионы, культура и безопасность" },
    { emoji: "✈️", label: "Въезд", headline: "Безвиз до 90 дней", detail: "Для граждан РФ — штамп в паспорт, обратный билет желателен" },
    { emoji: "☀️", label: "Патагония", headline: "Сезон: ноябрь–март", detail: "Теплее и длинный световой день; бронируйте жильё заранее" },
    { emoji: "💵", label: "Деньги", headline: "Песо + «синий» USD", detail: "Наличные доллары часто выгоднее оплаты картой" },
    { emoji: "🎫", label: "Туры", headline: "Авторские маршруты", detail: "Бронирование на платформе — цены в USD, связь с гидом" },
  ],
  toc: [
    { id: "quick-30", label: "Кратко за 30 секунд" },
    { id: "planning", label: "Планирование поездки" },
    { id: "topics-practice", label: "Практика" },
    { id: "topics-travel", label: "Путешествие" },
    { id: "topics-country", label: "Страна" },
    { id: "all-topics", label: "Все темы" },
    { id: "related", label: "См. также" },
    { id: "faq", label: "FAQ" },
  ],
  planning: {
    intro: GUIDE_INDEX_INTRO,
    cards: [
      {
        emoji: "🗓",
        title: "Сезон и маршрут",
        body: "Выберите регионы и даты: Патагония — лето южного полушария, BA — круглый год, север — весна и осень.",
        href: "/guide/pogoda-i-sezonnost",
        linkLabel: "Погода и сезонность",
      },
      {
        emoji: "✈️",
        title: "Перелёты и логистика",
        body: "Международные рейсы в EZE/AEP, внутренние — Aerolíneas, Flybondi, Jetsmart. Трансферы и документы на границе.",
        href: "/guide/kak-dobratsya",
        linkLabel: "Как добраться",
      },
      {
        emoji: "🏨",
        title: "Жильё и районы",
        body: "Palermo и Recoleta в BA, лоджи у троп в Patagonia, estancia в винодельнях. Многие туры включают проживание.",
        href: "/guide/gde-zhit",
        linkLabel: "Где жить",
      },
      {
        emoji: "💰",
        title: "Бюджет и оплата",
        body: "Курсы песо, карты, обмен USD. Туры на платформе — прозрачные цены в USD для сравнения.",
        href: "/guide/ekonomika-i-dengi",
        linkLabel: "Экономика и деньги",
      },
      {
        emoji: "🛡",
        title: "Страховка и безопасность",
        body: "Медполис обязателен с 2025 года. Базовые правила в BA и на маршрутах — в теме «Безопасность».",
        href: "/guide/bezopasnost",
        linkLabel: "Безопасность",
      },
      {
        emoji: "🎫",
        title: "Туры и бронирование",
        body: "Авторские маршруты с гидами, жильём и трансферами — удобная альтернатива самостоятельной логистике.",
        href: "/tours",
        linkLabel: "Каталог туров",
      },
    ],
  },
  topicGroups: [
    {
      id: "topics-practice",
      title: "Практика",
      subtitle: "Перелёты, жильё, транспорт, связь, деньги и безопасность — всё для подготовки к поездке.",
      topics: PRACTICE_SLUGS.map(topicItem),
    },
    {
      id: "topics-travel",
      title: "Путешествие",
      subtitle: "Регионы, must-see и сезоны — выберите направления и заложите время на маршрут.",
      topics: TRAVEL_SLUGS.map(topicItem),
    },
    {
      id: "topics-country",
      title: "Страна",
      subtitle: "Язык, культура, история, кухня и шопинг — понимание контекста делает поездку глубже.",
      topics: COUNTRY_SLUGS.map(topicItem),
    },
  ],
  relatedLinks: [
    {
      title: "Иммиграция и въезд",
      href: "/immigration",
      description: "ВНЖ, визы, документы и RADEX",
    },
    {
      title: "Как добраться — документы въезда",
      href: "/guide/kak-dobratsya#entry-docs",
      description: "Страховка, билеты, правила на границе",
    },
    {
      title: "Каталог туров",
      href: "/tours",
      description: "Авторские маршруты по регионам",
    },
    {
      title: "Сервисы",
      href: "/services",
      description: "Трансферы, страховка, SIM и партнёры",
    },
    {
      title: "Направления",
      href: "/destinations",
      description: "8 регионов с турами и сезонами",
    },
    {
      title: "Контакты",
      href: "/contacts",
      description: "Вопросы по платформе и подбору",
    },
  ],
  faq: FAQ,
  disclaimer:
    "Материалы путеводителя носят справочный характер. Правила въезда, курсы и цены меняются — сверяйтесь с официальными источниками перед поездкой. Платформа не оказывает юридических и миграционных услуг.",
};
