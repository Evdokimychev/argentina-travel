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
  annotation?: string;
  country?: string | { name?: string; nameRu?: string; slug?: string };
  region?: string | { name?: string; nameRu?: string };
  city?: string | { name?: string; nameRu?: string; slug?: string };
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
  photos?: Array<string | { url?: string; src?: string; medium?: string }>;
  gallery?: string[];
  activityType?: string;
  type?: string;
  tags?: string[];
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
  included?: string[] | string;
  notIncluded?: string[] | string;
  importantInfo?: string[] | string;
  status?: string;
  isPublished?: boolean;
  updatedAt?: string;
  [key: string]: unknown;
};

export type YouTravelExpert = {
  id?: number | string;
  name?: string;
  fullName?: string;
  slug?: string;
  avatar?: string;
  photo?: string;
  rating?: number;
  reviewCount?: number;
};

export type YouTravelProgramDay = {
  day?: number;
  dayNumber?: number;
  title?: string;
  name?: string;
  description?: string;
  text?: string;
  content?: string;
};

/** Tour departure / offer (зaezd). */
export type YouTravelOffer = {
  id?: number | string;
  tourId?: number | string;
  startDate?: string;
  endDate?: string;
  date?: string;
  price?: number;
  priceFrom?: number;
  currency?: string;
  seatsTotal?: number;
  seatsAvailable?: number;
  placesLeft?: number;
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
  total?: number;
  count?: number;
  message?: string;
  error?: string;
};
