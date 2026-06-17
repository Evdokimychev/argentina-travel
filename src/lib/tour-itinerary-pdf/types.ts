import type {
  TourArrivalInfo,
  TourDetail,
  TourItineraryDay,
  TourOrganizerDetail,
  TourPlace,
} from "@/types";

export interface TourItineraryPdfSource {
  slug: string;
  title: string;
  region: string;
  country: string;
  durationDays: number;
  durationNights: number;
  priceUsd: number;
  originalPriceUsd?: number;
  priceOnRequest?: boolean;
  priceFromPrefix?: boolean;
  image: string;
  gallery: string[];
  shortDescription: string;
  difficulty: string;
  comfort: string;
  groupMin: number;
  groupMax: number;
  minimumAge?: number;
  startLocation?: string;
  itinerary: TourItineraryDay[];
  included: string[];
  excluded: string[];
  arrival: TourArrivalInfo;
  importantInfo: string[];
  organizer: Pick<TourOrganizerDetail, "name" | "phone" | "email">;
  places: Pick<TourPlace, "title" | "description">[];
}

export interface TourItineraryPdfMeta {
  documentId: string;
  generatedAt: Date;
  tourUrl: string;
  brandName: string;
  brandDomain: string;
  brandUrl: string;
}

export function buildTourItineraryPdfSource(tour: TourDetail): TourItineraryPdfSource {
  return {
    slug: tour.slug,
    title: tour.title,
    region: tour.region,
    country: tour.country,
    durationDays: tour.durationDays,
    durationNights: tour.durationNights,
    priceUsd: tour.priceUsd,
    originalPriceUsd: tour.originalPriceUsd,
    priceOnRequest: tour.priceOnRequest,
    priceFromPrefix: tour.priceFromPrefix,
    image: tour.image,
    gallery: tour.gallery ?? [],
    shortDescription: tour.shortDescription,
    difficulty: tour.difficulty,
    comfort: tour.comfort,
    groupMin: tour.groupMin,
    groupMax: tour.groupMax,
    minimumAge: tour.minimumAge,
    startLocation: tour.startLocation,
    itinerary: tour.itinerary ?? [],
    included: tour.included ?? [],
    excluded: tour.excluded ?? [],
    arrival: tour.arrival,
    importantInfo: tour.importantInfo ?? [],
    organizer: {
      name: tour.organizer.name,
      phone: tour.organizer.phone,
      email: tour.organizer.email,
    },
    places: (tour.places ?? []).map((place) => ({
      title: place.title,
      description: place.description,
    })),
  };
}
