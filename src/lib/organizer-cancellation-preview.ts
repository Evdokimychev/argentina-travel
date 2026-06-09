import type { OrganizerCancellationSettings } from "@/types/organizer-profile";

export function buildCancellationTouristPreview(
  settings: OrganizerCancellationSettings
): string {
  if (settings.policyType === "standard") {
    return "Если вы отменяете бронирование после оплаты, то мы вернем вам всю внесенную сумму за вычетом расходов на организацию путешествия, которые будут у нас на момент отмены бронирования.";
  }

  const filled = settings.penalties.filter(
    (penalty) => penalty.amount.trim() && penalty.period.trim()
  );

  if (filled.length === 0) {
    return "Штрафные санкции отсутствуют";
  }

  return filled
    .map((penalty) => `${penalty.amount.trim()} — ${penalty.period.trim()}`)
    .join("; ");
}

export function buildCancellationTouristPreviewFull(
  settings: OrganizerCancellationSettings
): string {
  const base = buildCancellationTouristPreview(settings);
  const extra = settings.additionalConditions.trim();
  return extra ? `${base}\n\n${extra}` : base;
}
