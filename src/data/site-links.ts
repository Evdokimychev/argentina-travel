export const SITE_LEGAL_LINKS = [
  { href: "/legal/privacy", label: "Политика конфиденциальности", labelKey: "legal.privacy" },
  { href: "/legal/terms", label: "Пользовательское соглашение", labelKey: "legal.terms" },
  { href: "/legal/booking", label: "Условия бронирования", labelKey: "legal.booking" },
  { href: "/legal/refunds", label: "Политика возвратов", labelKey: "legal.refunds" },
  { href: "/legal/cookies", label: "Политика cookie", labelKey: "legal.cookies" },
  { href: "/legal/affiliate", label: "Партнёрские ссылки", labelKey: "legal.affiliate" },
] as const;

/** Primary footer links — synced with `@/data/site-nav` top-level sections. */
export const SITE_FOOTER_NAV = [
  { href: "/", label: "Главная", labelKey: "nav.home" },
  { href: "/destinations", label: "Регионы и места", labelKey: "nav.geography" },
  { href: "/tours", label: "Туры", labelKey: "nav.tours" },
  { href: "/guide", label: "Путеводитель", labelKey: "nav.guide" },
  { href: "/immigration", label: "Иммиграция", labelKey: "nav.immigration" },
  { href: "/gallery", label: "Галерея", labelKey: "nav.gallery" },
  { href: "/shop", label: "Магазин", labelKey: "nav.shop" },
  { href: "/services", label: "Сервисы", labelKey: "nav.services" },
  { href: "/blog", label: "Блог", labelKey: "nav.blog" },
  { href: "/forum", label: "Форум", labelKey: "nav.forum" },
  { href: "/about", label: "О проекте", labelKey: "nav.about" },
  { href: "/join", label: "Для организаторов", labelKey: "nav.utility.join" },
  { href: "/faq", label: "Частые вопросы", labelKey: "nav.faq" },
  { href: "/contacts", label: "Контакты", labelKey: "nav.contacts" },
] as const;

import { SITE_INSTAGRAM_URL, SITE_TELEGRAM_URL } from "@/data/site-contacts";

export const SITE_FOOTER_CONTACTS = [
  { href: "/contacts", label: "Написать нам", labelKey: "footer.contact.write" },
  { href: "/join", label: "Стать организатором", labelKey: "footer.contact.organizer" },
  { href: "/booking/find", label: "Найти заявку", labelKey: "footer.contact.findBooking" },
] as const;

export type SiteSocialLink = {
  href: string;
  label: string;
  external: true;
};

/** Fallback when CMS contact globals omit social URLs. */
export const SITE_SOCIAL_LINKS: readonly SiteSocialLink[] = [
  { href: SITE_TELEGRAM_URL, label: "Telegram", external: true },
  { href: SITE_INSTAGRAM_URL, label: "Instagram", external: true },
];

/** Primary public navigation lives in `@/data/site-nav`. Footer mirrors main sections. */
