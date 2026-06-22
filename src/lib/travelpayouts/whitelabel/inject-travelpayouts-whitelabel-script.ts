import { FLIGHTS_WL_SCRIPT_ID } from "@/lib/travelpayouts/whitelabel/flights-dom-ids";

/** Mirrors Travelpayouts dashboard embed — script in document.head, type=module, async. */
export function injectTravelpayoutsWhitelabelScript(scriptUrl: string): HTMLScriptElement | null {
  if (typeof document === "undefined" || !scriptUrl) return null;

  const existing = document.getElementById(FLIGHTS_WL_SCRIPT_ID);
  if (existing instanceof HTMLScriptElement) return existing;

  const script = document.createElement("script");
  script.id = FLIGHTS_WL_SCRIPT_ID;
  script.async = true;
  script.type = "module";
  script.src = scriptUrl;
  document.head.appendChild(script);
  return script;
}
