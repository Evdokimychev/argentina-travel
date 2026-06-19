import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  emitBookingStatusNotification,
  emitReviewApprovedNotifications,
} from "@/lib/notifications/notifications-server";

export async function notifyBookingStatusInApp(input: {
  userId: string | null | undefined;
  bookingId: string;
  tourTitle: string;
  fromStatus: string | null;
  toStatus: string;
  changedAt?: string;
}): Promise<void> {
  try {
    const supabase = createSupabaseAdminClient();
    await emitBookingStatusNotification(supabase, input);
  } catch {
    // Non-blocking in-app channel.
  }
}

export async function notifyReviewApprovedInApp(input: {
  reviewId: string;
  tourTitle: string;
  tourSlug: string;
  authorUserId: string | null;
  organizerUserId: string | null;
  rating: number;
}): Promise<void> {
  try {
    const supabase = createSupabaseAdminClient();
    await emitReviewApprovedNotifications(supabase, input);
  } catch {
    // Non-blocking in-app channel.
  }
}
