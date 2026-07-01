import type {
  OrganizerCancellationSettings,
  OrganizerContactsSettings,
  OrganizerProfile,
  OrganizerTeamGuide,
} from "@/types/organizer-profile";
import {
  createDefaultOrganizerCancellation,
  createDefaultOrganizerContacts,
  ORGANIZER_EXTENDED_DESCRIPTION_MAX,
  ORGANIZER_SHORT_DESCRIPTION_MAX,
} from "@/types/organizer-profile";
import {
  DEFAULT_GUIDE_AVATAR,
  ORGANIZER_TOUR_GUIDE_BIO_MAX,
  ORGANIZER_TEAM_GUIDES_MAX,
  TOUR_GUIDE_CATALOG,
} from "@/data/tour-guides-defaults";
import { SITE_SUPPORT_EMAIL } from "@/data/site-support-email";

const PROFILES_KEY = "argentina-travel-organizer-profiles";

export const ORGANIZER_PROFILE_UPDATED_EVENT = "organizer-profile-updated";

const IVAN_CONTACTS = createDefaultOrganizerContacts({
  website: "https://barilochetrip.tilda.ws/",
  contactEmail: SITE_SUPPORT_EMAIL,
  documentsEmail: SITE_SUPPORT_EMAIL,
  reviewUrls: ["https://www.instagram.com/p/C8xJqJ2R9kL/"],
});

const IVAN_BIO = `Привет! Меня зовут Иван, и я живу в Буэнос-Айресе уже больше пяти лет. За это время я успел полюбить эту страну — её культуру, природу и, конечно, людей.

Я организую авторские туры по Аргентине: от прогулок по историческому центру Буэнос-Айреса до поездок в Мендосу и Патагонию. Мне важно, чтобы каждый путешественник почувствовал себя не туристом, а гостем.

На моих турах вы узнаете, где пьют лучший мате, как заказывать стейк как местный и почему аргентинцы так любят футбол. Добро пожаловать в мою Аргентину!`;

const DEFAULT_PROFILES: Record<string, OrganizerProfile> = {
  "ivan-evdokimychev": {
    middleName: "",
    shortDescription:
      "Живу в Буэнос-Айресе и организую авторские туры по Аргентине для русскоязычных путешественников.",
    extendedDescription: IVAN_BIO,
    bio: IVAN_BIO,
    statusText: "Жду вас на моём туре по Аргентине 🇦🇷",
    guides: TOUR_GUIDE_CATALOG.map((guide) => ({ ...guide })),
    contacts: IVAN_CONTACTS,
    cancellation: createDefaultOrganizerCancellation(),
  },
};

function mergeCancellation(
  stored?: Partial<OrganizerCancellationSettings>
): OrganizerCancellationSettings {
  const defaults = createDefaultOrganizerCancellation();
  if (!stored) return defaults;

  return {
    ...defaults,
    ...stored,
    penalties:
      stored.penalties && stored.penalties.length > 0 ? stored.penalties : defaults.penalties,
  };
}

function mergeContacts(
  stored?: Partial<OrganizerContactsSettings>
): OrganizerContactsSettings {
  const defaults = createDefaultOrganizerContacts();
  if (!stored) return defaults;

  return {
    ...defaults,
    ...stored,
    reviewUrls:
      stored.reviewUrls && stored.reviewUrls.length > 0 ? stored.reviewUrls : defaults.reviewUrls,
  };
}

function normalizeTeamGuide(guide: Partial<OrganizerTeamGuide>): OrganizerTeamGuide | null {
  const name = guide.name?.trim();
  if (!name) return null;

  return {
    id: guide.id?.trim() || `guide-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    avatar: guide.avatar?.trim() || DEFAULT_GUIDE_AVATAR,
    bio: (guide.bio ?? "").trim().slice(0, ORGANIZER_TOUR_GUIDE_BIO_MAX),
    userId: guide.userId ?? null,
  };
}

function normalizeTeamGuides(guides?: Partial<OrganizerTeamGuide>[]): OrganizerTeamGuide[] {
  if (!guides?.length) return [];
  return guides
    .map((guide) => normalizeTeamGuide(guide))
    .filter((guide): guide is OrganizerTeamGuide => Boolean(guide))
    .slice(0, ORGANIZER_TEAM_GUIDES_MAX);
}

function normalizeProfile(profile: Partial<OrganizerProfile>): OrganizerProfile {
  const professionalExperience = normalizeProfessionalExperience(profile.professionalExperience);
  const extendedDescription = (profile.extendedDescription ?? profile.bio ?? "")
    .trim()
    .slice(0, ORGANIZER_EXTENDED_DESCRIPTION_MAX);
  const shortDescription = (profile.shortDescription ?? "")
    .trim()
    .slice(0, ORGANIZER_SHORT_DESCRIPTION_MAX);

  return {
    middleName: profile.middleName ?? "",
    shortDescription,
    extendedDescription,
    bio: extendedDescription,
    statusText: profile.statusText ?? "",
    professionalExperience,
    guides: normalizeTeamGuides(profile.guides),
    contacts: mergeContacts(profile.contacts),
    cancellation: mergeCancellation(profile.cancellation),
  };
}

function normalizeProfessionalExperience(
  raw?: OrganizerProfile["professionalExperience"]
): OrganizerProfile["professionalExperience"] {
  if (raw === null || raw === undefined) return null;
  const value = Math.round(raw.value);
  if (!Number.isFinite(value) || value <= 0) return null;
  return {
    value,
    unit: raw.unit === "months" ? "months" : "years",
  };
}

function readAll(): Record<string, OrganizerProfile> {
  if (typeof window === "undefined") {
    return Object.fromEntries(
      Object.entries(DEFAULT_PROFILES).map(([id, profile]) => [id, normalizeProfile(profile)])
    );
  }

  try {
    const raw = window.localStorage.getItem(PROFILES_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, Partial<OrganizerProfile>>) : {};
    const merged: Record<string, OrganizerProfile> = {};

    for (const [id, profile] of Object.entries(DEFAULT_PROFILES)) {
      merged[id] = normalizeProfile({ ...profile, ...parsed[id] });
    }

    if (parsed && typeof parsed === "object") {
      for (const [id, profile] of Object.entries(parsed)) {
        if (!merged[id]) {
          merged[id] = normalizeProfile(profile);
        }
      }
    }

    return merged;
  } catch {
    return Object.fromEntries(
      Object.entries(DEFAULT_PROFILES).map(([id, profile]) => [id, normalizeProfile(profile)])
    );
  }
}

function writeAll(profiles: Record<string, OrganizerProfile>) {
  window.localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  window.dispatchEvent(new CustomEvent(ORGANIZER_PROFILE_UPDATED_EVENT));
}

export function readOrganizerGuideTeam(userId: string): OrganizerTeamGuide[] {
  return readOrganizerProfile(userId).guides;
}

export function readOrganizerProfile(userId: string): OrganizerProfile {
  const profiles = readAll();
  return (
    profiles[userId] ??
    normalizeProfile({
      middleName: "",
      bio: "",
      shortDescription: "",
      extendedDescription: "",
      statusText: "",
      guides: [],
    })
  );
}

export function updateOrganizerProfile(
  userId: string,
  patch: Partial<OrganizerProfile>
): { profile: OrganizerProfile } | { error: string } {
  if (!userId) {
    return { error: "Пользователь не найден" };
  }

  const profiles = readAll();
  const current = readOrganizerProfile(userId);
  const next = normalizeProfile({
    ...current,
    ...patch,
    guides: patch.guides ? normalizeTeamGuides(patch.guides) : current.guides,
    contacts: patch.contacts ? { ...current.contacts, ...patch.contacts } : current.contacts,
    cancellation: patch.cancellation
      ? { ...current.cancellation, ...patch.cancellation }
      : current.cancellation,
  });

  profiles[userId] = next;
  writeAll(profiles);
  return { profile: next };
}
