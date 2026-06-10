import type { GuidePillarContent } from "@/types/guide-pillar";

const REGIONS_FAQ = [
  { question: "С чего начать первую поездку в Аргентину?", answer: "Классика: BA 3–4 дня + один регион — Патагония (ледники) или Iguazú (водопады) или Mendoza (вино)." },
  { question: "Сколько дней нужно на Патагонию?", answer: "Минимум 5–7 дней на Calafate + Chaltén или Bariloche. Ушуайя — ещё 3–4 дня." },
  { question: "Можно ли совместить Iguazú и BA?", answer: "Да, перелёт 2–3 часа. Типичный маршрут: неделя BA + 2–3 дня Iguazú." },
  { question: "Когда сезон в Патагонии?", answer: "Ноябрь–март — основной. Зима — лыжи в Bariloche, многие тропы закрыты." },
  { question: "Что такое северо-запад (NOA)?", answer: "Salta, Кафаяте, Quebrada de Humahuaca — горы, виноградники torrontés, колониальная архитектура." },
  { question: "Нужен ли гид в регионах?", answer: "Для треккинга в Chaltén — нет. Для ледника, Iguazú boat tour, estancia — гид или тур удобнее." },
  { question: "Какие регионы для второго визита?", answer: "Кордова, Lake District, Peninsula Valdés (киты), Iberá ( wetlands)." },
  { question: "Далеко ли Mendoza от BA?", answer: "~1,5 ч перелёта или ~12 ч автобусом. На 3–4 дня — винодельни и Андes." },
  { question: "Есть ли туры сразу по нескольким регионам?", answer: "Да — на платформе комбинированные маршруты BA + Patagonia / Iguazú / Mendoza." },
  { question: "Где смотреть все направления?", answer: "Каталог /destinations — 8 регионов с турами и сезонами." },
  { question: "Нужна ли страховка для Патагонии?", answer: "Да, с покрытием треккинга и эвакуации — см. раздел «Безопасность»." },
  { question: "Какой регион для винных туров?", answer: "Mendoza — malbec. Salta — torrontés на высоте. Оба — bodega-туры на полдня или день." },
];

export const TURISTICSKIE_REGIONY_PILLAR: GuidePillarContent = {
  heroSubtitle:
    "Патагония, Буэнос-Айрес, северо-запад, водопады и винодельни — обзор регионов для первой и второй поездки",
  heroCtas: [
    { label: "Все направления", href: "/destinations", variant: "primary" },
    { label: "Патагония", href: "#turistskie-regiony-1", variant: "secondary" },
    { label: "Задать вопрос", href: "/contacts?topic=turistskie-regiony", variant: "tertiary" },
  ],
  quickFacts: [
    { label: "Регионов в каталоге", value: "8 направлений с турами" },
    { label: "Патагония — сезон", value: "Ноябрь–март" },
    { label: "Iguazú из BA", value: "~2 ч перелёта" },
    { label: "Mendoza", value: "Malbec и Андes" },
    { label: "NOA", value: "Salta, Кафаяте, Humahuaca" },
    { label: "Классика первой поездки", value: "BA + 1 регион" },
  ],
  sections: [
    { id: "turistskie-regiony-1", title: "Патагония и Огненная Земля", content: "Эль-Калафате, El Chaltén, Барилoche, Ушуайя — ледники, треккинг, край света. Сезон ноябрь–март." },
    { id: "turistskie-regiony-2", title: "Центр и столица", content: "BA — культура, asado, milonga. Mendoza — malbec. Кордова — для второго визита." },
    { id: "turistskie-regiony-3", title: "Север: Salta и Iguazú", content: "Высокогорье, torrontés, Quebrada de Humahuaca. Iguazú — 275 водопадов на границе с Бразилией." },
    { id: "turistskie-regiony-4", title: "Как комбинировать регионы", content: "Не пытайтесь за 10 дней объехать всё — выберите BA + один природный регион. Внутренние перелёты экономят недели." },
    { id: "turistskie-regiony-5", title: "Сезоны по регионам", content: "Патагония — лето Южного полушария. Iguazú — избегайте пик дождей. NOA — весна и осень комфортнее лета." },
  ],
  faq: REGIONS_FAQ,
  blogLinks: [
    { title: "Патагония: с чего начать", href: "/guide/patagoniya-s-chego-nachat", description: "Маршруты и снаряжение" },
    { title: "Когда лучше ехать", href: "/blog/best-time-to-visit-argentina", description: "Сезоны по стране" },
  ],
  partnerServices: [
    { softIntro: "Не знаете, с какого региона начать?", title: "Все направления", description: "8 регионов с турами, сезонами и советами.", href: "/destinations", ctaLabel: "Открыть каталог" },
    { title: "Подбор маршрута", description: "Менеджер поможет связать регионы под ваш срок.", href: "/contacts?service=itinerary", ctaLabel: "Оставить заявку" },
  ],
};

const SIGHTS_FAQ = [
  { question: "Какие must-see в первую поездку?", answer: "Перито-Морено, Iguazú, районы BA (La Boca, Recoleta), винодельня Mendoza." },
  { question: "Нужно ли бронировать Перито-Морено заранее?", answer: "В высокий сезон — да, онлайн на сайте парка или через тур с трансфером." },
  { question: "Сколько времени на Iguazú?", answer: "Минимум 1 полный день на аргентинской стороне. 2 дня — аргентинская + бразильская." },
  { question: "Можно ли в Chaltén без гида?", answer: "Да, тропы к Fitz Roy и Cerro Torre — самостоятельные. Следите за погодой." },
  { question: "Когда пингвины на Peninsula Valdés?", answer: "Сентябрь–март — сезон размножения магеллановых пингвинов." },
  { question: "Что смотреть в BA за 2 дня?", answer: "Recoleta, San Telmo (воскресный рынок), Caminito днём, Teatro Colón или milonga вечером." },
  { question: "Нужен ли гид в BA?", answer: "Walking tour полезен для контекста. Авторские туры на платформе — с русскоязычным гидом." },
  { question: "Есть ли билеты на Teatro Colón?", answer: "Да, экскурсии и иногда спектакли — бронируйте на официальном сайте." },
  { question: "Как добраться до Quebrada de Humahuaca?", answer: "Из Salta — автобус или тур на день. Маршрут 14 — классика." },
  { question: "Опасен ли Caminito?", answer: "Днём в туристической зоне — нормально. Не носите ценности на виду, не ходите в side streets ночью." },
  { question: "Сколько стоит вход в нацпарки?", answer: "Перито-Морено и Iguazú — оплата картой или песo, иностранцы платят повышенный тариф. Уточняйте на сайте парка." },
  { question: "Можно ли совместить ледник и треккинг?", answer: "Да: 1 день Перито-Морено из Calafate + 2–3 дня Chaltén на тропах." },
];

export const DOSTOPRIMECHATELNOSTI_PILLAR: GuidePillarContent = {
  heroSubtitle:
    "Must-see: ледники, водопады, города и природные парки — что включить в маршрут и как бронировать",
  heroCtas: [
    { label: "Экскурсии", href: "/tours", variant: "primary" },
    { label: "Природные иконы", href: "#dostoprimechatelnosti-1", variant: "secondary" },
    { label: "Задать вопрос", href: "/contacts?topic=dostoprimechatelnosti", variant: "tertiary" },
  ],
  quickFacts: [
    { label: "Перито-Морено", value: "El Calafate, бронь в сезон" },
    { label: "Iguazú", value: "275 водопадов, 2 стороны" },
    { label: "Fitz Roy", value: "El Chaltén, треккинг без гида" },
    { label: "BA must-see", value: "Recoleta, San Telmo, Teatro Colón" },
    { label: "Пингвины", value: "Peninsula Valdés, сен–март" },
    { label: "Экскурсии", value: "Каталог туров на платформе" },
  ],
  sections: [
    { id: "dostoprimechatelnosti-1", title: "Природные иконы", content: "Перито-Морено, Iguazú, Fitz Roy, Cerro Torre, пингвины Valdés." },
    { id: "dostoprimechatelnosti-2", title: "Города и культура", content: "Caminito, Recoleta Cemetery, Teatro Colón, San Telmo, Jesuit Block в Cordoba." },
    { id: "dostoprimechatelnosti-3", title: "Как посещать", content: "Билеты онлайн в сезон. Треккинг — погода меняется быстро. Русскоязычные гиды — через каталог туров." },
    { id: "dostoprimechatelnosti-4", title: "Комбинированные маршруты", content: "BA + ледник + 2 дня Chaltén — популярная связка на 8–10 дней." },
    { id: "dostoprimechatelnosti-5", title: "Музеи и память", content: "Museo Evita, ESMA memorial, MALBA — для понимания современной Аргентины." },
  ],
  faq: SIGHTS_FAQ,
  blogLinks: [
    { title: "Танго и культура BA", href: "/guide/tango-i-kultura-ba", description: "Milonga и районы" },
    { title: "Туристические регионы", href: "/guide/turistskie-regiony", description: "Где что находится" },
  ],
  partnerServices: [
    { softIntro: "Хотите гид без самостоятельной логистики?", title: "Экскурсии к ледникам", description: "Туры с трансфером и билетами.", href: "/tours?query=Перито-Морено", ctaLabel: "Смотреть туры" },
    { title: "Городские экскурсии BA", description: "Авторские маршруты с гидом.", href: "/tours?query=Буэнос-Айрес", ctaLabel: "Каталог" },
  ],
};

const WEATHER_FAQ = [
  { question: "Когда лучше ехать в Патагонию?", answer: "Ноябрь–март — тёплее, открыты тропы. Декабрь–январь — пик сезона и цен." },
  { question: "Жарко ли в BA летом?", answer: "Да, декабрь–февраль +25…+35 °C и влажность. Март–май и сент–нояб — комфортнее." },
  { question: "Нужна ли зимняя одежда в BA?", answer: "Июнь–август мягко (+10…+18), но ветер и сырость — куртка и слои." },
  { question: "Когда сезон дождей в Iguazú?", answer: "Декабрь–февраль — максимум воды и влажности. Март–май — баланс." },
  { question: "Можно ли в Патагонию зимой?", answer: "Bariloche — лыжи. Calafate/Chaltén — многие тропы закрыты, короткий световой день." },
  { question: "Какая погода в Mendoza?", answer: "Континентальный климат: жаркое лето, прохладная ночь. Винный сезон — март–апril (сбор)." },
  { question: "Ветер в Патагонии — насколько серьёзно?", answer: "Очень. Закладывайте запас дней для треккинга — тропы могут закрыть из-за ветра." },
  { question: "Когда киты в Valdés?", answer: "Июнь–декабрь — сезоны зависят от вида. Пингвины — сентябрь–март." },
  { question: "Есть ли смысл в межсезонье?", answer: "Да — меньше людей, ниже цены. Погода менее предсказуема — гибкий маршрут." },
  { question: "Нужен ли дождевик в Iguazú?", answer: "Да, всегда. Boat tour — вы промокнете." },
  { question: "Когда feria в San Telmo?", answer: "Воскресенье — главный день, с утра до вечера. Лучшая погода — осень и весна BA." },
  { question: "Как планировать слои одежды?", answer: "Патагония: базовый слой + флис + windproof. BA: лёгкая одежда + куртка вечером." },
];

export const POGODA_PILLAR: GuidePillarContent = {
  heroSubtitle:
    "Когда ехать в Патагонию, Буэнос-Айрес и на север — сезоны, климат и практические советы по регионам",
  heroCtas: [
    { label: "Туры по сезону", href: "/tours", variant: "primary" },
    { label: "Патагония", href: "#pogoda-1", variant: "secondary" },
    { label: "Задать вопрос", href: "/contacts?topic=pogoda-i-sezonnost", variant: "tertiary" },
  ],
  quickFacts: [
    { label: "Патагония — лучший сезон", value: "Ноябрь–март" },
    { label: "BA — комфорт", value: "Март–май, сент–нояб" },
    { label: "Iguazú — меньше дождей", value: "Март–май, сент–нояб" },
    { label: "Salta / NOA", value: "Весна и осень" },
    { label: "Высокий сезон", value: "Дек–фев, июль (BA)" },
    { label: "Ветер Patagonia", value: "Круглый год, сильный" },
  ],
  sections: [
    { id: "pogoda-1", title: "Патагония", content: "Ноябрь–март — основной сезон. Зима — лыжи Bariloche, закрытые тропы. Ветер и дождь — всегда возможны." },
    { id: "pogoda-2", title: "Буэнос-Айрес", content: "Лето жаркое и влажное. Осень — один из лучших периодов. Зима мягкая." },
    { id: "pogoda-3", title: "Северо-запад и Iguazú", content: "Salta — избегайте летней жары на высоте. Iguazú — баланс воды и комфорта весной/осенью." },
    { id: "pogoda-4", title: "Mendoza и винный сезон", content: "Сбор винограда — март–апril. Лето — жарко днём, прохладно ночью." },
    { id: "pogoda-5", title: "Планирование под погоду", content: "Закладывайте buffer days в Patagonia. Следите за прогнозом Windy для юга." },
  ],
  faq: WEATHER_FAQ,
  blogLinks: [
    { title: "Сезоны и климат", href: "/guide/sezony-i-klimat", description: "Подробный разбор" },
    { title: "Когда лучше ехать", href: "/blog/best-time-to-visit-argentina", description: "Статья в блоге" },
  ],
  partnerServices: [
    { title: "Туры в высокий сезон", description: "Патагония с гидом и логистикой.", href: "/tours?query=Патагония", ctaLabel: "Смотреть туры" },
    { title: "Межсезонные маршруты", description: "BA и регионы без пиковых цен.", href: "/tours?query=Буэнос-Айрес", ctaLabel: "Каталог" },
  ],
};
