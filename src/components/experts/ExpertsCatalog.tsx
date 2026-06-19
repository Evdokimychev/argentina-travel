"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Users } from "lucide-react";
import ExpertCard from "@/components/experts/ExpertCard";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  getUniqueExpertCities,
  getUniqueExpertLanguages,
} from "@/lib/local-experts-server";
import { siteContainerClass } from "@/lib/site-container";
import {
  EXPERT_CATEGORY_LABELS,
  type ExpertCategory,
  type LocalExpertView,
} from "@/types/local-experts";
import { cn } from "@/lib/cn";

const CATEGORY_OPTIONS: ExpertCategory[] = [
  "guide",
  "relocation",
  "photo",
  "family",
  "nature",
  "food",
];

type ExpertsCatalogProps = {
  experts: LocalExpertView[];
};

export default function ExpertsCatalog({ experts }: ExpertsCatalogProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const cities = useMemo(() => getUniqueExpertCities(experts), [experts]);
  const languages = useMemo(() => getUniqueExpertLanguages(experts), [experts]);

  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [language, setLanguage] = useState(searchParams.get("language") ?? "");
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    setCity(searchParams.get("city") ?? "");
    setCategory(searchParams.get("category") ?? "");
    setLanguage(searchParams.get("language") ?? "");
    setQ(searchParams.get("q") ?? "");
  }, [searchParams]);

  const filtered = useMemo(() => {
    let result = experts;
    if (city.trim()) {
      const needle = city.trim().toLowerCase();
      result = result.filter((expert) => expert.city.toLowerCase().includes(needle));
    }
    if (category && CATEGORY_OPTIONS.includes(category as ExpertCategory)) {
      result = result.filter((expert) =>
        expert.categories.includes(category as ExpertCategory)
      );
    }
    if (language.trim()) {
      const lang = language.trim().toLowerCase();
      result = result.filter((expert) =>
        expert.languages.some((item) => item.toLowerCase() === lang)
      );
    }
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      result = result.filter(
        (expert) =>
          expert.name.toLowerCase().includes(needle) ||
          expert.bio.toLowerCase().includes(needle) ||
          expert.city.toLowerCase().includes(needle)
      );
    }
    return result;
  }, [experts, city, category, language, q]);

  function applyFilters() {
    const params = new URLSearchParams();
    if (city.trim()) params.set("city", city.trim());
    if (category) params.set("category", category);
    if (language.trim()) params.set("language", language.trim());
    if (q.trim()) params.set("q", q.trim());
    const qs = params.toString();
    router.replace(qs ? `/experts?${qs}` : "/experts", { scroll: false });
  }

  function resetFilters() {
    setCity("");
    setCategory("");
    setLanguage("");
    setQ("");
    router.replace("/experts", { scroll: false });
  }

  return (
    <div className="pb-16">
      <section className="border-b border-gray-100 bg-gradient-to-b from-sky/[0.06] via-white to-white">
        <div className={cn(siteContainerClass, "py-8 sm:py-10")}>
          <div className="max-w-3xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sky">
              Сообщество
            </p>
            <h1 className="font-heading text-3xl font-bold text-charcoal sm:text-4xl">
              Локальные эксперты
            </h1>
            <p className="mt-3 text-base leading-relaxed text-slate">
              Гиды, консультанты по переезду, фотографы и другие специалисты на месте —
              с проверенными профилями и перепиской через личный кабинет.
            </p>
          </div>
        </div>
      </section>

      <div className={cn(siteContainerClass, "py-8")}>
        <div className="mb-8 grid gap-3 rounded-2xl border border-gray-100 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-slate">Город</span>
            <select
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2"
            >
              <option value="">Все города</option>
              {cities.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-slate">Категория</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2"
            >
              <option value="">Все категории</option>
              {CATEGORY_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {EXPERT_CATEGORY_LABELS[item]}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-slate">Язык</span>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2"
            >
              <option value="">Любой</option>
              {languages.map((item) => (
                <option key={item} value={item}>
                  {item.toUpperCase()}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm lg:col-span-2">
            <span className="mb-1 block text-xs font-medium text-slate">Поиск</span>
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Имя, город или описание"
              className="w-full rounded-xl border border-gray-200 px-3 py-2"
            />
          </label>

          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
            <Button onClick={applyFilters}>Применить</Button>
            <Button variant="outline" onClick={resetFilters}>
              Сбросить
            </Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Эксперты не найдены"
            description="Измените фильтры или посмотрите весь каталог."
            action={{
              label: "Показать всех",
              onClick: resetFilters,
              variant: "outline",
            }}
          />
        ) : (
          <>
            <p className="mb-4 text-sm text-slate">
              Найдено: {filtered.length} из {experts.length}
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((expert) => (
                <ExpertCard key={expert.id} expert={expert} />
              ))}
            </div>
          </>
        )}

        <div className="mt-10 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 py-6 text-sm text-slate">
          <p className="font-medium text-charcoal">Вы организатор или местный специалист?</p>
          <p className="mt-1">
            Подайте заявку на включение в каталог — после модерации профиль появится здесь.
          </p>
          <Link href="/join" className="mt-3 inline-block font-medium text-sky hover:underline">
            Стать экспертом →
          </Link>
        </div>
      </div>
    </div>
  );
}
