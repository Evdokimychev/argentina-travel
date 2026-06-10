export const SITE_LEGAL_LINKS = [
  { href: "/legal/privacy", label: "Политика конфиденциальности" },
  { href: "/legal/terms", label: "Пользовательское соглашение" },
  { href: "/legal/booking", label: "Условия бронирования" },
  { href: "/legal/refunds", label: "Политика возвратов" },
] as const;

export const SITE_FOOTER_NAV = [
  { href: "/", label: "Главная" },
  { href: "/tours", label: "Каталог туров" },
  { href: "/about", label: "О проекте" },
  { href: "/join", label: "Для организаторов" },
  { href: "/blog", label: "Блог" },
  { href: "/faq", label: "FAQ" },
  { href: "/contacts", label: "Контакты" },
] as const;

export const SITE_FOOTER_CONTACTS = [
  { href: "/contacts", label: "Написать нам" },
  { href: "/join", label: "Стать организатором" },
  { href: "/booking/find", label: "Найти заявку" },
] as const;

export const SITE_SOCIAL_LINKS = [
  { href: "https://t.me/", label: "Telegram", external: true },
  { href: "https://instagram.com/", label: "Instagram", external: true },
] as const;
