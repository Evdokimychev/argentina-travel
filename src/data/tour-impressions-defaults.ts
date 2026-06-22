import type { TourPlace } from "@/types";
import { normalizeEditorValue, trimHtmlToPlainTextLength } from "@/lib/rich-text";
import { tourGalleryImage } from "@/lib/seed-media";

export const ORGANIZER_TOUR_IMPRESSION_TITLE_MAX = 55;
export const ORGANIZER_TOUR_IMPRESSION_DESCRIPTION_MAX = 150;
export const ORGANIZER_TOUR_IMPRESSION_EXTENDED_SCHEDULE_MAX = 2000;
export const ORGANIZER_TOUR_IMPRESSIONS_MAX = 9;

export const DEFAULT_IGUAZU_IMPRESSIONS: TourPlace[] = [
  {
    id: "iguazu-imp-1",
    title: "Панорамный вид на водопады Игуасу",
    description:
      "Самая знаменитая точка парка — «Глотка Дьявола» (Garganta del Diablo). Шум воды слышен за километр, брызги создают радуги, а панорама из около 275 каскадов оставляет сильное впечатление.",
    image: tourGalleryImage("iguazu-falls", 0),
  },
  {
    id: "iguazu-imp-2",
    title: "Экологический поезд через джунгли",
    description:
      "Поезд проносит вас сквозь тропический лес Атлантики к началу пешего маршрута. По пути можно увидеть коати, туканов и редкие виды орхидей.",
    image: tourGalleryImage("iguazu-falls", 1),
  },
  {
    id: "iguazu-imp-3",
    title: "Смотровые площадки аргентинской стороны",
    description:
      "Серия трасс и мостков ведёт к водопадам с разных ракурсов — от общего вида до близких точек, где чувствуешь мощь падающей воды.",
    image: tourGalleryImage("iguazu-falls", 2),
  },
];

export function createEmptyImpression(id?: string): TourPlace {
  return {
    id: id ?? `imp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: "",
    description: "",
    image: "",
    extendedScheduleEnabled: false,
    extendedSchedule: "",
  };
}

export function normalizeImpressions(items: TourPlace[] | undefined): TourPlace[] {
  return (items ?? []).map((item) => ({
    id: item.id?.trim() || createEmptyImpression().id,
    title: item.title.trim().slice(0, ORGANIZER_TOUR_IMPRESSION_TITLE_MAX),
    description: item.description.trim().slice(0, ORGANIZER_TOUR_IMPRESSION_DESCRIPTION_MAX),
    image: item.image.trim(),
    extendedScheduleEnabled: Boolean(item.extendedScheduleEnabled),
    extendedSchedule: item.extendedScheduleEnabled
      ? trimHtmlToPlainTextLength(
          normalizeEditorValue(item.extendedSchedule?.trim() ?? ""),
          ORGANIZER_TOUR_IMPRESSION_EXTENDED_SCHEDULE_MAX
        )
      : "",
  }));
}
