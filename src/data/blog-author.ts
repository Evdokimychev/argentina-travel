import { SITE_SUPPORT_EMAIL } from "@/data/site-support-email";

export const BLOG_EDITORIAL = {
  name: "Редакция «Пора в Аргентину»",
  bio: "Пишем для тех, кто планирует поездку или переезд: практика, проверенные маршруты и связка с путеводителем, иммиграцией и турами на платформе.",
  /** Compact avatar derivative — never the full article hero JPEG. */
  avatar: "/media/blog/editorial-avatar.webp",
  email: SITE_SUPPORT_EMAIL,
} as const;
