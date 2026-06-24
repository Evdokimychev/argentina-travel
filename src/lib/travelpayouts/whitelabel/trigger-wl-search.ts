import { TRAVELPAYOUTS_WHITELABEL_SEARCH_CONTAINER_ID } from "@/lib/travelpayouts/whitelabel/config";

const WL_SUBMIT_SELECTORS = [
  'button[type="submit"]',
  'input[type="submit"]',
  ".search-form__submit",
  ".submit-button",
  ".button-primary",
  '[class*="submit"]',
  '[class*="Submit"]',
] as const;

function isClickableSubmit(element: Element): element is HTMLElement {
  if (!(element instanceof HTMLElement)) return false;
  if (element instanceof HTMLButtonElement || element instanceof HTMLInputElement) {
    return !element.disabled;
  }
  return true;
}

/** Click the partner search form submit button when URL params alone did not auto-start. */
export function triggerTravelpayoutsWhitelabelSearch(): boolean {
  const search = document.getElementById(TRAVELPAYOUTS_WHITELABEL_SEARCH_CONTAINER_ID);
  if (!search) return false;

  for (const selector of WL_SUBMIT_SELECTORS) {
    const candidates = search.querySelectorAll(selector);
    for (const candidate of candidates) {
      if (!isClickableSubmit(candidate)) continue;
      candidate.click();
      return true;
    }
  }

  const form = search.querySelector("form");
  if (form instanceof HTMLFormElement && typeof form.requestSubmit === "function") {
    form.requestSubmit();
    return true;
  }

  return false;
}
