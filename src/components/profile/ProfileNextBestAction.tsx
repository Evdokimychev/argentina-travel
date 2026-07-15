"use client";

import { CalendarCheck2, CreditCard, MessageSquare, Route, UserRound } from "lucide-react";
import { ActionQueue, type ActionQueueItem } from "@/components/workspace/ActionQueue";
import { useUserExperience } from "@/context/UserExperienceContext";
import type { UserPendingAction } from "@/types/user-experience";

const ACTION_COPY: Record<
  UserPendingAction["type"],
  Pick<ActionQueueItem, "title" | "description" | "label" | "icon">
> = {
  payment: {
    title: "Завершите оплату поездки",
    description: "Бронирование подтверждено и ожидает оплаты.",
    label: "К оплате",
    icon: CreditCard,
  },
  message: {
    title: "Ответьте на новое сообщение",
    description: "В переписке есть сообщение, которое ждёт ответа.",
    label: "Ответить",
    icon: MessageSquare,
  },
  trip_prep: {
    title: "Подготовьтесь к ближайшей поездке",
    description: "Проверьте документы, даты и полезные детали перед выездом.",
    label: "Открыть план",
    icon: Route,
  },
  booking: {
    title: "Проверьте статус бронирования",
    description: "По заявке требуется следующее действие.",
    label: "К бронированию",
    icon: CalendarCheck2,
  },
  moderation: {
    title: "Завершите проверку материала",
    description: "Материал ожидает решения.",
    label: "Проверить",
    icon: CalendarCheck2,
  },
  profile: {
    title: "Дополните профиль",
    description: "Контактные данные ускорят оформление и связь по поездке.",
    label: "Заполнить",
    icon: UserRound,
  },
};

export default function ProfileNextBestAction() {
  const { experience, loading } = useUserExperience();
  if (loading) {
    return <div className="h-28 animate-pulse rounded-2xl border border-border-subtle bg-surface-muted" aria-label="Загружаем следующее действие" />;
  }

  const action = experience.pendingActions[0];
  const items: ActionQueueItem[] = action
    ? [{ id: `${action.type}-${action.href}`, href: action.href, priority: action.priority, ...ACTION_COPY[action.type] }]
    : [];

  return (
    <ActionQueue
      title="Следующий шаг"
      description="Самое важное действие по вашей поездке сейчас."
      items={items}
      emptyTitle="По поездкам всё в порядке"
      emptyDescription="Новых обязательных действий сейчас нет."
    />
  );
}
