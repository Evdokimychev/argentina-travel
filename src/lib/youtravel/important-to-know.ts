import { htmlToPlainText, isHtmlContent, sanitizeHtml } from "@/lib/rich-text";
import type { YouTravelTour } from "@/lib/youtravel/types";

export type YouTravelImportantToKnowItem = {
  title: string;
  html: string;
};

const DEFAULT_CANCELLATION_HTML = `<ul>
<li>отмена в течение 24 часов с момента оплаты – полный возврат предоплаты</li>
<li>отмена после 24 часов с момента оплаты – возврат предоплаты за вычетом 15% от стоимости тура</li>
</ul>`;

const DEFAULT_PREPAYMENT_HTML = `<p>Сумму предоплаты определяет тревел-эксперт, она отображается под кнопкой «Забронировать». Для большинства туров предоплата не превышает 50% стоимости тура. За 24 часа до начала тура необходимо оплатить тур полностью, если иное не прописано в информации о туре. Полная оплата может осуществляться через платформу или напрямую тревел-эксперту. При возникновении сложностей с оплатой обратитесь в службу поддержки сервиса.</p>`;

const DEFAULT_BOOKING_HTML = `<p>Выберите даты и нажмите на кнопку <strong class="text-brand">забронировать</strong>. Вы сможете быстро и безопасно оплатить тур банковской картой. Туры с моментальным бронированием подтверждаются автоматически. В остальных случаях вы резервируете место в группе внесением предоплаты, и тревел-эксперт одобряет вашу заявку в течение 24 часов. Если заявка будет отклонена, мы моментально вернём предоплату. До бронирования вы можете <strong class="text-brand">задать свои вопросы автору тура</strong>.</p>`;

function pickString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

/** Strip Vue SSR comment markers and normalize clickable spans from YouTravel HTML. */
export function normalizeYouTravelImportantToKnowHtml(html: string): string {
  let normalized = html
    .replace(/<!--\[\s*-->/g, "")
    .replace(/<!--\]\s*-->/g, "")
    .replace(
      /<span class="cl-green-default clickable">([\s\S]*?)<\/span>/gi,
      '<strong class="text-brand">$1</strong>',
    )
    .trim();

  if (!normalized) return "";

  if (!/<[a-z][\s\S]*>/i.test(normalized)) {
    normalized = `<p>${normalized}</p>`;
  }

  return sanitizeHtml(normalized);
}

function normalizeScrapedItems(
  items: Array<{ title?: string; html?: string }> | undefined,
): YouTravelImportantToKnowItem[] {
  if (!items?.length) return [];

  return items
    .map((item) => {
      const title = item.title?.trim();
      const html = item.html?.trim() ? normalizeYouTravelImportantToKnowHtml(item.html) : "";
      return title && html ? { title, html } : null;
    })
    .filter((item): item is YouTravelImportantToKnowItem => item != null);
}

function resolveVisaHtml(payload: YouTravelTour): string | undefined {
  const raw = pickString(payload.visa_info, payload.visaInfo);
  if (!raw) return undefined;
  if (isHtmlContent(raw)) return normalizeYouTravelImportantToKnowHtml(raw);
  return normalizeYouTravelImportantToKnowHtml(`<p>${raw}</p>`);
}

function resolvePreparationHtml(payload: YouTravelTour): string | undefined {
  const raw = pickString(payload.demands, payload.common);
  if (!raw) return undefined;
  if (isHtmlContent(raw)) return normalizeYouTravelImportantToKnowHtml(raw);
  const paragraphs = raw
    .split(/\r?\n\r?\n+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `<p>${part.replace(/\r?\n/g, "<br />")}</p>`)
    .join("");
  return normalizeYouTravelImportantToKnowHtml(paragraphs || `<p>${raw}</p>`);
}

function resolveCancellationHtml(payload: YouTravelTour): string {
  const custom = pickString(payload.custom_cancellation, payload.customCancellation);
  if (custom) {
    if (isHtmlContent(custom)) return normalizeYouTravelImportantToKnowHtml(custom);
    return normalizeYouTravelImportantToKnowHtml(`<p>${custom}</p>`);
  }
  return DEFAULT_CANCELLATION_HTML;
}

/** Platform defaults + tour-specific visa, preparation and custom cancellation from partner API. */
export function buildYouTravelImportantToKnowItems(
  payload: YouTravelTour,
): YouTravelImportantToKnowItem[] {
  const items: YouTravelImportantToKnowItem[] = [];

  const preparationHtml = resolvePreparationHtml(payload);
  if (preparationHtml) {
    items.push({ title: "Подготовка к туру", html: preparationHtml });
  }

  items.push({ title: "Условия отмены", html: resolveCancellationHtml(payload) });

  const visaHtml = resolveVisaHtml(payload);
  if (visaHtml) {
    items.push({ title: "Визы", html: visaHtml });
  }

  items.push(
    { title: "Нужно ли предоплачивать тур полностью?", html: DEFAULT_PREPAYMENT_HTML },
    { title: "Как забронировать", html: DEFAULT_BOOKING_HTML },
  );

  return items;
}

export function resolveYouTravelImportantToKnowItems(
  payload: YouTravelTour,
): YouTravelImportantToKnowItem[] | undefined {
  const scraped = normalizeScrapedItems(payload.public_page_extras?.importantToKnowItems);
  if (scraped.length >= 3) return scraped;

  const built = buildYouTravelImportantToKnowItems(payload);
  if (scraped.length === 0) return built.length ? built : undefined;

  const mergedTitles = new Set(scraped.map((item) => item.title.toLowerCase()));
  for (const item of built) {
    if (!mergedTitles.has(item.title.toLowerCase())) {
      scraped.push(item);
    }
  }

  return scraped.length ? scraped : undefined;
}

export function importantToKnowItemsToPlainList(items: YouTravelImportantToKnowItem[]): string[] {
  return items.map((item) => {
    const body = htmlToPlainText(item.html).trim();
    return body ? `${item.title}: ${body}` : item.title;
  });
}
