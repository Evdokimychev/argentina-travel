import type { TourCollection } from "@/data/tour-collections";
import type { OrganizerTourAccommodationPlace } from "@/data/tour-accommodation-defaults";
import type { OrganizerGroupTourDate } from "@/data/tour-booking-defaults";
import type { OrganizerProgramDay } from "@/data/tour-program-defaults";
import type { OrganizerTourDiscountType } from "@/data/tour-discount-defaults";
import type { OrganizerArrivalDepartureCity } from "@/data/tour-logistics-defaults";
import type { OrganizerTourInsuranceType } from "@/data/tour-terms-defaults";
import type { CurrencyCode } from "@/types/locale";
import type {
  AccommodationType,
  ActivityType,
  ComfortLevel,
  DifficultyLevel,
  RichTextBlock,
  TourBadge,
  TourBookingMode,
  TourFAQ,
  TourLanguage,
  TourOrganizerDetail,
  TourOrganizerPreview,
  TourPlace,
  TourReview,
  TourRoutePoint,
} from "@/types";
import type { OrganizerTourGuide, OrganizerTourType } from "@/types/organizer-tour";
import type { TourCheckoutPaymentOptions } from "@/types/tour-checkout-payment";

export type TourStatus = "draft" | "published" | "archived" | "hidden" | "deleted";

export interface TourGeography {
  countries: string[];
  cities: string[];
  touristRegions: string[];
  landmarks: string[];
  mainLocation: string;
  startLocation: string;
  destination: string;
  region: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface TourPricing {
  basePriceUsd: number;
  originalPriceUsd?: number;
  currency: CurrencyCode;
  priceFromPrefix: boolean;
  enabledDiscounts: OrganizerTourDiscountType[];
}

export interface TourBooking {
  mode: TourBookingMode;
  groupDates: OrganizerGroupTourDate[];
  individual?: {
    enabled: boolean;
    periodFrom: string;
    periodTo: string;
    priceUsd: number;
  };
  advantages: string[];
  autoRollDatesToNextYear: boolean;
  checkoutPaymentOptions?: TourCheckoutPaymentOptions;
}

export interface TourClassification {
  primaryActivity: ActivityType;
  activities: ActivityType[];
  collections: TourCollection[];
  tags: string[];
}

export interface TourLevels {
  difficulty: DifficultyLevel;
  difficultyDescription?: string;
  comfortLevels: ComfortLevel[];
  primaryComfort: ComfortLevel;
  accommodationType: AccommodationType;
}

export interface TourParticipants {
  groupMin: number;
  groupMax: number;
  minimumAge: number;
  maximumAge?: number | null;
  maxWeightEnabled?: boolean;
  maxWeightKg?: number | null;
  languages: TourLanguage[];
}

export interface TourAccommodationContent {
  description?: string;
  photos: string[];
  places: OrganizerTourAccommodationPlace[];
}

export interface TourProgram {
  routeMapImage?: string;
  routePoints: TourRoutePoint[];
  days: OrganizerProgramDay[];
}

export interface TourMedia {
  coverImage: string;
  gallery: string[];
  places: TourPlace[];
}

export interface TourOrganizerComment {
  greeting: string;
  recommendations: string[];
  routeNotes: string;
}

export interface TourTeam {
  guides: OrganizerTourGuide[];
  organizerPreview: TourOrganizerPreview;
  organizerDetail: TourOrganizerDetail;
  organizerComment: TourOrganizerComment;
}

export interface TourTerms {
  included: string[];
  excluded: string[];
  importantInfo: string[];
  faq: TourFAQ[];
  packingList?: {
    enabled: boolean;
    text: string;
  };
  insurance?: {
    type: OrganizerTourInsuranceType;
    description: string;
  };
  cancellation?: {
    useTemplate: boolean;
    customText: string;
  };
}

export interface TourLogistics {
  ticketRecommendationsEnabled: boolean;
  ticketRecommendationsText: string;
  arrivalDepartureEnabled: boolean;
  arrivalDepartureCities: OrganizerArrivalDepartureCity[];
  /** Airports, transfers, meeting point panel on tour page. */
  arrivalDetailsEnabled: boolean;
  arrivalAirportsText: string;
  arrivalTransfersText: string;
  arrivalMeetingPoint: string;
}

export interface TourSocial {
  rating: number;
  reviewCount: number;
  reviews: TourReview[];
}

export interface TourDisplayFlags {
  featured?: boolean;
  badges: TourBadge[];
  isHot?: boolean;
  isNew?: boolean;
  isBestOfMonth?: boolean;
}

/** Canonical marketplace tour — single source of truth (Phase A). */
export interface Tour {
  id: string;
  slug: string;
  organizerTourId?: string;
  status: TourStatus;
  type: OrganizerTourType;
  isPreliminaryProgram?: boolean;
  display: TourDisplayFlags;

  title: string;
  shortDescription: string;
  descriptionBlocks: RichTextBlock[];

  geography: TourGeography;
  durationDays: number;
  durationNights: number;

  pricing: TourPricing;
  booking: TourBooking;
  classification: TourClassification;
  levels: TourLevels;
  participants: TourParticipants;
  accommodation: TourAccommodationContent;
  program: TourProgram;
  media: TourMedia;
  team: TourTeam;
  terms: TourTerms;
  logistics: TourLogistics;
  social: TourSocial;

  partnerName?: string;
  coverLabel?: string;
  updatedAt?: string;
}

export const TOURS_REPOSITORY_STORE_KEY = "argentina-travel-tour-repository";

/** @deprecated Migrated to TOURS_REPOSITORY_STORE_KEY */
export const TOURS_REPOSITORY_OVERRIDES_KEY = "argentina-travel-tour-repository-overrides";

export const TOURS_REPOSITORY_UPDATED_EVENT = "tours-repository-updated";
