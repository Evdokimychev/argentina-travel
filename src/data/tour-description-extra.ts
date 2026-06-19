import { TourDescriptionExtra, TourDetail } from "@/types";

const patagoniaExtra: TourDescriptionExtra = {
  difficulty: "",
  seasonality:
    "Лучшее время — с октября по апрель (южное лето). Пик сезона: декабрь–февраль. Ветрено круглый год, температура +5…+18 °C. Зимой (июнь–август) часть маршрутов может быть ограничена погодой.",
  packing: [
    "Непромокаемая и ветрозащитная куртка",
    "Трекинговая обувь с хорошей подошвой",
    "Солнцезащитные очки и крем SPF 50+",
    "Power bank — розетки не на всех участках",
    "Тёплые слои: флис, шапка, перчатки",
    "Рюкзак 20–30 л для однодневных треков",
  ],
  flights:
    "Международный перелёт до Buenos Aires Ezeiza (EZE). Внутренний рейс EZE → El Calafate (FTE) включён в стоимость тура. Рекомендуем прилетать за день до начала программы.",
  meals:
    "Завтраки и обеды включены. Ужины — самостоятельно, кроме дней в lodge. В дни треккинга — ланч-бокс. Учитывайте, что в отдалённых районах выбор ограничен.",
  comfort:
    "Проживание в отелях 4* и lodge у парка. Номера с удобствами, Wi-Fi в отелях (в lodge может быть слабый сигнал). Дороги асфальт и грунт, переезды 2–6 часов.",
  transfers:
    "Все трансферы по программе включены: аэропорт → отель, между городами, в национальные парки. Групповой микроавтобус или минивэн, место встречи — аэропорт Ezeiza с табличкой ArgentinaTravel.",
};

const slugExtras: Record<string, TourDescriptionExtra> = {
  "patagonia-glaciers": patagoniaExtra,
};

function buildDefaultExtra(tour: TourDetail): TourDescriptionExtra {
  const mealItems = tour.included.filter((item) =>
    /завтрак|обед|ужин|питан|ланч/i.test(item)
  );

  return {
    difficulty: "",
    seasonality: `Оптимальный сезон для региона «${tour.region}» уточняйте при бронировании. Погода может меняться — возьмите слои одежды.`,
    packing: tour.organizerComment.recommendations.length
      ? [...tour.organizerComment.recommendations]
      : tour.importantInfo.slice(0, 4),
    flights: [
      tour.arrival.meetingPoint,
      ...tour.arrival.flights,
      ...tour.arrival.airports.map((a) => `Аэропорт: ${a}`),
    ].join(". "),
    meals:
      mealItems.length > 0
        ? mealItems.join(". ") + "."
        : "Детали питания указаны в программе тура и блоке «Что включено».",
    comfort: tour.accommodationType === "Без проживания"
      ? "Однодневная программа без ночёвки. Комфортный транспорт и сопровождение гида."
      : `Уровень комфорта: ${tour.comfort}. ${tour.accommodations[0]?.description ?? "Размещение по программе тура."}`,
    transfers: tour.arrival.transfers.join(". ") + ".",
  };
}

export function getTourDescriptionExtra(tour: TourDetail): TourDescriptionExtra {
  return tour.descriptionExtra ?? slugExtras[tour.slug] ?? buildDefaultExtra(tour);
}

export const DESCRIPTION_EXTRA_TABS = [
  { id: "difficulty", label: "Сложность" },
  { id: "seasonality", label: "Сезонность" },
  { id: "packing", label: "Что взять" },
  { id: "flights", label: "Перелёт" },
  { id: "meals", label: "Питание" },
  { id: "comfort", label: "Комфорт в поездке" },
  { id: "transfers", label: "Трансферы" },
] as const;

export type DescriptionExtraTabId = (typeof DESCRIPTION_EXTRA_TABS)[number]["id"];
