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
  const displayName = user ? joinFullName(user.firstName, user.lastName) : organizer.name;
  const avatar = user?.avatar?.trim() || organizer.avatar;

  return {
    ...organizer,
    name: displayName.trim() || organizer.name,
    avatar,
    shortDescription: profile.shortDescription || organizer.shortDescription,
    extendedDescription: profile.extendedDescription || organizer.extendedDescription,
    platformRegisteredAt: user?.createdAt,
    professionalExperience: profile.professionalExperience ?? null,
    email: organizer.email?.trim() || profile.contacts.contactEmail || organizer.email,
    phone: organizer.phone?.trim() || user?.phone || organizer.phone,
  };
}
