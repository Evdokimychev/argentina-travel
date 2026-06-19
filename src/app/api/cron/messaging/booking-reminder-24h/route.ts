import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/authorize-cron";
import { logCronResult } from "@/lib/cron/log-cron-result";
import { notifyBookingReminder24h } from "@/lib/notifications/messaging-notify";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

export const dynamic = "force-dynamic";

const CRON_ROUTE = "/api/cron/messaging/booking-reminder-24h";
const BUENOS_AIRES_TIMEZONE = "America/Argentina/Buenos_Aires";

type BookingReminderRow = Pick<
  Database["public"]["Tables"]["bookings"]["Row"],
  | "id"
  | "user_id"
  | "organizer_user_id"
  | "tour_title"
  | "start_date"
  | "contact_name"
  | "contact_email"
>;

type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "first_name" | "last_name" | "email"
>;

function profileName(profile: ProfileRow | undefined, fallback: string): string {
  if (!profile) return fallback;
  const fullName = `${profile.first_name} ${profile.last_name}`.trim();
  return fullName || fallback;
}

function formatDateInBuenosAires(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUENOS_AIRES_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

async function runBookingReminderCron(): Promise<NextResponse> {
  const startedAt = Date.now();
  const ranAt = new Date().toISOString();

  try {
    const targetDate = formatDateInBuenosAires(new Date(Date.now() + 24 * 60 * 60 * 1000));
    const supabase = createSupabaseAdminClient();

    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("id, user_id, organizer_user_id, tour_title, start_date, contact_name, contact_email")
      .eq("start_date", targetDate)
      .in("status", ["new", "pending", "confirmed"])
      .limit(300);

    if (error) {
      await logCronResult(CRON_ROUTE, {
        ok: false,
        ranAt,
        message: `Ошибка выборки заявок: ${error.message}`,
        statusCode: 500,
        durationMs: Date.now() - startedAt,
      });
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const rows = (bookings ?? []) as BookingReminderRow[];
    const profileIds = [
      ...new Set(
        rows.flatMap((row) => [row.user_id, row.organizer_user_id]).filter((value): value is string => Boolean(value))
      ),
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

    const jobs: Promise<void>[] = [];

    for (const booking of rows) {
      if (!booking.start_date) continue;

      const touristProfile = booking.user_id ? profileById.get(booking.user_id) : undefined;
      jobs.push(
        notifyBookingReminder24h({
          userId: booking.user_id,
          recipientEmail: touristProfile?.email ?? booking.contact_email,
          recipientName: profileName(
            touristProfile,
            booking.contact_name?.trim() || "Турист"
          ),
          recipientRole: "tourist",
          bookingId: booking.id,
          tourTitle: booking.tour_title,
          startDate: booking.start_date,
        })
      );

      if (booking.organizer_user_id) {
        const organizerProfile = profileById.get(booking.organizer_user_id);
        jobs.push(
          notifyBookingReminder24h({
            userId: booking.organizer_user_id,
            recipientEmail: organizerProfile?.email ?? null,
            recipientName: profileName(organizerProfile, "Организатор"),
            recipientRole: "organizer",
            bookingId: booking.id,
            tourTitle: booking.tour_title,
            startDate: booking.start_date,
          })
        );
      }
    }

    await Promise.allSettled(jobs);

    const message = `Обработано заявок на ${targetDate}: ${rows.length}; отправок: ${jobs.length}`;
    await logCronResult(CRON_ROUTE, {
      ok: true,
      ranAt,
      message,
      statusCode: 200,
      durationMs: Date.now() - startedAt,
      details: { targetDate, bookings: rows.length, deliveries: jobs.length },
    });

    return NextResponse.json({
      ok: true,
      ranAt,
      targetDate,
      bookings: rows.length,
      deliveries: jobs.length,
      message,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Неизвестная ошибка отправки напоминаний";
    await logCronResult(CRON_ROUTE, {
      ok: false,
      ranAt,
      message,
      error,
      statusCode: 500,
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) return auth.response;
  return runBookingReminderCron();
}

export async function GET(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) return auth.response;
  return runBookingReminderCron();
}
