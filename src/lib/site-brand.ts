import { getSiteUrl } from "@/lib/site-url";

export const SITE_BRAND_NAME = "Пора в Аргентину";

/** Публичный домен для брендинга в PDF, письмах и JSON-LD. */
export function getSiteBrandDomain(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_DOMAIN?.trim();
  if (fromEnv) return fromEnv.replace(/^https?:\/\//, "").replace(/\/$/, "");

  try {
    return new URL(getSiteUrl()).hostname;
  } catch {
    return "www.goargentina.ru";
  }
}

export function getSiteBrandUrl(): string {
  const domain = getSiteBrandDomain();
  return domain.startsWith("http") ? domain : `https://${domain}`;
}
