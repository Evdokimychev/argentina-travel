import { safeRemoveElement } from "@/lib/dom/safe-partner-dom";
import {
  TRAVELPAYOUTS_WHITELABEL_SEARCH_CONTAINER_ID,
  TRAVELPAYOUTS_WHITELABEL_TICKETS_CONTAINER_ID,
} from "@/lib/travelpayouts/whitelabel/config";
import { FLIGHTS_WL_SCRIPT_ID } from "@/lib/travelpayouts/whitelabel/flights-dom-ids";
import { removeAviasalesInjectedStyles } from "@/lib/travelpayouts/whitelabel/sanitize-aviasales-styles";

/** Drop partner DOM + script so the next mount re-reads `location.search` (modal / inline). */
export function resetTravelpayoutsWhitelabelWidget(): void {
  if (typeof document === "undefined") return;

  for (const id of [
    TRAVELPAYOUTS_WHITELABEL_SEARCH_CONTAINER_ID,
    TRAVELPAYOUTS_WHITELABEL_TICKETS_CONTAINER_ID,
  ]) {
    const el = document.getElementById(id);
    el?.replaceChildren();
  }

  const modals = document.getElementById("tpwl-modals");
  if (modals) safeRemoveElement(modals);

  const script = document.getElementById(FLIGHTS_WL_SCRIPT_ID);
  if (script) safeRemoveElement(script);

  removeAviasalesInjectedStyles();
}
