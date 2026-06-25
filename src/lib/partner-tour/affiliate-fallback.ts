import { buildYouTravelAffiliateFallbackPath } from "@/lib/youtravel/partner-tour-utils";

export type PartnerTourAffiliateFallbackInput = {
  slug: string;
  partner: "youtravel" | "tripster";
  startDate: string;
  endDate?: string | null;
  guests: number;
  name?: string;
  email?: string;
  phone?: string;
  offerId?: number | null;
  time?: string | null;
};

export function buildPartnerTourAffiliateFallbackPath(
  input: PartnerTourAffiliateFallbackInput
): string {
  if (input.partner === "youtravel") {
    return buildYouTravelAffiliateFallbackPath({
      slug: input.slug,
      startDate: input.startDate,
      endDate: input.endDate,
      guests: input.guests,
      name: input.name,
      email: input.email,
      phone: input.phone,
      offerId: input.offerId,
    });
  }

  const search = new URLSearchParams({
    start_date: input.startDate,
    guests: String(input.guests),
  });
  if (input.time?.trim()) search.set("time", input.time.trim());
  if (input.name) search.set("name", input.name);
  if (input.email) search.set("email", input.email);
  if (input.phone) search.set("phone", input.phone);
  return `/api/affiliate/go/${input.slug}?${search.toString()}`;
}
