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
