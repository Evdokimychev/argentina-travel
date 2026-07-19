"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, MapPinned, Menu, Search } from "lucide-react";
import ArgentinaLogo from "@/components/ArgentinaLogo";
import LocaleCurrencySwitcher from "@/components/LocaleCurrencySwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import ProfileMenu from "@/components/auth/ProfileMenu";
import DesktopSiteNav from "@/components/navigation/DesktopSiteNav";
import { SiteNavFullScreenOverlay } from "@/components/navigation/SiteNavDrawer";
import { useAuth } from "@/context/AuthContext";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import {
  SITE_NAV_SECTIONS,
  SITE_NAV_UTILITY_LINKS,
} from "@/data/site-nav";
import { useCanGoBack } from "@/hooks/useCanGoBack";
import { useSiteHeaderAutoHide } from "@/hooks/useSiteHeaderAutoHide";
import { useSiteHeaderOverlayLocked } from "@/hooks/useSiteHeaderOverlayLock";
import { cn } from "@/lib/cn";
import {
  tokenFocusRingClass,
  tokenHeaderCircleButtonClass,
  tokenHeaderNavBarClass,
  tokenHeaderShellClass,
  tokenHeaderShellScrolledClass,
} from "@/lib/design-tokens";
import { openSiteMap, prefetchQuickExploreMap } from "@/lib/site-map-open";
import { openSiteSearch } from "@/lib/site-search-open";
import { siteViewportInsetClass } from "@/lib/site-container";
import { resolveNavLabel } from "@/lib/site-nav";
import type {
  SiteBrandingGlobalResolved,
  SiteDesignGlobal,
  SiteNavigationGlobal,
  SiteMarketingGlobal,
  SiteModulesGlobal,
} from "@/types/site-globals";
import { filterPublicLinks, filterSiteNavSections } from "@/lib/public-module-visibility";

const CircleButton = forwardRef<
  HTMLButtonElement,
  {
    href?: string;
    onClick?: () => void;
    onMouseEnter?: () => void;
    onFocus?: () => void;
    ariaLabel: string;
    ariaExpanded?: boolean;
    ariaControls?: string;
    children: React.ReactNode;
    className?: string;
  }
>(function CircleButton(
  { href, onClick, onMouseEnter, onFocus, ariaLabel, ariaExpanded, ariaControls, children, className },
  ref
) {
  const cls = cn(tokenHeaderCircleButtonClass, tokenFocusRingClass, className);
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
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onFocus={onFocus}
      className={cls}
      {...aria}
    >
      {children}
    </button>
  );
});

export default function Header({
  navigation,
  design,
  branding,
  marketing,
  modules,
}: {
  navigation?: SiteNavigationGlobal;
  design?: SiteDesignGlobal;
  branding?: SiteBrandingGlobalResolved;
  marketing?: SiteMarketingGlobal;
  modules?: SiteModulesGlobal;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const canGoBack = useCanGoBack();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openMegaMenuId, setOpenMegaMenuId] = useState<string | null>(null);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const { t } = useLocaleCurrency();
  const { isAuthenticated, openAuth } = useAuth();
  const compact = design?.headerVariant === "compact";
  const showAnnouncement = marketing?.announcementEnabled === true && Boolean(marketing.announcementText.trim());
  const showUtilityBar = design?.showUtilityBar === true || showAnnouncement;
  const showUtilityBarMobile = showAnnouncement && marketing?.announcementOnMobile === true;
  const showMapButton = design?.showHeaderMapButton !== false;
  const showSiteSearch = design?.showSiteSearch !== false;
  const showThemeToggle = design?.showThemeToggle !== false;

  const headerAutoHideDisabled = mobileMenuOpen || openMegaMenuId !== null;
  const overlayLocked = useSiteHeaderOverlayLocked();

  const { headerVisible } = useSiteHeaderAutoHide({
    headerRef,
    disabled: headerAutoHideDisabled,
    forceHidden: overlayLocked,
  });

  useEffect(() => {
    setMobileMenuOpen(false);
    setOpenMegaMenuId(null);
  }, [pathname]);

  useEffect(() => {
    function onScroll() {
      setHeaderScrolled(window.scrollY > 8);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const utilityLinks = useMemo(() => {
    if (!navigation) return SITE_NAV_UTILITY_LINKS;
    return filterPublicLinks([
      { ...SITE_NAV_UTILITY_LINKS[0], label: navigation.utilityToursLabel, labelKey: undefined, href: navigation.utilityToursUrl },
      { ...SITE_NAV_UTILITY_LINKS[1], label: navigation.utilityOrganizerLabel, labelKey: undefined, href: navigation.utilityOrganizerUrl },
      { ...SITE_NAV_UTILITY_LINKS[2], label: navigation.utilityContactLabel, labelKey: undefined, href: navigation.utilityContactUrl },
    ], navigation, modules);
  }, [modules, navigation]);
  const utilityCtaLink = utilityLinks.at(-1);
  const navSections = useMemo(
    () => navigation ? filterSiteNavSections(SITE_NAV_SECTIONS, navigation, modules) : SITE_NAV_SECTIONS,
    [modules, navigation],
  );
  const mobileNavSections = useMemo(
    () => navSections.filter((section) => section.id !== "home"),
    [navSections],
  );

  const mobileMenuHeaderActions = (
    <>
      {showMapButton ? (
        <button
          type="button"
          onClick={() => {
            setMobileMenuOpen(false);
            openSiteMap();
          }}
          onMouseEnter={prefetchQuickExploreMap}
          onFocus={prefetchQuickExploreMap}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border-subtle text-foreground transition-colors hover:border-sky/40 hover:bg-sky/5 hover:text-sky focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
          aria-label="Быстрая карта"
        >
          <MapPinned className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </button>
      ) : null}
      {showSiteSearch ? (
        <button
          type="button"
          onClick={() => {
            setMobileMenuOpen(false);
            openSiteSearch();
          }}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border-subtle text-foreground transition-colors hover:border-sky/40 hover:bg-sky/5 hover:text-sky focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
          aria-label="Поиск по сайту"
        >
          <Search className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </button>
      ) : null}
      {isAuthenticated ? (
        <Link
          href="/profile"
          onClick={() => setMobileMenuOpen(false)}
          className="inline-flex min-h-11 items-center rounded-full px-3 py-1.5 text-xs font-semibold text-sky-ink transition-colors hover:bg-sky/5 dark:text-sky"
        >
          {t("nav.profile")}
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => {
            setMobileMenuOpen(false);
            openAuth();
          }}
          className="inline-flex min-h-11 items-center rounded-full px-3 py-1.5 text-xs font-semibold text-charcoal transition-colors hover:bg-surface-muted"
        >
          Войти
        </button>
      )}
    </>
  );

  const mobileMenuFooter = (
    <div className="flex items-center justify-center gap-3">
      {showThemeToggle ? <ThemeToggle /> : null}
      <LocaleCurrencySwitcher />
    </div>
  );

  return (
    <header
      ref={headerRef}
      className={cn(
        tokenHeaderShellClass,
        headerScrolled && tokenHeaderShellScrolledClass,
        !headerVisible && "-translate-y-full",
      )}
      data-variant={compact ? "compact" : "floating"}
    >
      <div
        className={cn(
          "site-header-utility-bar hidden border-b border-charcoal/[0.04] dark:border-white/[0.06]",
          showUtilityBar && (showUtilityBarMobile ? "block" : "md:block"),
          showAnnouncement && marketing?.announcementTone === "sky" && "bg-sky/10",
          showAnnouncement && marketing?.announcementTone === "wine" && "bg-rose-950/10",
          showAnnouncement && marketing?.announcementTone === "neutral" && "bg-surface-muted",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={cn(
              siteViewportInsetClass,
              "flex items-center justify-between gap-4 py-1.5 text-2xs text-slate"
            )}
          >
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-medium text-foreground/80">
                {showAnnouncement ? marketing?.announcementText : t("header.tagline")}
              </span>
              <span className="hidden text-charcoal/15 md:inline">|</span>
              {!showAnnouncement ? utilityLinks.slice(0, -1).map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
                  className="hidden items-center gap-1 font-medium text-foreground/70 transition-colors hover:text-sky md:inline-flex"
                >
                  {resolveNavLabel(link, t)}
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              )) : null}
            </div>
            <Link
              href={showAnnouncement ? marketing?.announcementHref ?? "/services" : utilityCtaLink?.href ?? "/contacts"}
              className="flex shrink-0 items-center gap-1 font-medium text-foreground/70 transition-colors hover:text-sky"
            >
              {showAnnouncement
                ? marketing?.announcementCtaLabel || "Подробнее"
                : utilityCtaLink
                  ? resolveNavLabel(utilityCtaLink, t)
                  : t("nav.contacts")}
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      <div
        className={cn(
          siteViewportInsetClass,
          compact ? "py-1.5" : "pb-2 pt-2.5 sm:pb-2.5 sm:pt-2.5",
        )}
      >
        <div className={cn(tokenHeaderNavBarClass, compact && "py-1.5")}>
          {canGoBack ? (
            <CircleButton
              ariaLabel="Назад"
              onClick={() => router.back()}
              className="lg:hidden"
            >
              <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </CircleButton>
          ) : null}

          <CircleButton
            ref={mobileMenuTriggerRef}
            ariaLabel={t("nav.menu")}
            ariaExpanded={mobileMenuOpen}
            ariaControls="site-nav-overlay"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="xl:hidden"
          >
            <Menu className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </CircleButton>

          <Link href="/" className="relative z-10 shrink-0" aria-label={t("nav.home")}>
            <ArgentinaLogo
              className={cn(canGoBack && "max-sm:h-9", compact && "!h-9")}
              src={branding?.primaryLogoUrl}
              alt={branding?.logoAlt}
            />
          </Link>

          <DesktopSiteNav
            sections={navSections}
            pathname={pathname}
            t={t}
            openMegaMenuId={openMegaMenuId}
            onOpenMegaMenuChange={setOpenMegaMenuId}
          />

          <div className="relative z-10 ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
            {showMapButton ? (
              <button
                type="button"
                aria-label="Быстрая карта — куда поехать"
                onClick={() => openSiteMap()}
                onMouseEnter={prefetchQuickExploreMap}
                onFocus={prefetchQuickExploreMap}
                className="hidden min-h-10 items-center gap-2 rounded-full bg-sky-ink px-3 text-sm font-semibold text-white ring-1 ring-sky-ink/30 transition-colors hover:bg-sky-ink/90 xl:inline-flex dark:bg-sky dark:text-charcoal dark:ring-sky/40 dark:hover:bg-sky/90"
              >
                <MapPinned className="h-[18px] w-[18px]" strokeWidth={1.75} />
                Карта
              </button>
            ) : null}
            {showSiteSearch ? (
              <CircleButton
                ariaLabel="Поиск по сайту"
                onClick={() => openSiteSearch()}
                className={canGoBack ? "max-[374px]:hidden" : undefined}
              >
                <Search className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </CircleButton>
            ) : null}
            {showThemeToggle ? (
              <div className="hidden xl:block"><ThemeToggle /></div>
            ) : null}
            <div className="hidden xl:block"><LocaleCurrencySwitcher variant="header" /></div>
            <div className="hidden xl:block"><ProfileMenu /></div>
          </div>
        </div>
      </div>

      <SiteNavFullScreenOverlay
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title={t("nav.menu")}
        sections={mobileNavSections}
        pathname={pathname}
        t={t}
        returnFocusRef={mobileMenuTriggerRef}
        headerActions={mobileMenuHeaderActions}
        footer={mobileMenuFooter}
      />
    </header>
  );
}
