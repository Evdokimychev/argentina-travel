export type ApartmentLifecycle = "draft" | "review" | "published" | "archived";

export type ApartmentInquiryStatus =
  | "awaiting_confirmation"
  | "in_review"
  | "confirmed"
  | "rejected"
  | "cancelled";

export type ApartmentInquiryPrivate = {
  id: string;
  apartmentId: string;
  apartmentTitle: string;
  apartmentLocality: string;
  ownerUserId: string;
  stayStart: string;
  stayEnd: string;
  guests: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestMessage: string;
  status: ApartmentInquiryStatus;
  statusNote: string | null;
  priceCurrencySnapshot: string;
  nightlyPriceMinorSnapshot: number;
  minimumStayNightsSnapshot: number;
  depositMinorSnapshot: number | null;
  rowVersion: number;
  createdAt: string;
  updatedAt: string;
};

export type ApartmentImageInput = {
  mediaRef: string;
  altText: string;
  rightsHolder: string;
  rightsSourceUrl?: string | null;
  licenseCode: string;
  position: number;
};

export type ApartmentPublicImage = Pick<ApartmentImageInput, "mediaRef" | "altText" | "position">;

export type ApartmentDraftInput = {
  marketId: string;
  countryCode: string;
  slug: string;
  propertyTimezone: string;
  title: string;
  summary: string;
  description: string;
  locality: string;
  region: string;
  publicLocationNote: string;
  publicLatitude?: number | null;
  publicLongitude?: number | null;
  exactAddress: string;
  accessInstructions: string;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenities: string[];
  houseRules: string[];
  nightlyPriceMinor: number;
  currency: string;
  minimumStayNights: number;
  depositMinor?: number | null;
  depositDisclosure: string;
  cancellationDisclosure: string;
  images: ApartmentImageInput[];
};

export type ApartmentPublic = {
  id: string;
  marketId: string;
  countryCode: string;
  slug: string;
  providerCode: "own";
  bookingMode: "native_request";
  availabilityMode: "managed_calendar";
  propertyTimezone: string;
  title: string;
  summary: string;
  description: string;
  locality: string;
  region: string;
  publicLocationNote: string;
  publicLatitude: number | null;
  publicLongitude: number | null;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenities: string[];
  houseRules: string[];
  nightlyPriceMinor: number;
  currency: string;
  minimumStayNights: number;
  depositMinor: number | null;
  depositDisclosure: string;
  cancellationDisclosure: string;
  publishedAt: string | null;
  images: ApartmentPublicImage[];
};

export type ApartmentPrivate = Omit<ApartmentPublic, "images"> & {
  ownerUserId: string;
  status: ApartmentLifecycle;
  rowVersion: number;
  exactAddress: string;
  accessInstructions: string;
  updatedAt: string;
  images: ApartmentImageInput[];
};
