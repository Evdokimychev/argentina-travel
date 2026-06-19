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
      "Рейсы из Москвы в Ezeiza (EZE) — обычно с одной-двумя пересадками, ~18–22 ч в пути. Из аэропорта — такси/remis (~45–60 мин до центра) или автобус Tienda León. Внутренние рейсы — из Aeroparque (AEP).",
    travelTips: [
      "Обменивайте песо в официальных обменниках (cambio) или снимайте в банкомате — «синий» курс выгоднее уличного.",
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
      "El Calafate — компактный город на берегу Lago Argentino и главные ворота к леднику Perito Moreno в национальном парке Los Glaciares. Сюда приезжают за зрелищными обрушениями ледяных глыб (calving), ледниковыми трекингами (Mini-Trekking, Big Ice) и круизами к Upsala и Spegazzini. Город полностью туристический: рестораны с патагонской ягнятиной, музеи ледников и прокат снаряжения.",
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
      "Ushuaia — один из самых южных городов мира и главные ворота к Антарктиде на берегу канала Бигл (Beagle), окружённый хребтом Martial. Отсюда отправляются круизы в Антарктиду, экскурсии в национальный парк Tierra del Fuego и морские прогулки к островам с пингвинами и морскими львами. «Поезд на край света» (Tren del Fin del Mundo), треккинг к лагуне Эсмеральда и рыбалка — классика региона. Город компактный, с видом на порт и снежные вершины.",
    highlights: [
      "Национальный парк Tierra del Fuego",
      "«Поезд на край света»",
      "Канал Бигл и маяк",
      "Остров магеллановых пингвинов",
      "Лагуна Эсмеральда",
      "Круизы в Антарктиду (сезон)",
    ],
    bestSeason: "Ноябрь–март — +10…+15 °C, длинный день; декабрь–февраль — пик",
    idealDuration: "3–4 дня",
    howToGetThere:
      "Перелёт BA → Ushuaia (USH), ~3,5 ч. Из аэропорта 10 мин до центра. Часто комбинируют с Calafate (FTE→USH или автобус через Chile — сложнее).",
    travelTips: [
      "Погода непредсказуема — всегда ветровка и слои.",
      "Пингвин-тура бронируйте заранее; сезон октябрь–март.",
      "Круизы в Антарктиду отправляются с ноября по март, бронь за полгода.",
      "Национальный парк — такси или организованный трансфер.",
    ],
  },
  iguazu: {
    regionGroup: "Северо-Восток",
    intro:
      "Водопады Iguazú — около 275 каскадов на границе Аргентины и Бразилии, объект ЮНЕСКО. Аргентинская сторона (национальный парк Iguazú) — панорамные тропы над водой и Garganta del Diablo; бразильская — общий вид «лица» водопада. База Puerto Iguazú — спокойный город с ресторанами, монументом Hito Tres Fronteras и ночной жизнью. Рядом — эко-лоджи в джунглях и наблюдение за птицами в атлантическом лесу.",
    highlights: [
      "Garganta del Diablo",
      "Circuito Superior и Inferior",
      "Паром к San Martin",
      "Бразильская сторона (Foz)",
      "Прогулка на лодке к водопадам",
      "Hito Tres Fronteras",
    ],
    bestSeason: "Март–май и август–октябрь — меньше дождей; декабрь–февраль — полноводье, но жарко",
    idealDuration: "2–3 дня",
    howToGetThere:
      "Прямые рейсы BA → Puerto Iguazú (IGR), ~2 ч. Из аэропорта 20–25 мин до Puerto Iguazú. Также рейсы из Mendoza и Córdoba с пересадкой.",
    travelTips: [
      "На 2 дня: один день — аргентинская сторона, второй — бразильская. Для посещения бразильской стороны нужен загранпаспорт; визовые правила Бразилии для граждан РФ менялись — уточняйте актуальные требования перед поездкой.",
      "Брызги у «Глотки Дьявола» сильные — берите защиту для камеры и лёгкий дождевик.",
      "Билеты в парк — онлайн; утром меньше людей у «Глотки Дьявола».",
      "Репеллент от комаров обязателен круглый год.",
    ],
  },
  mendoza: {
    regionGroup: "Анд и вино",
    intro:
      "Mendoza — столица аргентинского вина у подножия Аконкагуа (6961 м). Регионы Maipú и Luján de Cuyo — винодельни с дегустациями мальбека; долина Уко (Uco Valley) — высокогорные виноградники и гастрономические рестораны. Город зелёный, с площадями и оросительными каналами (acequias), удобен для велопрогулок между винодельнями. Рядом — Potrerillos, рафтинг по реке Мендоса и смотровые площадки Аконкагуа.",
    highlights: [
      "Винодельни Maipú и Luján",
      "Долина Уко и высокогорные вина",
      "Провинциальный парк Аконкагуа",
      "Potrerillos и горное озеро",
      "Оливковые усадьбы",
      "Гастрономия и asado",
    ],
    bestSeason: "Март–апрель — vendimia (сбор винограда); сентябрь–ноябрь — мягкая погода",
    idealDuration: "3–4 дня",
    howToGetThere:
      "Перелёт BA → Mendoza (MDZ), ~1,5 ч. Из аэропорта 15–20 мин до центра. Ночной автобус cama из BA — ~14 ч, популярен у бюджетных путешественников.",
    travelTips: [
      "Винные туры бронируйте заранее — на время vendimia (сбор винограда) места разбирают за месяцы.",
      "Долина Уко — полный день, трансфер или аренда авто.",
      "На высоте в долине Уко пейте больше воды; солнцезащитный крем обязателен.",
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
      "Патагония — регион на юге Аргентины и Чили: ледники, степи, фьорды и ветреные горные хребты. В аргентинской части — Los Glaciares (Perito Moreno, Fitz Roy в El Chaltén), Torres del Paine (Чили, но часто в одном маршруте), полуостров Вальдес (Península Valdés) с китами и пингвинами. Это направление для экспедиционных туров: переменчивая погода, длинные переезды и сильные впечатления от природы.",
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
      "Обычно комбинация перелётов: BA → El Calafate / Bariloche / Ushuaia + внутренние автобусы или перелёты. Полуостров Вальдес — через Puerto Madryn (PMY).",
    travelTips: [
      "Планируйте буфер 1–2 дня на задержки из‑за ветра в Патагонии.",
      "Слои одежды, непромокаемая обувь и ветровка — базовый набор.",
      "Torres del Paine — бронируйте приюты и кемпинги за 6+ месяцев.",
      "Киты у полуострова Вальдес — сезон июнь–декабрь (виды зависят от месяца).",
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
