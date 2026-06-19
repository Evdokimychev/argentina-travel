import { isValid, parseISO } from "date-fns";
import type { TourOrganizerDetail } from "@/types";
import type { OrganizerProfessionalExperience } from "@/types/organizer-profile";
import { formatMonths, formatYears } from "@/lib/pluralize";

function diffWholeMonths(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

export function formatPlatformTenure(registeredAt: string, now = new Date()): string {
  const start = parseISO(registeredAt);
  if (!isValid(start)) return "На площадке";

  const months = Math.max(1, diffWholeMonths(start, now));
  if (months >= 12) {
    const years = Math.floor(months / 12);
    return `На площадке ${formatYears(years)}`;
  }

  return `На площадке ${formatMonths(months)}`;
}

export function formatProfessionalExperience(
  experience: OrganizerProfessionalExperience
): string {
  const value = Math.max(1, Math.round(experience.value));
  if (experience.unit === "months") {
    return `${formatMonths(value)} опыта`;
  }
  return `${formatYears(value)} опыта`;
}

export function resolveOrganizerExperienceStat(
  organizer: Pick<
    TourOrganizerDetail,
    "experienceYears" | "platformRegisteredAt" | "professionalExperience"
  >
): string {
  if (organizer.professionalExperience && organizer.professionalExperience.value > 0) {
    return formatProfessionalExperience(organizer.professionalExperience);
  }

  if (organizer.experienceYears > 0) {
    return `${formatYears(organizer.experienceYears)} опыта`;
  }

  if (organizer.platformRegisteredAt?.trim()) {
    const start = parseISO(organizer.platformRegisteredAt);
    if (isValid(start) && start.getFullYear() >= 2000) {
      return `С ${start.getFullYear()} года`;
    }
    return formatPlatformTenure(organizer.platformRegisteredAt);
  }

  return "Недавно на площадке";
}
