import type { BlogAffiliateService } from "@/lib/blog-affiliate-zones";

/** UTM и ref для партнёрских переходов из блога. */
export function withBlogAffiliateAttribution(
  href: string,
  input: { postSlug: string; service: BlogAffiliateService },
): string {
  const base = href.startsWith("http") ? href : `https://www.goargentina.ru${href.startsWith("/") ? href : `/${href}`}`;

  try {
    const url = new URL(base);
    url.searchParams.set("utm_source", "blog");
    url.searchParams.set("utm_medium", "affiliate_zone");
    url.searchParams.set("utm_campaign", input.service);
    url.searchParams.set("utm_content", input.postSlug);

    if (!href.startsWith("http")) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
    return url.toString();
  } catch {
    return href;
  }
}
