import type { GuidePillarContent } from "@/types/guide-pillar";

const SVYAZ_FAQ = [
  { question: "Какой оператор для туриста?", answer: "Claro, Personal, Movistar — сравните пакеты data в аэропорту или centro." },
  { question: "Нужен ли паспорт для SIM?", answer: "Да, регистрация по паспорту обязательна в AR." },
  { question: "eSIM или физическая SIM?", answer: "eSIM (Airalo, Holafly) — без визита в салон. Локальная SIM — дешевле на 2+ недели." },
  { question: "Работает ли WhatsApp?", answer: "Да, основной мессенджер для связи с гидами, отелями, менялами." },
  { question: "Есть ли связь в El Chaltén?", answer: "В деревне — да, на тропах Fitz Roy — нет. Скачайте offline-карты." },
  { question: "Нужен ли VPN?", answer: "Для публичного Wi‑Fi — желательно. Для обычного серфинга — не обязателен." },
  { question: "Сколько стоит prepago data?", answer: "Пакеты от ~3000–8000 ARS — уточняйте актуальные тарифы на месте." },
  { question: "Работает ли роуминг из России?", answer: "Зависит от оператора. Часто дорого — локальная SIM или eSIM выгоднее." },
  { question: "Какие розетки?", answer: "220V, тип C/I. Европейская вилка часто подходит." },
  { question: "Есть ли Wi‑Fi в отелях?", answer: "Обычно да, скорость переменная. Не вводите банковские данные в публичных сетях." },
  { question: "Спутниковый интернет?", answer: "Starlink растёт в Patagonia, для туриста не актуален — offline maps важнее." },
  { question: "Как позвонить в Россию?", answer: "WhatsApp/Telegram через Wi‑Fi или data. Международные звонки с локальной SIM — проверьте тариф." },
];

export const SVYAZ_PILLAR: GuidePillarContent = {
  heroSubtitle:
    "SIM-карты, eSIM, интернет и связь на маршруте — от BA до троп Patagonia без сюрпризов",
  heroCtas: [
    { label: "Чеклист поездки", href: "/shop", variant: "primary" },
    { label: "Операторы", href: "#svyaz-1", variant: "secondary" },
    { label: "Задать вопрос", href: "/contacts?topic=svyaz", variant: "tertiary" },
  ],
  quickFacts: [
    { label: "Операторы", value: "Claro, Personal, Movistar" },
    { label: "eSIM", value: "Airalo, Holafly — без салона" },
    { label: "Регистрация SIM", value: "По паспорту" },
    { label: "Мессенджер", value: "WhatsApp — основной" },
    { label: "Patagonia тропы", value: "Нет связи — offline maps" },
    { label: "Напряжение", value: "220V, тип C/I" },
  ],
  sections: [
    { id: "svyaz-1", title: "Операторы и SIM", content: "Claro, Personal, Movistar — киоски в аэропорту и centro. Паспорт для регистрации." },
    { id: "svyaz-2", title: "eSIM для короткой поездки", content: "Airalo, Holafly — активация до вылета. Удобно на 7–14 дней." },
    { id: "svyaz-3", title: "Wi‑Fi и безопасность", content: "Отели и кафе — Wi‑Fi есть. VPN на публичных сетях." },
    { id: "svyaz-4", title: "Связь на маршруте", content: "Chaltén, тропы — offline. Сообщите близким план до выхода." },
    { id: "svyaz-5", title: "Роуминг vs локальная SIM", content: "Роуминг — для экстренных звонков. Data — локальная SIM или eSIM." },
  ],
  faq: SVYAZ_FAQ,
  blogLinks: [
    { title: "Безопасность", href: "/guide/bezopasnost", description: "Цифровая и личная" },
    { title: "Что взять в Патагонию", href: "/blog/patagonia-packing-list", description: "Power bank и offline" },
  ],
  partnerServices: [
    { title: "PDF-чеклисты", description: "Списки для поездки в магазине.", href: "/shop", ctaLabel: "Магазин" },
    { title: "Консультация по маршруту", description: "Уточним логистику и связь по регионам.", href: "/contacts", ctaLabel: "Связаться" },
  ],
};

const SHOPPING_FAQ = [
  { question: "Что привезти из Аргентины?", answer: "Кожа, mate/bombilla, вино (с лимитами), dulce de leche, alpaca poncho." },
  { question: "Где кожа в BA?", answer: "Murillo, Sur — куртки, ремни, сумки. Сравнивайте качество и цену." },
  { question: "Как работает tax free?", answer: "Global Blue в partner-магазинах — возврат IVA при вывозе. Чеки и паспорт." },
  { question: "Можно ли вывезти вино?", answer: "Проверьте лимиты авиакомпании и таможни вашей страны. Duty free — проще." },
  { question: "Что такое feria San Telmo?", answer: "Воскресный рынок — антиквариат, сувениры, уличные артисты." },
  { question: "Где alpaca и poncho?", answer: "Salta, Humahuaca — шерсть альпaca. В BA — туристические магазины Palermo." },
  { question: "Подделки mate?", answer: "Покупайте calabaza и bombilla в специализированных магазинах, не только на улице." },
  { question: "Торг уместен?", answer: "На feria — иногда. В бутиках — нет." },
  { question: "Когда Galerías Pacífico?", answer: "Классический mall в centro — tax free partner, архитектура." },
  { question: "Что такое alfajor?", answer: "Печенье с dulce de leche — Havanna, Cachafaz — бренды для подарков." },
  { question: "Оплата в магазинах?", answer: "Карта или песo/USD. Tax free — часто карта для возврата." },
  { question: "Есть ли аутлеты?", answer: "На outskirts BA — дешевле, нужен транспорт. Outlet Nordelta и аналоги." },
];

export const SHOPPING_PILLAR: GuidePillarContent = {
  heroSubtitle:
    "Кожа, mate, вино, tax free и ferias — что купить туристу и как оформить возврат налогов",
  heroCtas: [
    { label: "Магазин гидов", href: "/shop", variant: "primary" },
    { label: "Что купить", href: "#shopping-1", variant: "secondary" },
    { label: "Задать вопрос", href: "/contacts?topic=shopping", variant: "tertiary" },
  ],
  quickFacts: [
    { label: "Must-buy", value: "Кожа, mate, malbec, dulce de leche" },
    { label: "Feria", value: "San Telmo — воскресенье" },
    { label: "Tax free", value: "Global Blue, partner-магазины" },
    { label: "Кожа BA", value: "Murillo, Sur" },
    { label: "Alpaca", value: "Salta, север" },
    { label: "Mall", value: "Galerías Pacífico" },
  ],
  sections: [
    { id: "shopping-1", title: "Что купить", content: "Кожа, mate, вино, poncho, alfajores." },
    { id: "shopping-2", title: "Где покупать в BA", content: "Palermo Soho, San Telmo feria, Galerías Pacífico." },
    { id: "shopping-3", title: "Tax free и таможня", content: "Global Blue, чеки, лимиты алкоголя при вылете." },
    { id: "shopping-4", title: "Региональные сувениры", content: "Salta — текстиль, Mendoza — вино, Patagonia — шерсть." },
    { id: "shopping-5", title: "PDF и материалы", content: "Путеводители и чеклисты — /shop." },
  ],
  faq: SHOPPING_FAQ,
  blogLinks: [
    { title: "Кухня", href: "/guide/kukhnya", description: "Вино и dulce de leche" },
    { title: "Экономика и деньги", href: "/guide/ekonomika-i-dengi", description: "Оплата и tax free" },
  ],
  partnerServices: [
    { title: "Магазин гидов", description: "PDF-путеводители и чеклисты.", href: "/shop", ctaLabel: "Открыть магазин" },
    { title: "Шопинг-туры BA", description: "С гидом по Palermo и San Telmo.", href: "/tours?query=Буэнос-Айрес", ctaLabel: "Туры" },
  ],
};

const SAFETY_FAQ = [
  { question: "Безопасна ли Аргентина для туристов?", answer: "Да, при базовой осмотрительности. Основной риск в BA — карманники." },
  { question: "Какие районы BA безопаснее?", answer: "Palermo, Recoleta, Puerto Madero днём. La Boca — только туристические улицы днём." },
  { question: "Можно ли ходить с телефоном?", answer: "Не демонстрируйте на тротуаре у дороги — snatch theft. В карман или сумку." },
  { question: "Какое такси безопаснее?", answer: "Cabify, Uber, radio taxi. Не ловите машину с улицы ночью." },
  { question: "Нужна ли страховка?", answer: "Да, с медициной и эвакуацией. Для треккинга — покрытие активностей." },
  { question: "Где не менять валюту?", answer: "Не с уличными менялами (arbolitos). Только проверенные cueva или WU." },
  { question: "Что делать при краже?", answer: "Полиция + копия паспорта из облака. Заблокируйте карты. Consulate при потере паспорта." },
  { question: "Безопасен ли El Chaltén?", answer: "Да, деревня туристическая. Риск — погода на тропах, не преступность." },
  { question: "Можно ли пить воду из крана?", answer: "В BA — спорно, лучше bottled. В провинции — осторожнее." },
  { question: "Демонстрации в BA?", answer: "Избегайте Plaza de Mayo при митингах. Следите за новостями." },
  { question: "Нужен ли репеллент в Iguazú?", answer: "Да, комары. На тропах — нескользкая обувь." },
  { question: "Копии документов?", answer: "Паспорт в сейфе, копия/фото в облаке. Разделяйте карты и наличные." },
];

export const BEZOPASNOST_PILLAR: GuidePillarContent = {
  heroSubtitle:
    "Районы, мелкое воровство и правила на маршруте — как путешествовать спокойно в BA и регионах",
  heroCtas: [
    { label: "Страховка", href: "/contacts?service=insurance-request", variant: "primary" },
    { label: "Буэнос-Айрес", href: "#bezopasnost-1", variant: "secondary" },
    { label: "Задать вопрос", href: "/contacts?topic=bezopasnost", variant: "tertiary" },
  ],
  quickFacts: [
    { label: "Главный риск BA", value: "Карманники, snatch theft" },
    { label: "Безопаснее днём", value: "Palermo, Recoleta, Puerto Madero" },
    { label: "La Boca", value: "Только днём, туристические улицы" },
    { label: "Такси", value: "Cabify, Uber, radio taxi" },
    { label: "Страховка", value: "Обязательна для активных туров" },
    { label: "Документы", value: "Копия паспорта в облаке" },
  ],
  sections: [
    { id: "bezopasnost-1", title: "Буэнос-Айрес", content: "Районы, телефон, такси, La Boca днём." },
    { id: "bezopasnost-2", title: "Документы и деньги", content: "Сейф, разделение карт, без уличного обмена." },
    { id: "bezopasnost-3", title: "На природе", content: "Patagonia — погода и тропы. Iguazú — скользко, репеллент." },
    { id: "bezopasnost-4", title: "Медицина и страховка", content: "Частная клиника в BA качественная. Полис с эвакуацией." },
    { id: "bezopasnost-5", title: "Эмиграция и долгий stay", content: "Районы для жизни, договор аренды, местные контакты — /immigration." },
  ],
  faq: SAFETY_FAQ,
  blogLinks: [
    { title: "Визы для туристов", href: "/immigration/vizy-dlya-turistov", description: "Въезд и документы" },
    { title: "PDF-путеводитель BA", href: "/shop", description: "Безопасные маршруты" },
  ],
  partnerServices: [
    {
      softIntro: "Нужна страховка под ваш маршрут?",
      title: "Туристическая страховка",
      description: "Покрытие медицины и эвакуации — World Nomads.",
      href: "https://www.worldnomads.com",
      external: true,
      ctaLabel: "Выбрать полис",
    },
    {
      title: "Помощь с выбором полиса",
      description: "Подскажем покрытие под треккинг и регион.",
      href: "/contacts?service=insurance-request",
      ctaLabel: "Консультация",
    },
  ],
};
