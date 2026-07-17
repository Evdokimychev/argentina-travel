import type { I18nLocale } from "@/lib/i18n/config";
import { cn } from "@/lib/cn";
import { siteContainerClass } from "@/lib/site-container";

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
    <section className={cn(siteContainerClass, "mb-5 rounded-2xl border border-amber-300 bg-amber-50 py-3 text-sm text-amber-900")}>
      Для этой страницы пока доступна полная версия на русском языке. Выбранный язык интерфейса —{" "}
      {LOCALE_NAMES[locale]}.
    </section>
  );
}
