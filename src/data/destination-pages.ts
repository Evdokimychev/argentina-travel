import { POPULAR_DESTINATIONS } from "@/data/filters";
import type { Destination } from "@/types";

export type DestinationPage = Destination & {
  intro: string;
  highlights: string[];
  bestSeason: string;
  idealDuration: string;
  howToGetThere: string;
  travelTips: string[];
  regionGroup: string;
};

const DESTINATION_CONTENT: Record<
  string,
  Omit<DestinationPage, keyof Destination>
> = {
  ba: {
    regionGroup: "Столица и центр",
    intro:
      "Буэнос-Айрес — город с европейским характером и латиноамериканской энергией: широкие авениды, neoclassical фасады Recoleta, уличное танго в San Telmo и вечера в parrilla. Здесь удобно стартовать любой маршрут по Аргентине: международный аэропорт Ezeiza (EZE) и внутренний Aeroparque (AEP) связывают столицу с Патагонией, северо-западом и водопадами. Для первого визита достаточно 3–4 дней на центр, Palermo и Puerto Madero; на второй заезд — колонии и дельта Тигре.",
    highlights: [
      "San Telmo и рынок по воскресеньям",
      "La Boca и Caminito",
      "Recoleta и кладбище",
      "Milonga и шоу танго",
      "Asado в parrilla",
      "Palermo Soho и гастрономия",
    ],
    bestSeason: "Круглый год; комфортнее всего март–май и сентябрь–ноябрь (+18…+26 °C)",
    idealDuration: "3–5 дней",
    howToGetThere:
      "Прямые рейсы из Москвы в Ezeiza (EZE), ~18–20 ч с пересадкой. Из аэропорта — такси/remis (~45–60 мин до центра) или автобус Tienda León. Внутренние рейсы — из Aeroparque (AEP).",
    travelTips: [
      "Обменивайте pesos в официальных cambio или снимайте в банкомате — курс «синий» выгоднее уличного.",
      "Чаевые 10 % в ресторанах; такси округляют вверх.",
      "Воскресный San Telmo — приходите до 11:00, иначе толпы.",
      "Метро Subte дешёвое, но вечером удобнее Uber/Cabify.",
    ],
  },
  bariloche: {
    regionGroup: "Патагония",
    intro:
      "San Carlos de Bariloche стоит на берегу озера Nahuel Huapi у подножия Анд — главная база озёрной Патагонии. Летом — треккинг, каякинг и маршрут Circuito Chico; зимой — Cerro Catedral, один из крупнейших горнолыжных курортов Южного полушария. Город известен знаменитыми шоколадными мастерскими, ароматом кипарисовых лесов и видами на Cerro Tronador. Отсюда удобно ехать в Villa La Angostura и на Seven Lakes Route.",
    highlights: [
      "Cerro Catedral — лыжи и канатка",
      "Circuito Chico и Punto Panorámico",
      "Cerro Campanario",
      "Озёра Nahuel Huapi",
      "Шоколадные магазины Rapa Nui",
      "Треккинг Refugio Frey",
    ],
    bestSeason: "Декабрь–март — треккинг и озёра; июнь–сентябрь — лыжный сезон",
    idealDuration: "4–6 дней",
    howToGetThere:
      "Перелёт Buenos Aires (AEP/EZE) → San Carlos de Bariloche (BRC), ~2 ч. Из аэропорта — taxi/remis 20–25 мин до центра. Альтернатива — ночной автобус из BA (~18–20 ч).",
    travelTips: [
      "Погода меняется за час — слои, ветровка и крем SPF обязательны.",
      "Национальный парк Nahuel Huapi — вход по предварительной регистрации.",
      "Бронируйте refugio Frey за 2–3 месяца в высокий сезон.",
      "Зимой цепи на авто и раннее бронирование жилья у склонов.",
    ],
  },
  calafate: {
    regionGroup: "Патагония",
    intro:
      "El Calafate — компактный город на берегу Lago Argentino и главные ворота к леднику Perito Moreno в Los Glaciares National Park. Сюда приезжают за зрелищными обрушениями ледяных глыб (calving), ледниковыми трекингами (Mini-Trekking, Big Ice) и круизами к Upsala и Spegazzini. Город полностью туристический: рестораны с lamb patagónico, музеи ледников и прокат снаряжения.",
    highlights: [
      "Ледник Perito Moreno",
      "Walkways и смотровые площадки",
      "Mini-Trekking / Big Ice",
      "Круизы по Lago Argentino",
      "Estancia Cristina (опционально)",
      "Ледник Upsala с воды",
    ],
    bestSeason: "Октябрь–апрель — парк открыт, длинный световой день",
    idealDuration: "3–4 дня",
    howToGetThere:
      "Перелёт BA → El Calafate (FTE), ~3 ч. Из аэропорта до центра 20 мин на taxi. Связка Bariloche–Calafate — только через BA или автобус ~24 ч.",
    travelTips: [
      "Билеты в парк Perito Moreno покупайте онлайн заранее — лимит посещений.",
      "Big Ice требует хорошей физической формы и брони за месяцы.",
      "Ветер у ледника сильный — перчатки и непромокаемая куртка.",
      "На 3-й день добавьте El Chaltén (автобус ~3 ч) для Fitz Roy.",
    ],
  },
  ushuaia: {
    regionGroup: "Огненная Земля",
    intro:
      "Ushuaia — один из самых южных городов мира и главные ворота к Антарктиде на берегу канала Beagle, окружённая Martial Range. Отсюда отправляются круизы в Антарктиду, экскурсии в Tierra del Fuego National Park и морские прогулки к островам с пингвинами и sea lions. End of the World Train, треккинг Laguna Esmeralda и рыбалка — классика региона. Город компактный, с видом на порт и снежные вершины.",
    highlights: [
      "Tierra del Fuego National Park",
      "End of the World Train",
      "Canal Beagle и маяк",
      "Остров Magellanic penguins",
      "Laguna Esmeralda",
      "Круизы в Антарктиду (сезон)",
    ],
    bestSeason: "Ноябрь–март — +10…+15 °C, длинный день; декабрь–февраль — пик",
    idealDuration: "3–4 дня",
    howToGetThere:
      "Перелёт BA → Ushuaia (USH), ~3,5 ч. Из аэропорта 10 мин до центра. Часто комбинируют с Calafate (FTE→USH или автобус через Chile — сложнее).",
    travelTips: [
      "Погода непредсказуема — всегда ветровка и слои.",
      "Пингвин-тура бронируйте заранее; сезон октябрь–март.",
      "Antártida cruises стартуют ноябрь–март, бронь за полгода.",
      "Национальный парк — такси или организованный трансфер.",
    ],
  },
  iguazu: {
    regionGroup: "Северо-Восток",
    intro:
      "Водопады Iguazú — 275 каскадов на границе Аргентины и Бразилии, объект UNESCO. Аргентинская сторона (Iguazú National Park) — панорамные тропы над водой и Garganta del Diablo; бразильская — общий вид «лица» водопада. База Puerto Iguazú — спокойный город с ресторанами, Hito Tres Fronteras и ночной жизнью. Рядом — jungle lodges и birdwatching в Atlantic Forest.",
    highlights: [
      "Garganta del Diablo",
      "Circuito Superior и Inferior",
      "Паром к San Martin",
      "Бразильская сторона (Foz)",
      "Jungle boat / speedboat",
      "Hito Tres Fronteras",
    ],
    bestSeason: "Март–май и август–октябрь — меньше дождей; декабрь–февраль — полноводье, но жарко",
    idealDuration: "2–3 дня",
    howToGetThere:
      "Прямые рейсы BA → Puerto Iguazú (IGR), ~2 ч. Из аэропорта 20–25 мин до Puerto Iguazú. Также рейсы из Mendoza и Córdoba с пересадкой.",
    travelTips: [
      "На 2 дня: день — аргентинская сторона, день — бразильская side. Для посещения бразильской стороны нужен загранпаспорт; виза гражданам РФ не нужна (безвиз до 90 дней). Уточняйте актуальные правила перед поездкой.",
      "Spray у Garganta — защита для камеры и лёгкая дождевка.",
      "Билеты в парк online; утро — меньше людей на Devil's Throat.",
      "Репеллент от комаров обязателен круглый год.",
    ],
  },
  mendoza: {
    regionGroup: "Анд и вино",
    intro:
      "Mendoza — столица аргентинского вина у подножия Aconcagua (6961 м). Регион Maipú и Luján de Cuyo — bodegas с дегустациями Malbec; Uco Valley — высокогорные виноградники и fine dining. Город зелёный, с plazas и acequias, удобен для велопрогулок между wineries. Рядом — Potrerillos, rafting на Mendoza River и зимний Aconcagua viewpoint.",
    highlights: [
      "Bodegas Maipú и Luján",
      "Uco Valley и высокогорные вина",
      "Aconcagua Provincial Park",
      "Potrerillos и горное озеро",
      "Оливковые fincas",
      "Гастрономия и asado",
    ],
    bestSeason: "Март–апрель — vendimia (сбор винограда); сентябрь–ноябрь — мягкая погода",
    idealDuration: "3–4 дня",
    howToGetThere:
      "Перелёт BA → Mendoza (MDZ), ~1,5 ч. Из аэропорта 15–20 мин до центра. Ночной автобус cama из BA — ~14 ч, популярен у бюджетных путешественников.",
    travelTips: [
      "Wine tours бронируйте заранее — в vendimia sold out за месяцы.",
      "Uco Valley — полный день, трансфер или аренда авто.",
      "С altitude в Uco пейте больше воды; SPF обязателен.",
      "Сиеста 13:00–17:00 — планируйте дегустации на утро/вечер.",
    ],
  },
  salta: {
    regionGroup: "Северо-Запад",
    intro:
      "Salta — «Salta la Linda»: колониальный центр и Cafayate (вина Torrontés); соседняя провинция Жужуй — Quebrada de Humahuaca, Purmamarca (UNESCO). Train to the Clouds (Tren a las Nubes) — одна из высочайших железных дорог мира (сезонный график).",
    highlights: [
      "Колониальный центр Salta",
      "Cafayate и винные bodegas",
      "Quebrada de Humahuaca (Жужуй, UNESCO)",
      "Purmamarca и Cerro de los Siete Colores",
      "Tren a las Nubes",
      "Peñas и folk music",
    ],
    bestSeason: "Апрель–июнь и сентябрь–ноябрь — сухо и +18…+25 °C; зима ночами прохладно",
    idealDuration: "4–5 дней",
    howToGetThere:
      "Перелёт BA → Salta (SLA), ~2 ч. Дальше — аренда авто или организованные туры в Quebrada и Cafayate (3–4 ч на машине).",
    travelTips: [
      "Высота Salta ~1200 м, Quebrada de Humahuaca (Жужуй) до 3000 м — выделите 1 день на акклиматизацию.",
      "Cafayate — ночёвка в bodega hotel или возврат в Salta.",
      "Tren a las Nubes — покупка билетов на официальном сайте, сезон апрель–ноябрь.",
      "На юге региона — сухой климат, вода и головной убор.",
    ],
  },
  patagonia: {
    regionGroup: "Патагония",
    intro:
      "Патагония — регион на юге Аргентины и Чили: ледники, степи, фьорды и ветреные горные хребты. В аргентинской части — Los Glaciares (Perito Moreno, Fitz Roy в El Chaltén), Torres del Paine (Chile, но часто в одном маршруте), Peninsula Valdés с китами и penguins. Это destination для экспедиционных туров: переменчивая погода, длинные переезды и сильные впечатления от природы.",
    highlights: [
      "Los Glaciares и Perito Moreno",
      "El Chaltén и Monte Fitz Roy",
      "Torres del Paine (Chile)",
      "Peninsula Valdés — киты",
      "Ruta 40 и степи",
      "Малые группы и треккинг",
    ],
    bestSeason: "Ноябрь–март — основной сезон; январь–февраль — пик и цены",
    idealDuration: "10–14 дней",
    howToGetThere:
      "Обычно комбинация перелётов: BA → El Calafate / Bariloche / Ushuaia + внутренние автобусы или domestic flights. Valdés — через Puerto Madryn (PMY).",
    travelTips: [
      "Планируйте буфер 1–2 дня на задержки из‑за ветра в Patagonia.",
      "Слои, непромокаемая обувь и windbreaker — базовый набор.",
      "Torres del Paine — бронируйте refugio/campsites за 6+ месяцев.",
      "Киты в Valdés — сезон июнь–декабрь (species vary).",
    ],
  },
};

export const DESTINATION_PAGES: DestinationPage[] = POPULAR_DESTINATIONS.map((dest) => {
  const content = DESTINATION_CONTENT[dest.id];
  if (!content) {
    return {
      ...dest,
      intro: dest.description,
      highlights: [dest.description],
      bestSeason: "Уточняйте при бронировании тура",
      idealDuration: "3–5 дней",
      howToGetThere: "Через Buenos Aires или внутренние рейсы Aerolíneas / FlyBondi / JetSMART.",
      travelTips: [],
      regionGroup: dest.region,
    };
  }
  return { ...dest, ...content };
});

export function getDestinationPageById(id: string): DestinationPage | undefined {
  return DESTINATION_PAGES.find((page) => page.id === id);
}

export const DESTINATION_REGION_GROUPS = [
  ...new Set(DESTINATION_PAGES.map((d) => d.regionGroup)),
];
