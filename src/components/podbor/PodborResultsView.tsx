"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, RefreshCw, Sparkles, Wallet } from "lucide-react";
import type { PodborMatchResult } from "@/types/podbor";
import MarketplaceTourCard from "@/components/marketplace/MarketplaceTourCard";
import { Button, buttonVariants } from "@/components/ui/button";
import { SafeImage } from "@/components/ui/safe-image";
import PodborCompatibilityMeter from "./PodborCompatibilityMeter";
import PodborRegionMap from "./PodborRegionMap";
import { destinationHref } from "@/lib/destinations";

interface PodborResultsViewProps {
  result: PodborMatchResult;
  onRestart: () => void;
}

export default function PodborResultsView({ result, onRestart }: PodborResultsViewProps) {
  const isRelocation =
    result.answers.goal?.[0] === "relocation" ||
    result.answers.goal?.[0] === "business";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8"
    >
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-sky">
            <Sparkles className="h-4 w-4" aria-hidden />
            Ваш персональный маршрут готов
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-charcoal sm:text-4xl">
            {result.regions[0]?.name ?? "Аргентина"} — лучший старт
          </h1>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onRestart}>
          <RefreshCw className="h-4 w-4" aria-hidden />
          Пройти заново
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card">
            <PodborCompatibilityMeter value={result.compatibilityIndex} />
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card">
            <h2 className="font-heading text-xl font-bold text-charcoal">
              Рекомендация консультанта
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate">{result.narrative}</p>
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            <StatTile
              icon={CalendarDays}
              label="Лучшее время"
              value={result.bestSeason}
            />
            <StatTile
              icon={MapPin}
              label="Длительность"
              value={result.suggestedDuration}
            />
            <StatTile icon={Wallet} label="Бюджет" value={result.budgetLabel} />
          </section>
        </div>

        <PodborRegionMap regions={result.regions} />
      </div>

      <section className="mt-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="font-heading text-2xl font-bold text-charcoal">Топ-3 региона</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {result.regions.map((region, index) => (
            <Link
              key={region.id}
              href={destinationHref(region.slug)}
              className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <SafeImage
                  src={region.image}
                  alt={region.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-charcoal backdrop-blur-sm">
                  #{index + 1}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-heading text-lg font-bold text-charcoal group-hover:text-sky">
                  {region.name}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-slate">{region.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {result.tours.length > 0 ? (
        <section className="mt-12">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-heading text-2xl font-bold text-charcoal">Подходящие туры</h2>
            <Link
              href="/tours"
              className="inline-flex items-center gap-1 text-sm font-semibold text-sky hover:text-sky-dark"
            >
              Весь каталог
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {result.tours.map((tour) => (
              <MarketplaceTourCard key={tour.slug} tour={tour} />
            ))}
          </div>
        </section>
      ) : null}

      {result.excursions.length > 0 ? (
        <section className="mt-12">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-heading text-2xl font-bold text-charcoal">
              Рекомендуемые экскурсии
            </h2>
            <Link
              href="/excursions"
              className="inline-flex items-center gap-1 text-sm font-semibold text-sky hover:text-sky-dark"
            >
              Каталог экскурсий
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {result.excursions.map((excursion) => (
              <Link
                key={`${excursion.partner}-${excursion.slug}`}
                href={`/excursions/${excursion.slug}`}
                className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  {excursion.coverImage ? (
                    <SafeImage
                      src={excursion.coverImage}
                      alt={excursion.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="280px"
                    />
                  ) : null}
                </div>
                <div className="p-4">
                  <p className="text-xs text-slate">{excursion.cityName}</p>
                  <h3 className="mt-1 line-clamp-2 font-heading text-sm font-bold text-charcoal group-hover:text-sky">
                    {excursion.title}
                  </h3>
                  {excursion.priceDisplay ? (
                    <p className="mt-2 text-sm font-semibold text-charcoal">
                      {excursion.priceDisplay}
                    </p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-12 rounded-2xl border border-sky/15 bg-gradient-to-br from-sky/5 to-white p-6 sm:p-8">
        <h2 className="font-heading text-xl font-bold text-charcoal sm:text-2xl">
          {isRelocation
            ? "Нужна помощь с переездом или программой?"
            : "Соберём маршрут под ваши даты"}
        </h2>
        <p className="mt-3 max-w-2xl text-slate">
          {isRelocation
            ? "Мы подключим материалы по иммиграции и предложим туры для знакомства со страной."
            : "Отправьте заявку — организатор уточнит даты, состав группы и финальную стоимость."}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={isRelocation ? "/immigration" : "/contacts"}
            className={buttonVariants()}
          >
            {isRelocation ? "Раздел о переезде" : "Обсудить маршрут"}
          </Link>
          <Link href="/tours" className={buttonVariants({ variant: "outline" })}>
            Смотреть туры
          </Link>
        </div>
      </section>
    </motion.div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-card">
      <Icon className="h-5 w-5 text-sky" aria-hidden />
      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-snug text-charcoal">{value}</p>
    </div>
  );
}
