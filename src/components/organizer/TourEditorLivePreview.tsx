"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Circle, ExternalLink, Eye } from "lucide-react";
import { buildTourDetailFromOrganizerDraft } from "@/lib/tour-repository";
import { buildTourSectionLinks } from "@/components/tour-detail/tour-section-links";
import { evaluateTourProfileCompletion } from "@/lib/tour-profile-completion";
import { formatDays } from "@/lib/pluralize";
import type { OrganizerTourDraft } from "@/types/organizer-tour";
import { cn } from "@/lib/cn";

interface TourEditorLivePreviewProps {
  draft: OrganizerTourDraft;
  onOpenFullPreview: () => void;
  className?: string;
}

const SECTION_TAB_HINT: Record<string, string> = {
  description: "main",
  places: "main",
  itinerary: "program",
  dates: "conditions",
  included: "terms",
  accommodations: "description",
  faq: "terms",
  important: "terms",
  packing: "terms",
  policies: "terms",
  logistics: "main",
  "route-map": "program",
};

function formatPrice(draft: OrganizerTourDraft): string {
  if (draft.priceOnRequest) {
    return draft.priceUsd > 0 ? `от ${draft.priceUsd} ${draft.priceCurrency}` : "Цена по запросу";
  }
  if (draft.priceUsd <= 0) return "Укажите стоимость";
  const prefix = draft.priceFromPrefix ? "от " : "";
  return `${prefix}${draft.priceUsd} ${draft.priceCurrency}`;
}

export default function TourEditorLivePreview({
  draft,
  onOpenFullPreview,
  className,
}: TourEditorLivePreviewProps) {
  const preview = useMemo(() => buildTourDetailFromOrganizerDraft(draft), [draft]);
  const sectionLinks = useMemo(
    () => buildTourSectionLinks(preview.tour, { hasSimilarTours: false, canonicalTour: preview.canonical }),
    [preview]
  );
  const completion = useMemo(() => evaluateTourProfileCompletion(draft), [draft]);
  const completionById = useMemo(
    () => new Map(completion.items.map((item) => [item.id, item.done])),
    [completion]
  );

  const cover = draft.image || draft.gallery.find(Boolean) || "";
  const title = draft.title.trim() || "Без названия";

  function sectionReady(sectionId: string): boolean {
    switch (sectionId) {
      case "description":
        return completionById.get("description") ?? false;
      case "places":
        return draft.places.some((place) => place.title.trim());
      case "itinerary":
        return completionById.get("program") ?? false;
      case "dates":
        return completionById.get("dates") ?? false;
      case "included":
        return completionById.get("included") ?? false;
      case "accommodations":
        return Boolean(draft.accommodationDescriptionText.trim() || draft.accommodationPlaces.length);
      case "faq":
        return completionById.get("faq") ?? false;
      case "important":
        return draft.importantInfo.some((item) => item.trim());
      case "packing":
        return draft.packingListEnabled && Boolean(draft.packingListText.trim());
      case "policies":
        return Boolean(draft.insuranceDescription.trim() || !draft.useCancellationTemplate);
      case "logistics":
      case "route-map":
        return Boolean(
          draft.arrivalDetailsEnabled ||
            draft.arrivalDepartureEnabled ||
            draft.routeMapImage.trim() ||
            draft.routePoints.length
        );
      case "organizer":
        return draft.guides.some((guide) => guide.name.trim());
      case "reviews":
        return true;
      default:
        return true;
    }
  }

  return (
    <div className={cn("rounded-2xl border border-gray-200 bg-white shadow-sm", className)}>
      <div className="border-b border-gray-100 px-4 py-3 sm:px-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-heading text-base font-bold text-charcoal">Карточка на сайте</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-slate">
              Живой предпросмотр — обновляется по мере редактирования
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenFullPreview}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-medium text-charcoal transition-colors hover:border-brand/30 hover:bg-brand-light/40"
          >
            <Eye className="h-3.5 w-3.5 text-brand" />
            На весь экран
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <article className="overflow-hidden rounded-2xl border border-gray-200/80 bg-gray-50/40">
          <div className="relative aspect-[16/10] bg-gray-100">
            {cover ? (
              <Image src={cover} alt="" fill className="object-cover" sizes="320px" unoptimized />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate">
                Добавьте обложку
              </div>
            )}
            <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-charcoal shadow-sm">
              {formatDays(Math.max(1, draft.durationDays))}
            </span>
          </div>

          <div className="space-y-2 p-3">
            <h3 className="line-clamp-2 font-heading text-sm font-bold leading-snug text-charcoal">
              {title}
            </h3>
            <p className="text-sm font-semibold text-brand">{formatPrice(draft)}</p>
            {draft.shortDescription.trim() ? (
              <p className="line-clamp-3 text-xs leading-relaxed text-slate">{draft.shortDescription}</p>
            ) : (
              <p className="text-xs italic text-slate">Краткое описание пока не заполнено</p>
            )}
          </div>
        </article>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate">Разделы страницы</p>
          <ul className="mt-2 space-y-1">
            {sectionLinks.map((link) => {
              const ready = sectionReady(link.id);
              return (
                <li
                  key={link.id}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-charcoal"
                >
                  {ready ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
                  ) : (
                    <Circle className="h-3.5 w-3.5 shrink-0 text-gray-300" aria-hidden />
                  )}
                  <span className={cn(!ready && "text-slate")}>{link.label}</span>
                  {SECTION_TAB_HINT[link.id] ? (
                    <span className="ml-auto text-[10px] text-slate">
                      {ORGANIZER_TAB_LABEL[SECTION_TAB_HINT[link.id]!]}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>

        <Link
          href={`/organizer/tours/${draft.id}/preview`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-sky hover:underline"
        >
          Открыть сохранённую версию
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

const ORGANIZER_TAB_LABEL: Record<string, string> = {
  main: "Основное",
  description: "Жильё",
  conditions: "Цены",
  program: "Программа",
  terms: "Условия",
  publish: "Публикация",
};
