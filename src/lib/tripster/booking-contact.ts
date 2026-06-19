import { normalizePhone } from "@/lib/auth-store";
import { resolvePhoneCountryIsoFromProfile } from "@/data/profile-countries";

/** Нормализует телефон туриста для Tripster External Orders API (+79991234567). */
export function normalizeTripsterCustomerPhone(
  phone: string,
  profileCountry?: string | null
): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return null;

  const countryIso = profileCountry
    ? resolvePhoneCountryIsoFromProfile(profileCountry)
    : undefined;

  return (
    normalizePhone(trimmed, countryIso) ??
    (trimmed.startsWith("+") ? normalizePhone(trimmed) : null)
  );
}

export function formatTripsterCustomerPhoneForApi(
  phone: string,
  profileCountry?: string | null
): string {
  return normalizeTripsterCustomerPhone(phone, profileCountry) ?? phone.trim();
}

export type TripsterBookingContactPayload = {
  name: string;
  email: string;
  phone: string;
  messageToGuide?: string;
};

export function buildTripsterBookingContactPayload(input: {
  name: string;
  email: string;
  phone: string;
  messageToGuide?: string;
  profileCountry?: string | null;
}): TripsterBookingContactPayload | { error: string } {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const messageToGuide = input.messageToGuide?.trim() || undefined;

  if (!name) return { error: "Укажите имя и фамилию контактного лица." };
  if (!email || !email.includes("@")) {
    return { error: "Укажите корректный email — на него придёт подтверждение." };
  }

  const phone = normalizeTripsterCustomerPhone(input.phone, input.profileCountry);
  if (!phone) {
    return {
      error:
        "Укажите телефон в международном формате, например +7 999 123 45 67.",
    };
  }

  return { name, email, phone, messageToGuide };
}
