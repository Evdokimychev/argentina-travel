import type { OrganizerTourGuide } from "@/types/organizer-tour";

export function getTourAuthorGuide(
  guides: OrganizerTourGuide[] | undefined
): OrganizerTourGuide | null {
  if (!guides?.length) return null;
  const author = guides.find((guide) => guide.isTourAuthor && guide.name.trim());
  return author ?? null;
}

export function getCompanionGuides(
  guides: OrganizerTourGuide[] | undefined,
  author: OrganizerTourGuide | null
): OrganizerTourGuide[] {
  if (!guides?.length) return [];
  return guides.filter(
    (guide) =>
      guide.name.trim() &&
      guide.id !== author?.id &&
      !guide.isTourAuthor
  );
}

export function isOrganizerAlsoTourGuide(
  guides: OrganizerTourGuide[] | undefined
): boolean {
  return getTourAuthorGuide(guides) != null;
}

export function hasTourTeamGuides(guides: OrganizerTourGuide[] | undefined): boolean {
  return Boolean(guides?.some((guide) => guide.name.trim()));
}

export function resolveTourTeamSectionMeta(
  guides: OrganizerTourGuide[] | undefined
): {
  title: string;
  subtitle?: string;
  organizerIsGuide: boolean;
  companionCount: number;
} {
  const author = getTourAuthorGuide(guides);
  const companions = getCompanionGuides(guides, author);
  const organizerIsGuide = author != null;

  if (organizerIsGuide && companions.length === 0) {
    return {
      title: "Организатор и гид",
      subtitle: "Автор маршрута лично сопровождает тур",
      organizerIsGuide: true,
      companionCount: 0,
    };
  }

  if (organizerIsGuide && companions.length > 0) {
    return {
      title: "Организатор и команда",
      subtitle: "Автор тура и гиды, которые проведут вас по маршруту",
      organizerIsGuide: true,
      companionCount: companions.length,
    };
  }

  if (companions.length > 0) {
    return {
      title: "Организатор и гиды",
      subtitle: "Команда, которая проведёт вас по маршруту",
      organizerIsGuide: false,
      companionCount: companions.length,
    };
  }

  return {
    title: "Организатор",
    organizerIsGuide: false,
    companionCount: 0,
  };
}

/** Guide bio shown only when it adds detail beyond organizer profile text. */
export function shouldShowGuideBio(
  guideBio: string,
  organizerExtendedText: string
): boolean {
  const bio = guideBio.trim();
  if (!bio) return false;

  const extended = organizerExtendedText.trim();
  if (!extended) return true;

  const normalize = (value: string) => value.replace(/\s+/g, " ").toLowerCase();
  const normalizedBio = normalize(bio);
  const normalizedExtended = normalize(extended);

  if (normalizedBio === normalizedExtended) return false;
  if (normalizedExtended.includes(normalizedBio) || normalizedBio.includes(normalizedExtended)) {
    return normalizedBio.length > normalizedExtended.length + 40;
  }

  return true;
}
