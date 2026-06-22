/** Injected into Aviasales `#tpwl-modals` shadow root — light-DOM `> *` rules do not reach it. */
export const TPWL_MODALS_SHADOW_STYLE_ID = "ga-tpwl-modals-interactive-fix";

const SHADOW_INTERACTIVE_STYLE = `
:host {
  pointer-events: none !important;
}
#tpwl-modals-root > * {
  pointer-events: auto !important;
}
/* Popovers use position:absolute — keep within viewport on mobile and short screens. */
[class*="Popover-module__root"] {
  max-width: min(752px, calc(100vw - 1rem)) !important;
  max-height: calc(100dvh - 1rem) !important;
  overflow-y: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
[class*="DateRangePicker-module__popoverRoot"] {
  max-height: inherit;
}
`;

/** Re-enable clicks on autocomplete, date picker, and passenger popovers inside shadow DOM. */
export function ensureTpwlModalsInteractive(): void {
  const modals = document.getElementById("tpwl-modals");
  const root = modals?.shadowRoot;
  if (!root) return;

  let style = root.getElementById(TPWL_MODALS_SHADOW_STYLE_ID);
  if (!style) {
    style = document.createElement("style");
    style.id = TPWL_MODALS_SHADOW_STYLE_ID;
    root.prepend(style);
  }
  if (style.textContent !== SHADOW_INTERACTIVE_STYLE) {
    style.textContent = SHADOW_INTERACTIVE_STYLE;
  }
}
