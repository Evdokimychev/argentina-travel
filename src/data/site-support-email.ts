/** Канонический email поддержки — совпадает с DEFAULT_SITE_CONTACT в CMS. */
export const SITE_SUPPORT_EMAIL = "hello@goargentina.ru";

export const SITE_EMAIL = {
  display: SITE_SUPPORT_EMAIL,
  href: `mailto:${SITE_SUPPORT_EMAIL}`,
  note: "Почта для связи, предложений и сотрудничества",
} as const;
