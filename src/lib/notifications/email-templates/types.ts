import type { NotificationCategory } from "@/types/notifications-hub";

export type EmailTemplateResult = {
  subject: string;
  html: string;
  text: string;
};

export type EmailLayoutOptions = {
  previewText?: string;
  greeting?: string;
  unsubscribeUrl?: string | null;
  cta?: {
    label: string;
    href: string;
  };
};

export type TransactionalEmailCategory = NotificationCategory;
