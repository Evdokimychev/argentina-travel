"use client";

import Link from "next/link";
import { Compass, Heart, House, MapPinned, UserRound, type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  getPublicMobileNavItems,
  isPublicMobileNavItemActive,
  type PublicMobileNavItemId,
} from "@/lib/public-mobile-nav";
import { publicMobileBottomNavClass } from "@/lib/responsive-ui";
import type { SiteModulesGlobal, SiteNavigationGlobal } from "@/types/site-globals";

const ICONS: Record<PublicMobileNavItemId, LucideIcon> = {
  home: House,
  tours: Compass,
  map: MapPinned,
  favorites: Heart,
  profile: UserRound,
};

export default function PublicMobileBottomNav({
  navigation,
  modules,
}: {
  navigation?: SiteNavigationGlobal;
  modules?: SiteModulesGlobal;
}) {
  const pathname = usePathname() || "/";
  const items = getPublicMobileNavItems(navigation, modules);

  return (
    <nav className={publicMobileBottomNavClass} aria-label="Основная навигация">
      <div className="grid grid-flow-col auto-cols-fr items-center">
        {items.map((item) => {
          const Icon = ICONS[item.id];
          const active = isPublicMobileNavItemActive(item, pathname);

          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-h-14 min-w-11 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40",
                active ? "text-sky-ink" : "text-muted hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-9 items-center justify-center rounded-xl transition-colors",
                  active ? "bg-sky/12 text-sky-ink" : "text-muted",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.85} aria-hidden />
              </span>
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
