import type { GuidePillarContent } from "@/types/guide-pillar";

const SHOPPING_FAQ = [
  { question: "Что привезти из Аргентины?", answer: "Кожа, mate/bombilla, vino (с лимитами), dulce de leche, alpaca poncho." },
  { question: "Где кожа в BA?", answer: "Murillo, Sur — куртки, ремни, сумки. Сравнивайте качество и цену." },
  { question: "Как работает tax free?", answer: "Global Blue в partner-магазинах — возврат IVA при вывозе. Чеки и паспорт." },
  { question: "Можно ли вывезти вино?", answer: "Проверьте лимиты авиакомпании и таможни вашей страны. Duty free — проще." },
  { question: "Что такое feria San Telmo?", answer: "Воскресный рынок — антиквариат, сувениры, уличные артисты." },
  { question: "Где alpaca и poncho?", answer: "Salta, Humahuaca — шерсть альпaca. В BA — туристические магазины Palermo." },
  { question: "Подделки mate?", answer: "Покупайте calabaza и bombilla в специализированных магазинах, не только на улице." },
  { question: "Торг уместен?", answer: "На feria — иногда. В бутиках — нет." },
  { question: "Когда Galerías Pacífico?", answer: "Классический mall в centro — tax free partner, архитектура." },
  { question: "Что такое alfajor?", answer: "Печенье с dulce de leche — Havanna, Cachafaz — бренды для подарков." },
  { question: "Оплата в магазинах?", answer: "Карта или peso/USD. Tax free — часто карта для возврата." },
  { question: "Есть ли аутлеты?", answer: "На outskirts BA — дешевле, нужен транспорт. Outlet Nordelta и аналоги." },
];

export const SHOPPING_PILLAR: GuidePillarContent = {
  heroSubtitle:
    "Кожа, mate, vino, tax free и ferias — что купить туристу и как оформить возврат налогов",
  heroCtas: [
    { label: "Магазин гидов", href: "/shop", variant: "primary" },
    { label: "Что купить", href: "#shopping-1", variant: "secondary" },
    { label: "Задать вопрос", href: "/contacts?topic=shopping", variant: "tertiary" },
  ],
  quickFacts: [
    { label: "Must-buy", headline: "Кожа, mate, malbec", detail: "Dulce de leche и alfajores — классические подарки" },
    { label: "Feria", headline: "San Telmo — воскресенье", detail: "Антиквариат, сувениры; приходите утром" },
    { label: "Tax free", headline: "Global Blue", detail: "Partner-магазины — возврат IVA при вывозе, чеки и паспорт" },
    { label: "Кожа BA", headline: "Murillo, Sur", detail: "Куртки и сумки — сравнивайте качество и цену" },
    { label: "Alpaca", headline: "Salta, север", detail: "Текстиль выгоднее, чем в туристических лавках centro" },
    { label: "Mall", headline: "Galerías Pacífico", detail: "Архитектура + tax free partner в centro" },
  ],
  sections: [
    { id: "shopping-1", title: "Что купить", content: "Кожа, mate, vino, poncho, alfajores." },
    { id: "shopping-2", title: "Где покупать в BA", content: "Palermo Soho, San Telmo feria, Galerías Pacífico." },
    { id: "shopping-3", title: "Tax free и таможня", content: "Global Blue, чеки, лимиты алкоголя при вылете." },
    { id: "shopping-4", title: "Региональные сувениры", content: "Salta — текстиль, Mendoza — vino, Patagonia — шерсть." },
    { id: "shopping-5", title: "PDF и материалы", content: "Путеводители и чеклисты — /shop." },
  ],
  faq: SHOPPING_FAQ,
  blogLinks: [
    { title: "Кухня", href: "/guide/kukhnya", description: "Vino и dulce de leche" },
    { title: "Экономика и деньги", href: "/guide/ekonomika-i-dengi", description: "Оплата и tax free" },
  ],
  partnerServices: [
    { title: "Магазин гидов", description: "PDF-путеводители и чеклисты.", href: "/shop", ctaLabel: "Открыть магазин" },
    { title: "Шопинг-туры BA", description: "С гидом по Palermo и San Telmo.", href: "/tours?query=Буэнос-Айрес", ctaLabel: "Туры" },
  ],
};
