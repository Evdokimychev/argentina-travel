export type AviasalesPlaceType = "city" | "airport" | "country";

export type AviasalesPlace = {
  code: string;
  name: string;
  type: AviasalesPlaceType;
  countryName?: string;
  countryCode?: string;
  cityName?: string;
  cityCode?: string;
};

export type FlightTripType = "one_way" | "round_trip";

export type FlightSearchParams = {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  adults: number;
  children: number;
  infants: number;
  tripType: FlightTripType;
};

export type FlightPriceOffer = {
  id: string;
  origin: string;
  destination: string;
  departureAt: string;
  returnAt?: string;
  price: number;
  currency: string;
  airline?: string;
  flightNumber?: string;
  transfers: number;
  durationMinutes?: number;
  /** Relative or absolute Aviasales search path for affiliate redirect */
  ticketPath?: string;
};

export type AviasalesMarketConfig = {
  market: string;
  locale: string;
  host: string;
  currency: string;
};
