import { renderEmailLayout, renderPlainEmail } from "@/lib/notifications/email-templates/layout";
import type { EmailLayoutOptions, EmailTemplateResult } from "@/lib/notifications/email-templates/types";
import { escapeHtml } from "@/lib/notifications/email-templates/utils";
import { getSiteUrl } from "@/lib/site-url";

export const EMAIL_TEMPLATE_LOCALES = ["ru", "en", "es", "pt"] as const;
export type EmailTemplateLocale = (typeof EMAIL_TEMPLATE_LOCALES)[number];

export type EmailTemplateBlock =
  | { type: "paragraph"; text: string }
  | { type: "button"; label: string; urlVariable: string }
  | { type: "divider" };

export type EmailTemplateCatalogEntry = {
  eventKey: string;
  label: string;
  description: string;
  variables: ReadonlyArray<{ key: string; label: string; example: string; kind: "text" | "url" }>;
  defaultSubject: string;
  defaultBlocks: ReadonlyArray<EmailTemplateBlock>;
  connected: boolean;
};

export const EMAIL_TEMPLATE_CATALOG = [
  {
    eventKey: "booking.confirmed",
    label: "Заявка на тур принята",
    description: "Сервисное письмо туристу сразу после создания заявки.",
    connected: true,
    variables: [
      { key: "recipient_name", label: "Имя получателя", example: "Анна", kind: "text" },
      { key: "booking_number", label: "Номер заявки", example: "GA-4821", kind: "text" },
      { key: "tour_title", label: "Название тура", example: "Патагония без спешки", kind: "text" },
      { key: "start_date", label: "Дата начала", example: "12 октября 2026", kind: "text" },
      { key: "end_date", label: "Дата завершения", example: "20 октября 2026", kind: "text" },
      { key: "guests", label: "Количество участников", example: "2", kind: "text" },
      { key: "booking_url", label: "Ссылка на заявку", example: "https://www.goargentina.ru/profile/bookings/example", kind: "url" },
    ],
    defaultSubject: "Заявка принята: {{tour_title}}",
    defaultBlocks: [
      { type: "paragraph", text: "Здравствуйте, {{recipient_name}}!" },
      { type: "paragraph", text: "Заявка №{{booking_number}} на тур «{{tour_title}}» принята и передана организатору." },
      { type: "paragraph", text: "Даты: {{start_date}} — {{end_date}}. Участников: {{guests}}." },
      { type: "paragraph", text: "Мы сообщим, когда статус изменится." },
      { type: "button", label: "Открыть заявку", urlVariable: "booking_url" },
    ],
  },
  {
    eventKey: "booking.status_changed",
    label: "Статус заявки изменён",
    description: "Системное письмо об изменении статуса заявки.",
    connected: true,
    variables: [
      { key: "recipient_name", label: "Имя получателя", example: "Анна", kind: "text" },
      { key: "booking_number", label: "Номер заявки", example: "GA-4821", kind: "text" },
      { key: "tour_title", label: "Название тура", example: "Патагония без спешки", kind: "text" },
      { key: "previous_status", label: "Предыдущий статус", example: "Принята", kind: "text" },
      { key: "status", label: "Новый статус", example: "Подтверждена", kind: "text" },
      { key: "booking_url", label: "Ссылка на заявку", example: "https://www.goargentina.ru/profile/bookings/example", kind: "url" },
    ],
    defaultSubject: "Статус заявки: {{status}}",
    defaultBlocks: [
      { type: "paragraph", text: "Здравствуйте, {{recipient_name}}!" },
      { type: "paragraph", text: "Статус заявки №{{booking_number}} на тур «{{tour_title}}» изменён: {{previous_status}} → {{status}}." },
      { type: "button", label: "Открыть заявку", urlVariable: "booking_url" },
    ],
  },
  {
    eventKey: "booking.status_changed_admin",
    label: "Копия изменения статуса",
    description: "Служебное письмо администратору об изменении статуса заявки.",
    connected: true,
    variables: [
      { key: "booking_number", label: "Номер заявки", example: "GA-4821", kind: "text" },
      { key: "tour_title", label: "Название тура", example: "Патагония без спешки", kind: "text" },
      { key: "previous_status", label: "Предыдущий статус", example: "Принята", kind: "text" },
      { key: "status", label: "Новый статус", example: "Подтверждена", kind: "text" },
      { key: "admin_url", label: "Ссылка в админку", example: "https://www.goargentina.ru/admin/bookings", kind: "url" },
    ],
    defaultSubject: "Заявка №{{booking_number}}: статус {{status}}",
    defaultBlocks: [
      { type: "paragraph", text: "Статус заявки №{{booking_number}} на тур «{{tour_title}}» изменён: {{previous_status}} → {{status}}." },
      { type: "button", label: "Открыть заявки", urlVariable: "admin_url" },
    ],
  },
  {
    eventKey: "payment.received",
    label: "Платёж зафиксирован",
    description: "Системное письмо о зафиксированном платеже.",
    connected: true,
    variables: [
      { key: "recipient_name", label: "Имя получателя", example: "Анна", kind: "text" },
      { key: "booking_number", label: "Номер заявки", example: "GA-4821", kind: "text" },
      { key: "tour_title", label: "Название тура", example: "Патагония без спешки", kind: "text" },
      { key: "payment_status", label: "Статус платежа", example: "Оплата получена", kind: "text" },
      { key: "amount", label: "Сумма", example: "350 USD", kind: "text" },
      { key: "payment_method", label: "Способ оплаты", example: "Банковская карта", kind: "text" },
      { key: "booking_url", label: "Ссылка на заявку", example: "https://www.goargentina.ru/profile/bookings/example", kind: "url" },
    ],
    defaultSubject: "{{payment_status}}: {{tour_title}}",
    defaultBlocks: [
      { type: "paragraph", text: "Здравствуйте, {{recipient_name}}!" },
      { type: "paragraph", text: "{{payment_status}} по заявке №{{booking_number}} на тур «{{tour_title}}»." },
      { type: "paragraph", text: "Сумма: {{amount}}. Способ оплаты: {{payment_method}}." },
      { type: "button", label: "Открыть заявку", urlVariable: "booking_url" },
    ],
  },
  {
    eventKey: "messaging.new_message",
    label: "Новое сообщение",
    description: "Письмо туристу или организатору о новом сообщении в переписке.",
    connected: true,
    variables: [
      { key: "recipient_name", label: "Имя получателя", example: "Анна", kind: "text" },
      { key: "sender_name", label: "Имя отправителя", example: "Организатор тура", kind: "text" },
      { key: "tour_title", label: "Название тура", example: "Патагония без спешки", kind: "text" },
      { key: "booking_number", label: "Номер заявки", example: "GA-4821", kind: "text" },
      { key: "message_preview", label: "Фрагмент сообщения", example: "Уточнили место встречи и время начала.", kind: "text" },
      { key: "message_url", label: "Ссылка на переписку", example: "https://www.goargentina.ru/profile/messages", kind: "url" },
    ],
    defaultSubject: "Новое сообщение: {{tour_title}}",
    defaultBlocks: [
      { type: "paragraph", text: "Здравствуйте, {{recipient_name}}!" },
      { type: "paragraph", text: "{{sender_name}} отправил новое сообщение по заявке №{{booking_number}} на «{{tour_title}}»." },
      { type: "paragraph", text: "{{message_preview}}" },
      { type: "button", label: "Открыть переписку", urlVariable: "message_url" },
    ],
  },
  {
    eventKey: "booking.reminder_24h",
    label: "Напоминание за 24 часа",
    description: "Письмо туристу или организатору перед началом подтверждённой поездки.",
    connected: true,
    variables: [
      { key: "recipient_name", label: "Имя получателя", example: "Анна", kind: "text" },
      { key: "booking_number", label: "Номер заявки", example: "GA-4821", kind: "text" },
      { key: "tour_title", label: "Название тура", example: "Патагония без спешки", kind: "text" },
      { key: "start_date", label: "Дата начала", example: "12 октября 2026", kind: "text" },
      { key: "details_url", label: "Ссылка на детали", example: "https://www.goargentina.ru/profile/bookings/example", kind: "url" },
    ],
    defaultSubject: "Напоминание о поездке: {{tour_title}}",
    defaultBlocks: [
      { type: "paragraph", text: "Здравствуйте, {{recipient_name}}!" },
      { type: "paragraph", text: "Тур «{{tour_title}}» по заявке №{{booking_number}} начнётся примерно через 24 часа." },
      { type: "paragraph", text: "Дата начала: {{start_date}}." },
      { type: "button", label: "Открыть детали", urlVariable: "details_url" },
    ],
  },
  {
    eventKey: "trip_prep.reminder",
    label: "Подготовка к поездке",
    description: "Письмо с чек-листом за 7, 3 или 1 день до начала тура.",
    connected: true,
    variables: [
      { key: "recipient_name", label: "Имя получателя", example: "Анна", kind: "text" },
      { key: "tour_title", label: "Название тура", example: "Патагония без спешки", kind: "text" },
      { key: "start_date", label: "Дата начала", example: "12 октября 2026", kind: "text" },
      { key: "time_until_start", label: "Срок до начала", example: "через неделю", kind: "text" },
      { key: "prep_url", label: "Ссылка на чек-лист", example: "https://www.goargentina.ru/profile/trip-prep", kind: "url" },
    ],
    defaultSubject: "Подготовка к поездке: {{tour_title}}",
    defaultBlocks: [
      { type: "paragraph", text: "Здравствуйте, {{recipient_name}}!" },
      { type: "paragraph", text: "До начала тура «{{tour_title}}» осталось {{time_until_start}}. Дата начала: {{start_date}}." },
      { type: "paragraph", text: "Проверьте документы, связь, деньги, багаж и контакты организатора." },
      { type: "button", label: "Открыть чек-лист", urlVariable: "prep_url" },
    ],
  },
  {
    eventKey: "review.moderated",
    label: "Результат модерации отзыва",
    description: "Письмо туристу после проверки его отзыва.",
    connected: true,
    variables: [
      { key: "recipient_name", label: "Имя получателя", example: "Анна", kind: "text" },
      { key: "tour_title", label: "Название тура", example: "Патагония без спешки", kind: "text" },
      { key: "moderation_result", label: "Результат проверки", example: "Отзыв опубликован", kind: "text" },
      { key: "moderator_note", label: "Комментарий модератора", example: "Спасибо за подробный отзыв.", kind: "text" },
      { key: "tour_url", label: "Ссылка на тур", example: "https://www.goargentina.ru/tours/example", kind: "url" },
    ],
    defaultSubject: "Проверка отзыва: {{tour_title}}",
    defaultBlocks: [
      { type: "paragraph", text: "Здравствуйте, {{recipient_name}}!" },
      { type: "paragraph", text: "{{moderation_result}} по туру «{{tour_title}}»." },
      { type: "paragraph", text: "Комментарий: {{moderator_note}}" },
      { type: "button", label: "Открыть тур", urlVariable: "tour_url" },
    ],
  },
  {
    eventKey: "review.organizer_published",
    label: "Новый отзыв организатору",
    description: "Письмо организатору о новом опубликованном отзыве.",
    connected: true,
    variables: [
      { key: "organizer_name", label: "Имя организатора", example: "Мария", kind: "text" },
      { key: "tour_title", label: "Название тура", example: "Патагония без спешки", kind: "text" },
      { key: "author_name", label: "Имя автора", example: "Путешественник", kind: "text" },
      { key: "rating", label: "Оценка", example: "5 из 5", kind: "text" },
      { key: "review_preview", label: "Фрагмент отзыва", example: "Продуманный маршрут и отличная организация.", kind: "text" },
      { key: "trip_date", label: "Дата поездки", example: "октябрь 2026", kind: "text" },
      { key: "reviews_url", label: "Ссылка на отзывы", example: "https://www.goargentina.ru/organizer/reviews", kind: "url" },
    ],
    defaultSubject: "Новый отзыв: {{tour_title}}",
    defaultBlocks: [
      { type: "paragraph", text: "Здравствуйте, {{organizer_name}}!" },
      { type: "paragraph", text: "По туру «{{tour_title}}» опубликован новый отзыв от {{author_name}}." },
      { type: "paragraph", text: "Оценка: {{rating}}. Дата поездки: {{trip_date}}." },
      { type: "paragraph", text: "{{review_preview}}" },
      { type: "button", label: "Открыть отзывы", urlVariable: "reviews_url" },
    ],
  },
  {
    eventKey: "privacy.delete_completed",
    label: "Удаление данных завершено",
    description: "Обязательное сервисное письмо после завершения запроса на удаление данных.",
    connected: true,
    variables: [
      { key: "recipient_name", label: "Имя получателя", example: "Анна", kind: "text" },
      { key: "request_number", label: "Номер запроса", example: "PR-4821", kind: "text" },
      { key: "completed_date", label: "Дата завершения", example: "12 октября 2026", kind: "text" },
      { key: "support_contact", label: "Контакт поддержки", example: "форма обратной связи", kind: "text" },
      { key: "settings_url", label: "Ссылка на настройки", example: "https://www.goargentina.ru/profile/settings", kind: "url" },
    ],
    defaultSubject: "Запрос на удаление данных выполнен",
    defaultBlocks: [
      { type: "paragraph", text: "Здравствуйте, {{recipient_name}}!" },
      { type: "paragraph", text: "Запрос №{{request_number}} на удаление персональных данных завершён {{completed_date}}." },
      { type: "paragraph", text: "Персональные данные профиля и контактные данные в связанных заявках обезличены. По вопросам используйте: {{support_contact}}." },
      { type: "button", label: "Открыть настройки", urlVariable: "settings_url" },
    ],
  },
  {
    eventKey: "content.freshness_report",
    label: "Отчёт об актуальности контента",
    description: "Служебная сводка редакции о материалах, требующих проверки.",
    connected: true,
    variables: [
      { key: "recipient_name", label: "Имя получателя", example: "Редакция", kind: "text" },
      { key: "report_date", label: "Дата отчёта", example: "12 октября 2026", kind: "text" },
      { key: "total_count", label: "Всего материалов", example: "8", kind: "text" },
      { key: "critical_count", label: "Критичных материалов", example: "2", kind: "text" },
      { key: "stale_count", label: "Просроченных материалов", example: "6", kind: "text" },
      { key: "items_summary", label: "Список материалов", example: "Виза цифрового кочевника — проверить до 18 октября", kind: "text" },
      { key: "dashboard_url", label: "Ссылка на панель", example: "https://www.goargentina.ru/admin/content/freshness", kind: "url" },
    ],
    defaultSubject: "Контент: {{total_count}} материалов требуют проверки",
    defaultBlocks: [
      { type: "paragraph", text: "Здравствуйте, {{recipient_name}}!" },
      { type: "paragraph", text: "Отчёт за {{report_date}}: требуют проверки {{total_count}} материалов, критично — {{critical_count}}, просрочено — {{stale_count}}." },
      { type: "paragraph", text: "{{items_summary}}" },
      { type: "button", label: "Открыть панель", urlVariable: "dashboard_url" },
    ],
  },
  {
    eventKey: "notifications.daily_digest",
    label: "Ежедневная сводка",
    description: "Ежедневное письмо о накопившихся уведомлениях.",
    connected: true,
    variables: [
      { key: "recipient_name", label: "Имя получателя", example: "Анна", kind: "text" },
      { key: "scope_label", label: "Раздел сводки", example: "Личный кабинет", kind: "text" },
      { key: "date", label: "Дата сводки", example: "12 октября 2026", kind: "text" },
      { key: "event_count", label: "Количество событий", example: "4", kind: "text" },
      { key: "events_summary", label: "Список событий", example: "Подтверждена заявка; получено новое сообщение", kind: "text" },
    ],
    defaultSubject: "Сводка уведомлений за {{date}}",
    defaultBlocks: [
      { type: "paragraph", text: "Здравствуйте, {{recipient_name}}!" },
      { type: "paragraph", text: "Сводка «{{scope_label}}» за {{date}}: {{event_count}} событий." },
      { type: "paragraph", text: "{{events_summary}}" },
    ],
  },
  {
    eventKey: "operations.alert",
    label: "Служебное уведомление",
    description: "Письмо ответственным сотрудникам о новом обращении, заказе или операционном событии.",
    connected: true,
    variables: [
      { key: "alert_title", label: "Заголовок события", example: "Новое обращение с сайта", kind: "text" },
      { key: "alert_details", label: "Детали события", example: "Проверьте новое обращение в панели управления.", kind: "text" },
    ],
    defaultSubject: "{{alert_title}}",
    defaultBlocks: [
      { type: "paragraph", text: "{{alert_details}}" },
    ],
  },
  {
    eventKey: "moderation.outcome",
    label: "Решение модерации",
    description: "Письмо владельцу материала и ответственным сотрудникам о результате проверки.",
    connected: true,
    variables: [
      { key: "entity_type", label: "Тип материала", example: "Тур", kind: "text" },
      { key: "entity_title", label: "Название материала", example: "Патагония без спешки", kind: "text" },
      { key: "decision", label: "Решение", example: "Одобрено", kind: "text" },
      { key: "moderator_note", label: "Комментарий", example: "Материал соответствует требованиям.", kind: "text" },
    ],
    defaultSubject: "Модерация: {{entity_title}} — {{decision}}",
    defaultBlocks: [
      { type: "paragraph", text: "Материал: {{entity_type}} — «{{entity_title}}»." },
      { type: "paragraph", text: "Решение: {{decision}}. Комментарий: {{moderator_note}}" },
    ],
  },
  {
    eventKey: "organizer.application_approved",
    label: "Заявка организатора одобрена",
    description: "Письмо кандидату после одобрения роли организатора.",
    connected: true,
    variables: [
      { key: "applicant_name", label: "Имя кандидата", example: "Мария", kind: "text" },
      { key: "organizer_url", label: "Ссылка на кабинет", example: "https://www.goargentina.ru/organizer/tours", kind: "url" },
    ],
    defaultSubject: "Добро пожаловать в кабинет организатора",
    defaultBlocks: [
      { type: "paragraph", text: "Здравствуйте, {{applicant_name}}!" },
      { type: "paragraph", text: "Ваша заявка организатора одобрена. Можно переходить к созданию первого тура." },
      { type: "button", label: "Открыть кабинет", urlVariable: "organizer_url" },
    ],
  },
  {
    eventKey: "organizer.application_rejected",
    label: "Заявку организатора нужно уточнить",
    description: "Письмо кандидату, если для одобрения заявки нужны исправления или сведения.",
    connected: true,
    variables: [
      { key: "applicant_name", label: "Имя кандидата", example: "Мария", kind: "text" },
      { key: "review_note", label: "Комментарий", example: "Добавьте описание опыта проведения туров.", kind: "text" },
    ],
    defaultSubject: "Заявка организатора — требуются уточнения",
    defaultBlocks: [
      { type: "paragraph", text: "Здравствуйте, {{applicant_name}}!" },
      { type: "paragraph", text: "Заявку пока нельзя одобрить. Комментарий: {{review_note}}" },
    ],
  },
  {
    eventKey: "auth.magic_link",
    label: "Вход по ссылке",
    description: "Защищённое письмо входа управляется службой авторизации и доступно здесь только для справки.",
    connected: false,
    variables: [
      { key: "recipient_name", label: "Имя получателя", example: "Анна", kind: "text" },
    ],
    defaultSubject: "Ссылка для входа",
    defaultBlocks: [
      { type: "paragraph", text: "Здравствуйте, {{recipient_name}}!" },
      { type: "paragraph", text: "Защищённая одноразовая ссылка добавляется службой авторизации и не редактируется в этом разделе." },
    ],
  },
] as const satisfies ReadonlyArray<EmailTemplateCatalogEntry>;

export type EmailTemplateEventKey = (typeof EMAIL_TEMPLATE_CATALOG)[number]["eventKey"];
type EmailTemplateCatalogItem<K extends EmailTemplateEventKey> = Extract<
  (typeof EMAIL_TEMPLATE_CATALOG)[number],
  { eventKey: K }
>;
export type EmailTemplateVariables<K extends EmailTemplateEventKey> =
  K extends EmailTemplateEventKey
    ? Record<EmailTemplateCatalogItem<K>["variables"][number]["key"], string>
    : never;

const PLACEHOLDER = /{{([a-z][a-z0-9_]{1,63})}}/g;
const SAFE_EVENT_KEY = /^[a-z][a-z0-9_.-]{2,79}$/;
const SAFE_VARIABLE = /^[a-z][a-z0-9_]{1,63}$/;
const FORBIDDEN_MARKUP = /[<>]|javascript:|data:text|\bon[a-z]+\s*=/i;

export function findEmailTemplateCatalogEntry(eventKey: string): (typeof EMAIL_TEMPLATE_CATALOG)[number] | null {
  return EMAIL_TEMPLATE_CATALOG.find((entry) => entry.eventKey === eventKey) ?? null;
}

function placeholders(value: string): string[] {
  return [...value.matchAll(PLACEHOLDER)].map((match) => match[1]);
}

function hasMalformedBraces(value: string): boolean {
  return value.replace(PLACEHOLDER, "").includes("{{") || value.replace(PLACEHOLDER, "").includes("}}");
}

export function validateEmailTemplateDefinition(input: {
  eventKey: string;
  locale: string;
  subjectTemplate: string;
  bodyBlocks: unknown;
}): { ok: true; blocks: EmailTemplateBlock[] } | { ok: false; error: string } {
  if (!SAFE_EVENT_KEY.test(input.eventKey) || !findEmailTemplateCatalogEntry(input.eventKey)) {
    return { ok: false, error: "Выберите поддерживаемое событие" };
  }
  if (!EMAIL_TEMPLATE_LOCALES.includes(input.locale as EmailTemplateLocale)) {
    return { ok: false, error: "Выберите поддерживаемый язык" };
  }
  const subject = input.subjectTemplate.trim();
  if (!subject || subject.length > 200 || /[\r\n]/.test(subject) || FORBIDDEN_MARKUP.test(subject)) {
    return { ok: false, error: "Проверьте тему письма" };
  }
  if (!Array.isArray(input.bodyBlocks) || input.bodyBlocks.length < 1 || input.bodyBlocks.length > 12) {
    return { ok: false, error: "Добавьте от 1 до 12 блоков" };
  }

  const catalog = findEmailTemplateCatalogEntry(input.eventKey)!;
  const allowed = new Set<string>(catalog.variables.map((variable) => variable.key));
  const blocks: EmailTemplateBlock[] = [];
  for (const raw of input.bodyBlocks) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return { ok: false, error: "Один из блоков повреждён" };
    }
    const block = raw as Record<string, unknown>;
    if (block.type === "divider") {
      if (Object.keys(block).some((key) => key !== "type")) {
        return { ok: false, error: "Разделитель содержит лишние данные" };
      }
      blocks.push({ type: "divider" });
      continue;
    }
    if (block.type === "paragraph") {
      if (Object.keys(block).some((key) => key !== "type" && key !== "text")) {
        return { ok: false, error: "Текстовый блок содержит лишние данные" };
      }
      const text = typeof block.text === "string" ? block.text.trim() : "";
      if (!text || text.length > 2000 || FORBIDDEN_MARKUP.test(text) || hasMalformedBraces(text)) {
        return { ok: false, error: "Проверьте текстовый блок" };
      }
      if (placeholders(text).some((key) => !allowed.has(key))) {
        return { ok: false, error: "В тексте есть неизвестная переменная" };
      }
      blocks.push({ type: "paragraph", text });
      continue;
    }
    if (block.type === "button") {
      if (Object.keys(block).some((key) => !["type", "label", "urlVariable"].includes(key))) {
        return { ok: false, error: "Кнопка содержит лишние данные" };
      }
      const label = typeof block.label === "string" ? block.label.trim() : "";
      const urlVariable = typeof block.urlVariable === "string" ? block.urlVariable.trim() : "";
      const variable = catalog.variables.find((item) => item.key === urlVariable);
      if (!label || label.length > 120 || FORBIDDEN_MARKUP.test(label) || !SAFE_VARIABLE.test(urlVariable) || variable?.kind !== "url") {
        return { ok: false, error: "Проверьте кнопку и её ссылку" };
      }
      blocks.push({ type: "button", label, urlVariable });
      continue;
    }
    return { ok: false, error: "Этот тип блока не поддерживается" };
  }
  if (hasMalformedBraces(subject) || placeholders(subject).some((key) => !allowed.has(key))) {
    return { ok: false, error: "В теме есть неизвестная переменная" };
  }
  return { ok: true, blocks };
}

function interpolate(value: string, variables: Record<string, string>): string {
  return value.replace(PLACEHOLDER, (_, key: string) => variables[key] ?? "");
}

function safeButtonUrl(value: string): string | null {
  try {
    const url = new URL(value);
    const site = new URL(getSiteUrl());
    return url.protocol === site.protocol && url.origin === site.origin ? url.toString() : null;
  } catch {
    return null;
  }
}

export function renderConstrainedEmailTemplate<K extends EmailTemplateEventKey>(input: {
  eventKey: K;
  locale: string;
  subjectTemplate: string;
  bodyBlocks: unknown;
  variables: EmailTemplateVariables<K>;
  layoutOptions?: EmailLayoutOptions;
}): EmailTemplateResult | null {
  const validated = validateEmailTemplateDefinition(input);
  if (!validated.ok) return null;
  const catalog = findEmailTemplateCatalogEntry(input.eventKey)!;
  const allowed = new Set<string>(catalog.variables.map((variable) => variable.key));
  const variableValues = input.variables as Record<string, string>;
  const provided = Object.keys(input.variables);
  if (provided.some((key) => !allowed.has(key)) || [...allowed].some((key) => !(key in input.variables))) {
    return null;
  }

  const html: string[] = [];
  const plain: string[] = [];
  for (const block of validated.blocks) {
    if (block.type === "paragraph") {
      const rendered = interpolate(block.text, variableValues).trim();
      if (!rendered) continue;
      html.push(`<p style="margin:0 0 16px;">${escapeHtml(rendered).replace(/\n/g, "<br />")}</p>`);
      plain.push(rendered, "");
    } else if (block.type === "divider") {
      html.push('<hr style="margin:22px 0;border:0;border-top:1px solid #e2e8f0;" />');
      plain.push("—", "");
    } else {
      const href = safeButtonUrl(variableValues[block.urlVariable] ?? "");
      if (!href) return null;
      html.push(`<p style="margin:24px 0;"><a href="${escapeHtml(href)}" style="display:inline-block;border-radius:8px;background:#0f766e;padding:12px 22px;color:#ffffff;text-decoration:none;font-weight:600;">${escapeHtml(block.label)}</a></p>`);
      plain.push(`${block.label}: ${href}`, "");
    }
  }
  const subject = interpolate(input.subjectTemplate, variableValues)
    .replace(/[\r\n\u0000-\u001f\u007f]+/g, " ")
    .trim()
    .slice(0, 300);
  if (!subject || html.length === 0) return null;
  const layoutOptions = input.layoutOptions ?? {};
  return {
    subject,
    html: renderEmailLayout(html.join("\n"), layoutOptions),
    text: renderPlainEmail(plain.join("\n").trim(), layoutOptions),
  };
}

export function syntheticVariablesFor<K extends EmailTemplateEventKey>(eventKey: K): EmailTemplateVariables<K> {
  const catalog = findEmailTemplateCatalogEntry(eventKey);
  return Object.fromEntries((catalog?.variables ?? []).map((variable) => [variable.key, variable.example])) as EmailTemplateVariables<K>;
}
