import {
  TRAVELPAYOUTS_WHITELABEL_SEARCH_CONTAINER_ID,
  TRAVELPAYOUTS_WHITELABEL_TICKETS_CONTAINER_ID,
} from "@/lib/travelpayouts/whitelabel/config";
import { ensureTpwlModalsInteractive } from "@/lib/travelpayouts/whitelabel/ensure-tpwl-modals-interactive";
import { sanitizeAviasalesInjectedStyles } from "@/lib/travelpayouts/whitelabel/sanitize-aviasales-styles";

const WL_CONTAINER_IDS = [
  TRAVELPAYOUTS_WHITELABEL_SEARCH_CONTAINER_ID,
  TRAVELPAYOUTS_WHITELABEL_TICKETS_CONTAINER_ID,
] as const;

const FLIGHTS_WL_SEARCH_CARD_CLASS = "flights-wl-mount";

/** Partner sometimes pins search/results with fixed layout — keep them in page flow. */
function normalizeContainer(el: HTMLElement) {
  el.style.position = "relative";
  el.style.top = "auto";
  el.style.left = "auto";
  el.style.right = "auto";
  el.style.width = "100%";
  el.style.maxWidth = "100%";
  el.style.minHeight = "0";
  el.style.margin = "0";
  el.style.overflow = "visible";
  el.style.transform = "none";
  el.style.display = "";
}

function normalizeResultsWrappers(container: HTMLElement) {
  container.querySelectorAll(".TPWL-template-wrapper").forEach((node) => {
    normalizeContainer(node as HTMLElement);
  });
}

function getSearchCardMount(root: HTMLElement): HTMLElement {
  return root.querySelector(`.${FLIGHTS_WL_SEARCH_CARD_CLASS}`) ?? root;
}

/**
 * Partner script may reparent #tpwl-search / #tpwl-tickets to body or a fixed layer.
 * Keep search in the card and results directly below it on the same page — see docs/avia-white-label.html.
 */
function ensureContainerInMount(root: HTMLElement, id: string) {
  const el = document.getElementById(id);
  if (!el) return null;

  const searchCard = getSearchCardMount(root);

  if (id === TRAVELPAYOUTS_WHITELABEL_SEARCH_CONTAINER_ID) {
    if (!searchCard.contains(el)) searchCard.appendChild(el);
  } else if (!root.contains(el) || el.parentElement !== root || el.previousElementSibling !== searchCard) {
    root.insertBefore(el, searchCard.nextSibling);
  }

  normalizeContainer(el);
  normalizeResultsWrappers(el);
  return el;
}

/** Popovers render in #tpwl-modals on body — same as WordPress / official embed. */
function ensureModalsOnBody() {
  const modals = document.getElementById("tpwl-modals");
  if (!modals || modals.parentElement === document.body) return;

  modals.removeAttribute("style");
  document.body.appendChild(modals);
}

export function syncTravelpayoutsWhitelabelMount(mount: HTMLElement): boolean {
  sanitizeAviasalesInjectedStyles();
  ensureModalsOnBody();
  ensureTpwlModalsInteractive();

  for (const id of WL_CONTAINER_IDS) {
    ensureContainerInMount(mount, id);
  }

  const search = document.getElementById(TRAVELPAYOUTS_WHITELABEL_SEARCH_CONTAINER_ID);
  if (!search || !mount.contains(search)) return false;
  return search.offsetHeight > 60 || search.childElementCount > 0;
}

/** Scroll to inline results once the partner fills #tpwl-tickets. */
export function scrollTravelpayoutsWhitelabelResultsIntoView(): boolean {
  const tickets = document.getElementById(TRAVELPAYOUTS_WHITELABEL_TICKETS_CONTAINER_ID);
  if (!tickets || tickets.childElementCount === 0) return false;

  tickets.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}
