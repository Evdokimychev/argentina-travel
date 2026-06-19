export type WeGoTripCityRef = {
  id: number;
  name: string;
  slug: string;
};

export type WeGoTripCountryRef = {
  id: number;
  name: string;
  slug: string;
};

export type WeGoTripProductSummary = {
  id: number;
  title: string;
  slug: string;
  preview: string;
  cover?: string;
  price: number;
  currencySymbol: string;
  currencyCode: string;
  duration?: string;
  durationMin?: number;
  durationMax?: number;
  category?: string;
  rating: number | null;
  reviewsCount: number;
  city: WeGoTripCityRef;
  country?: WeGoTripCountryRef;
  tags?: Record<string, boolean>;
  authorName?: string;
};

export type WeGoTripProductDetail = WeGoTripProductSummary & {
  description: string;
  highlights: string[];
  distance?: string;
  address?: string;
  startLocation?: string;
  finishLocation?: string;
  inclusions: string[];
  exclusions: string[];
  importantInfo: string[];
  images: Array<{ id: number; preview: string; full: string; description?: string }>;
  tourEventsCount?: number;
};

export type WeGoTripSearchResult =
  | ({ type: "product" } & WeGoTripProductSummary)
  | {
      type: "city";
      id: number;
      name: string;
      slug: string;
      preview?: string;
      country?: WeGoTripCountryRef;
      available?: boolean;
    };

export type WeGoTripPaginated<T> = {
  count: number;
  pages: number;
  current: number;
  next: number | null;
  results: T[];
};

export type WeGoTripProductsResponse = {
  products: WeGoTripProductSummary[];
  pagination: Omit<WeGoTripPaginated<WeGoTripProductSummary>, "results">;
  source: "live" | "fallback";
};

export type WeGoTripProductDetailResponse = {
  product: WeGoTripProductDetail | null;
  source: "live" | "fallback";
};
