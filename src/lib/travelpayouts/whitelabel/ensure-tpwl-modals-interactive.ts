/** Injected into Aviasales `#tpwl-modals` shadow root — light-DOM `> *` rules do not reach it. */
export const TPWL_MODALS_SHADOW_STYLE_ID = "ga-tpwl-modals-interactive-fix";

const SHADOW_INTERACTIVE_STYLE = `
:host {
  pointer-events: none !important;
}
#tpwl-modals-root > * {
  pointer-events: auto !important;
}
`;

/** Re-enable clicks on autocomplete, date picker, and passenger popovers inside shadow DOM. */
export function ensureTpwlModalsInteractive(): void {
  const modals = document.getElementById("tpwl-modals");
  const root = modals?.shadowRoot;
  if (!root || root.getElementById(TPWL_MODALS_SHADOW_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = TPWL_MODALS_SHADOW_STYLE_ID;
  style.textContent = SHADOW_INTERACTIVE_STYLE;
  root.prepend(style);
}
