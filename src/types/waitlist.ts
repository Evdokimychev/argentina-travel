export type WaitlistStatus =
  | "waiting"
  | "contacted"
  | "offered"
  | "declined"
  | "cancelled"
  | "converted";

export type WaitlistStatusActor = "organizer" | "tourist" | "system";

export interface WaitlistStatusChange {
  id: string;
  from: WaitlistStatus | null;
  to: WaitlistStatus;
  changedAt: string;
  changedBy: WaitlistStatusActor;
  note?: string;
}

export interface WaitlistOrganizerComment {
  id: string;
  text: string;
  authorName: string;
  createdAt: string;
}

/** Заявка в лист ожидания на тур / экскурсию организатора. */
export interface WaitlistEntry {
  id: string;
  userId: string;
  organizerTourId?: string;
  tourId: string;
  tourSlug: string;
  tourTitle: string;
  tourImage: string;
  tourDateId?: string;
  startDate?: string;
  endDate?: string;
  guests: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  touristComment?: string;
  status: WaitlistStatus;
  statusHistory: WaitlistStatusChange[];
  organizerComments: WaitlistOrganizerComment[];
  /** Созданное бронирование после подтверждения места. */
  convertedBookingId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizerWaitlistStats {
  waitingCount: number;
  activeCount: number;
  offeredCount: number;
}

export const WAITLIST_STORE_KEY = "argentina-travel-waitlist";
export const WAITLIST_UPDATED_EVENT = "tourist-waitlist-updated";
