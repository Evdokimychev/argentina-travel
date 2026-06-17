import type { OrganizerTourDraft } from "@/types/organizer-tour";
import { isValidCustomBookingUrl } from "@/lib/tour-custom-booking-link";

export type PublishReadinessSeverity = "blocking" | "warning";

export interface PublishReadinessIssue {
  id: string;
  label: string;
  severity: PublishReadinessSeverity;
  tabId?: "main" | "description" | "conditions" | "program" | "terms" | "publish";
}

export interface PublishReadinessResult {
  ready: boolean;
  blockingCount: number;
  warningCount: number;
  issues: PublishReadinessIssue[];
  blockingMessage: string | null;
}

function hasScheduleOrOnRequest(draft: OrganizerTourDraft): boolean {
  if (draft.customBookingLink?.enabled) return true;
  if (draft.bookingMode === "on_request") return true;
  if (draft.individualTourEnabled) return true;
  return draft.groupTourDates.some(
    (date) => date.startDate.trim() && date.endDate.trim()
  );
}

function hasDescription(draft: OrganizerTourDraft): boolean {
  return Boolean(
    draft.shortDescription.trim() ||
      draft.description.trim() ||
      draft.programDays.some((day) => day.title.trim() || day.description.trim())
  );
}

export function evaluatePublishReadiness(draft: OrganizerTourDraft): PublishReadinessResult {
  const issues: PublishReadinessIssue[] = [];

  if (!draft.title.trim()) {
    issues.push({
      id: "title",
      label: "Укажите название тура",
      severity: "blocking",
      tabId: "main",
    });
  } else if (draft.title.trim().length < 8) {
    issues.push({
      id: "title-short",
      label: "Название слишком короткое — добавьте деталей маршрута",
      severity: "warning",
      tabId: "main",
    });
  }

  if (draft.priceOnRequest) {
    if (draft.priceUsd <= 0 && !draft.priceFromPrefix) {
      issues.push({
        id: "price-reference",
        label: "Добавьте ориентировочную цену или включите подпись «от» — так проще привлекать заявки",
        severity: "warning",
        tabId: "conditions",
      });
    }
  } else if (draft.priceUsd <= 0) {
    issues.push({
      id: "price",
      label: "Укажите цену тура (больше 0) или включите режим «Цена по запросу»",
      severity: "blocking",
      tabId: "conditions",
    });
  }

  if (!hasDescription(draft)) {
    issues.push({
      id: "description",
      label: "Добавьте краткое или полное описание программы",
      severity: "blocking",
      tabId: "description",
    });
  }

  const images = draft.gallery.filter(Boolean);
  if (images.length === 0 && !draft.image.trim()) {
    issues.push({
      id: "images",
      label: "Загрузите хотя бы одно фото тура",
      severity: "blocking",
      tabId: "main",
    });
  }

  if (draft.customBookingLink?.enabled) {
    if (!draft.customBookingLink.url.trim()) {
      issues.push({
        id: "custom-booking-url",
        label: "Укажите URL внешней ссылки на бронирование",
        severity: "blocking",
        tabId: "conditions",
      });
    } else if (!isValidCustomBookingUrl(draft.customBookingLink.url)) {
      issues.push({
        id: "custom-booking-url-invalid",
        label: "Некорректная ссылка на бронирование — нужен адрес http:// или https://",
        severity: "blocking",
        tabId: "conditions",
      });
    }
  }

  if (!hasScheduleOrOnRequest(draft)) {
    issues.push({
      id: "dates",
      label: "Добавьте даты группового тура или включите бронирование по запросу",
      severity: "blocking",
      tabId: "conditions",
    });
  }

  if (!draft.region.trim() && !draft.destination.trim()) {
    issues.push({
      id: "region",
      label: "Укажите регион или место проведения",
      severity: "blocking",
      tabId: "main",
    });
  }

  if (draft.groupMax < draft.groupMin) {
    issues.push({
      id: "group-size",
      label: "Максимальный размер группы меньше минимального",
      severity: "blocking",
      tabId: "conditions",
    });
  }

  if (draft.programDays.length === 0) {
    issues.push({
      id: "program-empty",
      label: "Добавьте хотя бы один день программы",
      severity: "warning",
      tabId: "program",
    });
  }

  const blocking = issues.filter((item) => item.severity === "blocking");
  const warnings = issues.filter((item) => item.severity === "warning");

  return {
    ready: blocking.length === 0,
    blockingCount: blocking.length,
    warningCount: warnings.length,
    issues,
    blockingMessage:
      blocking.length > 0
        ? `Публикация недоступна: ${blocking.map((item) => item.label).join("; ")}`
        : null,
  };
}
