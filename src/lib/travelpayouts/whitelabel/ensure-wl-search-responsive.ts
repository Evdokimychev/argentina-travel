const RESPONSIVE_STYLE_ID = "goargentina-wl-responsive";

export const TRAVELPAYOUTS_WL_RESPONSIVE_CSS = `
@media (max-width: 1023px) {
  [class*="DefaultSearch-module__root"] {
    display: grid !important;
    grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr) !important;
    gap: 0.5rem !important;
    height: auto !important;
  }

  [class*="DefaultSearch-module__mergedInputs"],
  [class*="DateRangePicker-module__mergedInputs"] {
    display: grid !important;
    grid-column: 1 / -1 !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    width: 100% !important;
  }

  [class*="DefaultSearch-module__mergedInputs"] > *,
  [class*="DateRangePicker-module__mergedInputs"] > * {
    width: auto !important;
    min-width: 0 !important;
  }

  [class*="DefaultSearch-module__passengersPicker"] {
    width: 100% !important;
    min-width: 0 !important;
  }

  [class*="DefaultSearch-module__submitBtn"] {
    grid-column: 2 !important;
    width: 100% !important;
    min-width: 0 !important;
    max-width: none !important;
  }
}
`;

export function ensureTravelpayoutsSearchResponsive(searchRoot: HTMLElement): boolean {
  const shadowRoot = searchRoot.shadowRoot;
  if (!shadowRoot || shadowRoot.getElementById(RESPONSIVE_STYLE_ID)) return false;

  const style = document.createElement("style");
  style.id = RESPONSIVE_STYLE_ID;
  style.textContent = TRAVELPAYOUTS_WL_RESPONSIVE_CSS;
  shadowRoot.appendChild(style);
  return true;
}
