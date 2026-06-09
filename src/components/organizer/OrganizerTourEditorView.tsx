"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CircleX, Copy, ExternalLink, Eye, Info, Link2, MoreHorizontal, Trash2, Upload, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  readOrganizerTourDraft,
  saveOrganizerTourDraft,
} from "@/lib/organizer-tour-store";
import { cn } from "@/lib/cn";
import TourLeisureTypesBlock from "@/components/organizer/TourLeisureTypesBlock";
import TourDifficultyBlock from "@/components/organizer/TourDifficultyBlock";
import TourGeographyBlock from "@/components/organizer/TourGeographyBlock";
import TourTicketRecommendationsBlock from "@/components/organizer/TourTicketRecommendationsBlock";
import TourArrivalDepartureBlock from "@/components/organizer/TourArrivalDepartureBlock";
import TourGeneralDescriptionBlock from "@/components/organizer/TourGeneralDescriptionBlock";
import TourPhotosBlock from "@/components/organizer/TourPhotosBlock";
import TourImpressionsBlock from "@/components/organizer/TourImpressionsBlock";
import TourGuidesBlock from "@/components/organizer/TourGuidesBlock";
import TourComfortBlock from "@/components/organizer/TourComfortBlock";
import TourAccommodationDescriptionBlock from "@/components/organizer/TourAccommodationDescriptionBlock";
import TourAccommodationVariantsBlock from "@/components/organizer/TourAccommodationVariantsBlock";
import TourAccommodationPlacesBlock from "@/components/organizer/TourAccommodationPlacesBlock";
import TourCurrencyBlock from "@/components/organizer/TourCurrencyBlock";
import TourDiscountBlock from "@/components/organizer/TourDiscountBlock";
import TourIndividualBlock from "@/components/organizer/TourIndividualBlock";
import TourGroupDatesBlock from "@/components/organizer/TourGroupDatesBlock";
import TourProgramBlock from "@/components/organizer/TourProgramBlock";
import TourTermsListBlock from "@/components/organizer/TourTermsListBlock";
import TourTermsConditionsBlock from "@/components/organizer/TourTermsConditionsBlock";
import TourInsuranceBlock from "@/components/organizer/TourInsuranceBlock";
import TourCancellationBlock from "@/components/organizer/TourCancellationBlock";
import TourFAQBlock from "@/components/organizer/TourFAQBlock";
import TourPackingListBlock from "@/components/organizer/TourPackingListBlock";
import {
  ACCOMMODATION_VARIANT_NOT_FILLED,
  IGUAZU_VARIANT_ACCOMMODATIONS,
} from "@/data/tour-accommodation-defaults";
import { primaryComfortLevel } from "@/data/tour-levels";
import { NO_ACCOMMODATION_LABEL } from "@/lib/tour-accommodation";
import type {
  TourBookingMode,
  TourLanguage,
} from "@/types";
import {
  ORGANIZER_TOUR_TITLE_MAX,
  ORGANIZER_TOUR_EDITOR_TABS,
  type OrganizerTourDraft,
  type OrganizerTourEditorTabId,
  type OrganizerTourStatus,
} from "@/types/organizer-tour";

const LANGUAGES: TourLanguage[] = ["Русский", "Испанский", "Английский", "Португальский"];

function getNavStickyTopPx(): number {
  if (typeof window === "undefined") return 84;

  const root = document.documentElement;
  const headerVar = getComputedStyle(root).getPropertyValue("--site-header-height").trim();
  const headerPx = headerVar.endsWith("px")
    ? parseFloat(headerVar)
    : Number.parseFloat(headerVar) || 72;
  const remPx = Number.parseFloat(getComputedStyle(root).fontSize) || 16;

  return Math.round(headerPx + 0.75 * remPx);
}

function syncBookingModeForIndividual(
  enabled: boolean,
  current: TourBookingMode,
  hasGroupDates: boolean
): TourBookingMode {
  if (enabled) {
    if (current === "scheduled") return hasGroupDates ? "both" : "on_request";
    return current;
  }

  if (current === "on_request") return "scheduled";
  if (current === "both") return hasGroupDates ? "scheduled" : "scheduled";
  return current;
}

const TOUR_VARIANT_SYNC: Record<
  string,
  {
    variantLabel: string;
    titleDiff?: string;
    minAgeDiff?: number;
    shortDescriptionDiff?: string;
    accommodationDescriptionDiff?: string;
  }
> = {
  "org-iguazu": {
    variantLabel: "Водопады Игуасу за 2 дня: аргентинская и бразильская стороны",
    titleDiff: "Водопады Игуасу за 2 дня: Погружение в мир мощи и красоты водопадов",
    minAgeDiff: 12,
    shortDescriptionDiff:
      "Двухдневный маршрут с ночёвкой у парка, бразильской стороной и более глубоким погружением в джунгли Misiones.",
    accommodationDescriptionDiff: ACCOMMODATION_VARIANT_NOT_FILLED,
  },
};

function FieldLabel({
  htmlFor,
  children,
  hint,
  required,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div className="mb-1.5">
      <label htmlFor={htmlFor} className="block text-xs font-medium text-charcoal">
        {children}
        {required ? <span className="text-brand"> *</span> : null}
      </label>
      {hint ? <p className="mt-0.5 text-xs leading-relaxed text-slate">{hint}</p> : null}
    </div>
  );
}

function FloatingLabeledInput({
  id,
  label,
  required,
  className,
  ...props
}: React.ComponentProps<typeof Input> & {
  label: string;
  required?: boolean;
}) {
  return (
    <div className={cn("relative w-full min-w-0", className)}>
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-3 top-0 z-10 -translate-y-1/2 bg-white px-1 text-xs font-medium text-slate"
      >
        {label}
        {required ? <span className="text-brand"> *</span> : null}
      </label>
      <Input id={id} className="h-14 pt-1" {...props} />
    </div>
  );
}

function RangeInputPair({
  minId,
  maxId,
  minLabel,
  maxLabel,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  minRequired,
  maxRequired,
  minInputProps,
  maxInputProps,
}: {
  minId: string;
  maxId: string;
  minLabel: string;
  maxLabel: string;
  minValue: number | string;
  maxValue: number | string;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
  minRequired?: boolean;
  maxRequired?: boolean;
  minInputProps?: React.ComponentProps<typeof Input>;
  maxInputProps?: React.ComponentProps<typeof Input>;
}) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <FloatingLabeledInput
        id={minId}
        label={minLabel}
        required={minRequired}
        type="number"
        className="min-w-0 flex-1"
        value={minValue}
        onChange={(event) => onMinChange(Number(event.target.value) || 0)}
        {...minInputProps}
      />
      <span
        className="flex h-14 w-5 shrink-0 items-center justify-center text-lg font-light text-gray-300"
        aria-hidden
      >
        —
      </span>
      <FloatingLabeledInput
        id={maxId}
        label={maxLabel}
        required={maxRequired}
        type="number"
        className="min-w-0 flex-1"
        value={maxValue}
        onChange={(event) => onMaxChange(Number(event.target.value) || 0)}
        {...maxInputProps}
      />
    </div>
  );
}

function SyncApplyBanner({
  onApply,
}: {
  onApply: () => void;
}) {
  return (
    <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-charcoal">
      <button type="button" onClick={onApply} className="text-left">
        <Link2 className="mr-1.5 inline h-4 w-4 align-[-2px] text-brand" />
        Применить изменение во всех вариантах тура?{" "}
        <span className="font-semibold text-brand hover:underline">Применить</span>
      </button>
    </div>
  );
}

function SyncDiffBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 rounded-xl bg-brand-light/80 px-4 py-3 text-sm leading-relaxed text-charcoal">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
      <p>{children}</p>
    </div>
  );
}

function LanguageTagsField({
  languages,
  onToggle,
}: {
  languages: TourLanguage[];
  onToggle: (language: TourLanguage) => void;
}) {
  const available = LANGUAGES.filter((language) => !languages.includes(language));

  return (
    <div>
      <FieldLabel
        required
        hint="Выберите языки, на которых будут говорить в путешествии"
      >
        Языки
      </FieldLabel>
      <div className="min-h-11 rounded-xl border border-gray-200 bg-white px-3 py-2">
        <div className="flex flex-wrap gap-2">
          {languages.map((language) => (
            <span
              key={language}
              className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-charcoal"
            >
              {language}
              <button
                type="button"
                onClick={() => onToggle(language)}
                className="text-slate transition-colors hover:text-charcoal"
                aria-label={`Убрать ${language}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {available.length > 0 ? (
            <select
              value=""
              onChange={(event) => {
                const value = event.target.value as TourLanguage;
                if (value) onToggle(value);
              }}
              className="h-7 rounded-full border border-dashed border-gray-300 bg-white px-2 text-xs text-slate outline-none"
            >
              <option value="">+ Язык</option>
              {available.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function formatEditorDate(iso: string | null | undefined): string | null {
  if (!iso) return null;

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  const formatted = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);

  return formatted.replace(/\./g, "").replace(" г", " г.");
}

function TourEditorActionsMenu({
  isPublished,
  isArchived,
  onUnpublish,
  onArchive,
}: {
  isPublished: boolean;
  isArchived: boolean;
  onUnpublish: () => void;
  onArchive: () => void;
}) {
  const [open, setOpen] = useState(false);

  const items = [
    isPublished && !isArchived
      ? {
          key: "unpublish",
          label: "Снять с публикации",
          icon: CircleX,
          onClick: () => {
            onUnpublish();
            setOpen(false);
          },
        }
      : null,
    !isArchived
      ? {
          key: "archive",
          label: "В архив",
          icon: Trash2,
          onClick: () => {
            onArchive();
            setOpen(false);
          },
        }
      : null,
  ].filter(Boolean) as {
    key: string;
    label: string;
    icon: typeof CircleX;
    onClick: () => void;
  }[];

  if (items.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-slate-50 text-sm font-medium text-charcoal transition-colors hover:bg-gray-100"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded border border-gray-300 bg-white">
            <MoreHorizontal className="h-3 w-3 text-slate" />
          </span>
          Все действия
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        sideOffset={6}
        className="min-w-0 overflow-hidden rounded-2xl border border-gray-100 p-1.5 shadow-lg"
      >
        <ul className="divide-y divide-gray-100">
          {items.map((item) => (
            <li key={item.key}>
              <button
                type="button"
                onClick={item.onClick}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-charcoal transition-colors hover:bg-gray-50"
              >
                <item.icon className="h-5 w-5 shrink-0 text-charcoal" strokeWidth={1.75} />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function TourEditorSidebar({
  draft,
  loading,
  saved,
  onUnpublish,
  onArchive,
}: {
  draft: OrganizerTourDraft;
  loading: boolean;
  saved: boolean;
  onUnpublish: () => void;
  onArchive: () => void;
}) {
  const isPublished = draft.status === "published";
  const platformName = draft.partnerName || "Клуб Гидов";
  const tourUrl = `/tours/${draft.slug}`;
  const previewUrl = `${tourUrl}?preview=1`;
  const lastChanged = formatEditorDate(draft.updatedAt);

  const statusLabel = isPublished ? "Опубликовано" : "Черновик";

  return (
    <aside className="hidden xl:sticky xl:top-[calc(var(--site-header-height,72px)+1rem)] xl:block xl:h-fit xl:max-h-[calc(100vh-var(--site-header-height,72px)-2rem)] xl:w-[280px] xl:shrink-0 xl:self-start xl:overflow-y-auto">
      <div className="space-y-4">
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="font-display text-base font-bold text-charcoal">Редактирование тура</h2>
            {lastChanged ? (
              <p className="mt-1.5 text-xs text-slate">Последнее изменение: {lastChanged}</p>
            ) : null}
          </div>

          <div className="rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-charcoal">
            Статус в личном кабинете:{" "}
            <span className="font-semibold text-emerald-700">{statusLabel}</span>
          </div>

          <Button type="submit" className="h-12 w-full rounded-2xl text-sm" disabled={loading}>
            <Upload className="h-4 w-4" />
            {loading
              ? "Сохраняем…"
              : isPublished
                ? "Сохранить и опубликовать"
                : "Сохранить черновик"}
          </Button>

          {saved ? (
            <p className="text-center text-xs text-emerald-700">Изменения сохранены</p>
          ) : null}

          {isPublished ? (
            <div className="rounded-xl bg-brand-light/70 px-3 py-3 text-sm leading-relaxed text-charcoal">
              Изменения опубликуются на площадках:{" "}
              <Link href={draft.partnerUrl ?? "/tours"} className="font-medium text-sky hover:underline">
                {platformName}
              </Link>
            </div>
          ) : null}

          <div className="space-y-2">
            <button
              type="button"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-charcoal transition-colors hover:bg-gray-50"
            >
              <Copy className="h-4 w-4 text-slate" />
              Создать копию
            </button>
            <TourEditorActionsMenu
              isPublished={isPublished}
              isArchived={draft.archived}
              onUnpublish={onUnpublish}
              onArchive={onArchive}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="font-display text-base font-bold text-charcoal">Предпросмотр тура</h2>
          <div className="mt-3 flex items-center gap-2">
            <Link href={previewUrl} target="_blank" className="text-sm font-medium text-sky hover:underline">
              {platformName}
            </Link>
            <Eye className="h-4 w-4 shrink-0 text-brand" aria-hidden />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="font-display text-base font-bold text-charcoal">Тур на площадке</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link
              href={isPublished ? tourUrl : "#"}
              target={isPublished ? "_blank" : undefined}
              aria-disabled={!isPublished}
              className={cn(
                "text-sm font-medium text-sky hover:underline",
                !isPublished && "pointer-events-none text-slate"
              )}
            >
              {platformName}
            </Link>
            <ExternalLink className="h-4 w-4 shrink-0 text-brand" aria-hidden />
            {isPublished ? (
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                Опубликовано
              </span>
            ) : (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-slate">
                Черновик
              </span>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

interface OrganizerTourEditorViewProps {
  tourId: string;
}

export default function OrganizerTourEditorView({ tourId }: OrganizerTourEditorViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<OrganizerTourEditorTabId>("main");
  const [draft, setDraft] = useState<OrganizerTourDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [navStuck, setNavStuck] = useState(false);
  const navSentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nextDraft = readOrganizerTourDraft(tourId);
    if (!nextDraft) {
      router.replace("/organizer/tours");
      return;
    }
    setDraft(nextDraft);
  }, [router, tourId]);

  useEffect(() => {
    const sentinel = navSentinelRef.current;
    if (!sentinel) return;

    let observer: IntersectionObserver | null = null;

    function mountObserver() {
      const el = navSentinelRef.current;
      if (!el) return;

      observer?.disconnect();
      const topPx = getNavStickyTopPx();
      observer = new IntersectionObserver(
        ([entry]) => setNavStuck(!entry.isIntersecting),
        {
          threshold: 0,
          rootMargin: `-${topPx}px 0px 0px 0px`,
        }
      );
      observer.observe(el);
    }

    mountObserver();
    window.addEventListener("resize", mountObserver);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", mountObserver);
    };
  }, [draft]);

  if (!draft) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200/60">
        <p className="text-sm text-slate">Загружаем редактор тура…</p>
      </div>
    );
  }

  function markDirty() {
    setSaved(false);
    setError(null);
  }

  function updateDraft(patch: Partial<OrganizerTourDraft>) {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
    markDirty();
  }

  function toggleLanguage(language: TourLanguage) {
    setDraft((prev) => {
      if (!prev) return prev;
      const exists = prev.languages.includes(language);
      const languages = exists
        ? prev.languages.filter((item) => item !== language)
        : [...prev.languages, language];
      return { ...prev, languages };
    });
    markDirty();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft) return;

    setLoading(true);
    setError(null);
    setSaved(false);

    const result = saveOrganizerTourDraft({
      ...draft,
      title: draft.title.slice(0, ORGANIZER_TOUR_TITLE_MAX),
      durationDays: Math.max(1, draft.durationDays),
      durationNights: Math.max(0, draft.durationNights),
      priceUsd: Math.max(0, draft.priceUsd),
      groupMin: Math.max(1, draft.groupMin),
      groupMax: Math.max(draft.groupMin, draft.groupMax),
      maxWeightKg: draft.maxWeightKg && draft.maxWeightKg > 0 ? draft.maxWeightKg : null,
      gallery: draft.gallery.filter(Boolean),
    });

    setLoading(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    setDraft(result.draft);
    setSaved(true);
  }

  const variantSync = TOUR_VARIANT_SYNC[draft.id];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-3xl bg-white shadow-sm ring-1 ring-gray-200/60">
        <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Link
            href="/organizer/tours"
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200/80 bg-white text-slate transition-colors hover:bg-gray-50 hover:text-charcoal"
            aria-label="Назад к списку туров"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate">
              Редактор тура
            </p>
            <h1 className="font-display text-lg font-bold leading-snug text-charcoal sm:text-xl lg:text-2xl">
              {draft.title}
            </h1>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 lg:pt-1">
          {draft.status === "published" ? (
            <Link
              href={`/tours/${draft.slug}`}
              target="_blank"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200/80 bg-white px-4 text-sm font-medium text-charcoal transition-colors hover:bg-gray-50"
            >
              <ExternalLink className="h-4 w-4" />
              Открыть на сайте
            </Link>
          ) : null}
          <Button type="submit" className="xl:hidden" disabled={loading}>
            <Upload className="h-4 w-4" />
            {loading
              ? "Сохраняем…"
              : draft.status === "published"
                ? "Сохранить и опубликовать"
                : "Сохранить черновик"}
          </Button>
        </div>
        </div>
      </div>

      <div ref={navSentinelRef} className="h-px" aria-hidden />

      <nav
        aria-label="Разделы редактора тура"
        className={cn(
          "sticky top-[calc(var(--site-header-height,72px)+0.75rem)] z-30 w-full transition-[max-width] duration-300 ease-out",
          navStuck && "xl:max-w-[calc(100%-19rem)]"
        )}
      >
        <div className="overflow-hidden rounded-2xl bg-white/95 shadow-sm ring-1 ring-gray-200/60 backdrop-blur-md supports-[backdrop-filter]:bg-white/90">
          <div className="flex gap-1 overflow-x-auto px-3 scrollbar-hide sm:px-4">
            {ORGANIZER_TOUR_EDITOR_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative shrink-0 px-3 py-3.5 text-sm font-medium transition-colors sm:px-4",
                  activeTab === tab.id
                    ? "text-charcoal after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-brand sm:after:inset-x-3"
                    : "text-slate hover:text-charcoal"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start">
        <div className="min-w-0 space-y-6">
            {activeTab === "main" ? (
              <section className="space-y-5 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
                <h2 className="font-display text-xl font-bold text-charcoal sm:text-2xl">
                  Расскажите о вашем туре
                </h2>

                <div>
                  <FieldLabel htmlFor="tour-title" required>
                    Название тура
                  </FieldLabel>
                  <Input
                    id="tour-title"
                    value={draft.title}
                    maxLength={ORGANIZER_TOUR_TITLE_MAX}
                    onChange={(event) =>
                      updateDraft({
                        title: event.target.value.slice(0, ORGANIZER_TOUR_TITLE_MAX),
                      })
                    }
                    required
                  />
                  <p className="mt-1 text-right text-xs text-slate">
                    {draft.title.length} / {ORGANIZER_TOUR_TITLE_MAX}
                  </p>
                </div>

                {variantSync?.titleDiff ? (
                  <div className="space-y-3">
                    <SyncApplyBanner onApply={() => markDirty()} />
                    <SyncDiffBanner>
                      Отличия в варианте «{variantSync.variantLabel}»: {variantSync.titleDiff}
                    </SyncDiffBanner>
                  </div>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
                  <LanguageTagsField languages={draft.languages} onToggle={toggleLanguage} />
                  <FloatingLabeledInput
                    id="tour-days"
                    label="Количество дней"
                    required
                    type="number"
                    min={1}
                    className="w-full"
                    value={draft.durationDays}
                    onChange={(event) =>
                      updateDraft({ durationDays: Number(event.target.value) || 1 })
                    }
                  />

                  <div className="sm:col-span-2">
                    <RangeInputPair
                      minId="tour-group-min"
                      maxId="tour-group-max"
                      minLabel="Мин. человек в группе"
                      maxLabel="Макс. человек в группе"
                      minValue={draft.groupMin}
                      maxValue={draft.groupMax}
                      maxRequired
                      minInputProps={{ min: 1 }}
                      maxInputProps={{ min: 1 }}
                      onMinChange={(groupMin) => updateDraft({ groupMin: Math.max(1, groupMin) })}
                      onMaxChange={(groupMax) =>
                        updateDraft({ groupMax: Math.max(draft.groupMin, groupMax || 1) })
                      }
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <RangeInputPair
                      minId="tour-min-age"
                      maxId="tour-max-age"
                      minLabel="Минимальный возраст, лет"
                      maxLabel="Максимальный возраст, лет"
                      minValue={draft.minimumAge}
                      maxValue={draft.maximumAge ?? ""}
                      minRequired
                      minInputProps={{ min: 0 }}
                      maxInputProps={{ min: 0 }}
                      onMinChange={(minimumAge) =>
                        updateDraft({ minimumAge: Math.max(0, minimumAge) })
                      }
                      onMaxChange={(maximumAge) =>
                        updateDraft({
                          maximumAge: maximumAge > 0 ? maximumAge : null,
                        })
                      }
                    />
                  </div>
                </div>

                {variantSync?.minAgeDiff ? (
                  <div className="space-y-3">
                    <SyncApplyBanner onApply={() => markDirty()} />
                    <SyncDiffBanner>
                      Отличия в варианте «{variantSync.variantLabel}»: Мин. возраст туриста –{" "}
                      {variantSync.minAgeDiff}
                    </SyncDiffBanner>
                  </div>
                ) : null}

                <div className="space-y-3 border-t border-gray-200/80 pt-5">
                  <div>
                    <h3 className="font-display text-base font-bold text-charcoal">
                      Максимальный вес туриста
                    </h3>
                    <p className="mt-1 text-sm text-slate">
                      Например, это может быть актуально для конных туров верхом
                    </p>
                  </div>
                  <div>
                    <FieldLabel
                      htmlFor="tour-max-weight"
                      hint="Если заполнить это поле — информация будет отражена на странице тура на сайте. Или вы можете оставить поле пустым."
                    >
                      Максимальный вес туриста, кг
                    </FieldLabel>
                    <Input
                      id="tour-max-weight"
                      type="number"
                      min={0}
                      value={draft.maxWeightKg ?? ""}
                      onChange={(event) =>
                        updateDraft({
                          maxWeightKg: event.target.value ? Number(event.target.value) : null,
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                </div>
              </section>
            ) : null}

            {activeTab === "main" ? (
              <TourLeisureTypesBlock
                activityType={draft.activityType}
                tourActivities={draft.tourActivities}
                collections={draft.collections}
                onActivityTypeChange={(activityType) => updateDraft({ activityType })}
                onTourActivitiesChange={(tourActivities) => updateDraft({ tourActivities })}
                onCollectionsChange={(collections) => updateDraft({ collections })}
              />
            ) : null}

            {activeTab === "main" ? (
              <TourDifficultyBlock
                difficultyLevel={draft.difficultyLevel}
                difficultyDescriptionText={draft.difficultyDescriptionText}
                onDifficultyLevelChange={(difficultyLevel) => updateDraft({ difficultyLevel })}
                onDifficultyDescriptionChange={(difficultyDescriptionText) =>
                  updateDraft({ difficultyDescriptionText })
                }
              />
            ) : null}

            {activeTab === "main" ? (
              <TourGeographyBlock
                countries={draft.countries}
                cities={draft.cities}
                mainLocation={draft.mainLocation}
                touristRegions={draft.touristRegions}
                landmarks={draft.landmarks}
                mapStartPoint={draft.mapStartPoint}
                onChange={(patch) => updateDraft(patch)}
              />
            ) : null}

            {activeTab === "main" ? (
              <TourTicketRecommendationsBlock
                enabled={draft.ticketRecommendationsEnabled}
                text={draft.ticketRecommendationsText}
                onEnabledChange={(ticketRecommendationsEnabled) =>
                  updateDraft({ ticketRecommendationsEnabled })
                }
                onChange={(ticketRecommendationsText) =>
                  updateDraft({ ticketRecommendationsText })
                }
              />
            ) : null}

            {activeTab === "main" ? (
              <TourArrivalDepartureBlock
                enabled={draft.arrivalDepartureEnabled}
                cities={draft.arrivalDepartureCities}
                onEnabledChange={(arrivalDepartureEnabled) =>
                  updateDraft({ arrivalDepartureEnabled })
                }
                onChange={(arrivalDepartureCities) => updateDraft({ arrivalDepartureCities })}
              />
            ) : null}

            {activeTab === "main" ? (
              <TourGeneralDescriptionBlock
                value={draft.shortDescription}
                onChange={(shortDescription) => updateDraft({ shortDescription })}
                variantLabel={variantSync?.variantLabel}
                variantDiff={variantSync?.shortDescriptionDiff}
                onApplySync={() => markDirty()}
              />
            ) : null}

            {activeTab === "main" ? (
              <TourPhotosBlock
                coverImage={draft.image}
                gallery={draft.gallery}
                onCoverChange={(image) => updateDraft({ image })}
                onGalleryChange={(gallery) => updateDraft({ gallery })}
              />
            ) : null}

            {activeTab === "main" ? (
              <TourImpressionsBlock
                places={draft.places}
                onChange={(places) => updateDraft({ places })}
              />
            ) : null}

            {activeTab === "main" ? (
              <TourGuidesBlock
                guides={draft.guides}
                onChange={(guides) => updateDraft({ guides })}
              />
            ) : null}

            {activeTab === "description" ? (
              <>
                <TourComfortBlock
                  comfortLevels={draft.comfortLevels}
                  onChange={(comfortLevels) => {
                    const comfortLevel = primaryComfortLevel(comfortLevels);
                    updateDraft({
                      comfortLevels,
                      comfortLevel,
                      ...(comfortLevel === NO_ACCOMMODATION_LABEL
                        ? { accommodationType: "Без проживания" }
                        : {}),
                    });
                  }}
                />

                <TourAccommodationDescriptionBlock
                  description={draft.accommodationDescriptionText}
                  photos={draft.accommodationPhotos}
                  onDescriptionChange={(accommodationDescriptionText) =>
                    updateDraft({ accommodationDescriptionText })
                  }
                  onPhotosChange={(accommodationPhotos) => updateDraft({ accommodationPhotos })}
                  variantLabel={variantSync?.variantLabel}
                  variantDiff={variantSync?.accommodationDescriptionDiff}
                  onApplySync={() => markDirty()}
                />

                {variantSync?.accommodationDescriptionDiff ? (
                  <TourAccommodationVariantsBlock
                    variantLabel={variantSync.variantLabel}
                    variantPlaces={IGUAZU_VARIANT_ACCOMMODATIONS}
                    onReplaceAll={() => markDirty()}
                  />
                ) : null}

                <TourAccommodationPlacesBlock
                  places={draft.accommodationPlaces}
                  onChange={(accommodationPlaces) => updateDraft({ accommodationPlaces })}
                />
              </>
            ) : null}

            {activeTab === "conditions" ? (
              <>
              <TourCurrencyBlock
                currency={draft.priceCurrency}
                priceFromPrefix={draft.priceFromPrefix}
                onCurrencyChange={(priceCurrency) => updateDraft({ priceCurrency })}
                onPriceFromPrefixChange={(priceFromPrefix) => updateDraft({ priceFromPrefix })}
              />

              <TourDiscountBlock
                enabledDiscounts={draft.enabledDiscounts}
                onChange={(enabledDiscounts) => updateDraft({ enabledDiscounts })}
              />

              <TourIndividualBlock
                enabled={draft.individualTourEnabled}
                periodFrom={draft.individualPeriodFrom}
                periodTo={draft.individualPeriodTo}
                priceUsd={draft.individualPriceUsd}
                currency={draft.priceCurrency}
                onEnabledChange={(individualTourEnabled) =>
                  updateDraft({
                    individualTourEnabled,
                    bookingMode: syncBookingModeForIndividual(
                      individualTourEnabled,
                      draft.bookingMode,
                      draft.groupTourDates.length > 0
                    ),
                  })
                }
                onPeriodFromChange={(individualPeriodFrom) => updateDraft({ individualPeriodFrom })}
                onPeriodToChange={(individualPeriodTo) => updateDraft({ individualPeriodTo })}
                onPriceChange={(individualPriceUsd) => updateDraft({ individualPriceUsd })}
              />

              <TourGroupDatesBlock
                dates={draft.groupTourDates}
                autoRollToNextYear={draft.autoRollGroupDatesToNextYear}
                durationDays={draft.durationDays}
                durationNights={draft.durationNights}
                priceCurrency={draft.priceCurrency}
                defaultPriceUsd={draft.priceUsd || draft.individualPriceUsd}
                onDatesChange={(groupTourDates) =>
                  updateDraft({
                    groupTourDates,
                    bookingMode: syncBookingModeForIndividual(
                      draft.individualTourEnabled,
                      draft.bookingMode,
                      groupTourDates.length > 0
                    ),
                  })
                }
                onAutoRollChange={(autoRollGroupDatesToNextYear) =>
                  updateDraft({ autoRollGroupDatesToNextYear })
                }
              />
              </>
            ) : null}

            {activeTab === "program" ? (
              <TourProgramBlock
                routeMapImage={draft.routeMapImage}
                programDays={draft.programDays}
                durationDays={draft.durationDays}
                onRouteMapChange={(routeMapImage) => updateDraft({ routeMapImage })}
                onProgramDaysChange={(programDays) => updateDraft({ programDays })}
              />
            ) : null}

            {activeTab === "terms" ? (
              <>
                <TourTermsConditionsBlock
                  includedText={draft.includedText}
                  excludedText={draft.excludedText}
                  onIncludedChange={(includedText) => updateDraft({ includedText })}
                  onExcludedChange={(excludedText) => updateDraft({ excludedText })}
                />

                <TourInsuranceBlock
                  insuranceType={draft.insuranceType}
                  insuranceDescription={draft.insuranceDescription}
                  onInsuranceTypeChange={(insuranceType) => updateDraft({ insuranceType })}
                  onInsuranceDescriptionChange={(insuranceDescription) =>
                    updateDraft({ insuranceDescription })
                  }
                />

                <TourCancellationBlock
                  useTemplate={draft.useCancellationTemplate}
                  customText={draft.customCancellationText}
                  onUseTemplateChange={(useCancellationTemplate) =>
                    updateDraft({ useCancellationTemplate })
                  }
                  onCustomTextChange={(customCancellationText) =>
                    updateDraft({ customCancellationText })
                  }
                />

                <TourTermsListBlock
                  title="Важно знать"
                  description="Ключевые рекомендации и ограничения для участников тура"
                  items={draft.importantInfo}
                  onChange={(importantInfo) => updateDraft({ importantInfo })}
                  placeholder="Например: возьмите непромокаемую обувь"
                />

                <TourPackingListBlock
                  enabled={draft.packingListEnabled}
                  value={draft.packingListText}
                  onEnabledChange={(packingListEnabled) => updateDraft({ packingListEnabled })}
                  onChange={(packingListText) => updateDraft({ packingListText })}
                />

                <TourFAQBlock
                  items={draft.faq}
                  onChange={(faq) => updateDraft({ faq })}
                />
              </>
            ) : null}

            {activeTab === "publish" ? (
              <section className="space-y-4 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="tour-status">Статус публикации</FieldLabel>
                    <select
                      id="tour-status"
                      value={draft.status}
                      onChange={(event) =>
                        updateDraft({ status: event.target.value as OrganizerTourStatus })
                      }
                      className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-charcoal focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    >
                      <option value="draft">Черновик</option>
                      <option value="published">Опубликовано</option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel htmlFor="tour-slug">URL тура</FieldLabel>
                    <Input id="tour-slug" value={draft.slug} readOnly className="bg-gray-50" />
                  </div>
                </div>

                <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={draft.isPreliminaryProgram ?? false}
                    onChange={(event) =>
                      updateDraft({ isPreliminaryProgram: event.target.checked })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand/30"
                  />
                  <span className="text-sm text-charcoal">Предварительная программа</span>
                </label>

                <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={draft.archived}
                    onChange={(event) => updateDraft({ archived: event.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand/30"
                  />
                  <span className="text-sm text-charcoal">Отправить в архив</span>
                </label>
              </section>
            ) : null}

            {error ? (
              <div role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {saved ? (
              <div className="rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800 xl:hidden">
                Изменения сохранены
              </div>
            ) : null}
          </div>

          <TourEditorSidebar
            draft={draft}
            saved={saved}
            loading={loading}
            onUnpublish={() => updateDraft({ status: "draft" })}
            onArchive={() => updateDraft({ archived: true, status: "draft" })}
          />
        </div>
    </form>
  );
}
