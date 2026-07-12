import type { KbEntry } from "./types";

const SENSITIVE_SECTION_IDS = new Set([
  "pereezd-v-argentinu",
  "dokumenty-i-legalizatsiya",
  "finansy-i-ekonomika",
]);

const SENSITIVE_TEXT_RE =
  /(внж|гражданств|иммиграц|миграц|dni|cuil|cuit|radex|dnu|декрет|виза|резиденц|апостил|налог|monotributo|банк|перевод|валют|blue dollar|страхов|медицин|безопасн|мошеннич|краж|преступ|полици|motochorro)/i;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface KbEditorialReview {
  isSensitive: boolean;
  isReviewDue: boolean;
  needsAttention: boolean;
  missingSources: boolean;
  reviewDueAt: string | null;
  sourceCount: number;
  policyDays: number;
}

function parseIsoDate(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

export function isKbSensitiveEntry(entry: KbEntry): boolean {
  if ((entry.site_sections ?? []).some((sectionId) => SENSITIVE_SECTION_IDS.has(sectionId))) {
    return true;
  }

  const text = [
    entry.title,
    entry.summary,
    entry.subtype,
    ...(entry.tags ?? []),
  ]
    .filter(Boolean)
    .join(" ");

  return SENSITIVE_TEXT_RE.test(text);
}

export function getKbEditorialReview(
  entry: KbEntry,
  now = new Date(),
): KbEditorialReview {
  const isSensitive = isKbSensitiveEntry(entry);
  const sourceCount = entry.sources?.length ?? 0;
  const verifiedAt = parseIsoDate(entry.last_verified);
  const policyDays = isSensitive
    ? 45
    : entry.confidence === "low"
      ? 30
      : entry.confidence === "medium"
        ? 90
        : 180;
  const reviewDueAt = verifiedAt ? addDays(verifiedAt, policyDays) : null;
  const isReviewDue = !reviewDueAt || reviewDueAt.getTime() < now.getTime();
  const missingSources = isSensitive && sourceCount === 0;
  const needsAttention =
    isReviewDue || missingSources || entry.confidence === "low";

  return {
    isSensitive,
    isReviewDue,
    needsAttention,
    missingSources,
    reviewDueAt: reviewDueAt ? toIsoDate(reviewDueAt) : null,
    sourceCount,
    policyDays,
  };
}
