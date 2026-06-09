import type { TourCollection } from "@/data/tour-collections";
import type { TourPlace } from "@/types";
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
  activityType: ActivityType;
  tourActivities: ActivityType[];
  collections: TourCollection[];
  difficultyLevel: DifficultyLevel;
  difficultyDescriptionText: string;
  comfortLevel: ComfortLevel;
  accommodationType: AccommodationType;
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
}

export const ORGANIZER_TOUR_TITLE_MAX = 120;

export const ORGANIZER_TOUR_EDITOR_TABS = [
  { id: "main", label: "Основное" },
  { id: "description", label: "Жильё и комфорт" },
  { id: "conditions", label: "Условия и цена" },
  { id: "program", label: "Программа" },
  { id: "publish", label: "Публикация" },
] as const;

export type OrganizerTourEditorTabId = (typeof ORGANIZER_TOUR_EDITOR_TABS)[number]["id"];

export const ORGANIZER_TOURS_UPDATED_EVENT = "organizer-tours-updated";
