export const MOBILITY_VERTICALS = ["rental", "transfer"] as const;
export type MobilityVertical = (typeof MOBILITY_VERTICALS)[number];

export type MobilityCapabilityMode =
  | "native_request"
  | "native_booking"
  | "affiliate_handoff"
  | "planned";

export type MobilityLifecycleStatus = "draft" | "review" | "published" | "archived";

export type MobilityProviderCapability = {
  providerId: string;
  providerKey: string;
  vertical: MobilityVertical;
  displayName: string;
  sourceOwnership: "platform" | "organizer" | "partner";
  capabilityMode: MobilityCapabilityMode;
  healthStatus: "unknown" | "healthy" | "degraded" | "unavailable";
  readinessStatus: "requires_verification" | "manual_handoff" | "verified" | "blocked";
  marketId: string;
  countryCode: string;
  sourceCurrency: string;
  displayCurrency: string;
  timezone: string;
  handoffPath: string | null;
};

export type MobilityPublicOffer = {
  id: string;
  providerId: string;
  vertical: MobilityVertical;
  slug: string;
  title: string;
  originLabel: string;
  destinationLabel: string;
  sourceCurrency: string;
  displayCurrency: string;
  priceMinor: number;
  capabilityMode: "native_request";
  confirmationMode: string;
  marketId: string;
  countryCode: string;
  timezone: string;
  seatCapacity: number;
  luggageCapacity: number;
  depositMinor?: number;
  insuranceSummary?: string;
  meetingPolicy?: string;
  flightDelayPolicy?: string;
  noShowPolicy?: string;
};

export type MobilityPublicCatalog = {
  providers: MobilityProviderCapability[];
  offers: MobilityPublicOffer[];
};

export type MobilityInventoryItem = {
  id: string;
  owner_user_id: string;
  provider_id: string;
  market_id: string;
  country_code: string;
  status: MobilityLifecycleStatus;
  row_version: number;
  title?: string;
  public_name?: string;
  verification_status?: "unverified" | "pending" | "verified" | "rejected" | "expired";
  updated_at: string;
};

export type MobilityInventoryProvider = {
  id: string;
  providerKey: string;
  displayName: string;
  verificationStatus: "unverified" | "pending" | "verified" | "rejected" | "expired";
  healthStatus: "unknown" | "healthy" | "degraded" | "unavailable";
  rowVersion: number;
  marketId: string;
  countryCode: string;
  timezone: string;
  sourceCurrency: string;
  displayCurrency: string;
  vertical: MobilityVertical;
  readinessStatus: "requires_verification" | "manual_handoff" | "verified" | "blocked";
  publicEnabled: boolean;
};

export type MobilityInventory = {
  providers: MobilityInventoryProvider[];
  documents: Array<{
    id: string;
    vehicleId: string;
    documentType: string;
    identifierLast4: string | null;
    expiresAt: string | null;
    verificationStatus: "pending" | "verified" | "rejected" | "expired";
  }>;
  vehicles: MobilityInventoryItem[];
  rentalOffers: MobilityInventoryItem[];
  transferServices: MobilityInventoryItem[];
};

export type MobilityRequestStatus =
  | "submitted"
  | "in_review"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "completed"
  | "no_show";

export type MobilityOperationsRequest = {
  id: string;
  vertical: MobilityVertical;
  productId: string;
  marketId: string;
  countryCode: string;
  timezone: string;
  displayCurrency: string;
  quotedPriceMinor: number | null;
  status: MobilityRequestStatus;
  rowVersion: number;
  createdAt: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  pickupDetails: Record<string, unknown>;
  customerNote: string | null;
  providerName: string;
  productTitle: string | null;
  allocation: null | {
    id: string;
    vehicleId: string;
    startsAt: string;
    endsAt: string;
    status: "tentative" | "confirmed" | "blocked";
  };
};

export function isMobilityVertical(value: unknown): value is MobilityVertical {
  return typeof value === "string" && MOBILITY_VERTICALS.includes(value as MobilityVertical);
}
