import { isValid, parseISO } from "date-fns";
import type { AuthUser } from "@/types/auth";
import { formatInternationalPhone } from "@/lib/phone-countries";
import type { CheckoutFormState, TravelerForm } from "./types";
import { createInitialCheckoutForm } from "./types";

export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function parseStoredDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

export function contactFieldsFromAuthUser(
  user: AuthUser
): Pick<
  CheckoutFormState,
  | "contactFirstName"
  | "contactLastName"
  | "contactEmail"
  | "contactPhone"
  | "contactDateOfBirth"
  | "createAccount"
> {
  const { firstName, lastName } = splitFullName(user.fullName);

  return {
    contactFirstName: firstName,
    contactLastName: lastName,
    contactEmail: user.email,
    contactPhone: formatInternationalPhone(user.phone),
    contactDateOfBirth: parseStoredDate(user.dateOfBirth),
    createAccount: false,
  };
}

export function syncContactToTraveler1(form: CheckoutFormState): TravelerForm[] {
  const travelers = [...form.travelers];
  if (travelers.length === 0) return travelers;

  travelers[0] = {
    firstName: form.contactFirstName,
    lastName: form.contactLastName,
    dateOfBirth: form.contactDateOfBirth,
  };

  return travelers;
}

export function applyAuthUserToCheckoutForm(
  form: CheckoutFormState,
  user: AuthUser
): CheckoutFormState {
  const next = { ...form, ...contactFieldsFromAuthUser(user) };
  if (next.contactIsParticipant1) {
    next.travelers = syncContactToTraveler1(next);
  }
  return next;
}

export function createCheckoutForm(guests: number, user?: AuthUser | null): CheckoutFormState {
  const base = createInitialCheckoutForm(guests);
  if (!user) return base;
  return applyAuthUserToCheckoutForm(base, user);
}
