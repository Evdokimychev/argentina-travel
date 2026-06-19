import Link from "next/link";
import { CMS_LOCALE_LABELS } from "@/lib/cms/cms-locale";
import type { CmsLocaleCoverage } from "@/lib/cms/cms-locale";
import type { CmsDocType } from "@/types/cms-content";
import { I18N_LOCALES, type I18nLocale } from "@/lib/i18n/config";

type Props = {
  docType: CmsDocType;
  slug: string;
  currentLocale: I18nLocale;
  locales: CmsLocaleCoverage;
  onCreateLocale?: (locale: I18nLocale) => void;
  creatingLocale?: I18nLocale | null;
};

export default function CmsLocaleTabs({
  docType,
  slug,
  currentLocale,
  locales,
  onCreateLocale,
  creatingLocale,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-slate">Язык</span>
      {I18N_LOCALES.map((locale) => {
        const entry = locales[locale];
        const isActive = locale === currentLocale;
        const label = CMS_LOCALE_LABELS[locale];

        if (entry) {
          return (
            <Link
              key={locale}
              href={`/admin/content/documents/${encodeURIComponent(entry.id)}`}
              className={`inline-flex h-8 items-center rounded-lg px-3 text-xs font-semibold uppercase transition ${
                isActive
                  ? "bg-sky text-white"
                  : "border border-gray-200 text-charcoal hover:border-sky/40 hover:text-sky"
              }`}
            >
              {label}
            </Link>
          );
        }

        return (
          <button
            key={locale}
            type="button"
            disabled={creatingLocale === locale}
            onClick={() => onCreateLocale?.(locale)}
            className="inline-flex h-8 items-center rounded-lg border border-dashed border-gray-300 px-3 text-xs font-semibold uppercase text-slate hover:border-sky/40 hover:text-sky disabled:opacity-50"
          >
            {creatingLocale === locale ? `${label}…` : `+ ${label}`}
          </button>
        );
      })}
      {!locales[currentLocale] && onCreateLocale ? (
        <span className="text-xs text-slate">Создайте перевод для редактирования</span>
      ) : null}
    </div>
  );
}

export function buildEmptyLocaleCoverage(): CmsLocaleCoverage {
  const coverage = {} as CmsLocaleCoverage;
  for (const locale of I18N_LOCALES) coverage[locale] = null;
  return coverage;
}
