// Supabase-ready marketplace tour listing type
// Maps to `tours` table + related fields

export type TourBadge = "hot" | "new" | "hit" | "family" | "expedition";

export type ActivityType =
  | "Экскурсионные туры"
  | "Пешие туры"
  | "Треккинг"
  | "Походы"
  | "Альпинизм"
  | "Сафари"
  | "Наблюдение за китами"
  | "Наблюдение за пингвинами"
  | "Винные туры"
  | "Гастрономические туры"
  | "Автотуры"
  | "Джип-туры"
  | "Велотуры"
  | "Каякинг"
  | "Рафтинг"
  | "Верховая езда"
  | "Фототуры"
  | "Семейные путешествия"
  | "Экспедиции"
  | "Люкс-путешествия"
  | "Авторские туры";

export type AccommodationType =
  | "Без проживания"
  | "Хостел"
  | "Отель"
  | "Бутик-отель"
  | "Апартаменты"
  | "Глэмпинг"
  | "Палатка"
  | "Горный приют"
  | "Лодж"
  | "Круизная каюта";

export type DurationBucket = "1–2 дня" | "2–3 дня" | "4–7 дней" | "8–14 дней" | "15+ дней";

export type ComfortLevel =
  | "Без проживания"
  | "Базовый"
  | "Стандарт"
  | "Комфорт"
  | "Премиум"
  | "Люкс";

export type DifficultyLevel =
  | "Лёгкая"
  | "Умеренная"
  | "Средняя"
  | "Высокая"
  | "Экстремальная";

export type TourLanguage = "Русский" | "Испанский" | "Английский" | "Португальский";

export type ChildrenPolicy =
  | "Без ограничений"
  | "От 2 лет"
  | "От 5 лет"
  | "От 8 лет"
  | "От 12 лет"
  | "От 16 лет"
  | "Только взрослые";

export type GroupSizeBucket =
  | "Индивидуально"
  | "До 4 человек"
  | "До 8 человек"
  | "До 12 человек"
  | "До 20 человек"
  | "Более 20 человек";

/** Group departure vs individual / private booking */
export type TourFormat = "group" | "individual";

export interface TourDate {
  start: string; // ISO date
  end: string;
  spotsLeft: number;
}

/** How tour dates can be booked */
export type TourBookingMode = "scheduled" | "on_request" | "both";

export interface TourOrganizerPreview {
  name: string;
  avatar: string;
}

export interface TourListing {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  image: string;
  gallery: string[];

  // Filter fields (Supabase columns)
  destination: string;
  region: string;
  activityType: ActivityType;
  durationDays: number;
  durationNights: number;
  durationBucket: DurationBucket;
  /** Base price in USD — convert on frontend */
  priceUsd: number;
  /** Strikethrough price when a discount is active */
  originalPriceUsd?: number;
  /** Individual / custom-date booking available */
  bookingMode?: TourBookingMode;
  requestDateFrom?: string;
  requestDateTo?: string;
  bookingAdvantages?: string[];
  accommodationType: AccommodationType;
  comfortLevel: ComfortLevel;
  difficultyLevel: DifficultyLevel;
  language: TourLanguage[];
  childrenAllowed: ChildrenPolicy;
  minimumAge: number;
  groupSizeMin: number;
  groupSizeMax: number;
  groupSizeBucket: GroupSizeBucket;
  availableDates: TourDate[];

  // Geo for "near me"
  latitude: number;
  longitude: number;

  // Display
  rating: number;
  reviewCount: number;
  organizer: TourOrganizerPreview;
  badges: TourBadge[];
  isHot?: boolean;
  isNew?: boolean;
  isBestOfMonth?: boolean;
  featured?: boolean;
}

export interface TourFilters {
  query: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  activityTypes: ActivityType[];
  priceMin: number;
  priceMax: number;
  durationMin: number | null;
  durationMax: number | null;
  dayTripsOnly: boolean;
  durations: DurationBucket[];
  accommodations: AccommodationType[];
  comfortLevels: ComfortLevel[];
  difficultyLevels: DifficultyLevel[];
  languages: TourLanguage[];
  childrenPolicy: ChildrenPolicy | null;
  groupSizes: GroupSizeBucket[];
  tourFormats: TourFormat[];
  nearMe: boolean;
  userCoords: { lat: number; lng: number } | null;
}

export const DEFAULT_FILTERS: TourFilters = {
  query: "",
  dateFrom: null,
  dateTo: null,
  activityTypes: [],
  priceMin: 0,
  priceMax: 0,
  durationMin: null,
  durationMax: null,
  dayTripsOnly: false,
  durations: [],
  accommodations: [],
  comfortLevels: [],
  difficultyLevels: [],
  languages: [],
  childrenPolicy: null,
  groupSizes: [],
  tourFormats: [],
  nearMe: false,
  userCoords: null,
};

// --- Detail page types (unchanged subset) ---

export interface TourPlace {
  id: string;
  title: string;
  description: string;
  image: string;
  extendedScheduleEnabled?: boolean;
  extendedSchedule?: string;
}

export interface TourRoutePoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  dayNumber?: number;
}

export interface TourFeature {
  title: string;
  description: string;
}

export interface TourItineraryDay {
  id: string;
  dayNumber: number;
  title: string;
  description: string;
  images: string[];
  activities: string[];
  meals: string[];
  accommodation: string;
}

export interface RichTextBlock {
  type: "heading" | "paragraph" | "list" | "quote" | "image";
  content: string;
  items?: string[];
  image?: string;
  caption?: string;
}

export interface TourDescriptionExtra {
  seasonality: string;
  packing: string[];
  flights: string;
  meals: string;
  comfort: string;
  transfers: string;
}

export interface TourOrganizerDetail {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  tourCount: number;
  travelerCount: number;
  languages: string[];
  experienceYears: number;
  phone: string;
  email: string;
}

export interface TourReview {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  tripDate: string;
  text: string;
  photos: string[];
}

export interface TourAccommodation {
  id: string;
  name: string;
  description: string;
  comfort: ComfortLevel;
  amenities: string[];
  images: string[];
}

export interface TourArrivalInfo {
  airports: string[];
  flights: string[];
  transfers: string[];
  meetingPoint: string;
}

export interface TourFAQ {
  id: string;
  question: string;
  answer: string;
}

export interface TourDatePrice {
  id: string;
  startDate: string;
  endDate: string;
  spotsLeft: number;
  /** Base price in USD for this departure */
  priceUsd: number;
}

export interface TourDetail {
  id: string;
  slug: string;
  title: string;
  country: string;
  region: string;
  durationDays: number;
  durationNights: number;
  /** Base price in USD */
  priceUsd: number;
  /** Strikethrough price when a discount is active */
  originalPriceUsd?: number;
  rating: number;
  reviewCount: number;
  gallery: string[];
  image: string;
  shortDescription: string;
  difficulty: DifficultyLevel;
  comfort: ComfortLevel;
  accommodationType?: AccommodationType;
  groupMin: number;
  groupMax: number;
  minimumAge?: number;
  startLocation?: string;
  bookingMode?: TourBookingMode;
  requestDateFrom?: string;
  requestDateTo?: string;
  bookingAdvantages?: string[];
  places: TourPlace[];
  routePoints?: TourRoutePoint[];
  descriptionBlocks: RichTextBlock[];
  descriptionExtra?: TourDescriptionExtra;
  itinerary: TourItineraryDay[];
  organizerComment: {
    greeting: string;
    recommendations: string[];
    routeNotes: string;
  };
  organizer: TourOrganizerDetail;
  reviews: TourReview[];
  accommodations: TourAccommodation[];
  included: string[];
  excluded: string[];
  arrival: TourArrivalInfo;
  importantInfo: string[];
  faq: TourFAQ[];
  dates: TourDatePrice[];
  tags: string[];
  featured?: boolean;
  checkoutPaymentOptions?: import("@/types/tour-checkout-payment").TourCheckoutPaymentOptions;
}

/** @deprecated Use TourListing for marketplace */
export interface Tour {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  region: string;
  duration: string;
  /** Base price in USD */
  priceUsd: number;
  image: string;
  gallery: string[];
  highlights: string[];
  included: string[];
  difficulty: string;
  groupSize: string;
  featured?: boolean;
  rating: number;
  reviewCount: number;
  tags: string[];
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  image: string;
  category: string;
  readTime: string;
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  text: string;
  rating: number;
}

export interface Destination {
  id: string;
  name: string;
  region: string;
  description: string;
  image: string;
  keywords: string[];
}
