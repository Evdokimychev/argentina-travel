import { NextResponse } from "next/server";
import { isSupabaseToursEnabled } from "@/lib/auth-mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchTourAvailabilityBySlug } from "@/lib/tour-availability-server";
import { checkRateLimit, getClientIp, rateLimitErrorResponse } from "@/lib/rate-limit";
import { hashRateLimitIdentifier } from "@/lib/rate-limit-identifier";
import { verifyGuestFormProtection } from "@/lib/forms/captcha-server";

type RouteContext = { params: Promise<{ slug: string }> };

interface WaitlistJoinBody {
  email?: string;
  contactName?: string;
  contactPhone?: string;
  slotDate?: string;
  guests?: number;
  note?: string;
  captchaToken?: string | null;
  honeypot?: string | null;
}

function toIsoDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
  return normalized;
}

function normalizeGuests(value: number | undefined): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value as number));
}

export async function POST(request: Request, context: RouteContext) {
  if (!isSupabaseToursEnabled()) {
    return NextResponse.json({ error: "Лист ожидания недоступен" }, { status: 503 });
  }

  const ip = getClientIp(request);
  const ipLimit = await checkRateLimit(`tour-waitlist:ip:${ip}`, 5, 60_000);
  if (!ipLimit.ok) {
    return rateLimitErrorResponse(
      ipLimit.retryAfterSec,
      "Слишком много заявок в лист ожидания. Повторите позже.",
    );
  }

  try {
    const { slug } = await context.params;
    const body = (await request.json()) as WaitlistJoinBody;
    const protection = await verifyGuestFormProtection({
      request,
      formId: "waitlist",
      captchaToken: body.captchaToken,
      honeypot: body.honeypot,
    });
    if (!protection.ok) {
      if (protection.kind === "configuration") {
        return NextResponse.json(
          {
            error: "Защита листа ожидания временно недоступна.",
            code: "FORM_PROTECTION_UNAVAILABLE",
          },
          { status: 503 },
        );
      }
      return NextResponse.json({ ok: true });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    const availability = await fetchTourAvailabilityBySlug(createSupabaseAdminClient(), slug);
    if (!availability) {
      return NextResponse.json({ error: "Тур не найден" }, { status: 404 });
    }

    const email = (body.email ?? authUser?.email ?? "").trim().toLowerCase();
    if (!authUser && !email) {
      return NextResponse.json({ error: "Укажите email для листа ожидания" }, { status: 400 });
    }

    if (email) {
      const emailHash = hashRateLimitIdentifier("tour-waitlist", email);
      const emailLimit = await checkRateLimit(
        `tour-waitlist:email:${emailHash}`,
        3,
        15 * 60_000,
      );
      if (!emailLimit.ok) {
        return rateLimitErrorResponse(
          emailLimit.retryAfterSec,
          "Слишком много заявок для этого адреса. Повторите позже.",
        );
      }
    }

    const slotDate = toIsoDate(body.slotDate);
    if (body.slotDate && !slotDate) {
      return NextResponse.json({ error: "Некорректная дата слота" }, { status: 400 });
    }

    if (slotDate && availability.slots.length > 0) {
      const exists = availability.slots.some((slot) => slot.date === slotDate);
      if (!exists) {
        return NextResponse.json(
          { error: "Выбранной даты нет в доступных слотах тура" },
          { status: 400 }
        );
      }
    }

    let duplicateQuery = supabase
      .from("tour_waitlist_entries")
      .select("id")
      .eq("tour_id", availability.tourId)
      .eq("status", "waiting")
      .limit(1);

    duplicateQuery = slotDate
      ? duplicateQuery.eq("slot_date", slotDate)
      : duplicateQuery.is("slot_date", null);

    duplicateQuery = authUser
      ? duplicateQuery.eq("user_id", authUser.id)
      : duplicateQuery.ilike("email", email);

    const { data: existing, error: duplicateError } = await duplicateQuery.maybeSingle();
    if (duplicateError) {
      return NextResponse.json({ error: duplicateError.message }, { status: 500 });
    }
    if (existing) {
      return NextResponse.json(
        { error: "Вы уже в листе ожидания по этой дате" },
        { status: 409 }
      );
    }

    const { data: inserted, error: insertError } = await supabase
      .from("tour_waitlist_entries")
      .insert({
        tour_id: availability.tourId,
        user_id: authUser?.id ?? null,
        email: email || null,
        contact_name: body.contactName?.trim() || null,
        contact_phone: body.contactPhone?.trim() || null,
        slot_date: slotDate,
        guests: normalizeGuests(body.guests),
        status: "waiting",
        source: "site",
        note: body.note?.trim() || null,
      })
      .select("id, status, created_at, slot_date")
      .single();

    if (insertError || !inserted) {
      return NextResponse.json(
        { error: insertError?.message ?? "Не удалось добавить в лист ожидания" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      entry: {
        id: inserted.id,
        status: inserted.status,
        createdAt: inserted.created_at,
        slotDate: inserted.slot_date,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
