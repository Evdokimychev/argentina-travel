import { normalizeSiteNavigation } from "@/lib/cms/site-globals/normalize";

type Props = {
  values: Record<string, unknown>;
};

const MAIN_LINKS = [
  ["showTours", "Туры"],
  ["showExcursions", "Экскурсии"],
  ["showGeography", "Направления и места"],
  ["showServices", "Сервисы"],
  ["showGuide", "Путеводитель"],
  ["showImmigration", "Переезд"],
  ["showJournal", "Блог"],
  ["showGallery", "Галерея"],
  ["showShop", "Магазин"],
  ["showAbout", "О проекте"],
] as const;

export default function SiteNavigationPreview({ values }: Props) {
  const navigation = normalizeSiteNavigation(values);
  const utilityLinks = [
    [navigation.utilityToursLabel, navigation.utilityToursUrl],
    [navigation.utilityOrganizerLabel, navigation.utilityOrganizerUrl],
    [navigation.utilityContactLabel, navigation.utilityContactUrl],
  ];

  return (
    <section className="border-y border-border-subtle bg-white px-4 py-5 sm:px-6">
      <p className="text-xs font-semibold uppercase text-slate">Предпросмотр меню</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-charcoal">
        {MAIN_LINKS.filter(([key]) => navigation[key]).map(([, label]) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-border-subtle pt-3 text-xs text-slate">
        {utilityLinks.map(([label, href]) => (
          <span key={`${label}-${href}`}>
            {label} <span className="text-slate/70">({href})</span>
          </span>
        ))}
      </div>
    </section>
  );
}
