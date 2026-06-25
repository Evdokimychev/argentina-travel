/**
 * Z-index contract — values from src/styles/tokens.css (--token-z-*).
 * Use Tailwind utilities: z-header, z-dialog, z-toast, etc. (see globals.css @theme).
 */

export const Z_INDEX = {
  base: 0,
  raised: 10,
  dropdown: 40,
  sticky: 50,
  header: 50,
  megaMenu: 55,
  overlay: 60,
  navDrawer: 60,
  cookie: 80,
  floatingWidget: 88,
  scrollRail: 85,
  lightbox: 100,
  popover: 110,
  dialog: 115,
  dialogElevated: 116,
  partnerModals: 120,
  toast: 120,
  progress: 130,
} as const;

export type ZIndexToken = keyof typeof Z_INDEX;
