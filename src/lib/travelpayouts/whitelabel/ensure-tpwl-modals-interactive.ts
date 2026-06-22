/** Injected into Aviasales `#tpwl-modals` shadow root — light-DOM `> *` rules do not reach it. */
export const TPWL_MODALS_SHADOW_STYLE_ID = "ga-tpwl-modals-interactive-fix";

const SHADOW_INTERACTIVE_STYLE = `
:host {
  pointer-events: none !important;
}
#tpwl-modals-root > * {
  pointer-events: auto !important;
}
/* Horizontal clamp for mobile; vertical fit is handled by the popover fitter (JS). */
[class*="Popover-module__root"] {
  max-width: min(752px, calc(100vw - 1rem)) !important;
}
`;

const POPOVER_SELECTOR = '[class*="Popover-module__root"]';
const VIEWPORT_MARGIN = 8;
const FITTER_FLAG = "__gaPopoverFitterInstalled";

/**
 * Aviasales anchors popovers right below their trigger using `position:absolute; top:<viewportY>`
 * inside the fixed `#tpwl-modals` host. When the trigger sits low on the page, a tall calendar
 * overflows the bottom of the screen and dates become unreachable. CSS `max-height` cannot fix it
 * (the element is shorter than the viewport — only its top offset is wrong), so we re-pin each
 * popover into the viewport (`position:fixed`) and cap its height with internal scroll as a
 * fallback. Runs on every animation frame so it survives Aviasales' own scroll/resize repositioning.
 */
function fitPopoverIntoViewport(pop: HTMLElement): void {
  const vh = window.innerHeight;
  const margin = VIEWPORT_MARGIN;
  const available = vh - margin * 2;

  pop.style.setProperty("max-height", "none", "important");
  const naturalHeight = pop.scrollHeight;
  const height = Math.min(naturalHeight, available);

  const anchorTop = parseFloat(pop.style.top) || pop.getBoundingClientRect().top;
  let top = anchorTop;
  if (top + height > vh - margin) top = vh - margin - height;
  if (top < margin) top = margin;

  pop.style.setProperty("position", "fixed", "important");
  pop.style.setProperty("top", `${Math.round(top)}px`, "important");
  pop.style.setProperty("max-height", `${available}px`, "important");
  pop.style.setProperty("overflow-y", "auto", "important");
  pop.style.setProperty("overscroll-behavior", "contain", "important");
}

function installPopoverFitter(host: HTMLElement, root: ShadowRoot): void {
  const flagged = host as HTMLElement & { [FITTER_FLAG]?: boolean };
  if (flagged[FITTER_FLAG]) return;
  flagged[FITTER_FLAG] = true;

  const tick = () => {
    if (!host.isConnected) {
      flagged[FITTER_FLAG] = false;
      return;
    }
    root.querySelectorAll<HTMLElement>(POPOVER_SELECTOR).forEach(fitPopoverIntoViewport);
    window.requestAnimationFrame(tick);
  };

  window.requestAnimationFrame(tick);
}

/** Re-enable clicks and keep popovers within the viewport inside the partner shadow DOM. */
export function ensureTpwlModalsInteractive(): void {
  const modals = document.getElementById("tpwl-modals");
  const root = modals?.shadowRoot;
  if (!modals || !root) return;

  let style = root.getElementById(TPWL_MODALS_SHADOW_STYLE_ID);
  if (!style) {
    style = document.createElement("style");
    style.id = TPWL_MODALS_SHADOW_STYLE_ID;
    root.prepend(style);
  }
  if (style.textContent !== SHADOW_INTERACTIVE_STYLE) {
    style.textContent = SHADOW_INTERACTIVE_STYLE;
  }

  installPopoverFitter(modals, root);
}
