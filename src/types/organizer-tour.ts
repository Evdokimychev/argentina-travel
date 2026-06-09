import type { TourCollection } from "@/data/tour-collections";
import type { OrganizerTourAccommodationPlace } from "@/data/tour-accommodation-defaults";
import type { TourPlace } from "@/types";
import type { CurrencyCode } from "@/types/locale";
import type { OrganizerTourDiscountType } from "@/data/tour-discount-defaults";
import type { OrganizerGroupTourDate } from "@/data/tour-booking-defaults";
import type { OrganizerProgramDay } from "@/data/tour-program-defaults";
import type { OrganizerTourFAQ, OrganizerTourInsuranceType } from "@/data/tour-terms-defaults";
import type { OrganizerArrivalDepartureCity } from "@/data/tour-logistics-defaults";
import type {
  AccommodationType,
  ActivityType,
  ComfortLevel,
  DifficultyLevel,
  TourBookingMode,
  TourLanguage,
} from "@/types";

export type OrganizerTourType = "tour" | "excursion";
export type OrganizerTourStatus = "published" | "draft";

export interface OrganizerTourListing {
  id: string;
  slug: string;
  title: string;
  image: string;
  coverLabel?: string;
  durationDays: number;
  type: OrganizerTourType;
  status: OrganizerTourStatus;
  archived: boolean;
  isPreliminaryProgram?: boolean;
  partnerName: string;
  partnerUrl?: string;
  updatedAt?: string;
}

export interface OrganizerTourGuide {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  isTourAuthor?: boolean;
  userId?: string | null;
}

export interface OrganizerTourDraft extends OrganizerTourListing {
  shortDescription: string;
  description: string;
  destination: string;
  region: string;
  country: string;
  startLocation: string;
  countries: string[];
  cities: string[];
  mainLocation: string;
  touristRegions: string[];
  landmarks: string[];
  mapStartPoint: string;
  durationNights: number;
  priceUsd: number;
  originalPriceUsd: number | null;
  priceCurrency: CurrencyCode;
  priceFromPrefix: boolean;
  enabledDiscounts: OrganizerTourDiscountType[];
  individualTourEnabled: boolean;
  individualPeriodFrom: string;
  individualPeriodTo: string;
  individualPriceUsd: number;
  autoRollGroupDatesToNextYear: boolean;
  groupTourDates: OrganizerGroupTourDate[];
  activityType: ActivityType;
  tourActivities: ActivityType[];
  collections: TourCollection[];
  difficultyLevel: DifficultyLevel;
  difficultyDescriptionText: string;
  comfortLevel: ComfortLevel;
  comfortLevels: ComfortLevel[];
  accommodationType: AccommodationType;
  accommodationDescriptionText: string;
  accommodationPhotos: string[];
  accommodationPlaces: OrganizerTourAccommodationPlace[];
  groupMin: number;
  groupMax: number;
  minimumAge: number;
  maximumAge: number | null;
  maxWeightKg: number | null;
  languages: TourLanguage[];
  includedText: string;
  excludedText: string;
  bookingMode: TourBookingMode;
  gallery: string[];
  places: TourPlace[];
  guides: OrganizerTourGuide[];
  routeMapImage: string;
  programDays: OrganizerProgramDay[];
  importantInfo: string[];
  faq: OrganizerTourFAQ[];
  packingListEnabled: boolean;
  packingListText: string;
  insuranceType: OrganizerTourInsuranceType;
  insuranceDescription: string;
  useCancellationTemplate: boolean;
  customCancellationText: string;
  ticketRecommendationsEnabled: boolean;
  ticketRecommendationsText: string;
  arrivalDepartureEnabled: boolean;
  arrivalDepartureCities: OrganizerArrivalDepartureCity[];
}

export const ORGANIZER_TOUR_TITLE_MAX = 120;

export const ORGANIZER_TOUR_EDITOR_TABS = [
  { id: "main", label: "Основное" },
  { id: "description", label: "Жильё и комфорт" },
  { id: "conditions", label: "Цены и даты" },
  { id: "program", label: "Программа" },
  { id: "terms", label: "Условия и FAQ" },
  { id: "publish", label: "Публикация" },
] as const;

export type OrganizerTourEditorTabId = (typeof ORGANIZER_TOUR_EDITOR_TABS)[number]["id"];

export const ORGANIZER_TOURS_UPDATED_EVENT = "organizer-tours-updated";
