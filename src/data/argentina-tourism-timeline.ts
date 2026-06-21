/** Вертикальная инфографика «Эволюция туризма в Аргентине» — редакция 2026. */

export type TourismTimelineStream = {
  id: string;
  label: string;
  /** CSS-цвет ленты */
  color: string;
  /** Tailwind bg class для легенды */
  swatchClass: string;
  description: string;
};

export type TourismTimelineEra = {
  id: string;
  yearLabel: string;
  theme: string;
  title: string;
  body: string;
  badge?: string;
  highlights: string[];
  href?: string;
  linkLabel?: string;
  /** Позиция узла на шкале 0–100 (снизу вверх) */
  position: number;
};

export type TourismHubDestination = {
  id: string;
  name: string;
  /** Доля маршрутов первого визита, % — иллюстративно */
  share: number;
  tag: string;
  href: string;
};

export const ARGENTINA_TOURISM_TIMELINE = {
  title: "Аргентина туристическая",
  subtitle: "Как страна стала маршрутом «от пампы до ледников»",
  editionLabel: "Редакция 2026 · история путешествий",
  hubLabel: "Буэнос-Айрес",
  hubStat: "≈90%",
  hubStatLabel: "маршрутов начинаются в столице",
  hubDescription:
    "Сегодня Буэнос-Айрес — главный хаб: сюда прилетают почти все, отсюда разлетаются перелёты в Патагонию, на Игуасу и в Мендосу.",
  disclaimer:
    "Доли направлений — оценка редакции для первых поездок, не официальная статистика. Цифры туристического потока уточняйте перед планированием.",
  streams: [
    {
      id: "culture",
      label: "Культура и города",
      color: "#c0392b",
      swatchClass: "bg-red-500",
      description: "Столица, tango, архитектура, гастрономия, колониальные центры",
    },
    {
      id: "nature",
      label: "Природа и парки",
      color: "#2d6a4f",
      swatchClass: "bg-emerald-600",
      description: "Патагония, водопады, киты, пингвины, национальные парки",
    },
    {
      id: "wine",
      label: "Вино и север",
      color: "#2563eb",
      swatchClass: "bg-blue-600",
      description: "Мендоса, Сальта, каньоны, высокогорные виноградники",
    },
  ] satisfies TourismTimelineStream[],
  eras: [
    {
      id: "era-1810",
      yearLabel: "1810–1910",
      theme: "Пампа",
      title: "Гаучо, estancia и «край света»",
      body:
        "Страна только формируется. Путешественников почти нет — лишь редкие экспедиции и торговые суда. Пампа и Patagonia кажутся бесконечными; культура gaucho и estancia закладывает образ «настоящей Аргентины», который туристы ищут и сегодня.",
      badge: "Сельская страна",
      highlights: [
        "Пампа — основной образ страны для иностранцев XIX века",
        "Patagonia и Огненная Земля — terra incognita",
        "Buenos Aires — порт, а не ещё «Париж Латинской Америки»",
      ],
      position: 12,
    },
    {
      id: "era-1910",
      yearLabel: "1910–1950",
      theme: "Коммерция",
      title: "Европейская столица и волна переселенцев",
      body:
        "Миллионы иммигрантов из Италии, Испании и других стран меняют лицо Буэнос-Айреса. Появляются первые отели, железные дороги в interior, tango и культурный туризм. Агроэкспорт делает страну богаче — и открывает interior для внутренних поездок.",
      badge: "2,5 млн иммигрантов",
      highlights: [
        "BA — «Париж Южной Америки»: театры, кафе, boulevard",
        "Первые туристические маршруты в pampas и Cordoba",
        "Bariloche и озёрный край — зачатки горного туризма",
      ],
      href: "/destinations/ba",
      linkLabel: "Буэнос-Айрес сегодня",
      position: 38,
    },
    {
      id: "era-1950",
      yearLabel: "1950–1990",
      theme: "Население",
      title: "Города растут, открываются нацпарки",
      body:
        "Городизация: люди стекаются в мегаполисы, но параллельно создаются национальные парки и инфраструктура для природного туризма. Игуасу, Лос-Гласьярес и другие объекты становятся символами страны; ЮНЕСКО закрепляет их статус.",
      badge: "~39 нацпарков",
      highlights: [
        "Нацпарк Игуасú (1934) — один из первых крупных маршрутов",
        "Los Glaciares и Perito Moreno — икона Patagonia",
        "Внутренний туризм: Mar del Plata, Bariloche, Mendoza",
      ],
      href: "/blog/natsionalnye-parki-argentiny",
      linkLabel: "Все национальные парки",
      position: 62,
    },
    {
      id: "era-2010",
      yearLabel: "1990–2026",
      theme: "Централизация",
      title: "Контрастный туризм: один перелёт — три климата",
      body:
        "Международный поток восстанавливается после пандемии. Типичный маршрут — BA + один природный регион за 10–14 дней. Вино, треккинг, гастрономия и антарктические круизы из Ushuaia — в одном бренде страны.",
      badge: "~7 млн туристов/год",
      highlights: [
        "EZE/AEP — хаб для внутренних рейсов Aerolíneas и Flybondi",
        "Wine tourism в Mendoza и Cafayate — стабильный поток",
        "Экотourism и trekking — главный magnet Patagonia",
      ],
      href: "/destinations",
      linkLabel: "Каталог направлений",
      position: 88,
    },
  ] satisfies TourismTimelineEra[],
  hubDestinations: [
    {
      id: "patagonia",
      name: "Патагония",
      share: 68,
      tag: "Ледники · треккинг",
      href: "/destinations/patagonia",
    },
    {
      id: "iguazu",
      name: "Игуасу",
      share: 55,
      tag: "Водопады · ЮНЕСКО",
      href: "/destinations/iguazu",
    },
    {
      id: "mendoza",
      name: "Мендоса",
      share: 42,
      tag: "Malbec · Анды",
      href: "/destinations/mendoza",
    },
    {
      id: "bariloche",
      name: "Барилoche",
      share: 38,
      tag: "Озёра · лыжи",
      href: "/destinations/bariloche",
    },
    {
      id: "salta",
      name: "Сальта / NOA",
      share: 28,
      tag: "Каньоны · torrontés",
      href: "/destinations/salta",
    },
    {
      id: "ushuaia",
      name: "Ушуайя",
      share: 25,
      tag: "Край света",
      href: "/destinations/ushuaia",
    },
  ] satisfies TourismHubDestination[],
} as const;

/** SVG-координаты лент (viewBox 0 0 400 420). */
export const TIMELINE_RIBBON_PATHS: Record<
  TourismTimelineStream["id"],
  string
> = {
  culture:
    "M 72 400 C 60 340, 88 280, 76 220 S 52 120, 168 52",
  nature:
    "M 200 400 C 200 330, 200 260, 200 190 S 200 110, 200 48",
  wine:
    "M 328 400 C 340 340, 312 280, 324 220 S 348 120, 232 52",
};

export const TIMELINE_VIEWBOX = { width: 400, height: 420 } as const;

export function eraYPosition(position: number, height = TIMELINE_VIEWBOX.height): number {
  const padding = 48;
  const usable = height - padding * 2;
  return height - padding - (position / 100) * usable;
}
