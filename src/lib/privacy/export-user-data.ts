import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { PrivacyExportPayload } from "@/types/privacy";
import type { SessionUser } from "@/types/user";
import { fetchUserBookings } from "@/lib/bookings-server";
import { fetchUserReviews } from "@/lib/reviews-server";
import { fetchConversationMessages } from "@/lib/messaging/conversation-server";
import type { ConversationThread } from "@/types/conversations";

type DbClient = SupabaseClient<Database>;

type ThreadRow = Database["public"]["Tables"]["conversation_threads"]["Row"];

function rowToThread(row: ThreadRow): ConversationThread {
  return {
    id: row.id,
    bookingId: row.booking_id,
    touristUserId: row.tourist_user_id,
    organizerUserId: row.organizer_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchUserConversationThreads(
  supabase: DbClient,
  userId: string
): Promise<ConversationThread[]> {
  const [asTourist, asOrganizer] = await Promise.all([
    supabase
      .from("conversation_threads")
      .select("*")
      .eq("tourist_user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("conversation_threads")
      .select("*")
      .eq("organizer_user_id", userId)
      .order("updated_at", { ascending: false }),
  ]);

  const byId = new Map<string, ConversationThread>();
  for (const row of [...(asTourist.data ?? []), ...(asOrganizer.data ?? [])]) {
    byId.set(row.id, rowToThread(row));
  }
  return Array.from(byId.values());
}

export async function buildUserPrivacyExport(
  supabase: DbClient,
  user: SessionUser
): Promise<PrivacyExportPayload> {
  const [bookings, reviews, threads] = await Promise.all([
    fetchUserBookings(supabase, user.id),
    fetchUserReviews(supabase, user.id),
    fetchUserConversationThreads(supabase, user.id),
  ]);

  const messages = await Promise.all(
    threads.map(async (thread) => {
      const items = await fetchConversationMessages(supabase, thread, user.id);
      const role: "tourist" | "organizer" =
        thread.touristUserId === user.id ? "tourist" : "organizer";
      return {
        threadId: thread.id,
        bookingId: thread.bookingId,
        role,
        messages: items.map((message) => ({
          id: message.id,
          senderId: message.senderId,
          senderRole: message.senderRole,
          body: message.body,
          createdAt: message.createdAt,
        })),
      };
    })
  );

  return {
    exportedAt: new Date().toISOString(),
    userId: user.id,
    profile: {
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      country: user.country,
      dateOfBirth: user.dateOfBirth ?? null,
      createdAt: user.createdAt ?? null,
    },
    bookings,
    reviews,
    messages,
  };
}
