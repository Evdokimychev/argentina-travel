import type { I18nLocale } from "@/lib/i18n/config";

const LOCALE_NAMES: Record<I18nLocale, string> = {
  ru: "русском",
  es: "испанском",
  en: "английском",
};

type Props = {
  locale: I18nLocale;
};

export default function TranslationPreparingBanner({ locale }: Props) {
  if (locale === "ru") return null;

  return (
    <section className="mx-auto mb-5 max-w-7xl rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:px-6">
      Перевод на {LOCALE_NAMES[locale]} язык готовится. Пока показываем русскую версию материала.
    </section>
  );
}
