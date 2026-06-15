"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import ArgentinaLogo from "@/components/ArgentinaLogo";
import FooterNewsletter from "@/components/FooterNewsletter";
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

export default function Footer() {
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
              Маркетплейс авторских туров по Аргентине: Патагония, Буэнос-Айрес, вино и tango.
              Бронируйте напрямую у проверенных организаторов.
            </p>
            <FooterNewsletter />
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:col-span-7 lg:grid-cols-3 xl:col-span-8">
            <FooterColumn title="Навигация">
              <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                <FooterLinkList items={navPrimary} t={t} />
                <FooterLinkList items={navSecondary} t={t} />
              </div>
            </FooterColumn>

            <FooterColumn title="Документы">
              <ul className="space-y-2.5">
                {SITE_LEGAL_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate transition-colors hover:text-sky"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </FooterColumn>

            <FooterColumn title="Контакты">
              <ul className="space-y-2.5">
                {SITE_FOOTER_CONTACTS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate transition-colors hover:text-sky"
                    >
                      {link.label}
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

        <div className="mt-12 flex flex-col gap-3 border-t border-gray-200/80 pt-8 text-sm text-slate sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Пора в Аргентину. Все права защищены.</p>
          <p className="text-xs text-slate/70">
            Демо-платформа · данные в браузере до подключения облака
          </p>
        </div>
      </div>
    </footer>
  );
}
