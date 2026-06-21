import type { CmsDocumentStatus } from "@/types/cms-content";

export const CMS_SCHEDULE_MIN_LEAD_MS = 60_000;

export function parseScheduledPublishAt(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString();
}

export function validateScheduledPublishAt(
  iso: string,
  now = Date.now()
): { ok: true; iso: string } | { ok: false; error: string } {
  const at = Date.parse(iso);
  if (Number.isNaN(at)) {
    return { ok: false, error: "Некорректная дата публикации" };
  }
  if (at - now < CMS_SCHEDULE_MIN_LEAD_MS) {
    return { ok: false, error: "Время публикации должно быть минимум через 1 минуту" };
  }
  return { ok: true, iso: new Date(at).toISOString() };
}

export function isScheduledCmsStatus(status: CmsDocumentStatus): boolean {
  return status === "scheduled";
}

/** Convert stored ISO to value for `<input type="datetime-local">` in local timezone. */
export function scheduledPublishAtToDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Parse `<input type="datetime-local">` value as local time → ISO UTC. */
export function datetimeLocalValueToScheduledPublishAt(value: string): string | null {
  if (!value.trim()) return null;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString();
}

export function formatScheduledPublishLabel(iso: string, locale = "ru-RU"): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
