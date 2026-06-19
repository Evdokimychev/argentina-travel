import "server-only";

import {
  sendTripPrepReminderEmail,
} from "@/lib/notifications/email-delivery";
import {
  emitNotificationEvent,
  isPersistableUserId,
} from "@/lib/notifications/notifications-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { absoluteUrl } from "@/lib/site-url";
import type { Database } from "@/types/database";
import type { TripPrepReminderKind } from "@/types/trip-prep";

type BookingRow = Pick<
  Database["public"]["Tables"]["bookings"]["Row"],
  "id" | "user_id" | "tour_title" | "start_date" | "contact_name" | "contact_email" | "status"
>;

type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "first_name" | "last_name" | "email"
>;

const REMINDER_DAYS: Record<TripPrepReminderKind, number> = {
  "7d": 7,
  "3d": 3,
  "1d": 1,
};

function profileName(profile: ProfileRow | undefined, fallback: string): string {
  if (!profile) return fallback;
  const fullName = `${profile.first_name} ${profile.last_name}`.trim();
  return fullName || fallback;
}

function formatTargetDate(daysAhead: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysAhead);
  return date.toISOString().slice(0, 10);
}

function resolveSiteOrigin(): string {
  return absoluteUrl("");
}

export async function notifyTripPrepReminder(input: {
  booking: BookingRow;
  profile?: ProfileRow;
  kind: TripPrepReminderKind;
}): Promise<boolean> {
  const userId = input.booking.user_id;
  if (!input.booking.start_date) return false;

  const daysBefore = REMINDER_DAYS[input.kind] as 7 | 3 | 1;
  const prepHref = `${resolveSiteOrigin()}/profile/trip-prep?bookingId=${encodeURIComponent(input.booking.id)}`;
  const recipientName = profileName(input.profile, input.booking.contact_name?.trim() || "Турист");
  const recipientEmail = input.profile?.email ?? input.booking.contact_email;

  const dedupeKey = `trip-prep:${input.kind}:${input.booking.id}`;

  if (isPersistableUserId(userId)) {
    await emitNotificationEvent(createSupabaseAdminClient(), {
      userId,
      dedupeKey,
      eventType: "trip_prep_reminder",
      category: "booking",
      title: "Подготовка к поездке",
      body: `До тура «${input.booking.tour_title}» осталось ${daysBefore} ${daysBefore === 1 ? "день" : "дня"}. Проверьте чек-лист.`,
      href: prepHref,
      metadata: {
        booking_id: input.booking.id,
        kind: input.kind,
        start_date: input.booking.start_date,
      },
      channels: ["in_app"],
    });
  }

  await sendTripPrepReminderEmail({
    userId,
    recipientEmail,
    recipientName,
    bookingId: input.booking.id,
    tourTitle: input.booking.tour_title,
    startDate: input.booking.start_date,
    daysBefore,
    prepHref,
  });

  return true;
}

export async function runTripPrepRemindersCron(): Promise<{
  processed: number;
  sent: number;
  details: Array<{ kind: TripPrepReminderKind; bookings: number; sent: number }>;
}> {
  const supabase = createSupabaseAdminClient();
  const kinds: TripPrepReminderKind[] = ["7d", "3d", "1d"];
  const details: Array<{ kind: TripPrepReminderKind; bookings: number; sent: number }> = [];
  let processed = 0;
  let sent = 0;

  for (const kind of kinds) {
    const targetDate = formatTargetDate(REMINDER_DAYS[kind]);
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("id, user_id, tour_title, start_date, contact_name, contact_email, status")
      .eq("start_date", targetDate)
      .in("status", ["pending", "confirmed"])
      .limit(300);

    if (error) {
      details.push({ kind, bookings: 0, sent: 0 });
      continue;
    }

    const rows = (bookings ?? []) as BookingRow[];
    processed += rows.length;

    const profileIds = [
      ...new Set(rows.map((row) => row.user_id).filter((value): value is string => Boolean(value))),
    ];
    const { data: profiles } = profileIds.length
      ? await supabase
          .from("profiles")
          .select("id, first_name, last_name, email")
          .in("id", profileIds)
      : { data: [] as ProfileRow[] };

    const profileById = new Map<string, ProfileRow>(
      ((profiles ?? []) as ProfileRow[]).map((profile) => [profile.id, profile])
    );

    let kindSent = 0;

    for (const booking of rows) {
      const { data: existing } = await supabase
        .from("trip_prep_reminders_sent")
        .select("id")
        .eq("booking_id", booking.id)
        .eq("kind", kind)
        .maybeSingle();

      if (existing) continue;

      const profile = booking.user_id ? profileById.get(booking.user_id) : undefined;
      await notifyTripPrepReminder({ booking, profile, kind });

      await supabase.from("trip_prep_reminders_sent").insert({
        booking_id: booking.id,
        kind,
      });

      kindSent += 1;
      sent += 1;
    }

    details.push({ kind, bookings: rows.length, sent: kindSent });
  }

  return { processed, sent, details };
}
