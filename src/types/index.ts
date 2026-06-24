// Supabase-ready marketplace tour listing type
// Maps to `tours` table + related fields

import type { OrganizerProfessionalExperience } from "@/types/organizer-profile";
import type { GroupDiscountSettings } from "@/types/group-discount";
import type { TourAccommodation } from "@/types/tour-accommodation";
import type { TourCustomBookingLinkPublic } from "@/types/tour-custom-booking-link";

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
  /** Public profile URL segment — organizer account id. */
  slug?: string;
  ownerUserId?: string;
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
  /** Страна старта / основная локация (для партнёрских туров — из Tripster, не только Аргентина). */
  country?: string;
  activityType: ActivityType;
  durationDays: number;
  durationNights: number;
  durationBucket: DurationBucket;
  /** Organizer account id for catalog filtering and public profile links. */
  organizerOwnerId?: string;
  /** Base price in USD — convert on frontend */
  priceUsd: number;
  /** Strikethrough price when a discount is active */
  originalPriceUsd?: number;
  /** Нет фиксированной цены */
  priceOnRequest?: boolean;
  /** Показывать «от» перед ориентировочной ценой */
  priceFromPrefix?: boolean;
  /** Групповая скидка настроена организатором */
  groupDiscountEnabled?: boolean;
  /** Краткая подпись для карточки каталога */
  groupDiscountHint?: string;
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
  /** Партнёрский тур (Tripster / YouTravel) — не редактируется в кабинете организатора */
  partnerSource?: "tripster" | "youtravel";
  /** Отображение цены от Tripster, если валюта не USD */
  partnerPriceDisplay?: string;
  /** Числовая цена от Tripster в исходной валюте */
  partnerPriceValue?: number;
  partnerPriceCurrency?: string;
  /** Базовая цена до скидки Tripster (за человека или за тур) */
  partnerOriginalPriceValue?: number;
  /** За человека или за группу/тур */
  partnerPriceUnit?: "per_person" | "per_group";
  /** Мгновенная бронь (партнёрский тур) */
  partnerInstantBooking?: boolean;
  /** Гарантия проведения тура (партнёрский тур) */
  partnerTourGuaranteed?: boolean;
  /** Тематические метки для каталога (до 4) */
  partnerThematicTags?: string[];
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
  /** Filter by organizer public profile slug (account id). */
  organizerSlug: string;
  /** YouTravel partner tours with instant booking only. */
  instantBookingOnly: boolean;
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
  organizerSlug: "",
  instantBookingOnly: false,
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
  /** Фото локации для popup на карте маршрута */
  imageUrl?: string;
}

export interface TourFeature {
  title: string;
  description: string;
}

import type { TourDayActivity } from "@/types/tour-itinerary-activity";
import type { TourTravelRisk } from "@/types/tour-travel-risk";
import type { TourSectionOrganizerComments } from "@/types/tour-section-comments";

export type { TourDayActivity } from "@/types/tour-itinerary-activity";

export interface TourItineraryDay {
  id: string;
  dayNumber: number;
  title: string;
  description: string;
  /** HTML-описание дня (партнёрские туры Tripster) */
  descriptionHtml?: string;
  /** Точки маршрута дня (партнёрские туры YouTravel) */
  routeLocationNames?: string[];
  images: string[];
  activities: TourDayActivity[];
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
  difficulty: string;
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
  shortDescription?: string;
  extendedDescription?: string;
  /** Status line from organizer settings — shown on tour and profile pages. */
  statusText?: string;
  /** Public profile URL segment — organizer account id. */
  slug?: string;
  ownerUserId?: string;
  rating: number;
  /** Organizer-wide review count (Tripster guide profile for partner tours). */
  reviewCount?: number;
  tourCount: number;
  travelerCount: number;
  languages: string[];
  experienceYears: number;
  /** ISO date when organizer registered on the platform. */
  platformRegisteredAt?: string;
  /** Organizer-provided professional experience (settings). */
  professionalExperience?: OrganizerProfessionalExperience | null;
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
  /** Review from a verified booking / completed trip. */
  verifiedTrip?: boolean;
  /** Source of the review: platform DB, Tripster partner API, YouTravel, or static seed. */
  source?: "platform" | "tripster" | "youtravel" | "static";
  /** Organizer reply shown under the tourist review. */
  organizerReply?: string;
  /** ISO date when organizer published a reply. */
  organizerRepliedAt?: string;
}

export type {
  TourAccommodation,
  TourAccommodationAlternative,
  TourAccommodationRoomType,
  AccommodationDisplayMode,
} from "@/types/tour-accommodation";
export type {
  TourCustomBookingLink,
  TourCustomBookingLinkPublic,
} from "@/types/tour-custom-booking-link";

export interface TourArrivalInfo {
  airports: string[];
  flights: string[];
  transfers: string[];
  meetingPoint: string;
  finishPoint?: string;
  startTime?: string;
  finishTime?: string;
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
  /** Цена заезда от партнёра (если валюта не USD) */
  partnerPriceValue?: number;
  partnerPriceCurrency?: string;
  /** YouTravel: доля предоплаты в процентах (например, 15). */
  partnerPrepayPercent?: number;
  /** YouTravel: фиксированная сумма предоплаты в валюте партнёра. */
  partnerPrepayValue?: number;
  partnerPrepayCurrency?: string;
  /** Цена до скидки заезда (партнёр) */
  partnerOriginalPriceValue?: number;
  partnerOriginalPriceCurrency?: string;
  /** YouTravel: сколько человек уже записалось на этот заезд */
  travelersGoingCount?: number;
  /** YouTravel: размер группы на заезд (из оффера) */
  seatsTotal?: number;
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
  comfortLevels?: ComfortLevel[];
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
  /** Комментарий организатора в конце блока программы. */
  itineraryOrganizerComment?: string;
  /** Комментарий организатора в конце блока «Проживание». */
  accommodationOrganizerComment?: string;
  /** Комментарии организатора в конце секций страницы тура. */
  sectionOrganizerComments?: TourSectionOrganizerComments;
  /** Факторы маршрута, на которые стоит обратить внимание. */
  travelRisks?: TourTravelRisk[];
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
  groupDiscount?: GroupDiscountSettings;
  groupDiscountEnabled?: boolean;
  groupDiscountHint?: string;
  priceOnRequest?: boolean;
  priceFromPrefix?: boolean;
  /** Приватный тур — не показывается в каталоге без ?access= */
  isPrivate?: boolean;
  /** Лист ожидания при нехватке мест на выбранную дату. */
  waitlistEnabled?: boolean;
  /** Разрешить выбор типа номера при бронировании. */
  accommodationUpgradesEnabled?: boolean;
  /** Внешняя ссылка на бронирование вместо checkout. */
  customBookingLink?: TourCustomBookingLinkPublic;
  /** Партнёрский тур Tripster */
  partnerSource?: "tripster" | "youtravel";
  partnerExperienceId?: number;
  partnerPriceDisplay?: string;
  partnerPriceValue?: number;
  partnerPriceCurrency?: string;
  partnerOriginalPriceValue?: number;
  partnerPriceUnit?: "per_person" | "per_group";
  /** Контент партнёрского тура Tripster (HTML-блоки, условия) */
  partnerContent?: import("@/lib/tripster/partner-tour-content").PartnerTourContent;
  /** Тематические метки партнёрского тура (основная — первая) */
  partnerThematicTags?: string[];
  /** Профиль гида Tripster (обогащение с API) */
  partnerGuideProfile?: import("@/types/excursion").ExcursionGuideProfile;
  /** Отзывы гида с других туров Tripster, если у текущего тура отзывов нет */
  partnerGuideReviews?: TourReview[];
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

export type BlogCardVariant = "featured" | "standard" | "compact";

export type BlogRelatedResource = {
  label: string;
  href: string;
  type: "guide" | "immigration" | "tour" | "blog";
  description?: string;
};

export interface BlogPostSection {
  title: string;
  body: string;
  /** CMS hint: faq, mistakes, checklist — overrides title heuristics when set */
  blockType?: import("@/types/blog-content-blocks").BlogSectionKind;
  /** Typed blocks (map, ticket-link, seasons, budget) — rendered after parsed body */
  blocks?: import("@/types/blog-content-blocks").BlogBodyBlock[];
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  seoTitle?: string;
  excerpt: string;
  content: string;
  sections?: BlogPostSection[];
  author: string;
  authorBio?: string;
  authorAvatar?: string;
  date: string;
  /** Дата последней фактической правки (JSON-LD, карточки) */
  dateModified?: string;
  image: string;
  category: string;
  /** @deprecated Prefer readTimeMinutes + formatBlogReadTime */
  readTime: string;
  readTimeMinutes: number;
  tags: string[];
  featured?: boolean;
  cardVariant?: BlogCardVariant;
  /** Статья прошла полную ручную редакцию */
  editorialReviewed?: boolean;
  /** Шаблонная авто-статья — не индексировать до переработки (класс B) */
  noIndex?: boolean;
  /** Канонический slug для дубликата Класса B → pillar */
  canonicalSlug?: string;
  relatedResources?: BlogRelatedResource[];
  /** Идентификаторы направлений (см. POPULAR_DESTINATIONS) для галереи */
  relatedDestinations?: string[];
  /** Встраиваемые виджеты туров в теле статьи */
  tourEmbeds?: import("@/types/tour-embed").TourEmbedConfig[];
  /** Идентификатор богатой редакторской вёрстки (см. data/blog-articles) */
  richArticleId?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  text: string;
  rating: number;
  tourSlug?: string;
  tourTitle?: string;
  verifiedTrip?: boolean;
}

export interface Destination {
  id: string;
  name: string;
  region: string;
  description: string;
  image: string;
  imageAlt?: string;
  gallery?: string[];
  keywords: string[];
}
