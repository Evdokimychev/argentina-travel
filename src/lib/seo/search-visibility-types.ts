export const SEARCH_VISIBILITY_PROVIDERS = [
  "google_search_console",
  "yandex_webmaster",
] as const;

export type SearchVisibilityProvider = (typeof SEARCH_VISIBILITY_PROVIDERS)[number];

export type SearchPerformanceInput = {
  provider: SearchVisibilityProvider;
  propertyUrl: string;
  metricDate: string;
  query: string;
  page: string;
  country: string;
  device: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type SearchProviderConnection = {
  provider: SearchVisibilityProvider;
  propertyUrl: string;
  credentialLabel: string | null;
  status: "configured" | "verified" | "error";
  lastVerifiedAt: string | null;
  lastSyncedAt: string | null;
  lastErrorCode: string | null;
};

export type SearchOpportunity = {
  kind: "near_top" | "low_ctr" | "protect_winner";
  query: string;
  page: string | null;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  recommendation: string;
};

export type SearchVisibilitySnapshot = {
  generatedAt: string;
  period: { from: string; to: string };
  connections: SearchProviderConnection[];
  totals: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number | null;
  };
  topQueries: Array<{
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  topPages: Array<{
    page: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  opportunities: SearchOpportunity[];
  dataStatus: "connected" | "awaiting_sync" | "not_connected";
};

export class SearchProviderError extends Error {
  constructor(
    readonly code:
      | "INVALID_CREDENTIAL"
      | "AUTH_FAILED"
      | "PROPERTY_NOT_FOUND"
      | "RATE_LIMITED"
      | "PROVIDER_UNAVAILABLE"
      | "INVALID_RESPONSE",
    message: string,
  ) {
    super(message);
  }
}

export function isSearchVisibilityProvider(value: unknown): value is SearchVisibilityProvider {
  return SEARCH_VISIBILITY_PROVIDERS.includes(value as SearchVisibilityProvider);
}
