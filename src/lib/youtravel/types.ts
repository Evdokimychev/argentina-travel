/** Raw tour object from YouTravel partner API — fields vary; keep optional. */
export type YouTravelTour = {
  id?: number | string;
  externalId?: number | string;
  slug?: string;
  url?: string;
  title?: string;
  name?: string;
  subtitle?: string;
  shortDescription?: string;
  description?: string;
  /** Full plain-text description from public JSON-LD (may include highlight list). */
  public_description?: string;
  /** Activity/comfort/allocation snippets scraped from the public tour page. */
  public_page_extras?: {
    activityComment?: string;
    activityDescription?: string;
    activityLabel?: string;
    comfortDescription?: string;
    accommodationPhotos?: string[];
    /** Full intro paragraphs + highlight list from the public tour page. */
    descriptionHtml?: string;
    schemaDescription?: string;
    importantToKnowItems?: Array<{ title: string; html: string }>;
    arrivalInfo?: {
      start: { label: string; date: string; city: string };
      finish: { label: string; date: string; city: string };
    };
    reviews?: YouTravelReview[];
  };
  /** Activity block scraped from public tour page (legacy flat fields). */
  public_activity_description?: string;
  public_activity_comment?: string;
  public_activity_label?: string;
  activity?: number;
  activity_data?: YouTravelActivityData;
  comfort_data?: YouTravelComfortData;
  type_allocation?: string;
  type_accommodation?: Array<string | { id?: string | number; name?: string }>;
  age_from?: number;
  age_to?: number;
  ageFrom?: number;
  ageTo?: number;
  annotation?: string;
  country?: string | { name?: string; nameRu?: string; slug?: string };
  region?: string | { name?: string; nameRu?: string };
  city?: string | { name?: string; nameRu?: string; slug?: string };
  start_point_city?: string | { name?: string; nameRu?: string };
  finish_point_city?: string | { name?: string; nameRu?: string };
  destination?: string;
  duration?: number;
  durationDays?: number;
  durationNights?: number;
  price?: number;
  priceFrom?: number;
  minPrice?: number;
  currency?: string;
  rating?: number;
  reviewCount?: number;
  reviewsCount?: number;
  coverImage?: string;
  image?: string;
  previewImage?: string;
  photos?: Array<string | { url?: string; src?: string; medium?: string; host?: string }>;
  gallery?: Array<string | { url?: string; src?: string; medium?: string; host?: string }>;
  preview_text?: string;
  previewText?: string;
  countries?: string[];
  regions?: string[];
  expert_data?: YouTravelExpert;
  photo_allocation?: Array<string | { url?: string; src?: string; medium?: string; host?: string }>;
  preview_image?: string;
  included?: string[] | string;
  not_included?: string[] | string;
  notIncluded?: string[] | string;
  days?: YouTravelProgramDay[];
  activityType?: string;
  main_type?: string;
  types?: Array<string | { title?: string; main?: boolean }>;
  tags?: string[];
  demands?: string;
  visa_info?: string;
  custom_cancellation?: string;
  customCancellation?: string;
  type?: string;
  languages?: string[];
  groupSizeMin?: number;
  groupSizeMax?: number;
  latitude?: number;
  longitude?: number;
  expert?: YouTravelExpert;
  organizer?: YouTravelExpert;
  travelExpert?: YouTravelExpert;
  program?: YouTravelProgramDay[];
  itinerary?: YouTravelProgramDay[];
  importantInfo?: string[] | string;
  status?: string;
  isPublished?: boolean;
  updatedAt?: string;
  instant_booking?: boolean;
  instantBooking?: boolean;
  is_instant?: boolean;
  guarantee?: boolean;
  is_guarantee?: boolean;
  isGuarantee?: boolean;
  tour_guaranteed?: boolean;
  tourGuaranteed?: boolean;
  serp?: {
    link?: string;
    instant_booking?: boolean;
    instantBooking?: boolean;
    is_instant?: boolean;
    guarantee?: boolean;
    is_guarantee?: boolean;
    tour_guaranteed?: boolean;
    [key: string]: unknown;
  };
  reviews?: YouTravelReview[];
  reviews_list?: YouTravelReview[];
  tour_reviews?: YouTravelReview[];
  cached_reviews?: YouTravelReview[];
  [key: string]: unknown;
};

export type YouTravelReview = {
  id?: number | string;
  rating?: number;
  rate?: number;
  score?: number;
  stars?: number;
  name?: string;
  only_name?: string;
  author_name?: string;
  authorName?: string;
  text?: string;
  review_text?: string;
  reviewText?: string;
  content?: string;
  comment?: string;
  message?: string;
  html?: string;
  description?: string;
  created_at?: string;
  createdAt?: string;
  date?: string;
  display_date?: string;
  published_at?: string;
  publishedAt?: string;
  trip_date?: string;
  tripDate?: string;
  event_date?: string;
  eventDate?: string;
  avatar?: string | { src?: string; url?: string; host?: string };
  photo?: string | { src?: string; url?: string; host?: string };
  photos?: Array<
    | string
    | {
        src?: string;
        url?: string;
        host?: string;
        medium?: string;
        AllocationSrc?: string;
        AllocationPreviewSrc?: string;
        AllocationThumbSrc?: string;
      }
  >;
  images?: Array<string | { src?: string; url?: string; host?: string; medium?: string }>;
  gallery?: Array<string | { src?: string; url?: string; host?: string; medium?: string }>;
  user?: { name?: string; fullName?: string; username?: string; avatar?: unknown; photo?: unknown };
  author?: { name?: string; fullName?: string; avatar?: unknown; photo?: unknown };
  traveler?: { name?: string; fullName?: string; avatar?: unknown; photo?: unknown };
  reply?: string;
  organizer_reply?: string;
  expert_reply?: string;
  reply_at?: string;
  replyAt?: string;
  organizer_replied_at?: string;
  [key: string]: unknown;
};

export type YouTravelActivityData = {
  level?: number;
  title?: string;
  description?: string;
  title_select?: string;
};

export type YouTravelComfortData = {
  level?: number;
  title?: string;
  description?: string;
};

export type YouTravelExpert = {
  id?: number | string;
  name?: string;
  fullName?: string;
  slug?: string;
  link?: string;
  avatar?: string | { src?: string; url?: string; host?: string };
  photo?: string | { src?: string; url?: string; host?: string };
  rating?: number;
  reviewCount?: number;
  tours_count?: number;
  count_reviews?: number | string;
  rating_expert?: number | string;
  personal_notes?: string;
  guide_since?: string;
  registered_at?: string;
};

export type YouTravelLocationData = {
  name?: string;
  cord_x?: number | string;
  cord_y?: number | string;
  location_id?: number | string;
  external_id?: number | string;
};

export type YouTravelProgramDay = {
  day?: number;
  dayNumber?: number;
  title?: string;
  name?: string;
  description?: string;
  text?: string;
  content?: string;
  locations_data?: YouTravelLocationData[];
  locationsData?: YouTravelLocationData[];
  photo?: Array<string | { url?: string; src?: string; medium?: string; thumbnail?: string; host?: string }>;
  photos?: Array<string | { url?: string; src?: string; medium?: string; thumbnail?: string; host?: string }>;
  images?: Array<string | { url?: string; src?: string; medium?: string; thumbnail?: string; host?: string }>;
  gallery?: Array<string | { url?: string; src?: string; medium?: string; thumbnail?: string; host?: string }>;
};

/** Tour departure / offer (зaezd). */
export type YouTravelOffer = {
  id?: number | string;
  tourId?: number | string;
  startDate?: string;
  endDate?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  price?: number;
  priceFrom?: number;
  priceValue?: number;
  priceDiscountValue?: number;
  currency?: string;
  seatsTotal?: number;
  seatsAvailable?: number;
  placesLeft?: number;
  freeSpaces?: number;
  max_group_size?: number;
  link?: string;
  partner_link?: string;
  partnerLink?: string;
  url?: string;
  status?: string;
  [key: string]: unknown;
};

export type YouTravelListParams = {
  take: number;
  skip?: number;
};

export type YouTravelApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  items?: T;
  tours?: T;
  offers?: T;
  reviews?: T;
  total?: number;
  count?: number;
  message?: string;
  error?: string;
};
