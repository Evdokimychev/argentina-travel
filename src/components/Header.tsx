"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Plane, Menu, ArrowUpRight } from "lucide-react";
import ArgentinaLogo from "@/components/ArgentinaLogo";
import LocaleCurrencySwitcher from "@/components/LocaleCurrencySwitcher";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import ProfileMenu from "@/components/auth/ProfileMenu";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/cn";

function CircleButton({
  href,
  onClick,
  ariaLabel,
  children,
  className,
}: {
  href?: string;
  onClick?: () => void;
  ariaLabel: string;
  children: React.ReactNode;
  className?: string;
}) {
  const cls = cn(
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200/80 bg-white text-charcoal transition-colors hover:border-sky/40 hover:bg-sky/5 hover:text-sky",
    className
  );

  if (href) {
    return (
      <Link href={href} className={cls} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={cls} aria-label={ariaLabel}>
      {children}
    </button>
  );
}

function NavLink({
  href,
  label,
  index,
  active,
  onClick,
}: {
  href: string;
  label: string;
  index: number;
  active: boolean;
  onClick?: () => void;
}) {
  const num = String(index).padStart(2, "0");

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group relative inline-flex items-baseline gap-1 px-1 py-1 text-sm font-medium transition-colors",
        active ? "text-sky" : "text-charcoal/70 hover:text-sky"
      )}
    >
      {label}
      <sup className="text-[10px] font-normal text-gray-400 group-hover:text-sky/70">
        {num}
      </sup>
    </Link>
  );
}

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const { t } = useLocaleCurrency();
  const { isAuthenticated, openAuth } = useAuth();

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

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/tours", label: t("nav.tours") },
    { href: "/about", label: t("nav.about") },
    { href: "/blog", label: t("nav.blog") },
    { href: "/contacts", label: t("nav.contacts") },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header ref={headerRef} className="sticky top-0 z-50 bg-white/90 backdrop-blur-md">
      {/* Top utility bar */}
      <div className="hidden border-b border-gray-100 bg-white lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 text-xs text-slate sm:px-6 lg:px-8">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>Откройте Аргентину 🇦🇷 вместе с нами</span>
            <span className="hidden text-gray-300 xl:inline">|</span>
            <Link
              href="/tours"
              className="hidden items-center gap-1 font-medium text-charcoal transition-colors hover:text-sky xl:inline-flex"
            >
              Бронируйте лучшие туры
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </p>
          <Link
            href="/join"
            className="hidden items-center gap-1 font-medium text-charcoal transition-colors hover:text-sky xl:inline-flex"
          >
            Авторам туров
            <ArrowUpRight className="h-3 w-3" />
          </Link>
          <span className="hidden text-gray-300 xl:inline">|</span>
          <Link
            href="/contacts"
            className="flex items-center gap-1 font-medium text-charcoal transition-colors hover:text-sky"
          >
            Свяжитесь с нами
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Pill navigation */}
      <div className="mx-auto max-w-7xl px-3 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 rounded-full bg-nav-pill px-2 py-2 shadow-card sm:gap-3 sm:px-3">
          <CircleButton
            ariaLabel="Меню"
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden"
          >
            <Menu className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </CircleButton>

          <Link href="/" className="shrink-0 pl-0.5 sm:pl-1">
            <ArgentinaLogo />
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-6 xl:gap-8 lg:flex">
            {navLinks.map((link, i) => (
              <NavLink
                key={link.href}
                href={link.href}
                label={link.label}
                index={i + 1}
                active={isActive(link.href)}
              />
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <div className="hidden sm:block">
              <LocaleCurrencySwitcher variant="compact" />
            </div>
            <CircleButton href="/tours" ariaLabel={t("nav.chooseTour")}>
              <Plane className="h-[18px] w-[18px] text-sky" strokeWidth={1.75} />
            </CircleButton>
            <ProfileMenu />
          </div>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-gray-100 bg-white px-4 py-4 lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {navLinks.map((link, i) => (
              <NavLink
                key={link.href}
                href={link.href}
                label={link.label}
                index={i + 1}
                active={isActive(link.href)}
                onClick={() => setMenuOpen(false)}
              />
            ))}
            <div className="mt-3 border-t border-gray-100 pt-3 sm:hidden">
              <LocaleCurrencySwitcher />
            </div>
            <div className="mt-3 border-t border-gray-100 pt-3">
              {isAuthenticated ? (
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex px-1 py-1 text-sm font-medium text-charcoal hover:text-sky"
                >
                  Личный кабинет
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    openAuth();
                  }}
                  className="inline-flex px-1 py-1 text-sm font-medium text-charcoal hover:text-sky"
                >
                  Войти
                </button>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
