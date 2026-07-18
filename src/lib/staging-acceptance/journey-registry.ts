export const ACCEPTANCE_EVIDENCE_BOUNDARIES = [
  "browser",
  "request",
  "database",
  "roleVisibility",
  "cleanup",
] as const;

export type AcceptanceEvidenceBoundary = (typeof ACCEPTANCE_EVIDENCE_BOUNDARIES)[number];

export type AcceptanceJourney = Readonly<{
  id: `J${string}`;
  matrixId: number;
  title: string;
  roles: readonly string[];
  sprint: readonly string[];
  requiredEvidence: readonly AcceptanceEvidenceBoundary[];
}>;

const evidence = ACCEPTANCE_EVIDENCE_BOUNDARIES;

export const ACCEPTANCE_JOURNEYS = [
  { id: "J01", matrixId: 1, title: "Гость: главная → каталог → фильтры → карточка", roles: ["guest"], sprint: ["0A", "3", "10"], requiredEvidence: evidence },
  { id: "J02", matrixId: 2, title: "Гость: тур/экскурсия → дата → CTA", roles: ["guest"], sprint: ["0A", "6"], requiredEvidence: evidence },
  { id: "J03", matrixId: 3, title: "Партнёрский checkout без создания реального заказа", roles: ["guest"], sprint: ["0A", "6"], requiredEvidence: evidence },
  { id: "J04", matrixId: 4, title: "Регистрация туриста и подтверждение email", roles: ["tourist"], sprint: ["0A", "1"], requiredEvidence: evidence },
  { id: "J05", matrixId: 5, title: "Вход, выход и неверный пароль", roles: ["tourist"], sprint: ["0A", "10"], requiredEvidence: evidence },
  { id: "J06", matrixId: 6, title: "Сброс пароля, ссылка и новый пароль", roles: ["tourist"], sprint: ["0A", "1"], requiredEvidence: evidence },
  { id: "J07", matrixId: 7, title: "Профиль, избранное и сохранённые материалы", roles: ["tourist"], sprint: ["0A", "10"], requiredEvidence: evidence },
  { id: "J08", matrixId: 8, title: "Заявки туриста и привязка гостевой заявки", roles: ["guest", "tourist"], sprint: ["0A", "6"], requiredEvidence: evidence },
  { id: "J09", matrixId: 9, title: "Заявка организатора и доверенное назначение роли", roles: ["organizerApplicant", "admin"], sprint: ["0A", "1", "7"], requiredEvidence: evidence },
  { id: "J10", matrixId: 10, title: "Организатор создаёт тур или экскурсию", roles: ["organizer"], sprint: ["0A", "7"], requiredEvidence: evidence },
  { id: "J11", matrixId: 11, title: "Автосохранение, перезагрузка и конфликт версий", roles: ["organizer"], sprint: ["0A", "7"], requiredEvidence: evidence },
  { id: "J12", matrixId: 12, title: "Загрузка, замена и удаление медиа", roles: ["organizer"], sprint: ["0A", "1", "7"], requiredEvidence: evidence },
  { id: "J13", matrixId: 13, title: "Готовность тура и отправка на модерацию", roles: ["organizer"], sprint: ["0A", "7"], requiredEvidence: evidence },
  { id: "J14", matrixId: 14, title: "Очередь администратора, approve/reject и audit actor", roles: ["limitedAdmin", "fullAdmin"], sprint: ["0A", "1", "7"], requiredEvidence: evidence },
  { id: "J15", matrixId: 15, title: "Публикация и повторная модерация", roles: ["organizer", "admin", "guest"], sprint: ["0A", "7"], requiredEvidence: evidence },
  { id: "J16", matrixId: 16, title: "Даты, остатки, overbooking и waitlist", roles: ["tourist", "organizer"], sprint: ["0A", "6", "7"], requiredEvidence: evidence },
  { id: "J17", matrixId: 17, title: "Native booking: цена, запись и подтверждение", roles: ["tourist", "organizer", "admin"], sprint: ["0A", "6"], requiredEvidence: evidence },
  { id: "J18", matrixId: 18, title: "CRM заявок, статусы и комментарии", roles: ["organizer", "otherOrganizer", "tourist", "admin"], sprint: ["0A", "7"], requiredEvidence: evidence },
  { id: "J19", matrixId: 19, title: "Переписка туриста и организатора", roles: ["tourist", "organizer", "otherTourist"], sprint: ["0A", "1", "7"], requiredEvidence: evidence },
  { id: "J20", matrixId: 20, title: "Уведомления и email outbox", roles: ["tourist", "organizer"], sprint: ["0A", "2", "7"], requiredEvidence: evidence },
  { id: "J21", matrixId: 21, title: "Отмена заявки и освобождение места", roles: ["tourist", "organizer"], sprint: ["0A", "6"], requiredEvidence: evidence },
  { id: "J22", matrixId: 22, title: "Sandbox-оплата, webhook replay и refund", roles: ["tourist", "admin"], sprint: ["0A", "9"], requiredEvidence: evidence },
  { id: "J23", matrixId: 23, title: "CMS, staff, settings, redirects и privacy", roles: ["limitedAdmin", "fullAdmin"], sprint: ["0A", "1", "8", "10"], requiredEvidence: evidence },
  { id: "J24", matrixId: 24, title: "Privacy export и delete", roles: ["tourist", "admin"], sprint: ["0A", "1", "9"], requiredEvidence: evidence },
  { id: "J25", matrixId: 25, title: "Cron, outbox, reconciliation и incident", roles: ["system", "admin"], sprint: ["2"], requiredEvidence: evidence },
] as const satisfies readonly AcceptanceJourney[];

export function journeyIdFromTitle(title: string): AcceptanceJourney["id"] | null {
  return (title.match(/\[(J\d{2})\]/)?.[1] as AcceptanceJourney["id"] | undefined) ?? null;
}
