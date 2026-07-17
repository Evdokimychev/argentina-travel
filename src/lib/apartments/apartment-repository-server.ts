import "server-only";

import { createHash } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ApartmentDraftInput, ApartmentPrivate, ApartmentPublic } from "@/types/apartments";

const PUBLIC_BASE_COLUMNS = "id,market_id,country_code,slug,provider_code,booking_mode,availability_mode,property_timezone,title,summary,description,locality,region,public_location_note,public_latitude,public_longitude,max_guests,bedrooms,beds,bathrooms,amenities,house_rules,nightly_price_minor,currency,minimum_stay_nights,deposit_minor,deposit_disclosure,cancellation_disclosure,published_at";
const PUBLIC_COLUMNS = `${PUBLIC_BASE_COLUMNS},apartment_images(media_ref,alt_text,position)`;
const PRIVATE_COLUMNS = `${PUBLIC_BASE_COLUMNS},owner_user_id,status,row_version,updated_at,apartment_images(media_ref,alt_text,rights_holder,rights_source_url,license_code,position),apartment_private_locations(exact_address,access_instructions)`;

type Row = Record<string, unknown>;

function publicImages(row: Row) {
  const value = Array.isArray(row.apartment_images) ? row.apartment_images as Row[] : [];
  return value.sort((a, b) => Number(a.position) - Number(b.position)).map((item) => ({
    mediaRef: String(item.media_ref), altText: String(item.alt_text), position: Number(item.position),
  }));
}

function privateImages(row: Row) {
  const value = Array.isArray(row.apartment_images) ? row.apartment_images as Row[] : [];
  return value.sort((a, b) => Number(a.position) - Number(b.position)).map((item) => ({ mediaRef: String(item.media_ref), altText: String(item.alt_text), rightsHolder: String(item.rights_holder), rightsSourceUrl: item.rights_source_url ? String(item.rights_source_url) : null, licenseCode: String(item.license_code), position: Number(item.position) }));
}

function publicDto(row: Row): ApartmentPublic {
  return {
    id: String(row.id), marketId: String(row.market_id), countryCode: String(row.country_code),
    slug: String(row.slug), providerCode: "own", bookingMode: "native_request",
    availabilityMode: "managed_calendar", propertyTimezone: String(row.property_timezone),
    title: String(row.title), summary: String(row.summary), description: String(row.description),
    locality: String(row.locality), region: String(row.region), publicLocationNote: String(row.public_location_note),
    publicLatitude: row.public_latitude === null ? null : Number(row.public_latitude),
    publicLongitude: row.public_longitude === null ? null : Number(row.public_longitude),
    maxGuests: Number(row.max_guests), bedrooms: Number(row.bedrooms), beds: Number(row.beds),
    bathrooms: Number(row.bathrooms), amenities: row.amenities as string[], houseRules: row.house_rules as string[],
    nightlyPriceMinor: Number(row.nightly_price_minor), currency: String(row.currency),
    minimumStayNights: Number(row.minimum_stay_nights),
    depositMinor: row.deposit_minor === null ? null : Number(row.deposit_minor),
    depositDisclosure: String(row.deposit_disclosure), cancellationDisclosure: String(row.cancellation_disclosure),
    publishedAt: row.published_at ? String(row.published_at) : null, images: publicImages(row),
  };
}

function privateDto(row: Row): ApartmentPrivate {
  const location = Array.isArray(row.apartment_private_locations)
    ? row.apartment_private_locations[0] as Row | undefined
    : row.apartment_private_locations as Row | null;
  return { ...publicDto(row), ownerUserId: String(row.owner_user_id), status: row.status as ApartmentPrivate["status"],
    rowVersion: Number(row.row_version), exactAddress: String(location?.exact_address ?? ""),
    accessInstructions: String(location?.access_instructions ?? ""), updatedAt: String(row.updated_at),
    images: privateImages(row) };
}

export async function listPublishedApartments(marketId: string): Promise<ApartmentPublic[]> {
  const db = createSupabaseAdminClient();
  // Generated database types intentionally lag this new migration until the integration gate.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (db as any).from("apartment_listings").select(PUBLIC_COLUMNS)
    .eq("market_id", marketId).eq("status", "published").order("published_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: Row) => publicDto(row));
}

export async function getPublishedApartment(slug: string, marketId: string): Promise<ApartmentPublic | null> {
  const db = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (db as any).from("apartment_listings").select(PUBLIC_COLUMNS)
    .eq("market_id", marketId).eq("slug", slug).eq("status", "published").maybeSingle();
  if (error) throw error;
  return data ? publicDto(data as Row) : null;
}

export async function listManagedApartments(ownerUserId?: string): Promise<ApartmentPrivate[]> {
  const db = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (db as any).from("apartment_listings").select(PRIVATE_COLUMNS).order("updated_at", { ascending: false });
  if (ownerUserId) query = query.eq("owner_user_id", ownerUserId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row: Row) => privateDto(row));
}

export async function saveApartmentDraft(input: { apartmentId?: string; expectedVersion?: number; actorUserId: string; ownerUserId: string; actorIsAdmin: boolean; draft: ApartmentDraftInput; }): Promise<ApartmentPrivate> {
  const db = createSupabaseAdminClient();
  const imagesPayload = input.draft.images.map((image) => ({ media_ref: image.mediaRef, alt_text: image.altText,
    rights_holder: image.rightsHolder, rights_source_url: image.rightsSourceUrl ?? "", license_code: image.licenseCode, position: image.position }));
  const draft = Object.fromEntries(Object.entries(input.draft).filter(([key]) => key !== "images"));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (db as any).rpc("apartment_save_draft", {
    p_apartment_id: input.apartmentId ?? null, p_expected_version: input.expectedVersion ?? null,
    p_actor_user_id: input.actorUserId, p_owner_user_id: input.ownerUserId,
    p_actor_is_admin: input.actorIsAdmin, p_input: draft, p_images: imagesPayload,
  });
  if (error) throw error;
  const savedId = String((data as Row).id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row, error: readError } = await (db as any).from("apartment_listings").select(PRIVATE_COLUMNS).eq("id", savedId).single();
  if (readError) throw readError;
  return privateDto(row as Row);
}

export function sha256(value: string): string { return createHash("sha256").update(value).digest("hex"); }
