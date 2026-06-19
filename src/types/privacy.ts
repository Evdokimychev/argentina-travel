export type PrivacyRequestStatus =
  | "pending"
  | "approved"
  | "processing"
  | "completed"
  | "rejected"
  | "failed";

export type PrivacyRequestType = "delete";

export interface PrivacyRequestRow {
  id: string;
  user_id: string;
  request_type: PrivacyRequestType;
  status: PrivacyRequestStatus;
  reason: string | null;
  metadata: Record<string, unknown>;
  requested_at: string;
  processed_at: string | null;
  processed_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PrivacyExportPayload {
  exportedAt: string;
  userId: string;
  profile: {
    email: string;
    fullName: string;
    phone: string;
    country: string;
    dateOfBirth: string | null;
    createdAt: string | null;
  };
  bookings: unknown[];
  reviews: unknown[];
  messages: Array<{
    threadId: string;
    bookingId: string;
    role: "tourist" | "organizer";
    messages: unknown[];
  }>;
}
