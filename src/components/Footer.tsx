"use client";

import Link from "next/link";
import { ArrowUpRight, Compass } from "lucide-react";
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
import { siteContainerClass } from "@/lib/site-container";
import { resolveNavLabel } from "@/lib/site-nav";
import type { SiteLegalFooterInfo } from "@/components/SiteChrome";

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
      <h3 className="font-heading text-sm font-semibold text-charcoal">{title}</h3>
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
            className="text-sm text-slate transition-colors hover:text-sky"
          >
            {resolveNavLabel(link, t)}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function Footer({ siteLegal }: { siteLegal?: SiteLegalFooterInfo }) {
  const { t } = useLocaleCurrency();
  const navMid = Math.ceil(SITE_FOOTER_NAV.length / 2);
  const navPrimary = SITE_FOOTER_NAV.slice(0, navMid);
  const navSecondary = SITE_FOOTER_NAV.slice(navMid);

  return (
    <footer
      className="border-t border-gray-100 bg-surface-muted"
      data-scroll-rail-tone="light"
    >
      <div className={cn(siteContainerClass, "py-14 lg:py-16")}>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5 xl:col-span-4">
            <Link href="/" className="inline-flex rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40">
              <ArgentinaLogo />
            </Link>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate">
              {t("footer.description")}
            </p>
            <FooterNewsletter />
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:col-span-7 lg:grid-cols-3 xl:col-span-8">
            <FooterColumn title={t("footer.navigation")}>
              <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
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
                      className="text-sm text-slate transition-colors hover:text-sky"
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
                      className="text-sm text-slate transition-colors hover:text-sky"
                    >
                      {resolveNavLabel(link, t)}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                {SITE_SOCIAL_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-charcoal shadow-sm transition-colors hover:border-sky/30 hover:text-sky"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-60" aria-hidden />
                  </a>
                ))}
              </div>
            </FooterColumn>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-sky/20 bg-gradient-to-br from-sky/[0.06] via-white to-white p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-sky">
              <Compass className="h-3.5 w-3.5" aria-hidden />
              {t("footer.routeEyebrow")}
            </p>
            <h3 className="mt-2 font-heading text-lg font-bold text-charcoal">
              {t("footer.routeTitle")}
            </h3>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate">
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

        <div className="mt-12 flex flex-col gap-3 border-t border-gray-200/80 pt-8 text-sm text-slate sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p>© {new Date().getFullYear()} {t("footer.copyright")}</p>
            {siteLegal?.legalLine ? (
              <p className="mt-1 text-xs text-slate/80">{siteLegal.legalLine}</p>
            ) : null}
          </div>
          <p className="text-xs text-slate/70">
            {siteLegal?.supportEmail ? (
              <>
                {t("footer.support")}{" "}
                <a href={`mailto:${siteLegal.supportEmail}`} className="text-sky hover:underline">
                  {siteLegal.supportEmail}
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
