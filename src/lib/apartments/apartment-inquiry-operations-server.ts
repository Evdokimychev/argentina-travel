import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  ApartmentInquiryPrivate,
  ApartmentInquiryStatus,
} from "@/types/apartments";

const INQUIRY_COLUMNS = [
  "id",
  "apartment_id",
  "stay_range",
  "guests",
  "guest_name",
  "guest_email",
  "guest_phone",
  "guest_message",
  "status",
  "status_note",
  "price_currency_snapshot",
  "nightly_price_minor_snapshot",
  "minimum_stay_nights_snapshot",
  "deposit_minor_snapshot",
  "row_version",
  "created_at",
  "updated_at",
  "apartment_listings!inner(title,locality,owner_user_id)",
].join(",");

type InquiryRow = Record<string, unknown>;

function parseStayRange(value: unknown): { start: string; end: string } {
  const match = String(value ?? "").match(/^\[([^,]+),([^\)]+)\)$/);
  return { start: match?.[1] ?? "", end: match?.[2] ?? "" };
}

function toInquiry(row: InquiryRow): ApartmentInquiryPrivate {
  const listingValue = row.apartment_listings;
  const listing = (Array.isArray(listingValue) ? listingValue[0] : listingValue) as
    | InquiryRow
    | null
    | undefined;
  const stay = parseStayRange(row.stay_range);
  return {
    id: String(row.id),
    apartmentId: String(row.apartment_id),
    apartmentTitle: String(listing?.title ?? "Апартаменты"),
    apartmentLocality: String(listing?.locality ?? ""),
    ownerUserId: String(listing?.owner_user_id ?? ""),
    stayStart: stay.start,
    stayEnd: stay.end,
    guests: Number(row.guests),
    guestName: String(row.guest_name),
    guestEmail: String(row.guest_email),
    guestPhone: String(row.guest_phone ?? ""),
    guestMessage: String(row.guest_message ?? ""),
    status: row.status as ApartmentInquiryStatus,
    statusNote: row.status_note ? String(row.status_note) : null,
    priceCurrencySnapshot: String(row.price_currency_snapshot),
    nightlyPriceMinorSnapshot: Number(row.nightly_price_minor_snapshot),
    minimumStayNightsSnapshot: Number(row.minimum_stay_nights_snapshot),
    depositMinorSnapshot: row.deposit_minor_snapshot === null
      ? null
      : Number(row.deposit_minor_snapshot),
    rowVersion: Number(row.row_version),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function listApartmentInquiries(input: {
  ownerUserId?: string;
  status?: ApartmentInquiryStatus;
}): Promise<ApartmentInquiryPrivate[]> {
  const db = createSupabaseAdminClient();
  // Generated types are updated only after the staged migration is accepted.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (db as any)
    .from("apartment_inquiries")
    .select(INQUIRY_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(250);
  if (input.ownerUserId) {
    query = query.eq("apartment_listings.owner_user_id", input.ownerUserId);
  }
  if (input.status) query = query.eq("status", input.status);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row: InquiryRow) => toInquiry(row));
}

export async function transitionApartmentInquiry(input: {
  inquiryId: string;
  expectedVersion: number;
  actorUserId: string;
  actorIsAdmin: boolean;
  nextStatus: ApartmentInquiryStatus;
  note?: string;
}): Promise<void> {
  const db = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (db as any).rpc("apartment_transition_inquiry", {
    p_inquiry_id: input.inquiryId,
    p_expected_version: input.expectedVersion,
    p_actor_user_id: input.actorUserId,
    p_actor_is_admin: input.actorIsAdmin,
    p_next_status: input.nextStatus,
    p_note: input.note?.trim() || null,
  });
  if (error) throw error;
}

export const APARTMENT_INQUIRY_STATUSES = [
  "awaiting_confirmation",
  "in_review",
  "confirmed",
  "rejected",
  "cancelled",
] as const satisfies readonly ApartmentInquiryStatus[];

export function isApartmentInquiryStatus(value: unknown): value is ApartmentInquiryStatus {
  return typeof value === "string"
    && (APARTMENT_INQUIRY_STATUSES as readonly string[]).includes(value);
}

export function apartmentInquiryMutationError(error: unknown): {
  status: number;
  message: string;
} {
  const value = error as { code?: string; message?: string } | null;
  if (value?.code === "40001") {
    return { status: 409, message: "Заявка уже изменилась. Обновите список и повторите действие." };
  }
  if (value?.code === "23P01") {
    return { status: 409, message: "Эти даты уже заняты. Проверьте календарь перед подтверждением." };
  }
  if (value?.code === "42501") {
    return { status: 403, message: "У вас нет доступа к этой заявке." };
  }
  if (value?.code === "P0002") {
    return { status: 404, message: "Заявка не найдена." };
  }
  if (value?.code === "23514") {
    return { status: 409, message: "Это действие больше недоступно для текущего статуса заявки." };
  }
  return { status: 503, message: "Не удалось изменить заявку. Повторите позже." };
}
