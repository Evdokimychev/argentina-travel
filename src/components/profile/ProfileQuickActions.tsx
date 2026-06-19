"use client";

import Link from "next/link";
import {
  Bell,
  CalendarDays,
  Compass,
  Heart,
  Mail,
  Settings,
  Star,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { cabinetQuickActionClass, cabinetQuickActionsClass } from "@/lib/cabinet-ui";

const ACTIONS = [
  { href: "/tours", label: "Выбрать тур", icon: Compass },
  { href: "/profile/bookings", label: "Бронирования", icon: CalendarDays },
  { href: "/profile/favorites", label: "Избранное", icon: Heart },
  { href: "/profile/messages", label: "Сообщения", icon: Mail },
  { href: "/profile/reviews", label: "Отзывы", icon: Star },
  { href: "/profile/settings", label: "Настройки", icon: Settings },
] as const;

export default function ProfileQuickActions() {
  return (
    <nav aria-label="Быстрые действия" className={cabinetQuickActionsClass}>
      {ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <Link key={action.href} href={action.href} className={cabinetQuickActionClass}>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky/10 text-sky">
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </span>
            {action.label}
          </Link>
        );
      })}
      <Link href="#notifications" className={cn(cabinetQuickActionClass, "sm:hidden")}>
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky/10 text-sky">
          <Bell className="h-4 w-4" strokeWidth={1.75} />
        </span>
        Уведомления
      </Link>
    </nav>
  );
}
