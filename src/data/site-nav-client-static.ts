import type { SiteNavLink } from "@/types/site-nav";

/** Static service links used by client mega-menu chrome without loading the full nav catalog. */
export const NAV_FOOTER_SERVICE_LINKS: SiteNavLink[] = [
  { id: "footer-flights", label: "Авиабилеты", labelKey: "nav.flights", href: "/flights" },
  { id: "footer-transfers", label: "Трансферы", labelKey: "nav.transfers", href: "/transfers" },
  { id: "footer-esim", label: "eSIM", labelKey: "nav.esim", href: "/esim" },
  { id: "footer-insurance", label: "Страховка", labelKey: "nav.insurance", href: "/insurance" },
  { id: "footer-car-rental", label: "Аренда авто", labelKey: "nav.carRental", href: "/car-rental" },
  { id: "footer-audio-guides", label: "Аудиогиды", labelKey: "nav.audioGuides", href: "/audio-guides" },
];

/** Priority order for the adaptive desktop header. */
export const SITE_NAV_DESKTOP_PRIORITY_IDS = [
  "geography",
  "tours",
  "excursions",
  "guide",
  "immigration",
] as const;
