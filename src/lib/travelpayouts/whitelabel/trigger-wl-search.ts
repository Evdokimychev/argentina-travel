import { TRAVELPAYOUTS_WHITELABEL_SEARCH_CONTAINER_ID } from "@/lib/travelpayouts/whitelabel/config";

const WL_SUBMIT_SELECTORS = [
  'button[type="submit"]',
  ".search-form__submit",
  ".submit-button",
  ".button-primary",
] as const;

/** Click the partner search form submit button when URL params alone did not auto-start. */
export function triggerTravelpayoutsWhitelabelSearch(): boolean {
  const search = document.getElementById(TRAVELPAYOUTS_WHITELABEL_SEARCH_CONTAINER_ID);
  if (!search) return false;

  for (const selector of WL_SUBMIT_SELECTORS) {
    const candidate = search.querySelector(selector);
    if (candidate instanceof HTMLButtonElement && !candidate.disabled) {
      candidate.click();
      return true;
    }
    if (candidate instanceof HTMLElement) {
      candidate.click();
      return true;
    }
  }

  return false;
}
