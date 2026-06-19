/** Scopes for public API v1 keys. Wildcard grants all read scopes. */
export type PublicApiScope = "tours:read" | "excursions:read" | "*";

export type PublicApiKeyUsageStats = {
  requestsLast7d: number;
  topEndpoints: Array<{ endpoint: string; count: number }>;
};

export type PublicApiKeyRecord = {
  id: string;
  keyPrefix: string;
  label: string;
  partnerName: string | null;
  organizerId: string | null;
  scopes: PublicApiScope[];
  rateLimitPerMinute: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
};

export type PublicApiKeyWithUsage = PublicApiKeyRecord & {
  usage: PublicApiKeyUsageStats;
};

export type PublicApiPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PublicApiTourListing = {
  slug: string;
  title: string;
  shortDescription: string;
  image: string;
  destination: string;
  region: string;
  country?: string;
  activityType: string;
  durationDays: number;
  durationNights: number;
  priceUsd: number;
  originalPriceUsd?: number;
  priceOnRequest?: boolean;
  rating: number;
  reviewCount: number;
  organizer: {
    name: string;
    slug?: string;
    avatar: string;
  };
  badges: string[];
  isHot?: boolean;
  isNew?: boolean;
  isBestOfMonth?: boolean;
  url: string;
};

export type PublicApiExcursionListing = {
  slug: string;
  title: string;
  tagline?: string;
  citySlug: string;
  cityName: string;
  coverImage?: string;
  partner: string;
  rating?: number;
  reviewCount: number;
  priceValue?: number;
  priceCurrency?: string;
  priceDisplay?: string;
  durationMinutes?: number;
  format?: string;
  url: string;
};

export type PublicApiListResponse<T> = {
  data: T[];
  pagination: PublicApiPagination;
};
