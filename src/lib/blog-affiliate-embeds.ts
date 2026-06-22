import type { BlogAffiliateService } from "@/lib/blog-affiliate-zones";

export type BlogAffiliateEmbedConfig = {
  service: BlogAffiliateService;
  embedUrl: string | null;
  title: string;
  minHeight: number;
};

function readEmbedUrl(envKey: string): string | null {
  const value = process.env[envKey]?.trim();
  return value && value.startsWith("http") ? value : null;
}

/** Partner SDK embed slots — env-gated; fallback to card links in BlogAffiliateZone. */
export function resolveBlogAffiliateEmbed(
  service: BlogAffiliateService,
): BlogAffiliateEmbedConfig | null {
  if (service === "car-rental") {
    return {
      service,
      embedUrl: readEmbedUrl("NEXT_PUBLIC_LOCALRENT_EMBED_URL"),
      title: "Подбор авто LocalRent",
      minHeight: 420,
    };
  }

  return null;
}

export function resolveBlogAffiliateEmbedForPost(input: {
  category: string;
  tags: string[];
}): BlogAffiliateEmbedConfig | null {
  const carCategories = new Set(["Патагония", "Север Аргентины", "Транспорт", "Горы и треккинг"]);
  const carTags = new Set(["авто", "аренда", "логистика"]);

  const wantsCar =
    carCategories.has(input.category) ||
    input.tags.some((tag) => carTags.has(tag.toLowerCase()));

  if (!wantsCar) return null;
  return resolveBlogAffiliateEmbed("car-rental");
}
