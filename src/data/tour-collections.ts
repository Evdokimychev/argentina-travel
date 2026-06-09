export type TourCollection =
  | "Водные туры"
  | "Горные туры"
  | "Семейные путешествия"
  | "Винные и гастрономические"
  | "Дикая природа"
  | "Приключения"
  | "Культурные туры"
  | "Фото и природа";

export interface TourCollectionOption {
  label: TourCollection;
  keywords: string[];
}

/** Подборки каталога — используются в фильтрах и редакторе тура */
export const TOUR_COLLECTION_OPTIONS: TourCollectionOption[] = [
  {
    label: "Водные туры",
    keywords: ["водн", "сплав", "raft", "kayak", "каяк", "рафт", "река"],
  },
  {
    label: "Горные туры",
    keywords: ["гор", "trek", "трек", "поход", "альп"],
  },
  {
    label: "Семейные путешествия",
    keywords: ["семей", "дети", "family", "kids"],
  },
  {
    label: "Винные и гастрономические",
    keywords: ["вино", "wine", "еда", "гастро", "стейк", "bodega"],
  },
  {
    label: "Дикая природа",
    keywords: ["сафари", "пингвин", "кит", "wildlife", "animals"],
  },
  {
    label: "Приключения",
    keywords: ["экспед", "экстрим", "приключ", "expedition"],
  },
  {
    label: "Культурные туры",
    keywords: ["культур", "экскурс", "город", "музе"],
  },
  {
    label: "Фото и природа",
    keywords: ["фото", "photo", "пейзаж", "landscape"],
  },
];

export const TOUR_COLLECTIONS = TOUR_COLLECTION_OPTIONS.map((option) => option.label);
