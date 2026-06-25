/** Injected into Aviasales `#tpwl-modals` shadow root — light-DOM `> *` rules do not reach it. */
export const TPWL_MODALS_SHADOW_STYLE_ID = "ga-tpwl-modals-interactive-fix";

const SHADOW_INTERACTIVE_STYLE = `
:host {
  pointer-events: none !important;
}
#tpwl-modals-root > * {
  pointer-events: auto !important;
}
/* Compact popovers — airport suggest, calendar, passengers. */
[class*="Popover-module__root"],
[class*="Popup-module__root"],
[class*="Dropdown-module__root"] {
  box-sizing: border-box !important;
  width: min(380px, calc(100dvw - 1rem)) !important;
  max-width: min(380px, calc(100dvw - 1rem)) !important;
  min-width: 0 !important;
}
@media (max-width: 639px) {
  [class*="Popover-module__root"],
  [class*="Popup-module__root"],
  [class*="Dropdown-module__root"] {
    width: calc(100dvw - 1rem) !important;
    max-width: calc(100dvw - 1rem) !important;
  }
}
[class*="Popover-module__root"] [class*="module__content"],
[class*="Popover-module__root"] [class*="module__body"],
[class*="Popover-module__root"] [class*="module__inner"],
[class*="Popover-module__root"] [class*="module__wrapper"] {
  padding: 0.5rem 0.75rem !important;
}
[class*="Passengers-module"],
[class*="Passenger-module"] {
  max-width: 100% !important;
}
[class*="Passengers-module"] [class*="module__row"],
[class*="Passenger-module"] [class*="module__row"] {
  padding-block: 0.375rem !important;
}
`;

const POPOVER_SELECTOR =
  '[class*="Popover-module__root"], [class*="Popup-module__root"], [class*="Dropdown-module__root"]';
const VIEWPORT_MARGIN = 8;
const POPOVER_GAP = 6;
const POPOVER_MAX_WIDTH = 380;
const FITTER_FLAG = "__gaPopoverFitterInstalled";
const TPWL_SEARCH_ID = "tpwl-search";

const TRIGGER_SELECTORS = [
  '[aria-expanded="true"]',
  '[data-state="open"]',
  "button[aria-haspopup][aria-expanded='true']",
].join(", ");

function collectShadowRoots(root: Element): ShadowRoot[] {
  const roots: ShadowRoot[] = [];
  const walk = (node: Element) => {
    if (node.shadowRoot) {
      roots.push(node.shadowRoot);
      node.shadowRoot.querySelectorAll("*").forEach((child) => {
        if (child instanceof HTMLElement) walk(child);
      });
    }
    node.querySelectorAll(":scope > *").forEach((child) => {
      if (child instanceof HTMLElement) walk(child);
    });
  };
  walk(root);
  return roots;
}

function queryInTpwlSearch(selector: string): HTMLElement | null {
  const search = document.getElementById(TPWL_SEARCH_ID);
  if (!search) return null;

  const match = search.querySelector<HTMLElement>(selector);
  if (match) return match;

  for (const root of collectShadowRoots(search)) {
    const shadowMatch = root.querySelector<HTMLElement>(selector);
    if (shadowMatch) return shadowMatch;
  }
  return null;
}

function findActivePopoverTrigger(): HTMLElement | null {
  const expanded = queryInTpwlSearch(TRIGGER_SELECTORS);
  if (expanded) return expanded;

  const active = document.activeElement;
  const search = document.getElementById(TPWL_SEARCH_ID);
  if (active instanceof HTMLElement && search?.contains(active)) return active;

  return null;
}

function clampHorizontal(left: number, width: number, vw: number, margin: number): number {
  return Math.max(margin, Math.min(left, vw - width - margin));
}

/**
 * Aviasales anchors popovers with `position:absolute; top:<viewportY>` inside the fixed
 * `#tpwl-modals` host. They often overlap the trigger input. We re-pin each popover below
 * the active trigger (`position:fixed`), clamp width, and cap height with internal scroll.
 */
function fitPopoverIntoViewport(pop: HTMLElement): void {
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const margin = VIEWPORT_MARGIN;
  const available = vh - margin * 2;
  const popWidth = Math.min(POPOVER_MAX_WIDTH, vw - margin * 2);

  pop.style.setProperty("max-height", "none", "important");
  const naturalHeight = pop.scrollHeight;
  const height = Math.min(naturalHeight, available);

  const trigger = findActivePopoverTrigger();
  let top: number;
  let left: number;

  if (trigger) {
    const triggerRect = trigger.getBoundingClientRect();
    top = triggerRect.bottom + POPOVER_GAP;
    left = clampHorizontal(triggerRect.left, popWidth, vw, margin);

    if (top + height > vh - margin) {
      const aboveTop = triggerRect.top - POPOVER_GAP - height;
      if (aboveTop >= margin) {
        top = aboveTop;
      } else {
        top = Math.max(margin, vh - margin - height);
      }
    }
  } else {
    const rect = pop.getBoundingClientRect();
    top = parseFloat(pop.style.top) || rect.top;
    left = parseFloat(pop.style.left) || rect.left;
    left = clampHorizontal(left, popWidth, vw, margin);

    if (top + height > vh - margin) top = vh - margin - height;
    if (top < margin) top = margin;
  }

  pop.style.setProperty("position", "fixed", "important");
  pop.style.setProperty("top", `${Math.round(top)}px`, "important");
  pop.style.setProperty("left", `${Math.round(left)}px`, "important");
  pop.style.setProperty("width", `${Math.round(popWidth)}px`, "important");
  pop.style.setProperty("max-width", `${Math.round(popWidth)}px`, "important");
  pop.style.setProperty("max-height", `${available}px`, "important");
  pop.style.setProperty("overflow-y", "auto", "important");
  pop.style.setProperty("overscroll-behavior", "contain", "important");
  pop.style.setProperty("transform", "none", "important");
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
