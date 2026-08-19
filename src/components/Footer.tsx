"use client";

import Link from "next/link";
import { ArrowUpRight, ChevronDown, Compass } from "lucide-react";
import ArgentinaLogo from "@/components/ArgentinaLogo";
import FooterNewsletter from "@/components/FooterNewsletter";
import { buttonVariants } from "@/components/ui/button";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import {
  SITE_FOOTER_CONTACTS,
  SITE_FOOTER_NAV,
  SITE_LEGAL_LINKS,
  SITE_SOCIAL_LINKS,
} from "@/data/site-links";
import { cn } from "@/lib/cn";
import type { SiteFooterInfo } from "@/lib/site-footer-info";
import { siteContainerClass } from "@/lib/site-container";
import { resolveNavLabel } from "@/lib/site-nav";
import { COOKIE_CONSENT_OPEN_EVENT } from "@/lib/cookie-consent";
import { filterPublicLinks, isPublicLinkEnabled } from "@/lib/public-module-visibility";
import { DEFAULT_SITE_NAVIGATION } from "@/lib/cms/site-globals/normalize";
import type {
  SiteBrandingGlobalResolved,
  SiteDesignGlobal,
  SiteNavigationGlobal,
  SiteFormsGlobal,
  SiteModulesGlobal,
} from "@/types/site-globals";

function FooterColumn({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <h2 className="font-heading text-sm font-semibold text-foreground">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function FooterLinkList({
  items,
  t,
}: {
  items: ReadonlyArray<{ href: string; label: string; labelKey?: string }>;
  t: (key: string) => string;
}) {
  return (
    <ul className="space-y-2.5">
      {items.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            className="inline-flex min-h-9 items-center py-1 text-sm text-slate transition-colors hover:text-sky-ink dark:text-muted dark:hover:text-sky"
          >
            {resolveNavLabel(link, t)}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function FooterDisclosure({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group border-b border-border-subtle py-1">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-foreground marker:content-none">
        {title}
        <ChevronDown
          className="h-4 w-4 text-sky-ink transition-transform group-open:rotate-180 dark:text-sky"
          aria-hidden
        />
      </summary>
      <div className="pb-4 pt-1">{children}</div>
    </details>
  );
}

export default function Footer({
  siteFooter,
  /** @deprecated Pass siteFooter instead */
  siteLegal,
  design,
  branding,
  navigation,
  forms,
  modules,
}: {
  siteFooter?: SiteFooterInfo;
  siteLegal?: SiteFooterInfo;
  design?: SiteDesignGlobal;
  branding?: SiteBrandingGlobalResolved;
  navigation?: SiteNavigationGlobal;
  forms?: SiteFormsGlobal;
  modules?: SiteModulesGlobal;
}) {
  const { t } = useLocaleCurrency();
  const footerInfo = siteFooter ?? siteLegal;
  const socialLinks =
    footerInfo?.socialLinks?.length ? footerInfo.socialLinks : [...SITE_SOCIAL_LINKS];
  const effectiveNavigation = navigation ?? DEFAULT_SITE_NAVIGATION;
  const footerNavigation = filterPublicLinks(SITE_FOOTER_NAV, effectiveNavigation, modules);
  const showRouteCta =
    design?.showFooterRouteCta !== false &&
    isPublicLinkEnabled("/podbor", effectiveNavigation, modules);
  const navMid = Math.ceil(footerNavigation.length / 2);
  const navPrimary = footerNavigation.slice(0, navMid);
  const navSecondary = footerNavigation.slice(navMid);

  return (
    <footer
      className="site-footer-shell site-footer-safe-area border-t border-border-subtle dark:border-border-subtle"
      data-scroll-rail-tone="light"
    >
      <div className={cn(siteContainerClass, "py-14 lg:py-16")}>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5 xl:col-span-4">
            <Link href="/" className="inline-flex rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40">
              <ArgentinaLogo
                src={branding?.footerLogoUrl || branding?.primaryLogoUrl}
                alt={branding?.logoAlt}
              />
            </Link>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate dark:text-muted">
              {t("footer.description")}
            </p>
            {design?.showFooterNewsletter !== false && forms?.newsletterEnabled !== false ? (
              <FooterNewsletter />
            ) : null}
          </div>

          <div className="space-y-1 lg:hidden">
            <FooterDisclosure title={t("footer.navigation")}>
              <div className="grid grid-cols-2 gap-x-6">
                <FooterLinkList items={navPrimary} t={t} />
                <FooterLinkList items={navSecondary} t={t} />
              </div>
            </FooterDisclosure>
            <FooterDisclosure title={t("footer.documents")}>
              <FooterLinkList items={SITE_LEGAL_LINKS} t={t} />
            </FooterDisclosure>
            <FooterDisclosure title={t("footer.contacts")}>
              <FooterLinkList items={SITE_FOOTER_CONTACTS} t={t} />
              {socialLinks.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {socialLinks.map((link) => (
                    <a
                      key={`${link.label}-${link.href}-mobile`}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border-subtle bg-surface-elevated px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-sky/30 hover:text-sky-ink"
                    >
                      {link.label}
                      <ArrowUpRight className="h-3.5 w-3.5 opacity-60" aria-hidden />
                    </a>
                  ))}
                </div>
              ) : null}
            </FooterDisclosure>
          </div>

          <div className="hidden gap-8 lg:col-span-7 lg:grid lg:grid-cols-3 xl:col-span-8">
            <FooterColumn title={t("footer.navigation")} className="col-span-2 lg:col-span-1">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                <FooterLinkList items={navPrimary} t={t} />
                <FooterLinkList items={navSecondary} t={t} />
              </div>
            </FooterColumn>

            <FooterColumn title={t("footer.documents")}>
              <ul className="space-y-2.5">
                {SITE_LEGAL_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-9 items-center py-1 text-sm text-slate transition-colors hover:text-sky-ink dark:text-muted dark:hover:text-sky"
                    >
                      {resolveNavLabel(link, t)}
                    </Link>
                  </li>
                ))}
              </ul>
            </FooterColumn>

            <FooterColumn title={t("footer.contacts")}>
              <ul className="space-y-2.5">
                {SITE_FOOTER_CONTACTS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-9 items-center py-1 text-sm text-slate transition-colors hover:text-sky-ink dark:text-muted dark:hover:text-sky"
                    >
                      {resolveNavLabel(link, t)}
                    </Link>
                  </li>
                ))}
              </ul>
              {socialLinks.length ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {socialLinks.map((link) => (
                    <a
                      key={`${link.label}-${link.href}`}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border-subtle bg-surface-elevated px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-sky/30 hover:text-sky-ink dark:hover:text-sky"
                    >
                      {link.label}
                      <ArrowUpRight className="h-3.5 w-3.5 opacity-60" aria-hidden />
                    </a>
                  ))}
                </div>
              ) : null}
            </FooterColumn>
          </div>
        </div>

        {showRouteCta ? (
          <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-sky/20 bg-gradient-to-br from-sky/[0.06] via-surface-elevated to-surface-elevated p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6 dark:from-sky/[0.08] dark:via-surface-elevated dark:to-surface-elevated">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-sky-ink dark:text-sky">
                <Compass className="h-3.5 w-3.5" aria-hidden />
                {t("footer.routeEyebrow")}
              </p>
              <h2 className="mt-2 font-heading text-lg font-bold text-foreground">
                {t("footer.routeTitle")}
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate dark:text-muted">
                {t("footer.routeBody")}
              </p>
            </div>
            <Link
              href="/podbor"
              className={buttonVariants({ className: "shrink-0 self-start sm:self-center" })}
            >
              {t("footer.routeCta")}
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        ) : null}

        <div className="mt-12 flex flex-col gap-3 border-t border-border-subtle pt-8 text-sm text-slate sm:flex-row sm:items-center sm:justify-between dark:text-muted">
          <div>
            <p>© {new Date().getFullYear()} {t("footer.copyright")}</p>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event(COOKIE_CONSENT_OPEN_EVENT))}
              className="mt-2 text-xs text-sky-ink hover:underline dark:text-sky"
            >
              Настройки cookie
            </button>
            {footerInfo?.legalLine ? (
              <p className="mt-1 text-xs text-slate/80 dark:text-muted">{footerInfo.legalLine}</p>
            ) : null}
          </div>
          <p className="text-xs text-slate dark:text-muted">
            {footerInfo?.supportEmail ? (
              <>
                {t("footer.support")}{" "}
                <a
                  href={`mailto:${footerInfo.supportEmail}`}
                  className="text-sky-ink hover:underline dark:text-sky"
                >
                  {footerInfo.supportEmail}
                </a>
              </>
            ) : (
              t("footer.marketplaceTag")
            )}
          </p>
        </div>
      </div>
    </footer>
  );
}
