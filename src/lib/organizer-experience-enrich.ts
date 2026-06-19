import { getOrganizerCanonicalStats } from "@/data/organizer-canonical-stats";
import { getUserById } from "@/lib/auth-store";
import { joinFullName } from "@/lib/full-name";
import { readOrganizerProfile } from "@/lib/organizer-profile-store";
import type { TourOrganizerDetail } from "@/types";

export function enrichTourOrganizerDetail(
  organizer: TourOrganizerDetail,
  ownerUserId?: string
): TourOrganizerDetail {
  if (!ownerUserId) return organizer;

  const profile = readOrganizerProfile(ownerUserId);
  const user = getUserById(ownerUserId);
  const canonical = getOrganizerCanonicalStats(ownerUserId);
  const displayName = user ? joinFullName(user.firstName, user.lastName) : organizer.name;
  const avatar = user?.avatar?.trim() || organizer.avatar;
  const platformRegisteredAt =
    canonical?.platformRegisteredAt ?? user?.createdAt ?? organizer.platformRegisteredAt;

  return {
    ...organizer,
    name: displayName.trim() || organizer.name,
    avatar,
    shortDescription: profile.shortDescription || organizer.shortDescription,
    extendedDescription: profile.extendedDescription || organizer.extendedDescription,
    statusText: profile.statusText.trim() || organizer.statusText,
    tourCount: canonical?.tourCount ?? organizer.tourCount,
    travelerCount: canonical?.travelerCount ?? organizer.travelerCount,
    experienceYears: canonical ? 0 : organizer.experienceYears,
    platformRegisteredAt,
    professionalExperience: profile.professionalExperience ?? null,
    slug: ownerUserId,
    ownerUserId,
    email: "",
    phone: "",
  };
}
