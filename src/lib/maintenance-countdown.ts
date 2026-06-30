export type MaintenanceCountdownParts = {
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
};

/** Разбивает оставшееся время до целевой даты (упрощённый месяц = 30 дней). */
export function getMaintenanceCountdownParts(
  target: Date,
  now = new Date()
): MaintenanceCountdownParts {
  const diffMs = target.getTime() - now.getTime();
  if (!Number.isFinite(diffMs) || diffMs <= 0) {
    return { months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  let totalSeconds = Math.floor(diffMs / 1000);
  const seconds = totalSeconds % 60;
  totalSeconds = Math.floor(totalSeconds / 60);
  const minutes = totalSeconds % 60;
  totalSeconds = Math.floor(totalSeconds / 60);
  const hours = totalSeconds % 24;
  totalSeconds = Math.floor(totalSeconds / 24);
  const days = totalSeconds % 30;
  const months = Math.floor(totalSeconds / 30);

  return { months, days, hours, minutes, seconds, expired: false };
}

export function parseMaintenanceCountdownTarget(value: string | undefined | null): Date | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}
