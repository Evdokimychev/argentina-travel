import type { WaitlistStatus, WaitlistStatusActor } from "@/types/waitlist";

export const WAITLIST_STATUS_LABELS: Record<WaitlistStatus, string> = {
  waiting: "В очереди",
  contacted: "Связались",
  offered: "Место предложено",
  declined: "Отказ",
  cancelled: "Отменена",
  converted: "Оформлено",
};

export const WAITLIST_STATUS_TONE: Record<
  Exclude<WaitlistStatus, "converted" | "cancelled" | "declined">,
  string
> = {
  waiting: "bg-violet-50 text-violet-800 ring-violet-200/60",
  contacted: "bg-sky/10 text-sky ring-sky/20",
  offered: "bg-emerald-50 text-emerald-800 ring-emerald-200/60",
};

export const WAITLIST_STATUS_ACTOR_LABELS: Record<WaitlistStatusActor, string> = {
  system: "Система",
  organizer: "Организатор",
  tourist: "Турист",
};

/** Переходы статусов для организатора. */
export const ORGANIZER_WAITLIST_TRANSITIONS: Record<
  Exclude<WaitlistStatus, "converted" | "cancelled" | "declined">,
  WaitlistStatus[]
> = {
  waiting: ["contacted", "offered", "cancelled"],
  contacted: ["offered", "cancelled"],
  offered: ["waiting", "cancelled"],
};

export function isActiveWaitlistStatus(status: WaitlistStatus): boolean {
  return status === "waiting" || status === "contacted" || status === "offered";
}
