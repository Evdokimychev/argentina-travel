"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { forwardRef, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, Menu, Search } from "lucide-react";
import ArgentinaLogo from "@/components/ArgentinaLogo";
import LocaleCurrencySwitcher from "@/components/LocaleCurrencySwitcher";
import ProfileMenu from "@/components/auth/ProfileMenu";
import { MegaMenuTrigger } from "@/components/navigation/MegaMenuTrigger";
import { SiteNavFullScreenOverlay } from "@/components/navigation/SiteNavDrawer";
import { useAuth } from "@/context/AuthContext";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import {
  SITE_NAV_MOBILE_SECTIONS,
  SITE_NAV_OVERFLOW_SECTIONS,
  SITE_NAV_PRIMARY_SECTIONS,
  SITE_NAV_UTILITY_LINKS,
} from "@/data/site-nav";
import { useCanGoBack } from "@/hooks/useCanGoBack";
import { cn } from "@/lib/cn";
import { openSiteSearch } from "@/lib/site-search-open";
import { siteViewportInsetClass } from "@/lib/site-container";
import { isNavSectionActive, resolveNavLabel } from "@/lib/site-nav";

function useIsLgUp() {
  const [isLgUp, setIsLgUp] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsLgUp(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return isLgUp;
}

const CircleButton = forwardRef<
  HTMLButtonElement,
  {
    href?: string;
    onClick?: () => void;
    ariaLabel: string;
    ariaExpanded?: boolean;
    ariaControls?: string;
    children: React.ReactNode;
    className?: string;
  }
>(function CircleButton(
  { href, onClick, ariaLabel, ariaExpanded, ariaControls, children, className },
  ref
) {
  const cls = cn(
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-charcoal/[0.06] text-foreground ring-1 ring-charcoal/10 backdrop-blur-sm transition-colors hover:bg-sky/10 hover:text-sky hover:ring-sky/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40",
    className
  );
  const aria = {
    "aria-label": ariaLabel,
    ...(ariaExpanded !== undefined ? { "aria-expanded": ariaExpanded } : {}),
    ...(ariaControls ? { "aria-controls": ariaControls } : {}),
  };

  if (href) {
    return (
      <Link href={href} className={cls} {...aria}>
        {children}
      </Link>
    );
  }

  return (
    <button ref={ref} type="button" onClick={onClick} className={cls} {...aria}>
      {children}
    </button>
  );
});

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const canGoBack = useCanGoBack();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openMegaMenuId, setOpenMegaMenuId] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const desktopMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const isLgUp = useIsLgUp();
  const { t } = useLocaleCurrency();
  const { isAuthenticated, openAuth } = useAuth();

  const overlaySections = isLgUp ? SITE_NAV_OVERFLOW_SECTIONS : SITE_NAV_MOBILE_SECTIONS;
  const overlayTitle = isLgUp ? t("nav.more") : t("nav.menu");
  const menuTriggerRef = isLgUp ? desktopMenuTriggerRef : mobileMenuTriggerRef;
  const hasOverflowSections = SITE_NAV_OVERFLOW_SECTIONS.length > 0;

  useEffect(() => {
    setMenuOpen(false);
    setOpenMegaMenuId(null);
  }, [pathname]);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const syncHeaderHeight = () => {
      document.documentElement.style.setProperty(
        "--site-header-height",
        `${header.offsetHeight}px`
      );
    };

    syncHeaderHeight();
    const observer = new ResizeObserver(syncHeaderHeight);
    observer.observe(header);
    window.addEventListener("resize", syncHeaderHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncHeaderHeight);
      document.documentElement.style.removeProperty("--site-header-height");
    };
  }, [menuOpen]);

  const utilityLinks = SITE_NAV_UTILITY_LINKS;

  const mobileMenuFooter = (
    <>
      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => {
            setMenuOpen(false);
            openSiteSearch();
          }}
          className="mb-3 flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-charcoal transition-colors hover:border-sky/30 hover:bg-sky/5 hover:text-sky"
        >
          <Search className="h-4 w-4 shrink-0 text-sky" strokeWidth={1.75} aria-hidden />
          Поиск по сайту
        </button>
        <LocaleCurrencySwitcher />
      </div>
      <div className="mt-3 border-t border-border-subtle pt-3 sm:mt-0 sm:border-t-0 sm:pt-0">
        {isAuthenticated ? (
          <Link
            href="/profile"
            onClick={() => setMenuOpen(false)}
            className="inline-flex px-3 py-2 text-sm font-medium text-foreground hover:text-sky"
          >
            {t("nav.profile")}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              openAuth();
            }}
            className="inline-flex px-3 py-2 text-sm font-medium text-foreground hover:text-sky"
          >
            Войти
          </button>
        )}
      </div>
    </>
  );

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 border-b border-charcoal/[0.06] bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70"
    >
      <div className="hidden border-b border-charcoal/[0.04] lg:block">
        <div
          className={cn(
            siteViewportInsetClass,
            "flex items-center justify-between gap-4 py-2 text-[11px] text-slate"
          )}
        >
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-medium text-foreground/80">Откройте Аргентину 🇦🇷 вместе с нами</span>
            <span className="hidden text-charcoal/15 xl:inline">|</span>
            {utilityLinks.slice(0, 2).map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className="hidden items-center gap-1 font-medium text-foreground/70 transition-colors hover:text-sky xl:inline-flex"
              >
                {resolveNavLabel(link, t)}
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            ))}
          </div>
          <Link
            href={utilityLinks[2]?.href ?? "/contacts"}
            className="flex shrink-0 items-center gap-1 font-medium text-foreground/70 transition-colors hover:text-sky"
          >
            {utilityLinks[2] ? resolveNavLabel(utilityLinks[2], t) : t("nav.contacts")}
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className={cn(siteViewportInsetClass, "pb-2.5 pt-3 sm:pb-3 sm:pt-3.5 lg:pt-4")}>
        <div
          className={cn(
            "flex w-full items-center gap-2 rounded-2xl border border-charcoal/[0.07]",
            "bg-gradient-to-r from-white via-surface-muted/30 to-white",
            "px-2 py-2.5 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_8px_24px_-12px_rgba(26,26,46,0.12)]",
            "sm:gap-3 sm:px-3"
          )}
        >
          {canGoBack ? (
            <CircleButton ariaLabel="Назад" onClick={() => router.back()}>
              <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </CircleButton>
          ) : null}

          <CircleButton
            ref={mobileMenuTriggerRef}
            ariaLabel={t("nav.menu")}
            ariaExpanded={menuOpen}
            ariaControls="site-nav-overlay"
            onClick={() => setMenuOpen((open) => !open)}
            className="lg:hidden"
          >
            <Menu className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </CircleButton>

          <Link href="/" className="shrink-0" aria-label={t("nav.home")}>
            <ArgentinaLogo />
          </Link>

          <nav
            className="hidden min-w-0 flex-1 items-center justify-center gap-2 xl:gap-4 lg:flex"
            aria-label={t("nav.main")}
          >
            {SITE_NAV_PRIMARY_SECTIONS.map((section, index) => (
              <MegaMenuTrigger
                key={section.id}
                section={section}
                index={index + 1}
                active={isNavSectionActive(pathname, section)}
                t={t}
                open={openMegaMenuId === section.id}
                onOpenChange={(nextOpen) => {
                  if (nextOpen) {
                    setOpenMegaMenuId(section.id);
                    return;
                  }
                  setOpenMegaMenuId((current) => (current === section.id ? null : current));
                }}
              />
            ))}
            {hasOverflowSections ? (
              <button
                ref={desktopMenuTriggerRef}
                type="button"
                id="site-nav-overflow-trigger"
                aria-expanded={menuOpen}
                aria-controls="site-nav-overlay"
                aria-label={t("nav.more")}
                onClick={() => setMenuOpen((open) => !open)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40",
                  menuOpen
                    ? "bg-sky/10 text-sky ring-1 ring-sky/25"
                    : "text-foreground/70 hover:bg-charcoal/[0.04] hover:text-sky"
                )}
              >
                {t("nav.more")}
                <Menu className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
              </button>
            ) : null}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <div className="hidden sm:block">
              <LocaleCurrencySwitcher variant="header" />
            </div>
            <ProfileMenu />
          </div>
        </div>
      </div>

      <SiteNavFullScreenOverlay
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={overlayTitle}
        sections={overlaySections}
        pathname={pathname}
        t={t}
        returnFocusRef={menuTriggerRef}
        footer={isLgUp ? undefined : mobileMenuFooter}
      />
    </header>
  );
}
