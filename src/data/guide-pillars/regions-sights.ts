import type { GuidePillarContent } from "@/types/guide-pillar";

const REGIONS_FAQ = [
  { question: "С чего начать первую поездку в Аргентину?", answer: "Классика: BA 3–4 дня + один регион — Патагония (ледники) или Iguazú (водопады) или Mendoza (вино)." },
  { question: "Сколько дней нужно на Патагонию?", answer: "Минимум 5–7 дней на Calafate + Chaltén или Bariloche. Ушуайя — ещё 3–4 дня." },
  { question: "Можно ли совместить Iguazú и BA?", answer: "Да, перелёт 2–3 часа. Типичный маршрут: неделя BA + 2–3 дня Iguazú." },
  { question: "Когда сезон в Патагонии?", answer: "Ноябрь–март — основной. Зима — лыжи в Bariloche, многие тропы закрыты." },
  { question: "Что такое северо-запад (NOA)?", answer: "Salta, Кафаяте, Quebrada de Humahuaca — горы, виноградники torrontés, колониальная архитектура." },
  { question: "Нужен ли гид в регионах?", answer: "Для треккинга в Chaltén — нет. Для ледника, Iguazú boat tour, estancia — гид или тур удобнее." },
  { question: "Какие регионы для второго визита?", answer: "Кордова, Lake District, Peninsula Valdés (киты), Iberá ( wetlands)." },
  { question: "Далеко ли Mendoza от BA?", answer: "~1,5 ч перелёта или ~12 ч автобусом. На 3–4 дня — винодельни и Анды." },
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
    { label: "Регионов в каталоге", headline: "8 направлений", detail: "Туры, сезоны и советы — на платформе" },
    { label: "Патагония — сезон", headline: "Ноябрь–март", detail: "Теплее, открыты тропы; дек–янв — пик цен" },
    { label: "Iguazú из BA", headline: "~2 ч перелёта", detail: "2–3 дня на аргентинской стороне — минимум" },
    { label: "Mendoza", headline: "Malbec и Анды", detail: "1,5 ч перелёта или ~12 ч автобусом" },
    { label: "NOA", headline: "Salta, Humahuaca", detail: "Горы, torrontés, колониальная архитектура" },
    { label: "Классика первой поездки", headline: "BA + 1 регион", detail: "Не пытайтесь объехать всё за 10 дней" },
  ],
  sections: [
    { id: "turistskie-regiony-1", title: "Патагония и Огненная Земля", content: "Эль-Калафате, El Chaltén, Барилоче, Ушуайя — ледники, треккинг, край света. Сезон ноябрь–март." },
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
  { question: "Что обязательно увидеть в первую поездку?", answer: "Перито-Морено, Iguazú, районы BA (La Boca, Recoleta), винодельни Mendoza." },
  { question: "Нужно ли бронировать Перито-Морено заранее?", answer: "В высокий сезон — да, онлайн на сайте парка или через тур с трансфером." },
  { question: "Сколько времени на Iguazú?", answer: "Минимум 1 полный день на аргентинской стороне. 2 дня — аргентинская + бразильская." },
  { question: "Можно ли в Chaltén без гида?", answer: "Да, тропы к Fitz Roy и Cerro Torre — самостоятельные. Следите за погодой." },
  { question: "Когда пингвины на Peninsula Valdés?", answer: "Сентябрь–март — сезон размножения магеллановых пингвинов." },
  { question: "Что смотреть в BA за 2 дня?", answer: "Recoleta, San Telmo (воскресный рынок), Caminito днём, Teatro Colón или milonga вечером." },
  { question: "Нужен ли гид в BA?", answer: "Walking tour полезен для контекста. Авторские туры на платформе — с русскоязычным гидом." },
  { question: "Есть ли билеты на Teatro Colón?", answer: "Да, экскурсии и иногда спектакли — бронируйте на официальном сайте." },
  { question: "Как добраться до Quebrada de Humahuaca?", answer: "Из Salta — автобус или тур на день. Маршрут 14 — классика." },
  { question: "Опасен ли Caminito?", answer: "Днём в туристической зоне — нормально. Не носите ценности на виду, не ходите в side streets ночью." },
  { question: "Сколько стоит вход в нацпарки?", answer: "Перито-Морено и Iguazú — оплата картой или pesos, иностранцы платят повышенный тариф. Уточняйте на сайте парка." },
  { question: "Можно ли совместить ледник и треккинг?", answer: "Да: 1 день Перито-Морено из Calafate + 2–3 дня Chaltén на тропах." },
];

export const DOSTOPRIMECHATELNOSTI_PILLAR: GuidePillarContent = {
  heroSubtitle:
    "Главное: ледники, водопады, города и природные парки — что включить в маршрут и как бронировать",
  heroCtas: [
    { label: "Экскурсии", href: "/tours", variant: "primary" },
    { label: "Природные иконы", href: "#dostoprimechatelnosti-1", variant: "secondary" },
    { label: "Задать вопрос", href: "/contacts?topic=dostoprimechatelnosti", variant: "tertiary" },
  ],
  quickFacts: [
    { label: "Перито-Морено", headline: "El Calafate", detail: "Бронь онлайн в высокий сезон — или тур с трансфером" },
    { label: "Iguazú", headline: "275 водопадов", detail: "Аргентинская + бразильская стороны — 2 дня идеально" },
    { label: "Fitz Roy", headline: "El Chaltén", detail: "Треккинг без гида; погода меняется за часы" },
    { label: "Главное в BA", headline: "Recoleta, San Telmo", detail: "Teatro Colón или milonga — на вечер" },
    { label: "Пингвины", headline: "Peninsula Valdés", detail: "Сентябрь–март — сезон размножения" },
    { label: "Экскурсии", headline: "Каталог на платформе", detail: "Русскоязычные гиды — фильтр по языку" },
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
  { question: "Какая погода в Mendoza?", answer: "Континентальный климат: жаркое лето, прохладная ночь. Винный сезон — март–апрель (сбор)." },
  { question: "Ветер в Патагонии — насколько серьёзно?", answer: "Очень. Закладывайте запас дней для треккинга — тропы могут закрыть из-за ветра." },
  { question: "Когда киты в Valdés?", answer: "Июнь–декабрь — сезоны зависят от вида. Пингвины — сентябрь–март." },
  { question: "Есть ли смысл в межсезонье?", answer: "Да — меньше людей, ниже цены. Погода менее предсказуема — гибкий маршрут." },
  { question: "Нужен ли дождевик в Iguazú?", answer: "Да, всегда. Boat tour — вы промокнете." },
  { question: "Когда feria в San Telmo?", answer: "Воскресенье — главный день, с утра до вечера. Лучшая погода — осень и весна BA." },
  { question: "Как планировать слои одежды?", answer: "Патагония: базовый слой + флис + windproof. BA: лёгкая одежда + куртка вечером." },
];

export const POGODA_PILLAR: GuidePillarContent = {
  heroSubtitle:
    "Когда ехать в Патагонию, Буэнос-Айрес и на север — климат по месяцам, прогноз и практические советы по регионам",
  heroCtas: [
    { label: "🌡 Климат по месяцам", href: "#weather-dashboard", variant: "primary" },
    { label: "🏔 Патагония", href: "#pogoda-1", variant: "secondary" },
    { label: "☀️ BA", href: "#pogoda-2", variant: "secondary" },
    { label: "Туры по сезону", href: "/tours", variant: "tertiary" },
  ],
  quickFacts: [
    { emoji: "☀️", label: "Патагония — лучший сезон", headline: "Ноябрь–март", detail: "Тропы открыты; дек–янв — пик туристов и цен" },
    { emoji: "🌡️", label: "BA — комфорт", headline: "Март–май, сент–нояб", detail: "Избегайте жары +35 °C летом (дек–фев)" },
    { emoji: "🌧️", label: "Iguazú — меньше дождей", headline: "Март–май, сент–нояб", detail: "Дек–фев — максимум воды, но влажность и комары" },
    { emoji: "🏔️", label: "Salta / NOA", headline: "Весна и осень", detail: "Лето жаркое на высоте; зима — прохладные ночи" },
    { emoji: "📅", label: "Высокий сезон", headline: "Дек–фев, июль (BA)", detail: "Patagonia летом + школьные каникулы BA зимой" },
    { emoji: "💨", label: "Ветер Patagonia", headline: "Круглый год", detail: "Закладывайте запас дней на треккинг" },
  ],
  sections: [
    {
      id: "weather-dashboard",
      title: "Климат по месяцам и прогноз",
      content:
        "Интерактивная панель: средние температуры и осадки по всем месяцам для пяти ключевых регионов, плюс прогноз на вчера, сегодня и завтра. Переключайте регион — BA, Patagonia, Iguazú, Salta, Mendoza.",
      widgetSlot: {
        id: "weather-dashboard",
        label: "Климат и прогноз",
        type: "weather-panel",
      },
    },
    {
      id: "pogoda-1",
      title: "Патагония",
      content:
        "Южная Патагония — прохладный ветреный климат. Лето короткое (ноябрь–март), зима длинная и суровая на тропах.",
      widgetSlot: {
        id: "patagonia-tours",
        label: "Туры в Patagonia",
        type: "tour-embed",
        tourEmbed: {
          variant: "grid",
          title: "Готовые туры в Patagonia",
          subtitle: "Ледники, треккинг и комфортные маршруты с гидом",
          limit: 3,
          source: { kind: "query", query: "patagon" },
          catalogHref: "/tours?query=patagonia",
          catalogLabel: "Все туры Patagonia",
          tone: "muted",
        },
      },
      subsections: [
        {
          title: "El Calafate и Perito Moreno",
          body: "Ноябрь–март — основной туристический сезон: +12…+18 °C днём, но ветер усиливает ощущение холода. Закладывайте windproof-куртку и слои.",
        },
        {
          title: "El Chaltén и треккинг",
          body: "Тропы Fitz Roy и Cerro Torre открыты с октября по апрель. Ветер может закрыть маршруты на 1–2 дня — buffer days обязательны.",
        },
        {
          title: "Bariloche зимой",
          body: "Июнь–август — лыжный сезон Cerro Catedral. Температура около 0…+5 °C, снег в горах.",
        },
      ],
      table: {
        headers: ["Период", "Температура", "Осадки", "Для кого"],
        rows: [
          ["Ноя–мар", "+10…+18 °C", "Умеренные", "Треккинг, ледники, киты Valdés"],
          ["Апр–ок", "+2…+12 °C", "Меньше туристов", "Межсезонье, закрытые тропы"],
          ["Июн–авг", "0…+8 °C", "Снег в горах", "Лыжи Bariloche, закрытые тропы юга"],
        ],
      },
      infoBoxes: [
        {
          variant: "warning",
          title: "Ветер — главный фактор",
          body: "Patagonia известна порывами 80–100 км/ч. Следите за Windy и прогнозом накануне треккинга.",
        },
      ],
    },
    {
      id: "pogoda-2",
      title: "Буэнос-Айрес",
      content:
        "Субтропический влажный климат: жаркое лето (дек–фев), мягкая зима (июн–авг). Лучшие периоды для прогулок — март–май и сент–нояб.",
      subsections: [
        {
          title: "Лето (дек–фев)",
          body: "+28…+35 °C днём, высокая влажность. Жара спадает к вечеру. Кондиционер в жилье обязателен.",
        },
        {
          title: "Осень и весна",
          body: "+18…+25 °C, меньше дождей. Идеально для San Telmo, Recoleta, велопрогулок и rooftop-баров.",
        },
        {
          title: "Зима (июн–авг)",
          body: "+10…+18 °C, влажность и ветер с Río de la Plata. Куртка и зонт — в сумке каждый день.",
        },
      ],
      table: {
        headers: ["Месяц", "Макс °C", "Мин °C", "Комфорт"],
        rows: [
          ["Янв–фев", "28–30", "18–20", "Жарко, высокий сезон"],
          ["Мар–май", "18–26", "11–17", "Отлично для города"],
          ["Июн–авг", "15–17", "7–9", "Мягкая зима"],
          ["Сен–ноя", "19–25", "10–15", "Лучший период"],
        ],
      },
    },
    {
      id: "pogoda-3",
      title: "Северо-запад и Iguazú",
      content: "Два контрастных климата: сухие горы Salta и влажные субтропики Misiones.",
      subsections: [
        {
          title: "Iguazú",
          body: "Тепло круглый год (+20…+32 °C). Дек–фев — максимум воды в водопадах, но и максимум дождей и комаров. Март–май и сен–нояб — баланс.",
        },
        {
          title: "Salta и Quebrada de Humahuaca",
          body: "Высокогорье: жаркие дни (+25…+30 °C) и холодные ночи. Лето (янв–фев) — грозы и град. Лучше апр–июн и сен–окт.",
        },
      ],
      infoBoxes: [
        {
          variant: "tip",
          title: "Iguazú — дождевик всегда",
          body: "Даже в сухой сезон вы промокнете на boat tour и смотровых площадках. Защита для камеры обязательна.",
        },
      ],
    },
    {
      id: "pogoda-4",
      title: "Mendoza и винный сезон",
      content:
        "Континентальный сухой климат: мало осадков, жаркое лето, прохладные ночи. Винный туризм — круглый год, но harvest season особенный.",
      subsections: [
        {
          title: "Vendimia (сбор винограда)",
          body: "Март–апрель — фестивали, дегустации, активность на bodegas. Бронируйте туры заранее.",
        },
        {
          title: "Лето в винодельнях",
          body: "+30…+35 °C днём, +15…+18 °C ночью. Экскурсии лучше утром или вечером.",
        },
      ],
      table: {
        headers: ["Сезон", "Что делать", "Температура"],
        rows: [
          ["Мар–апр", "Vendimia, harvest tours", "+20…+27 °C"],
          ["Май–авг", "Горы и Aconcagua views", "+14…+22 °C"],
          ["Сен–фев", "Винные туры, asado", "+25…+33 °C"],
        ],
      },
    },
    {
      id: "pogoda-5",
      title: "Планирование под погоду",
      content: "Практические правила для маршрута по всей стране.",
      subsections: [
        {
          title: "Слои одежды",
          body: "Patagonia: base layer + fleece + windproof shell. BA: лёгкая одежда + куртка. Iguazú: дождевик + breathable layers.",
        },
        {
          title: "Buffer days",
          body: "В Patagonia закладывайте 1–2 запасных дня на каждые 3 дня треккинга — погода меняет планы.",
        },
        {
          title: "Приложения",
          body: "Windy — ветер Patagonia. YR.no / Windguru — общий прогноз. SMN Argentina — официальный метеосервис.",
        },
      ],
      infoBoxes: [
        {
          variant: "info",
          title: "Южное полушарие",
          body: "Сезоны инвертированы относительно России: декабрь = лето, июнь = зима. Планируйте Patagonia на «наше зимнее».",
        },
      ],
    },
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
