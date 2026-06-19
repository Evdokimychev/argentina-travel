export type TripPrepCategory =
  | "documents"
  | "connectivity"
  | "money"
  | "health"
  | "luggage"
  | "transfer"
  | "organizer";

export type TripPrepTourType = "default" | "group" | "individual" | "partner";

export type TripPrepReminderKind = "7d" | "3d" | "1d";

export interface TripPrepItemView {
  id: string;
  category: TripPrepCategory;
  title: string;
  description?: string | null;
  sortOrder: number;
  required: boolean;
  checked: boolean;
  checkedAt?: string | null;
}

export interface TripPrepCategoryGroup {
  category: TripPrepCategory;
  label: string;
  items: TripPrepItemView[];
}

export interface TripPrepSummary {
  total: number;
  checked: number;
  requiredTotal: number;
  requiredChecked: number;
  percent: number;
  isComplete: boolean;
}

export interface TripPrepChecklistResponse {
  bookingId: string;
  startDate: string | null;
  tourTitle: string;
  template: {
    id: string;
    name: string;
    tourType: TripPrepTourType;
  };
  categories: TripPrepCategoryGroup[];
  summary: TripPrepSummary;
}

export interface TripPrepTemplateView {
  id: string;
  name: string;
  tourType: TripPrepTourType;
  isDefault: boolean;
  items: Omit<TripPrepItemView, "checked" | "checkedAt">[];
  createdAt: string;
  updatedAt: string;
}

export interface OrganizerTripPrepSummary {
  bookingId: string;
  percentComplete: number;
  itemsTotal: number;
  itemsChecked: number;
  requiredTotal: number;
  requiredChecked: number;
  isComplete: boolean;
  hasProgress: boolean;
}

export const TRIP_PREP_CATEGORY_LABELS: Record<TripPrepCategory, string> = {
  documents: "Документы",
  connectivity: "Связь",
  money: "Деньги",
  health: "Здоровье",
  luggage: "Багаж",
  transfer: "Трансфер",
  organizer: "Контакты организатора",
};

export const TRIP_PREP_TOUR_TYPE_LABELS: Record<TripPrepTourType, string> = {
  default: "Стандартный",
  group: "Групповой тур",
  individual: "Индивидуальный тур",
  partner: "Партнёрский тур",
};

export const TRIP_PREP_PROGRESS_STORAGE_KEY = "argentina-travel-trip-prep-progress";
