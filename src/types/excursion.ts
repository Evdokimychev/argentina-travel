export type ExcursionPhoto = {
  thumbnail?: string;
  medium?: string;
  type?: string;
};

export type ExcursionDescriptionBlock = {
  title: string;
  html: string;
};

export type ExcursionGuide = {
  id: number;
  name: string;
  url?: string;
  avatar?: string;
};

export type ExcursionLocationPoint = {
  text: string;
};

export type ExcursionTicketOption = {
  id: number;
  title: string;
  isDefault?: boolean;
  value?: number;
};

export type ExcursionTag = {
  id: number;
  name: string;
  url?: string;
};

export type ExcursionListing = {
  id: number;
  slug: string;
  title: string;
  tagline?: string;
  cityId: number;
  citySlug: string;
  cityName: string;
  coverImage?: string;
  rating?: number;
  reviewCount: number;
  priceValue?: number;
  priceCurrency?: string;
  priceDisplay?: string;
  durationMinutes?: number;
  format?: string;
};

export type ExcursionDetail = ExcursionListing & {
  annotation?: string;
  description?: string;
  photos: ExcursionPhoto[];
  tripsterUrl: string;
  bookingHref: string;
  experienceType?: string;
  maxPersons?: number;
  childFriendly?: boolean;
  instantBooking?: boolean;
  isBookable?: boolean;
  movementType?: string;
  visitorsCount?: number;
  comfortLevelInfo?: string;
  priceIncluded?: string;
  priceExcluded?: string;
  priceDescription?: string;
  meetingPoint?: ExcursionLocationPoint;
  finishPoint?: ExcursionLocationPoint;
  guide?: ExcursionGuide;
  descriptionBlocks: ExcursionDescriptionBlock[];
  ticketOptions: ExcursionTicketOption[];
  tags: ExcursionTag[];
  reviews?: ExcursionReview[];
};

export type ExcursionReview = {
  id: number;
  rating?: number;
  authorName?: string;
  text?: string;
  createdAt?: string;
};

export type ExcursionCity = {
  id: number;
  slug: string;
  name: string;
  experienceCount: number;
  coverImage?: string;
};

export type ExcursionListFilters = {
  citySlug?: string;
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "popular" | "rating" | "price_asc" | "price_desc";
  page?: number;
  pageSize?: number;
};

export type ExcursionListResult = {
  items: ExcursionListing[];
  total: number;
  page: number;
  pageSize: number;
  cities: ExcursionCity[];
};
