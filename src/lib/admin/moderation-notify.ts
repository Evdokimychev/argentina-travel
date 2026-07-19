/** Durable email alerts for moderation outcomes. */
import { absoluteUrl } from "@/lib/site-url";
import { sendOperationalEmail } from "@/lib/notifications/email-delivery";
import {
  escapeHtml,
  renderEmailLayout,
  renderPlainEmail,
} from "@/lib/notifications/email-templates";

export async function notifyModerationOutcome(input: {
  entityType: string;
  entityTitle: string;
  ownerEmail: string | null;
  action: "approve" | "reject";
  note?: string;
}): Promise<void> {
  const actionLabel = input.action === "approve" ? "одобрено" : "отклонено";
  const subject = `Модерация: ${input.entityTitle.replace(/[\r\n]+/g, " ")} — ${actionLabel}`;
  const safeEntityType = escapeHtml(input.entityType);
  const safeEntityTitle = escapeHtml(input.entityTitle);
  const safeNote = input.note ? escapeHtml(input.note) : null;
  const contentHtml = `
    <p>Тип: ${safeEntityType}</p>
    <p>Объект: <strong>${safeEntityTitle}</strong></p>
    <p>Решение: ${actionLabel}</p>
    ${safeNote ? `<p>Комментарий: ${safeNote}</p>` : ""}
  `;
  const layoutOptions = { previewText: subject };

  await sendOperationalEmail({
    category: "organizer",
    recipientEmails: [input.ownerEmail],
    includeAdminCopy: true,
    subject,
    html: renderEmailLayout(contentHtml, layoutOptions),
    text: renderPlainEmail(
      [
        `Тип: ${input.entityType}`,
        `Объект: ${input.entityTitle}`,
        `Решение: ${actionLabel}`,
        input.note ? `Комментарий: ${input.note}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      layoutOptions,
    ),
  });
}

export async function notifyOrganizerApplicationReview(input: {
  applicantEmail: string;
  applicantName: string;
  action: "approve" | "reject";
  note?: string;
}): Promise<void> {
  if (!input.applicantEmail) return;

  const subject =
    input.action === "approve"
      ? "Добро пожаловать в кабинет организатора — Пора в Аргентину"
      : "Заявка организатора — требуются уточнения";

  const organizerCabinetUrl = absoluteUrl("/organizer/tours?welcome=1");
  const safeApplicantName = escapeHtml(input.applicantName);
  const safeNote = input.note ? escapeHtml(input.note) : null;

  const contentHtml =
    input.action === "approve"
      ? `<p>Здравствуйте, ${safeApplicantName}!</p>
<p>Ваша заявка организатора одобрена.</p>
<p>Вы уже можете зайти в кабинет и начать публикацию.</p>
<p><strong>Чек-лист первого шага:</strong></p>
<ul>
  <li>Создайте первый тур</li>
</ul>`
      : `<p>Здравствуйте, ${safeApplicantName}!</p><p>К сожалению, заявку пока нельзя одобрить.${safeNote ? ` Причина: ${safeNote}` : ""}</p>`;
  const layoutOptions = input.action === "approve"
    ? {
        previewText: subject,
        cta: { label: "Открыть кабинет организатора", href: organizerCabinetUrl },
      }
    : { previewText: subject };

  await sendOperationalEmail({
    category: "organizer",
    recipientEmails: [input.applicantEmail],
    subject,
    html: renderEmailLayout(contentHtml, layoutOptions),
    text: renderPlainEmail(
      input.action === "approve"
        ? [
            `Здравствуйте, ${input.applicantName}!`,
            "Ваша заявка организатора одобрена.",
            "Вы уже можете зайти в кабинет и начать публикацию.",
            "Создайте первый тур.",
          ].join("\n")
        : `Здравствуйте, ${input.applicantName}!\nК сожалению, заявку пока нельзя одобрить.${input.note ? ` Причина: ${input.note}` : ""}`,
      layoutOptions,
    ),
  });
}
