import { differenceInMonths, format, startOfDay } from "date-fns";
import { monthsWord, yearsWord } from "@/lib/pluralize";

/** До этого возраста показываем полные годы и месяцы */
const YOUNG_CHILD_AGE_YEARS = 3;

export interface ParticipantAge {
  years: number;
  months: number;
  totalMonths: number;
}

export function computeParticipantAge(
  dateOfBirth: Date,
  referenceDate: Date = new Date()
): ParticipantAge {
  const birth = startOfDay(dateOfBirth);
  const ref = startOfDay(referenceDate);
  const totalMonths = Math.max(0, differenceInMonths(ref, birth));
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  return { years, months, totalMonths };
}

/** «34 года», «2 года 3 месяца», «8 месяцев» */
export function formatParticipantAge(
  dateOfBirth: Date,
  referenceDate: Date = new Date()
): string {
  const { years, months, totalMonths } = computeParticipantAge(dateOfBirth, referenceDate);

  if (totalMonths <= 0) {
    return "менее месяца";
  }

  if (years >= YOUNG_CHILD_AGE_YEARS) {
    return `${years} ${yearsWord(years)}`;
  }

  if (years === 0) {
    return `${months} ${monthsWord(months)}`;
  }

  if (months === 0) {
    return `${years} ${yearsWord(years)}`;
  }

  return `${years} ${yearsWord(years)} ${months} ${monthsWord(months)}`;
}

export function participantAgeLabel(dateOfBirth: Date | null): string | null {
  if (!dateOfBirth) return null;
  return formatParticipantAge(dateOfBirth);
}

/** ISO date (YYYY-MM-DD) for date picker upper bound — today (local) */
export function todayIsoDate(): string {
  return format(startOfDay(new Date()), "yyyy-MM-dd");
}

/** Upper bound — today; birth date cannot be in the future */
export function maxBirthDateIso(): string {
  return todayIsoDate();
}

export function minBirthDateIso(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 120);
  return format(startOfDay(d), "yyyy-MM-dd");
}
