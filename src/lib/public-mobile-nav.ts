import type { SiteModulesGlobal, SiteNavigationGlobal } from "@/types/site-globals";
import { isPublicLinkEnabled } from "@/lib/public-module-visibility";

export type PublicMobileNavItemId = "home" | "tours" | "map" | "favorites" | "profile";

export type PublicMobileNavItem = {
  id: PublicMobileNavItemId;
  href: string;
  label: string;
};

export const PUBLIC_MOBILE_NAV_ITEMS: readonly PublicMobileNavItem[] = [
  { id: "home", href: "/", label: "Главная" },
  { id: "tours", href: "/tours", label: "Туры" },
  { id: "map", href: "/mapa-argentina", label: "Карта" },
  { id: "favorites", href: "/profile/favorites", label: "Избранное" },
  { id: "profile", href: "/profile", label: "Профиль" },
] as const;

const PUBLIC_MOBILE_NAV_HIDDEN_ROOTS = [
  "/admin",
  "/organizer",
  "/profile",
  "/booking",
  "/trip",
  "/pay",
  "/auth",
  "/login",
  "/register",
  "/embed",
  "/maintenance",
] as const;

function isPathWithin(pathname: string, root: string): boolean {
  return pathname === root || pathname.startsWith(`${root}/`);
}

/**
 * Booking detail screens own the bottom edge with their primary action.
 * Workspaces and transactional screens use their own focused navigation.
 */
export function shouldShowPublicMobileNav(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  if (PUBLIC_MOBILE_NAV_HIDDEN_ROOTS.some((root) => isPathWithin(pathname, root))) {
    return false;
  }
  return !/^\/(?:tours|excursions)\/[^/]+\/?$/.test(pathname);
}

export function getPublicMobileNavItems(
  navigation?: SiteNavigationGlobal,
  modules?: SiteModulesGlobal,
): PublicMobileNavItem[] {
  if (!navigation) return [...PUBLIC_MOBILE_NAV_ITEMS];
  return PUBLIC_MOBILE_NAV_ITEMS.filter((item) =>
    isPublicLinkEnabled(item.href, navigation, modules),
  );
}

export function isPublicMobileNavItemActive(
  item: PublicMobileNavItem,
  pathname: string,
): boolean {
  if (item.id === "home") return pathname === "/";
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
