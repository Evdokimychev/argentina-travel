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

export type ExcursionGuideProfile = ExcursionGuide & {
  rating?: number;
  reviewCount?: number;
  cityName?: string;
  countryName?: string;
  isLicensed?: boolean;
  guideSince?: string;
  responseTimeLabel?: string;
  excursionCount?: number;
  description?: string;
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

export type ExcursionPriceUnit = "per_person" | "per_excursion";

export type ExcursionFormatKind = "group" | "individual";

export type ExcursionPartner = "tripster" | "sputnik8";

export type ExcursionListing = {
  partner: ExcursionPartner;
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
  priceFrom?: boolean;
  priceUnit?: ExcursionPriceUnit;
  durationMinutes?: number;
  format?: string;
  formatKind?: ExcursionFormatKind;
  guide?: ExcursionGuide;
};

export type ExcursionDetail = Omit<ExcursionListing, "guide"> & {
  annotation?: string;
  description?: string;
  photos: ExcursionPhoto[];
  /** @deprecated Use partnerUrl — kept for Tripster backward compatibility */
  tripsterUrl: string;
  partnerUrl: string;
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
  guide?: ExcursionGuideProfile;
  descriptionBlocks: ExcursionDescriptionBlock[];
  ticketOptions: ExcursionTicketOption[];
  tags: ExcursionTag[];
  placesToSee?: string;
  languages?: string[];
  payTypeInText?: string;
  minimumBookPeriod?: string;
  reviews?: ExcursionReview[];
};

export type ExcursionReview = {
  id: number;
  rating?: number;
  authorName?: string;
  authorAvatar?: string;
  text?: string;
  createdAt?: string;
  tripDate?: string;
  photos?: string[];
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
