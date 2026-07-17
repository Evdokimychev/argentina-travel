/** Lightweight guide metadata used by the client-side root navigation only. */
export const SITE_NAV_GUIDE_INTRO =
  "Главная страница «Об Аргентине» — география и маршруты; 14 тем — практика, сервисы и туры. Каждый раздел — отправная точка перед бронированием на платформе.";

export const SITE_NAV_GUIDE_ABOUT_HREF = "/guide/ob-argentine";

export const SITE_NAV_GUIDE_TOPICS = {
  "kak-dobratsya": {
    title: "Как добраться",
    shortDescription: "Перелёты, аэропорты и трансферы до отеля",
  },
  "gde-zhit": {
    title: "Где жить",
    shortDescription: "Отели, районы BA, аренда, Patagonia и регионы — полный справочник",
  },
  transport: {
    title: "На чём передвигаться",
    shortDescription: "Авто, автобусы, перелёты и городской транспорт",
  },
  "turistskie-regiony": {
    title: "Туристические регионы",
    shortDescription: "Патагония, BA, северо-запад, водопады и винодельни",
  },
  dostoprimechatelnosti: {
    title: "Достопримечательности",
    shortDescription: "Главное: ледники, водопады, города и природные парки",
  },
  "pogoda-i-sezonnost": {
    title: "Погода и сезонность",
    shortDescription: "Когда ехать в Патагонию, BA и на север",
  },
  yazyk: {
    title: "Язык",
    shortDescription: "Испанский, местный акцент и базовые фразы",
  },
  kultura: {
    title: "Культура",
    shortDescription: "Танго, традиции, fútbol и повседневный этикет",
  },
  istoriya: {
    title: "История",
    shortDescription: "От колонизации до современной Аргентины",
  },
  kukhnya: {
    title: "Кухня",
    shortDescription: "Asado, empanadas, вино и гастрономические маршруты",
  },
  svyaz: {
    title: "Связь",
    shortDescription: "SIM, eSIM, покрытие по регионам и связь на маршруте",
  },
  "ekonomika-i-dengi": {
    title: "Экономика и деньги",
    shortDescription:
      "Подробное руководство: песо, синий и официальный курс, обмен, карты, банкоматы и деньги для эмигрантов",
  },
  shopping: {
    title: "Шопинг",
    shortDescription: "Кожа, mate, вино и tax free",
  },
  bezopasnost: {
    title: "Безопасность",
    shortDescription: "Районы BA, кражи, транспорт, «что делать если» и страховка",
  },
} as const;

export type SiteNavGuideTopicSlug = keyof typeof SITE_NAV_GUIDE_TOPICS;
