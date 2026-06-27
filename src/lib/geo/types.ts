/** ISO 3166-1 alpha-2 codes used in the geo layer. */
export type GeoCountryCode =
  | "AR"
  | "BR"
  | "RU"
  | "TR"
  | "ES"
  | "IT"
  | "FR"
  | "GB"
  | "AE"
  | "US"
  | "CL"
  | "PE";

export type GeoLocationType = "city" | "macro_region" | "province" | "country";

export type GeoLocation = {
  id: string;
  slug: string;
  type: GeoLocationType;
  nameRu: string;
  provinceRu?: string;
  macroRegionRu?: string;
  countryCode: GeoCountryCode;
  countryRu: string;
  lat?: number;
  lng?: number;
  aliases: string[];
};

export type GeoAirport = {
  iata: string;
  icao?: string;
  nameRu: string;
  nameEn: string;
  nameEs: string;
  cityRu: string;
  countryCode: GeoCountryCode;
  countryRu: string;
  lat: number;
  lng: number;
  /** 1–100, higher = more prominent in pickers */
  popularity: number;
  /** Aviasales metro code (e.g. BUE for AEP+EZE) */
  metroCode?: string;
};

export type TourLocationInput = {
  destination?: string | null;
  region?: string | null;
  country?: string | null;
  cities?: string[] | null;
  mainLocation?: string | null;
  title?: string | null;
};

export type TourLocationWarning = {
  code: string;
  message: string;
};
