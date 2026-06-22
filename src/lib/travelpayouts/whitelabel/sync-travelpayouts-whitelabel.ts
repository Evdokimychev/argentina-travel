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
    const el = document.getElementById(id);
    if (el) normalizeContainer(el);
  }

  const search = document.getElementById(TRAVELPAYOUTS_WHITELABEL_SEARCH_CONTAINER_ID);
  if (!search || !mount.contains(search)) return false;
  return search.offsetHeight > 60 || search.childElementCount > 0;
}
