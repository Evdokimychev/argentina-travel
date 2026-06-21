/**
 * Статические редиректы для URL из контент-плана Claude (docs/articles).
 * Внутренние ссылки в статьях ведут на /marshruty/, /dengi/, /pereezd/ и т.д.;
 * канонические страницы опубликованы в /blog/{slug}.
 */
export const CONTENT_PLAN_URL_REDIRECTS: Record<string, string> = {
  "/marshruty/argentina-2-nedeli": "/blog/argentina-2-nedeli-marshrut",
  "/marshruty/argentina-10-dnej": "/blog/argentina-10-dnej-3-nedeli",
  "/marshruty/ruta-40-sem-ozer": "/blog/ruta-40-sem-ozer",
  "/dengi/stoimost-zhizni-ba": "/blog/stoimost-zhizni-buenos-aires",
  "/dengi/kak-menyat-dengi": "/blog/kak-menyat-dengi-argentina",
  "/dengi/kak-menyat-valyutu": "/blog/kak-menyat-dengi-argentina",
  "/dengi/byudzhet-poezdki": "/blog/byudzhet-poezdki-argentina",
  "/transport/vnutrennie-aviabilety": "/blog/vnutrennie-aviabilety-argentina",
  "/transport/kak-dobratsya-v-argentinu": "/blog/kak-dobratsya-v-argentinu",
  "/goroda/buenos-aires-rajony": "/blog/buenos-aires-rajony",
  "/goroda/mendoza-vino": "/blog/mendoza-vinnyj-gid",
  "/pereezd/vnzh-argentina": "/blog/vnzh-argentina-rezidenciya",
  "/pereezd/viza-cifrovogo-kochevnika": "/blog/viza-cifrovogo-kochevnika-argentina",
  "/pereezd/dni-cuil": "/blog/dni-cuil-argentina",
  "/pereezd/grazhdanstvo": "/blog/grazhdanstvo-argentiny",
  "/pereezd/bankovskij-schet": "/blog/bankovskij-schet-argentina",
  "/blog/buenos-aires-neighborhoods": "/blog/buenos-aires-rajony",
  "/blog/mendoza-wine-route": "/blog/mendoza-vinnyj-gid",
  "/parki/ischigualasto-valle-de-la-luna": "/blog/ischigualasto-valle-de-la-luna",
};

export function matchContentPlanRedirect(pathname: string): string | null {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.replace(/\/+$/, "")
      : pathname;
  return CONTENT_PLAN_URL_REDIRECTS[normalized] ?? null;
}
