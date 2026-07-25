/**
 * Illustrative restaurant-bill breakdown. Deliberately has NO currency figures —
 * only relative shares of a hypothetical bill — so it never goes stale and
 * can't be mistaken for real pricing. Cubierto is explicitly marked as
 * "not universal" per editorial policy (CABA law 4407 vs. other provinces).
 */
export type SteakBillLineItem = {
  id: string;
  label: string;
  /** Illustrative share of the bill total, 0–1. Not a real percentage from any receipt. */
  share: number;
  note?: string;
  optional?: boolean;
};

export const STEAK_BILL_EXPLAINER_UI = {
  ariaLabel: "Из чего складывается счёт в parrilla",
  title: "Из чего складывается счёт",
  hint: "Иллюстративный пример структуры счёта — не реальные цены и не прайс-лист конкретного ресторана.",
  disclaimer:
    "Cubierto взимается не везде и не во всех провинциях регулируется одинаково. Propina — всегда добровольная надбавка сверх cubierto.",
} as const;

export const STEAK_BILL_LINE_ITEMS: SteakBillLineItem[] = [
  { id: "steak", label: "Основной отруб (например, bife de chorizo)", share: 0.5 },
  { id: "guarnicion", label: "Guarnición — гарнир", share: 0.12 },
  { id: "starter", label: "Закуска (например, provoleta) — если заказана", share: 0.12, optional: true },
  { id: "drinks", label: "Напитки", share: 0.11 },
  {
    id: "cubierto",
    label: "Cubierto / servicio de mesa",
    share: 0.05,
    note: "Не универсален — уточняйте, взимается ли он в конкретном заведении и провинции.",
    optional: true,
  },
  {
    id: "propina",
    label: "Propina — чаевые",
    share: 0.1,
    note: "Всегда добровольно, обычно сверх счёта, а не часть cubierto.",
    optional: true,
  },
];
