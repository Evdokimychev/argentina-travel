export const PARTNER_WEBHOOK_EVENTS = [
  "booking.created",
  "booking.confirmed",
  "booking.cancelled",
] as const;

export type PartnerWebhookEvent = (typeof PARTNER_WEBHOOK_EVENTS)[number];

export type PartnerWebhookDeliveryStatus =
  | "pending"
  | "delivering"
  | "delivered"
  | "failed";

export type PartnerWebhookRecord = {
  id: string;
  organizerId: string;
  url: string;
  events: PartnerWebhookEvent[];
  active: boolean;
  secretMasked: string;
  createdAt: string;
  updatedAt: string;
};

export type PartnerWebhookDeliveryRecord = {
  id: string;
  webhookId: string;
  event: PartnerWebhookEvent;
  payload: Record<string, unknown>;
  status: PartnerWebhookDeliveryStatus;
  attempts: number;
  lastResponseStatus: number | null;
  lastError: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
};
