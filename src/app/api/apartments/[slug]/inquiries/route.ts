import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { enforcePublicModuleAccess } from "@/lib/public-module-policy-server";
import { verifyGuestFormProtection } from "@/lib/forms/captcha-server";
import { checkRateLimit, getClientIp, rateLimitErrorResponse } from "@/lib/rate-limit";
import { isValidBookingOperationKey } from "@/lib/partner-booking/idempotency";
import { getPublishedApartment, sha256 } from "@/lib/apartments/apartment-repository-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PRIMARY_PUBLIC_MARKET } from "@/lib/market-context";

type Context = { params: Promise<{ slug: string }> };

export async function POST(request: Request, context: Context) {
  const blocked = await enforcePublicModuleAccess("apartments", "public_write");
  if (blocked) return blocked;
  const limit = await checkRateLimit(`apartment-inquiry:${getClientIp(request)}`, 8, 60 * 60_000);
  if (!limit.ok) return rateLimitErrorResponse(limit.retryAfterSec, "Слишком много заявок. Попробуйте позже.");
  const operationKey = request.headers.get("idempotency-key")?.trim() ?? null;
  if (!isValidBookingOperationKey(operationKey)) return NextResponse.json({ error: "Обновите страницу и повторите заявку.", code: "IDEMPOTENCY_REQUIRED" }, { status: 400 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Проверьте данные заявки." }, { status: 400 });
  const protection = await verifyGuestFormProtection({ request, formId: "native_booking",
    captchaToken: typeof body.captchaToken === "string" ? body.captchaToken : null,
    honeypot: typeof body.website === "string" ? body.website : null });
  if (!protection.ok) return NextResponse.json({ error: protection.kind === "configuration" ? "Защита формы временно недоступна." : "Не удалось проверить форму." }, { status: protection.kind === "configuration" ? 503 : 400 });
  const { slug } = await context.params;
  const apartment = await getPublishedApartment(slug, PRIMARY_PUBLIC_MARKET.id);
  if (!apartment) return NextResponse.json({ error: "Апартаменты не найдены." }, { status: 404 });
  const startDate = typeof body.startDate === "string" ? body.startDate : "";
  const endDate = typeof body.endDate === "string" ? body.endDate : "";
  const guests = Number(body.guests);
  const guestName = typeof body.name === "string" ? body.name.trim() : "";
  const guestEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const guestPhone = typeof body.phone === "string" ? body.phone.trim() : "";
  const guestMessage = typeof body.message === "string" ? body.message.trim() : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate) || endDate <= startDate || !Number.isInteger(guests) || guests < 1 || guests > apartment.maxGuests || guestName.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
    return NextResponse.json({ error: "Проверьте даты, число гостей и контакты." }, { status: 400 });
  }
  const fingerprint = createHash("sha256").update(JSON.stringify({ apartmentId: apartment.id, startDate, endDate, guests, guestName, guestEmail, guestPhone, guestMessage })).digest("hex");
  const db = createSupabaseAdminClient();
  // Generated database types intentionally lag this new migration until the integration gate.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (db as any).rpc("apartment_create_inquiry", {
    p_apartment_id: apartment.id, p_start_date: startDate, p_end_date: endDate,
    p_guests: guests, p_guest_name: guestName, p_guest_email: guestEmail,
    p_guest_phone: guestPhone, p_guest_message: guestMessage,
    p_idempotency_key_hash: sha256(operationKey), p_request_fingerprint: fingerprint,
  });
  if (error) {
    const message = String(error.message ?? "");
    if (message.includes("DATES_UNAVAILABLE")) return NextResponse.json({ error: "Эти даты уже недоступны." }, { status: 409 });
    if (message.includes("IDEMPOTENCY_CONFLICT")) return NextResponse.json({ error: "Эта заявка уже использована с другими данными." }, { status: 409 });
    if (message.includes("INVALID_REQUEST")) return NextResponse.json({ error: "Проверьте срок проживания и число гостей." }, { status: 400 });
    return NextResponse.json({ error: "Не удалось сохранить заявку. Попробуйте позже." }, { status: 503 });
  }
  const inquiryId = String((data as { id: string }).id);
  return NextResponse.json({ inquiryId, status: "awaiting_confirmation", message: "Заявка принята. Мы проверим доступность и свяжемся с вами — бронирование ещё не подтверждено." }, { status: 201 });
}
