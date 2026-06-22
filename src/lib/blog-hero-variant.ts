export type BlogHeroVariant = "a" | "b";

export const BLOG_HERO_VARIANT_KEY = "argentina-travel-blog-hero-variant-v1";

export const BLOG_HERO_COPY: Record<
  BlogHeroVariant,
  { subtitle: string; primaryCta: string; secondaryCta: string }
> = {
  a: {
    subtitle:
      "Проверенные материалы — от Патагонии и Игуасу до виз, денег и районов Буэнос-Айреса. Начните с редакционных статей или выберите тему.",
    primaryCta: "Справочник мест",
    secondaryCta: "Путеводитель",
  },
  b: {
    subtitle:
      "Планируете поездку или переезд? Короткие гиды, чек-листы и маршруты — с привязкой к турам и сервисам на платформе.",
    primaryCta: "Подбор маршрута",
    secondaryCta: "Все статьи",
  },
};

export function resolveBlogHeroVariant(stored?: string | null): BlogHeroVariant {
  return stored === "b" ? "b" : "a";
}

export function pickBlogHeroVariant(): BlogHeroVariant {
  if (typeof window === "undefined") return "a";
  const existing = window.localStorage.getItem(BLOG_HERO_VARIANT_KEY);
  if (existing === "a" || existing === "b") return existing;
  const next: BlogHeroVariant = Math.random() < 0.5 ? "a" : "b";
  window.localStorage.setItem(BLOG_HERO_VARIANT_KEY, next);
  return next;
}
