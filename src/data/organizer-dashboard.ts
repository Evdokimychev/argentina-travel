import type { LucideIcon } from "lucide-react";

export type OrganizerNavId =
  | "dashboard"
  | "analytics"
  | "tours"
  | "bookings"
  | "messages"
  | "reviews"
  | "payments";

export interface OrganizerNavItem {
  id: OrganizerNavId;
  label: string;
  href: string;
  badge?: number;
}

export const ORGANIZER_NAV_ITEMS: OrganizerNavItem[] = [
  { id: "dashboard", label: "Обзор", href: "/organizer" },
  { id: "analytics", label: "Аналитика", href: "/organizer/analytics" },
  { id: "tours", label: "Туры и экскурсии", href: "/organizer/tours" },
  { id: "bookings", label: "Заявки", href: "/organizer/bookings" },
  { id: "messages", label: "Сообщения", href: "/organizer/messages" },
  { id: "reviews", label: "Отзывы", href: "/organizer/reviews" },
  { id: "payments", label: "Финансы", href: "/organizer/finance" },
];

export interface OrganizerDashboardCard {
  id: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  status?: { label: string; tone: "success" | "neutral" };
  actions?: Array<{ label: string; variant: "primary" | "outline"; href?: string }>;
  meta?: string;
  links?: Array<{ label: string; href: string }>;
}
