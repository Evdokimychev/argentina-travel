import type {
  OrganizerCancellationSettings,
  OrganizerContactsSettings,
  OrganizerProfile,
} from "@/types/organizer-profile";
import {
  createDefaultOrganizerCancellation,
  createDefaultOrganizerContacts,
} from "@/types/organizer-profile";

const PROFILES_KEY = "argentina-travel-organizer-profiles";

const IVAN_CONTACTS = createDefaultOrganizerContacts({
  website: "https://barilochetrip.tilda.ws/",
  contactEmail: "IAEvdokimychev@ya.ru",
  documentsEmail: "IAEvdokimychev@ya.ru",
  reviewUrls: ["https://www.instagram.com/p/C8xJqJ2R9kL/"],
});

const DEFAULT_PROFILES: Record<string, OrganizerProfile> = {
  "ivan-evdokimychev": {
    middleName: "",
    bio: `Привет! Меня зовут Иван, и я живу в Буэнос-Айресе уже больше пяти лет. За это время я успел полюбить эту страну — её культуру, природу и, конечно, людей.

Я организую авторские туры по Аргентине: от прогулок по историческому центру Буэнос-Айреса до поездок в Мендосу и Патагонию. Мне важно, чтобы каждый путешественник почувствовал себя не туристом, а гостем.

На моих турах вы узнаете, где пьют лучший мате, как заказывать стейк как местный и почему аргентинцы так любят футбол. Добро пожаловать в мою Аргентину!`,
    statusText: "Жду вас на моём туре по Аргентине 🇦🇷",
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

function normalizeProfile(profile: Partial<OrganizerProfile>): OrganizerProfile {
  return {
    middleName: profile.middleName ?? "",
    bio: profile.bio ?? "",
    statusText: profile.statusText ?? "",
    contacts: mergeContacts(profile.contacts),
    cancellation: mergeCancellation(profile.cancellation),
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
}

export function readOrganizerProfile(userId: string): OrganizerProfile {
  const profiles = readAll();
  return (
    profiles[userId] ??
    normalizeProfile({
      middleName: "",
      bio: "",
      statusText: "",
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
    contacts: patch.contacts ? { ...current.contacts, ...patch.contacts } : current.contacts,
    cancellation: patch.cancellation
      ? { ...current.cancellation, ...patch.cancellation }
      : current.cancellation,
  });

  profiles[userId] = next;
  writeAll(profiles);
  return { profile: next };
}
