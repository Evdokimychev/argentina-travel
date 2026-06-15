export type EsimOffer = {
  id: string;
  title: string;
  description?: string;
  purchaseUrl: string;
  imageUrl?: string;
  price: number;
  salePrice?: number;
  currency: string;
  brand?: string;
  availability?: string;
  productType?: string;
  countrySlug?: string;
  mpn?: string;
  isBundle?: boolean;
  /** Parsed from feed — see offer-meta.ts */
  region?: string;
  area?: string;
  planType?: string;
  dataLabel?: string;
  dataGb?: number | null;
  isUnlimited?: boolean;
  validityDays?: number;
  planSlug?: string;
  pricePerDay?: number;
  inStock?: boolean;
  networkLabel?: string;
};

export type EsimCatalogSummary = {
  count: number;
  minPrice?: number;
  maxPrice?: number;
  currency: string;
  minDataGb?: number | null;
  maxDataGb?: number | null;
  hasUnlimited: boolean;
  validityRange?: { min?: number; max?: number };
  networks: string[];
  regions: string[];
};

export type EsimCatalogResult = {
  offers: EsimOffer[];
  source: "feed" | "unconfigured" | "error";
  error?: string;
  countrySlug?: string;
  summary?: EsimCatalogSummary;
};

export type EsimCountry = {
  id: string;
  slug: string;
  nameKey: string;
  keywords: string[];
};
