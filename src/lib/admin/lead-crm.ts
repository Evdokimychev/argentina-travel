import type { ContactSubmissionKind, ContactSubmissionStatus } from "@/types/database";

export const CONTACT_STATUS_LABELS: Record<ContactSubmissionStatus, string> = {
  new: "Новое",
  in_progress: "В работе",
  waiting: "Ждём ответа",
  resolved: "Завершено",
  spam: "Спам",
};

export const CONTACT_KIND_LABELS: Record<ContactSubmissionKind, string> = {
  general: "Общий вопрос",
  tour_inquiry: "Вопрос о туре",
  service_request: "Запрос услуги",
  product_inquiry: "Вопрос о продукте",
  organizer_application: "Заявка организатора",
  consultation: "Консультация",
};
