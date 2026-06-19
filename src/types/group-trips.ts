export type GroupTripListingStatus = "open" | "full" | "confirmed" | "cancelled";

export type GroupTripMemberStatus = "interested" | "confirmed" | "declined";

export type GroupTripMemberView = {
  id: string;
  userId: string;
  status: GroupTripMemberStatus;
  joinedAt: string;
  displayName?: string;
};

export type GroupTripListingView = {
  id: string;
  tourId: string;
  tourSlug?: string;
  tourTitle?: string;
  organizerId: string;
  creatorUserId: string;
  slotDate: string;
  availabilitySlotId: string | null;
  minParticipants: number;
  maxParticipants: number;
  status: GroupTripListingStatus;
  description: string | null;
  memberCount: number;
  members?: GroupTripMemberView[];
  isCreator?: boolean;
  isMember?: boolean;
  myMemberStatus?: GroupTripMemberStatus | null;
  slotCapacity?: number | null;
  slotAvailable?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateGroupTripListingInput = {
  tourId: string;
  slotDate: string;
  minParticipants: number;
  maxParticipants: number;
  description?: string;
};

export type OrganizerGroupTripPatchAction = "confirm" | "cancel";
