export const TOURIST_ONBOARDING_DISMISSED_KEY = "argentina-travel-tourist-onboarding-dismissed";
export const ORGANIZER_ONBOARDING_DISMISSED_KEY = "argentina-travel-organizer-onboarding-dismissed";

export const ONBOARDING_UPDATED_EVENT = "onboarding-updated";

function readFlag(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeFlag(key: string, value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (value) {
      window.localStorage.setItem(key, "1");
    } else {
      window.localStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(ONBOARDING_UPDATED_EVENT));
}

export function isTouristOnboardingDismissed(): boolean {
  return readFlag(TOURIST_ONBOARDING_DISMISSED_KEY);
}

export function dismissTouristOnboarding(): void {
  writeFlag(TOURIST_ONBOARDING_DISMISSED_KEY, true);
}

export function isOrganizerOnboardingDismissed(): boolean {
  return readFlag(ORGANIZER_ONBOARDING_DISMISSED_KEY);
}

export function dismissOrganizerOnboarding(): void {
  writeFlag(ORGANIZER_ONBOARDING_DISMISSED_KEY, true);
}
