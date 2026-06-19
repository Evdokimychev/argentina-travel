import type { Json } from "@/types/database";

export type AdminNotificationType = "moderation_queue" | "new_lead" | "pending_payment";

export type AdminNotificationItem = {
  id: string;
  type: AdminNotificationType;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
  metadata: Json;
};
