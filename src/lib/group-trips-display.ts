import type { GroupTripListingStatus, GroupTripMemberStatus } from "@/types/group-trips";

export const GROUP_TRIP_LISTING_STATUS_LABELS: Record<GroupTripListingStatus, string> = {
  open: "Набор открыт",
  full: "Группа набрана",
  confirmed: "Подтверждено организатором",
  cancelled: "Отменено",
};

export const GROUP_TRIP_MEMBER_STATUS_LABELS: Record<GroupTripMemberStatus, string> = {
  interested: "В наборе",
  confirmed: "Подтверждён",
  declined: "Вышел",
};

export function formatGroupTripProgress(memberCount: number, minParticipants: number, maxParticipants: number): string {
  return `${memberCount} · мин. ${minParticipants} · макс. ${maxParticipants}`;
}

export function isGroupTripJoinable(status: GroupTripListingStatus): boolean {
  return status === "open";
}
