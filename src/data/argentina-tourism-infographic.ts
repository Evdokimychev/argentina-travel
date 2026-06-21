/** Данные туристической инфографики «Аргентина в цифрах» — редакция 2026. */

export type TourismInfographicFact = {
  id: string;
  icon: "area" | "currency" | "capital" | "population" | "language" | "visa" | "timezone" | "season";
  label: string;
  value: string;
  detail?: string;
  href?: string;
};

export type TourismMapCity = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  tag: string;
  href: string;
};

export type TourismHighlight = {
  id: string;
  emoji: string;
  title: string;
  stat: string;
  detail: string;
  href?: string;
};

export type TourismBarStat = {
  id: string;
  label: string;
  /** 0–100, относительная популярность среди туристов */
  value: number;
  detail: string;
};

export type TourismPracticalItem = {
  title: string;
  body: string;
  href?: string;
  linkLabel?: string;
};

export const ARGENTINA_TOURISM_INFOGRAPHIC = {
  title: "Аргентина",
  subtitle: "Путешествие в контрастах",
  tagline:
    "От тропических водопадов на севере до ледников Патагонии и «края света» — одна из самых контрастных стран для самостоятельных и организованных маршрутов.",
  editionLabel: "Редакция 2026 · туризм",
  disclaimer:
    "Цифры приведены для планирования поездки. Правила въезда, курс песо и сезонность уточняйте перед выездом.",
  sidebarFacts: [
    {
      id: "area",
      icon: "area",
      label: "Площадь",
      value: "2,78 млн км²",
      detail: "8-е место в мире — расстояния измеряются перелётами",
      href: "/guide/ob-argentine#geography",
    },
    {
      id: "currency",
      icon: "currency",
      label: "Валюта",
      value: "Песо (ARS)",
      detail: "Карты и наличные USD — см. гид по деньгам",
      href: "/guide/ekonomika-i-dengi",
    },
    {
      id: "capital",
      icon: "capital",
      label: "Столица",
      value: "Буэнос-Айрес",
      detail: "EZE и AEP — главные международные хабы",
      href: "/destinations/ba",
    },
    {
      id: "population",
      icon: "population",
      label: "Население",
      value: "~46 млн",
      detail: "Большинство — в столице и на пампасах",
    },
    {
      id: "language",
      icon: "language",
      label: "Язык",
      value: "Испанский",
      detail: "Диалект rioplatense; в туристических зонах — базовый английский",
    },
    {
      id: "visa",
      icon: "visa",
      label: "Въезд (РФ)",
      value: "До 90 дней",
      detail: "Без визы, туристический статус",
      href: "/blog/argentina-tourist-visa-2026",
    },
    {
      id: "timezone",
      icon: "timezone",
      label: "Часовой пояс",
      value: "UTC−3",
      detail: "Единый пояс на всей территории",
    },
    {
      id: "season",
      icon: "season",
      label: "Лучший сезон",
      value: "Зависит от региона",
      detail: "Патагония — ноябрь–март; BA — весна и осень",
      href: "/guide/pogoda-i-sezonnost",
    },
  ] satisfies TourismInfographicFact[],
  mapCities: [
    {
      id: "ba",
      name: "Буэнос-Айрес",
      lat: -34.6,
      lng: -58.38,
      tag: "Столица · культура · гастрономия",
      href: "/destinations/ba",
    },
    {
      id: "iguazu",
      name: "Игуасу",
      lat: -25.69,
      lng: -54.44,
      tag: "275 водопадов · ЮНЕСКО",
      href: "/destinations/iguazu",
    },
    {
      id: "salta",
      name: "Сальта",
      lat: -24.79,
      lng: -65.41,
      tag: "Каньоны · виноградники NOA",
      href: "/destinations/salta",
    },
    {
      id: "mendoza",
      name: "Мендоса",
      lat: -32.89,
      lng: -68.83,
      tag: "Malbec · Анды",
      href: "/destinations/mendoza",
    },
    {
      id: "bariloche",
      name: "Барилоче",
      lat: -41.13,
      lng: -71.31,
      tag: "Озёра · лыжи · треккинг",
      href: "/destinations/bariloche",
    },
    {
      id: "calafate",
      name: "Эль-Калафате",
      lat: -50.34,
      lng: -72.27,
      tag: "Перито-Морено · ледники",
      href: "/destinations/calafate",
    },
    {
      id: "ushuaia",
      name: "Ушуайя",
      lat: -54.8,
      lng: -68.3,
      tag: "Край света · Антарктида",
      href: "/destinations/ushuaia",
    },
  ] satisfies TourismMapCity[],
  highlights: [
    {
      id: "unesco",
      emoji: "🏛️",
      title: "Объекты ЮНЕСКО",
      stat: "11",
      detail: "Игуасу, Лос-Гласьярес, Вальдес, Талампая и другие",
      href: "/blog/natsionalnye-parki-argentiny",
    },
    {
      id: "parks",
      emoji: "🏞️",
      title: "Национальные парки",
      stat: "~39",
      detail: "От джунглей Мисьонес до ледников Патагонии",
      href: "/blog/natsionalnye-parki-argentiny",
    },
    {
      id: "regions",
      emoji: "🗺️",
      title: "Ключевых регионов",
      stat: "8+",
      detail: "В каталоге направлений платформы",
      href: "/destinations",
    },
    {
      id: "visitors",
      emoji: "✈️",
      title: "Иностранных туристов",
      stat: "~7 млн/год",
      detail: "После восстановления потока после пандемии",
    },
  ] satisfies TourismHighlight[],
  destinationBars: [
    {
      id: "ba",
      label: "Буэнос-Айрес",
      value: 100,
      detail: "Почти каждый маршрут начинается в столице",
    },
    {
      id: "patagonia",
      label: "Патагония",
      value: 88,
      detail: "Ледники, треккинг, киты и пингвины",
    },
    {
      id: "iguazu",
      label: "Игуасу",
      value: 72,
      detail: "Водопады №1 в Южной Америке",
    },
    {
      id: "mendoza",
      label: "Мендоса",
      value: 58,
      detail: "Винные маршруты у подножия Анд",
    },
    {
      id: "salta",
      label: "Северо-запад",
      value: 45,
      detail: "Каньоны, высокогорье, Cafayate",
    },
  ] satisfies TourismBarStat[],
  practical: [
    {
      title: "Международные аэропорты",
      body: "EZE (Эсейса) — основной хаб; AEP (Аэропарк Хорхе Ньюbery) — удобен для внутренних рейсов. Из России — чаще через Стамбул, Доху или Мадрид.",
      href: "/guide/kak-dobratsya",
      linkLabel: "Как добраться",
    },
    {
      title: "Внутри страны",
      body: "На длинных расстояниях — перелёты (Aerolíneas Argentinas, Flybondi). Автобусы комфортны, но медленны. Аренда авто — точечно в Мендосе, Сальте, Барилоче.",
      href: "/guide/transport",
      linkLabel: "Транспорт",
    },
    {
      title: "Комбо с соседями",
      body: "Уругвай — паром из BA за полдня. Бразилия — водопады с двух сторон. Чили — Патагония и Торрес-дель-Пайне через Калафате или Барилоче.",
      href: "/guide/ob-argentine#neighbors",
      linkLabel: "Соседние страны",
    },
  ] satisfies TourismPracticalItem[],
} as const;

/** Equirectangular projection for South America bbox onto SVG coordinates. */
export function projectTourismMapPoint(
  lat: number,
  lng: number,
  width = 320,
  height = 400,
): { x: number; y: number } {
  const minLng = -82;
  const maxLng = -34;
  const minLat = -56;
  const maxLat = 14;
  const x = ((lng - minLng) / (maxLng - minLng)) * width;
  const y = ((maxLat - lat) / (maxLat - minLat)) * height;
  return { x, y };
}
