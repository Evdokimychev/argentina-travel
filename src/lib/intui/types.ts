import type { CurrencyCode, LocaleCode } from "@/types/locale";

export type TransferLocationType = "airport" | "point";

export type TransferLocation = {
  id: string;
  name: string;
  type: TransferLocationType;
  code?: string;
  lat?: number;
  lng?: number;
  countryName?: string;
};

export type TransferSearchParams = {
  origin: TransferLocation;
  destination: TransferLocation;
  date: string;
  time: string;
  adults: number;
  children: number;
  infants: number;
  lang: LocaleCode;
  currency: CurrencyCode;
};

export type TransferOffer = {
  id: string;
  vehicleName: string;
  vehicleClass?: string;
  price: number;
  currency: string;
  capacity?: number;
  luggage?: number;
  durationMinutes?: number;
  features: string[];
  imageUrl?: string;
  bookPath?: string;
  raw?: Record<string, unknown>;
};

export type TransferSearchResult = {
  offers: TransferOffer[];
  source: "intui" | "unconfigured" | "error";
  error?: string;
  /** Partner search URL when native Intui API is unavailable */
  affiliateUrl?: string;
};

export type IntuiApiStatus = "authorization_error" | "wrong_params" | "err_url" | string;
