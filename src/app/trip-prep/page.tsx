import Link from "next/link";
import type { Metadata } from "next";
import { ClipboardCheck, LogIn } from "lucide-react";
import { DEFAULT_TRIP_PREP_ITEMS } from "@/data/trip-prep-defaults";
import { TRIP_PREP_CATEGORY_LABELS, type TripPrepCategory } from "@/types/trip-prep";

export const metadata: Metadata = {
  title: "Подготовка к поездке в Аргентину",
  description:
    "Чек-лист перед вылетом: документы, связь, деньги, здоровье, багаж и контакты организатора. Войдите, чтобы сохранить прогресс.",
};

const PREVIEW_CATEGORIES: TripPrepCategory[] = [
  "documents",
  "connectivity",
  "money",
  "health",
  "luggage",
  "transfer",
  "organizer",
];

export default function TripPrepLandingPage() {
  const previewByCategory = PREVIEW_CATEGORIES.map((category) => ({
    category,
    label: TRIP_PREP_CATEGORY_LABELS[category],
    items: DEFAULT_TRIP_PREP_ITEMS.filter((item) => item.category === category).slice(0, 2),
  })).filter((group) => group.items.length > 0);

  return (
    <main className="site-container py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-light/40 text-brand">
            <ClipboardCheck className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <div>
            <h1 className="font-display text-3xl font-bold text-charcoal sm:text-4xl">
              Подготовка к поездке
            </h1>
            <p className="mt-3 text-base leading-relaxed text-slate">
              Единый чек-лист перед вылетом в Аргентину: документы, связь, деньги, здоровье и контакты
              организатора. После бронирования отмечайте пункты в личном кабинете — мы напомним за 7, 3 и 1
              день до старта тура.
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {previewByCategory.map((group) => (
            <section
              key={group.category}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <h2 className="font-heading text-lg font-bold text-charcoal">{group.label}</h2>
              <ul className="mt-3 space-y-2">
                {group.items.map((item) => (
                  <li key={item.id} className="text-sm text-slate">
                    <span className="font-medium text-charcoal">{item.title}</span>
                    {item.description ? (
                      <span className="mt-0.5 block text-xs leading-relaxed">{item.description}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-brand/20 bg-brand-light/20 p-6 text-center">
          <p className="text-sm text-charcoal">
            Полный чек-лист и сохранение прогресса доступны после входа и привязки к бронированию.
          </p>
          <Link
            href="/?auth=sign-in&next=/profile/trip-prep"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            <LogIn className="h-4 w-4" />
            Войти и открыть чек-лист
          </Link>
        </div>

        <p className="mt-6 text-xs leading-relaxed text-slate">
          Информация носит справочный характер. Правила въезда, визы и медицинские требования могут
          меняться — уточняйте перед поездкой у организатора и в официальных источниках.
        </p>
      </div>
    </main>
  );
}
