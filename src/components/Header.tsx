"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { forwardRef, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, Menu, Search } from "lucide-react";
import ArgentinaLogo from "@/components/ArgentinaLogo";
import LocaleCurrencySwitcher from "@/components/LocaleCurrencySwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import ProfileMenu from "@/components/auth/ProfileMenu";
import { MegaMenuTrigger } from "@/components/navigation/MegaMenuTrigger";
import { NavOverflowMegaMenuTrigger } from "@/components/navigation/NavOverflowMegaMenuTrigger";
import { SiteNavFullScreenOverlay } from "@/components/navigation/SiteNavDrawer";
import { useAuth } from "@/context/AuthContext";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import {
  SITE_NAV_MOBILE_SECTIONS,
  SITE_NAV_UTILITY_LINKS,
} from "@/data/site-nav";
import { useCanGoBack } from "@/hooks/useCanGoBack";
import { useSiteHeaderAutoHide } from "@/hooks/useSiteHeaderAutoHide";
import { useSiteNavLayout } from "@/hooks/useSiteNavLayout";
import { cn } from "@/lib/cn";
import {
  tokenFocusRingClass,
  tokenHeaderCircleButtonClass,
  tokenHeaderNavBarClass,
  tokenHeaderShellClass,
  tokenHeaderShellScrolledClass,
} from "@/lib/design-tokens";
import { openSiteSearch } from "@/lib/site-search-open";
import { siteViewportInsetClass } from "@/lib/site-container";
import { isNavSectionActive, resolveNavLabel } from "@/lib/site-nav";

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
    <button ref={ref} type="button" onClick={onClick} className={cls} {...aria}>
      {children}
    </button>
  );
});

export default function Header() {
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

  const { primarySections, overflowSections, showNavIndex, layout: navLayout } =
    useSiteNavLayout();

  const hasOverflowSections = overflowSections.length > 0;
  const overflowNavActive = overflowSections.some((section) =>
    isNavSectionActive(pathname, section)
  );
  const navCompact = navLayout === "compact";
  const headerAutoHideDisabled = mobileMenuOpen || openMegaMenuId !== null;

  const { headerVisible } = useSiteHeaderAutoHide({
    headerRef,
    disabled: headerAutoHideDisabled,
  });

  useEffect(() => {
    setMobileMenuOpen(false);
    setOpenMegaMenuId(null);
  }, [pathname]);

  useEffect(() => {
    setOpenMegaMenuId(null);
  }, [navLayout]);

  useEffect(() => {
    function onScroll() {
      setHeaderScrolled(window.scrollY > 8);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const utilityLinks = SITE_NAV_UTILITY_LINKS;

  const mobileMenuFooter = (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => {
          setMobileMenuOpen(false);
          openSiteSearch();
        }}
        className="flex w-full items-center gap-3 rounded-2xl border border-border-subtle bg-surface-muted/50 px-4 py-3.5 text-sm font-medium text-foreground transition-colors hover:border-sky/30 hover:bg-sky/5 hover:text-sky"
      >
        <Search className="h-4 w-4 shrink-0 text-sky" strokeWidth={1.75} aria-hidden />
        Поиск по сайту
      </button>

      <nav
        className="grid grid-cols-1 gap-1 rounded-2xl border border-border-subtle bg-surface-muted/30 p-2"
        aria-label="Быстрые ссылки"
      >
        {utilityLinks.map((link) => (
          <Link
            key={link.id}
            href={link.href}
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/85 transition-colors hover:bg-surface-elevated hover:text-sky"
          >
            {resolveNavLabel(link, t)}
          </Link>
        ))}
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle/80 pt-3">
        <LocaleCurrencySwitcher />
        {isAuthenticated ? (
          <Link
            href="/profile"
            onClick={() => setMobileMenuOpen(false)}
            className="inline-flex rounded-xl px-3 py-2 text-sm font-semibold text-sky transition-colors hover:bg-sky/5"
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
            className="inline-flex rounded-xl bg-charcoal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-charcoal/90"
          >
            Войти
          </button>
        )}
      </div>
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
    >
      <div
        className={cn(
          "site-header-utility-bar hidden overflow-hidden border-b border-charcoal/[0.04] md:grid md:grid-rows-[1fr]"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={cn(
              siteViewportInsetClass,
              "flex items-center justify-between gap-4 py-2 text-2xs text-slate"
            )}
          >
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-medium text-foreground/80">{t("header.tagline")}</span>
              <span className="hidden text-charcoal/15 md:inline">|</span>
              {utilityLinks.slice(0, 2).map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
                  className="hidden items-center gap-1 font-medium text-foreground/70 transition-colors hover:text-sky md:inline-flex"
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
      </div>

      <div className={cn(siteViewportInsetClass, "pb-2.5 pt-3 sm:pb-3 sm:pt-3.5 lg:pt-4")}>
        <div className={tokenHeaderNavBarClass}>
          {canGoBack ? (
            <CircleButton ariaLabel="Назад" onClick={() => router.back()}>
              <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </CircleButton>
          ) : null}

          <CircleButton
            ref={mobileMenuTriggerRef}
            ariaLabel={t("nav.menu")}
            ariaExpanded={mobileMenuOpen}
            ariaControls="site-nav-overlay"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="lg:hidden"
          >
            <Menu className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </CircleButton>

          <Link href="/" className="shrink-0" aria-label={t("nav.home")}>
            <ArgentinaLogo />
          </Link>

          <nav
            className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 lg:flex xl:gap-2 2xl:gap-4"
            aria-label={t("nav.main")}
          >
            {primarySections.map((section, index) => (
              <MegaMenuTrigger
                key={section.id}
                section={section}
                index={index + 1}
                active={isNavSectionActive(pathname, section)}
                t={t}
                open={openMegaMenuId === section.id}
                showIndex={showNavIndex}
                compact={navCompact}
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
              <NavOverflowMegaMenuTrigger
                sections={overflowSections}
                index={primarySections.length + 1}
                active={overflowNavActive}
                t={t}
                open={openMegaMenuId === "more"}
                showIndex={showNavIndex}
                compact={navCompact}
                onOpenChange={(nextOpen) => {
                  if (nextOpen) {
                    setOpenMegaMenuId("more");
                    return;
                  }
                  setOpenMegaMenuId((current) => (current === "more" ? null : current));
                }}
              />
            ) : null}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <CircleButton
              ariaLabel="Поиск по сайту"
              onClick={() => openSiteSearch()}
            >
              <Search className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </CircleButton>
            <ThemeToggle />
            <LocaleCurrencySwitcher variant="header" />
            <ProfileMenu />
          </div>
        </div>
      </div>

      <SiteNavFullScreenOverlay
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title={t("nav.menu")}
        sections={SITE_NAV_MOBILE_SECTIONS}
        pathname={pathname}
        t={t}
        returnFocusRef={mobileMenuTriggerRef}
        footer={mobileMenuFooter}
      />
    </header>
  );
}
