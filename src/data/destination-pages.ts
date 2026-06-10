import { POPULAR_DESTINATIONS } from "@/data/filters";
import type { Destination } from "@/types";

export type DestinationPage = Destination & {
  intro: string;
  highlights: string[];
  bestSeason?: string;
};

const DESTINATION_CONTENT: Record<
  string,
  Pick<DestinationPage, "intro" | "highlights" | "bestSeason">
> = {
  ba: {
    intro:
      "Буэнос-Айрес — культурная столица Аргентины: европейская архитектура, танго, кофейни и одна из сильнейших гастрономических сцен Латинской Америки. Идеальная база для коротких поездок и старта большого маршрута по стране.",
    highlights: ["San Telmo и La Boca", "Asado и parrilla", "Milonga и танго", "Recoleta и Puerto Madero"],
    bestSeason: "Круглый год; осень (март–май) особенно комфортна",
  },
  bariloche: {
    intro:
      "Барилоче на берегу озера Нахуэль-Уапи — ворота в озёрную Патагонию: горные тропы, лыжи зимой, шоколадные магазины и виды на Анды. Отсюда удобно строить маршруты в национальные парки региона.",
    highlights: ["Cerro Catedral", "Circuito Chico", "Озёра и треккинг", "Лыжный сезон"],
    bestSeason: "Декабрь–март для треккинга; июнь–сентябрь для лыж",
  },
  calafate: {
    intro:
      "Эль-Калафате — главная база для ледника Перито-Морено и ледниковых походов. Компактный туристический город на берегу Лаго Аргентино с развитой инфраструктурой для экспедиционных туров.",
    highlights: ["Перито-Морено", "Ледниковые трекинги", "Круизы по озеру", "Патагония ледников"],
    bestSeason: "Октябрь–апрель",
  },
  ushuaia: {
    intro:
      "Ушуайя — самый южный город мира и отправная точка в Антарктиду и национальный парк Tierra del Fuego. Морские прогулки, треккинг, пингвины и ощущение «края света».",
    highlights: ["Tierra del Fuego", "Пролив Бигля", "Круизы к пингвинам", "Поезд в конец света"],
    bestSeason: "Ноябрь–март",
  },
  iguazu: {
    intro:
      "Водопады Игуасу — одно из природных чудес мира на границе Аргентины и Бразилии. Джунгли Misiones, сотни каскадов и тропы с видами на Глотку Дьявола.",
    highlights: ["Национальный парк Iguazú", "Глотка Дьявола", "Экскурсии в джунглях", "Бордер-кросс"],
    bestSeason: "Март–май и сентябрь–ноябрь — меньше дождей",
  },
  mendoza: {
    intro:
      "Мендоса у подножия Анд — столица аргентинского вина: bodega, degustации, гастрономия и виды на Aconcagua. Отличное сочетание релакса и лёгких активностей.",
    highlights: ["Винодельни Maipú и Luján", "Aconcagua viewpoints", "Гастрономия", "Веломаршруты"],
    bestSeason: "Март–май (сбор винограда) и сентябрь–ноябрь",
  },
  salta: {
    intro:
      "Сальта и северо-запад — красные каньоны, виноградники высокогорья, колониальная архитектура и аутентичная культура. Train to the Clouds и Quebrada de Humahuaca — must-see региона.",
    highlights: ["Quebrada de Humahuaca", "Cafayate и вина", "Колониальный центр", "Высокогорье"],
    bestSeason: "Апрель–июнь и сентябрь–ноябрь",
  },
  patagonia: {
    intro:
      "Патагония — бескрайние просторы юга: ледники, фьорды, ветреные степи и горные маршруты. Регион для тех, кто готов к переменчивой погоде ради сильных впечатлений.",
    highlights: ["Ледники и треккинг", "El Chaltén и Fitz Roy", "Морская дикая природа", "Малые группы"],
    bestSeason: "Ноябрь–март — основной сезон",
  },
};

export const DESTINATION_PAGES: DestinationPage[] = POPULAR_DESTINATIONS.map((dest) => {
  const content = DESTINATION_CONTENT[dest.id];
  return {
    ...dest,
    intro: content?.intro ?? dest.description,
    highlights: content?.highlights ?? [dest.description],
    bestSeason: content?.bestSeason,
  };
});

export function getDestinationPageById(id: string): DestinationPage | undefined {
  return DESTINATION_PAGES.find((page) => page.id === id);
}
