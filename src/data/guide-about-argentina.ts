import type { GuidePillarFaqItem, GuidePillarHeroCta } from "@/types/guide-pillar";
import type { TravelHubArticleLink, TravelHubQuickFact, TravelHubTocItem } from "@/types/guide-travel-hub";
import { getPlaceCoverImage } from "@/lib/media-resolver";

export const GUIDE_ABOUT_ARGENTINA_PATH = "/guide/ob-argentine";

export type GuideAboutRegion = {
  rank: number;
  title: string;
  days: string;
  summary: string;
  href: string;
  highlights: string[];
};

export type GuideAboutItinerary = {
  title: string;
  duration: string;
  stops: string[];
  note?: string;
};

export type GuideAboutPracticalCard = {
  emoji: string;
  title: string;
  body: string;
  href: string;
  linkLabel: string;
};

export type GuideAboutArgentinaContent = {
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  heroCtas: GuidePillarHeroCta[];
  intro: string;
  quickFacts: TravelHubQuickFact[];
  toc: TravelHubTocItem[];
  geography: { heading: string; body: string };
  whyVisit: { heading: string; bullets: string[] };
  regions: GuideAboutRegion[];
  itineraries: GuideAboutItinerary[];
  practicalCards: GuideAboutPracticalCard[];
  neighborCountries: { heading: string; body: string; links: TravelHubArticleLink[] };
  faq: GuidePillarFaqItem[];
  furtherReading: TravelHubArticleLink[];
  disclaimer: string;
};

export const GUIDE_ABOUT_ARGENTINA: GuideAboutArgentinaContent = {
  heroTitle: "Об Аргентине",
  heroSubtitle:
    "География, регионы, сезоны и маршруты — всё, что нужно понять о стране перед поездкой или бронированием тура",
  heroImage: getPlaceCoverImage("buenos-aires"),
  heroCtas: [
    { label: "Направления", href: "/destinations", variant: "primary" },
    { label: "Как добраться", href: "/guide/kak-dobratsya", variant: "secondary" },
    { label: "Туры", href: "/tours", variant: "tertiary" },
  ],
  intro:
    "Аргентина — восьмая по площади страна мира и один из самых контрастных маршрутов Южной Америки: от тропических водопадов Игуасу (Iguazú) на севере до ледников Patagonia и «края света» в Ushuaia. Столица Buenos Aires — отдельный мир с европейской архитектурой, tango и asado; за пределами мегаполиса — степи pampas, виноградники Mendoza, красные каньоны Salta и озёра Bariloche. Для первого визита важно понять масштаб: внутренние расстояния измеряются часами полёта, а не поездками на автобусе. Эта страница — отправная точка: от общей картины к конкретным темам путеводителя, направлениям и турам на платформе.",
  quickFacts: [
    { emoji: "🏛️", label: "Столица", headline: "Buenos Aires", detail: "EZE и AEP — международные хабы" },
    { emoji: "👥", label: "Население", headline: "~46 млн", detail: "Большинство в pampas и столице" },
    { emoji: "🗺️", label: "Площадь", headline: "2,78 млн км²", detail: "8-е место в мире" },
    { emoji: "🗣️", label: "Язык", headline: "Испанский", detail: "Диалект rioplatense" },
    { emoji: "💵", label: "Валюта", headline: "Peso (ARS)", detail: "См. «Экономика и деньги»" },
    { emoji: "🕐", label: "Время", headline: "UTC−3", detail: "Единый часовой пояс" },
    { emoji: "🛂", label: "Виза РФ", headline: "До 90 дней", detail: "Без визы, туристический въезд" },
    { emoji: "☀️", label: "Patagonia", headline: "Ноябрь–март", detail: "Основной сезон на юге" },
  ],
  toc: [
    { id: "quick-facts", label: "Цифры и факты" },
    { id: "geography", label: "География" },
    { id: "why-visit", label: "Зачем ехать" },
    { id: "regions", label: "Регионы" },
    { id: "itineraries", label: "Маршруты" },
    { id: "practical", label: "Практика" },
    { id: "neighbors", label: "Соседи" },
    { id: "faq", label: "FAQ" },
  ],
  geography: {
    heading: "География и климат",
    body:
      "Страна вытянута с севера на юг более чем на 3 700 км. На западе — хребет Andes с Aconcagua (6 961 м). Центр занимают пампас — плодородные степи и аграрный пояс. На севере — субтропики Misiones и сухие каньоны северо-запада. Юг — Patagonia: степи, ледники, фьорды и ветреные горные хребты. Из‑за такой протяжённости «лучшее время» зависит от региона: в Patagonia лето — ноябрь–март, в Buenos Aires комфортны осень и весна, в Iguazú жарко круглый год с сезонными дождями.",
  },
  whyVisit: {
    heading: "Зачем ехать в Аргентину",
    bullets: [
      "Контраст природы: водопады, ледники, penguins, киты, виноградники и высокогорные каньоны в одной стране",
      "Buenos Aires — культура, gastronomy, tango и архитектура уровня европейской столицы",
      "Patagonia и Los Glaciares — must-see для любителей trekking и экспедиций",
      "Malbec и bodegas Mendoza — один из сильнейших винных регионов мира",
      "Безвизовый въезд для граждан РФ и ряда стран СНГ на срок до 90 дней (туристический статус)",
      "Удобные стыковки с Brazil, Uruguay и Chile для комбинированных маршрутов",
    ],
  },
  regions: [
    {
      rank: 1,
      title: "Buenos Aires и Tigre",
      days: "4–5 дней",
      summary: "Столица, tango, районы Palermo и San Telmo, delta Tigre и однодневный Uruguay.",
      href: "/destinations/ba",
      highlights: ["San Telmo", "La Boca", "Recoleta", "Delta Tigre", "Colonia (Uruguay)"],
    },
    {
      rank: 2,
      title: "Iguazú",
      days: "2–3 дня",
      summary: "275 водопадов UNESCO, аргентинская и бразильской стороны, джунгли Misiones.",
      href: "/destinations/iguazu",
      highlights: ["Garganta del Diablo", "Нац. парк", "Puerto Iguazú", "Бразилия (Foz)"],
    },
    {
      rank: 3,
      title: "Bariloche",
      days: "3–4 дня",
      summary: "Озёра Nahuel Huapi, Cerro Catedral, лыжи зимой и trekking летом.",
      href: "/destinations/bariloche",
      highlights: ["Circuito Chico", "Cerro Campanario", "Refugio Frey", "Seven Lakes"],
    },
    {
      rank: 4,
      title: "El Calafate",
      days: "2–3 дня",
      summary: "Ледник Perito Moreno, ледниковые трекинги и круизы по Lago Argentino.",
      href: "/destinations/calafate",
      highlights: ["Perito Moreno", "Big Ice", "El Chaltén (Fitz Roy)", "Upsala"],
    },
    {
      rank: 5,
      title: "Ushuaia",
      days: "2–3 дня",
      summary: "Самый южный город, Tierra del Fuego, Beagle и ворота в Antarctica.",
      href: "/destinations/ushuaia",
      highlights: ["Tierra del Fuego NP", "Canal Beagle", "Penguins", "End of the World"],
    },
    {
      rank: 6,
      title: "Salta и северо-запад",
      days: "3–4 дня",
      summary: "Quebrada de Humahuaca, Cafayate, колониальный центр и высокогорные вина.",
      href: "/destinations/salta",
      highlights: ["Humahuaca", "Purmamarca", "Cafayate", "Tren a las Nubes"],
    },
    {
      rank: 7,
      title: "Mendoza",
      days: "2–3 дня",
      summary: "Malbec, bodegas у подножия Andes, Uco Valley и виды на Aconcagua.",
      href: "/destinations/mendoza",
      highlights: ["Maipú", "Luján de Cuyo", "Uco Valley", "Potrerillos"],
    },
    {
      rank: 8,
      title: "Patagonia (комплексно)",
      days: "10–14 дней",
      summary: "Комбинация ледников, Fitz Roy, Valdés и внутренних перелётов.",
      href: "/destinations/patagonia",
      highlights: ["Los Glaciares", "El Chaltén", "Peninsula Valdés", "Ruta 40"],
    },
  ],
  itineraries: [
    {
      title: "Классика за 7–10 дней",
      duration: "7–10 дней",
      stops: ["Buenos Aires (3 дня)", "Uruguay / Tigre (1 день)", "El Calafate (2–3 дня)", "Iguazú (2 дня)"],
      note: "Внутренние перелёты через BA; бронируйте Perito Moreno и Iguazú заранее.",
    },
    {
      title: "Patagonia + столица",
      duration: "12–14 дней",
      stops: [
        "Buenos Aires (4 дня)",
        "Ushuaia (2 дня)",
        "El Calafate (2–3 дня)",
        "Bariloche (2–3 дня)",
        "Iguazú или Mendoza (2 дня)",
      ],
      note: "Только Aerolíneas Argentinas для стабильности; закладывайте буфер на ветер в Patagonia.",
    },
    {
      title: "Север и вино",
      duration: "10–12 дней",
      stops: ["Buenos Aires (3 дня)", "Salta + Humahuaca (3 дня)", "Cafayate (1–2 дня)", "Mendoza (3 дня)"],
      note: "Удобнее с арендой авто на северо-западе; в Mendoza — wine tours с трансфером.",
    },
  ],
  practicalCards: [
    {
      emoji: "✈️",
      title: "Как добраться",
      body: "Международные рейсы в EZE/AEP; из России — чаще через Istanbul, Doha или Madrid. Бронируйте за 40–60 дней.",
      href: "/guide/kak-dobratsya",
      linkLabel: "Перелёты и аэропорты",
    },
    {
      emoji: "💵",
      title: "Деньги и курс",
      body: "Peso, карты и обмен USD. Курс и правила меняются — проверяйте актуальную ситуацию перед поездкой.",
      href: "/guide/ekonomika-i-dengi",
      linkLabel: "Экономика и деньги",
    },
    {
      emoji: "🛡️",
      title: "Безопасность",
      body: "Базовая осмотрительность в BA: телефон на шнурке, без демонстративных украшений, такси через приложения.",
      href: "/guide/bezopasnost",
      linkLabel: "Безопасность",
    },
    {
      emoji: "🏨",
      title: "Где жить",
      body: "Для первой поездки — отели в туристических районах BA; в Patagonia бронь за 2–3 месяца в высокий сезон.",
      href: "/guide/gde-zhit",
      linkLabel: "Жильё и районы",
    },
    {
      emoji: "🌤️",
      title: "Когда ехать",
      body: "Patagonia — ноябрь–март; BA приятен круглый год; Iguazú — весна/осень для меньших дождей.",
      href: "/guide/pogoda-i-sezonnost",
      linkLabel: "Погода и сезоны",
    },
    {
      emoji: "🚌",
      title: "Транспорт внутри страны",
      body: "На длинных расстояниях — перелёты Aerolíneas; автобусы и поезда медленные. Аренда авто — точечно в регионах.",
      href: "/guide/transport",
      linkLabel: "Транспорт",
    },
  ],
  neighborCountries: {
    heading: "Соседние страны в одном маршруте",
    body:
      "Uruguay — паром до Colonia и Montevideo из BA за полдня. Brazil — водопады Iguazú с двух сторон границы; дальше интересна природа, а не мегаполисы. Chile — Patagonia, Torres del Paine и Santiago часто комбинируют с Argentina через Calafate или Bariloche. Paraguay — шопинг и короткие поездки из Iguazú. Для open-jaw билетов (прилёт в одну страну, вылет из другой) уточняйте правила въезда и медстраховки.",
    links: [
      { title: "Иммиграция и документы", href: "/immigration", description: "Визы и правила въезда" },
      { title: "Авиабилеты", href: "/flights", description: "Поиск маршрутов" },
    ],
  },
  faq: [
    {
      question: "Сколько дней нужно на первую поездку?",
      answer:
        "Минимум 10 дней для BA + один регион (Iguazú, Calafate или Mendoza). Классический маршрут BA + Patagonia + водопады — 2–3 недели. Не закладывайте на Buenos Aires меньше 3 дней — город часто «раскрывается» позже, чем ожидают.",
    },
    {
      question: "Нужна ли медстраховка?",
      answer:
        "Да — для туристического въезда требуется полис на весь срок пребывания на территории Аргентины. Для trekking в Patagonia выбирайте покрытие с активным отдыхом и эвакуацией.",
    },
    {
      question: "Какую валюту везти?",
      answer:
        "USD в купюрах нового образца часто удобны для обмена; карты Visa/Mastercard работают, но курс конвертации может отличаться. Подробности — в разделе «Экономика и деньги».",
    },
    {
      question: "Можно ли объехать страну на машине?",
      answer:
        "Технически да, но расстояния огромны: между точками интереса — часы pampas без смены пейзажа. Рациональнее летать между регионами и брать авто локально (Mendoza, Salta, Bariloche).",
    },
    {
      question: "Есть ли пляжный отдых?",
      answer:
        "Ограниченно: у BA нет морских пляжей; Mar del Plata — сезон декабрь–март с толпами. Для качественного пляжа чаще смотрят Uruguay (Punta del Este) или Brazil.",
    },
    {
      question: "Где искать экскурсии и туры?",
      answer:
        "Городские экскурсии — в каталоге /excursions; многодневные маршруты — у авторов на /tours. Путеводитель даёт контекст, платформа — бронирование.",
    },
  ],
  furtherReading: [
    {
      title: "Ru-AR — практический гид Максима Лемоса",
      href: "https://ru-ar.ru/argentina",
      description: "Маршруты, валюта, безопасность, транспорт",
    },
    {
      title: "RuArgentina — путеводитель Кирилла Маковеева",
      href: "https://ruargentina.com/",
      description: "Экскурсии, туры, FAQ для туристов",
    },
  ],
  disclaimer:
    "Факты о визах, курсах и правилах въезда могут меняться. Перед поездкой сверяйтесь с официальными источниками и актуальными темами путеводителя на платформе.",
};
