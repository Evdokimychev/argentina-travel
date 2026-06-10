"use client";

import Link from "next/link";
import ArgentinaLogo from "@/components/ArgentinaLogo";
import FooterNewsletter from "@/components/FooterNewsletter";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import {
  SITE_FOOTER_CONTACTS,
  SITE_FOOTER_NAV,
  SITE_LEGAL_LINKS,
  SITE_SOCIAL_LINKS,
} from "@/data/site-links";
import { resolveNavLabel } from "@/lib/site-nav";

export default function Footer() {
  const { t } = useLocaleCurrency();

  return (
    <footer className="bg-charcoal text-white" data-scroll-rail-tone="dark">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link href="/" className="inline-flex">
              <ArgentinaLogo size="sm" />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-400">
              Маркетплейс авторских туров по Аргентине: Патагония, Буэнос-Айрес, вино и tango.
              Бронируйте напрямую у проверенных организаторов.
            </p>
            <FooterNewsletter />
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-sun">
                Навигация
              </h3>
              <ul className="mt-4 space-y-2">
                {SITE_FOOTER_NAV.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 transition-colors hover:text-white"
                    >
                      {resolveNavLabel(link, t)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300">
                Документы
              </h3>
              <ul className="mt-4 space-y-2">
                {SITE_LEGAL_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300">
                Контакты
              </h3>
              <ul className="mt-4 space-y-2">
                {SITE_FOOTER_CONTACTS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-3">
                {SITE_SOCIAL_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-400 transition-colors hover:text-sun"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-gray-800 pt-8 text-center text-sm text-gray-500 sm:flex-row sm:text-left">
          <p>© {new Date().getFullYear()} Пора в Аргентину. Все права защищены.</p>
          <p className="text-xs text-gray-600">
            Демо-платформа · данные в браузере до подключения облака
          </p>
        </div>
      </div>
    </footer>
  );
}
