import { CMS_LOCALE_LABELS } from "@/lib/cms/cms-locale";
import type { CmsLocaleCoverage } from "@/lib/cms/cms-locale";
import type { I18nLocale } from "@/lib/i18n/config";
import { I18N_LOCALES } from "@/lib/i18n/config";

type Props = {
  locales: CmsLocaleCoverage;
  compact?: boolean;
};

export default function CmsLocaleBadges({ locales, compact = false }: Props) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {I18N_LOCALES.map((locale) => {
        const entry = locales[locale as I18nLocale];
        const label = CMS_LOCALE_LABELS[locale as I18nLocale];
        if (entry) {
          const published = entry.status === "published";
          return (
            <span
              key={locale}
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                published
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
              title={`${label}: ${entry.status}`}
            >
              {compact ? label : `${label} · ${entry.status === "published" ? "опубл." : "черн."}`}
            </span>
          );
        }
        return (
          <span
            key={locale}
            className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate/60"
            title={`${label}: нет перевода`}
          >
            {label}
          </span>
        );
      })}
    </span>
  );
}
