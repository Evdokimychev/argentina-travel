import type { SiteFeedbackMessage } from "@/types/site-feedback";

type ApiErrorBody = {
  error?: string;
  message?: string;
  code?: string;
};

/** Извлекает текст ошибки из JSON-ответа API. */
export async function readApiErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return body.error ?? body.message ?? body.code ?? `Ошибка сервера (${response.status})`;
  } catch {
    return `Ошибка сервера (${response.status})`;
  }
}

/** Бросает Error с понятным сообщением для normalizeSiteError. */
export async function assertOkResponse(response: Response): Promise<void> {
  if (response.ok) return;
  const message = await readApiErrorMessage(response);
  throw new Error(message);
}

export function serviceUnavailableMessage(context?: Partial<SiteFeedbackMessage>): SiteFeedbackMessage {
  return {
    title: "Сервис временно недоступен",
    description: "Не удалось получить данные с сервера. Попробуйте позже.",
    steps: [
      "Обновите страницу через минуту",
      "Если проблема сохраняется — напишите в поддержку",
    ],
    action: { label: "Контакты", href: "/contacts" },
    ...context,
  };
}
