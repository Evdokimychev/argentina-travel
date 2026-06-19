export function formatExcursionDuration(
  minutes: number | undefined,
  t: (key: string) => string
): string | null {
  if (!minutes || minutes <= 0) return null;

  const minUnit = t("excursions.duration.min");
  const hourUnit = t("excursions.duration.h");

  if (minutes < 60) return `${minutes} ${minUnit}`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return `${hours} ${hourUnit}`;
  return `${hours} ${hourUnit} ${rest} ${minUnit}`;
}

function resolveGuideSinceLocale(locale: string): string {
  if (locale.startsWith("ru")) return "ru-RU";
  if (locale.startsWith("es")) return "es-ES";
  if (locale.startsWith("pt")) return "pt-BR";
  return "en-US";
}

export function formatGuideSinceDisplay(value: string, locale: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (/^\d{4}$/.test(trimmed)) return trimmed;

  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
    ? new Date(`${trimmed}T12:00:00`)
    : new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) return trimmed;

  return new Intl.DateTimeFormat(resolveGuideSinceLocale(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}
