import type { ContactSubmissionStatus } from "@/types/database";

export const CONTACT_STATUS_TRANSITIONS: Readonly<
  Record<ContactSubmissionStatus, readonly ContactSubmissionStatus[]>
> = {
  new: ["in_progress", "waiting", "resolved", "spam"],
  in_progress: ["waiting", "resolved", "spam", "new"],
  waiting: ["in_progress", "resolved", "spam"],
  resolved: ["in_progress"],
  spam: ["new"],
};

export function canTransitionContactStatus(
  from: ContactSubmissionStatus,
  to: ContactSubmissionStatus,
): boolean {
  if (from === to) return true;
  return CONTACT_STATUS_TRANSITIONS[from].includes(to);
}

export function assertContactStatusTransition(
  from: ContactSubmissionStatus,
  to: ContactSubmissionStatus,
): { ok: true } | { ok: false; error: string } {
  if (canTransitionContactStatus(from, to)) return { ok: true };
  return {
    ok: false,
    error: `Переход из статуса «${from}» в «${to}» недоступен. Завершённые и спам можно только вернуть в работу явно.`,
  };
}
