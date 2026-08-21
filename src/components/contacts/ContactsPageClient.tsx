"use client";

import { useCallback, useState, type FormEvent } from "react";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import ContactOfficeMap from "@/components/contacts/ContactOfficeMap";
import ContactTeamBlock from "@/components/contacts/ContactTeamBlock";
import {
  SITE_EMAIL,
  SITE_OFFICE,
  SITE_PHONES,
  SITE_WHATSAPP_URL,
} from "@/data/site-contacts";
import { SmartInput } from "@/components/ui/smart-input";
import { Button, buttonVariants } from "@/components/ui/button";
import { SmartTextarea } from "@/components/ui/smart-textarea";
import { cn } from "@/lib/cn";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { useSiteFeedback } from "@/context/SiteFeedbackContext";
import { normalizeSiteError } from "@/lib/site-feedback/normalize-error";
import type { SiteFeedbackMessage } from "@/types/site-feedback";
import { trackContactFormSubmit } from "@/lib/analytics/gtm-events";
import { getStoredFirstTouchAttribution } from "@/lib/attribution/first-touch";
import { getStoredConversionContext } from "@/lib/attribution/conversion-context";
import { siteContainerClass } from "@/lib/site-container";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { requiredField, validateEmail } from "@/lib/form-validation";
import TurnstileField from "@/components/forms/TurnstileField";
import { pageBandSectionClass } from "@/lib/page-band";

export type ContactFormContext = {
  tourSlug?: string;
  productSlug?: string;
  serviceSlug?: string;
  topic?: string;
  tourTitle?: string;
  productTitle?: string;
  productFormat?: string;
  productPriceLabel?: string;
  serviceTitle?: string;
};

type ContactsPageClientProps = {
  contactPageIntro?: string | null;
  whatsAppUrl?: string | null;
  telegramUrl?: string | null;
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
  tiktokUrl?: string | null;
  facebookUrl?: string | null;
  xUrl?: string | null;
  supportEmail?: string;
  formEnabled?: boolean;
  formContext?: ContactFormContext;
};

function buildInitialMessage(context: ContactFormContext): string {
  if (context.tourTitle) return `Интересует тур «${context.tourTitle}». `;
  if (context.productTitle) {
    return `Хочу заказать «${context.productTitle}»${context.productFormat ? ` (${context.productFormat})` : ""}. `;
  }
  if (context.serviceTitle) return `Запрос по сервису: «${context.serviceTitle}». `;
  if (context.topic) return `Вопрос по теме: ${context.topic}. `;
  return "";
}

function ContactsForm({ formContext = {} }: { formContext?: ContactFormContext }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<SiteFeedbackMessage | null>(null);
  const feedback = useSiteFeedback();
  const [message, setMessage] = useState(() => buildInitialMessage(formContext));
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);
  const handleCaptchaToken = useCallback((token: string) => setCaptchaToken(token), []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const tourTitle = String(formData.get("tour") ?? "").trim();
    const bodyMessage = String(formData.get("message") ?? message).trim();
    const honeypot = String(formData.get("company") ?? "");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          message: bodyMessage,
          tourSlug: formContext.tourSlug,
          productSlug: formContext.productSlug,
          serviceSlug: formContext.serviceSlug,
          context: {
            tour_title: formContext.tourTitle ?? (tourTitle || undefined),
            product_title: formContext.productTitle,
            service_title: formContext.serviceTitle,
            topic: formContext.topic,
            placement: "contacts_form",
            first_touch: getStoredFirstTouchAttribution(),
            conversion_context: getStoredConversionContext(),
          },
          pageUrl: typeof window !== "undefined" ? window.location.href : null,
          captchaToken,
          honeypot,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Не удалось отправить сообщение.");
      }

      setSubmitted(true);
      trackContactFormSubmit({
        source: "contacts",
        tourSlug: formContext.tourSlug,
        productSlug: formContext.productSlug,
        serviceSlug: formContext.serviceSlug,
      });
      feedback.success({
        title: "Сообщение отправлено",
        description: "Менеджер свяжется с вами в ближайшее время.",
      });
    } catch (error) {
      const normalized = normalizeSiteError(error, {
        title: "Не удалось отправить сообщение",
        action: { label: "Попробовать позже", href: "/contacts" },
      });
      setSubmitError(normalized);
      feedback.showError(normalized);
    } finally {
      setSubmitting(false);
      setCaptchaResetSignal((signal) => signal + 1);
    }
  }

  return (
    <>
      {formContext.tourTitle ? (
        <div className="mt-6 rounded-xl border border-sky/20 bg-sky/5 px-4 py-3 text-sm text-charcoal">
          Вопрос по туру: <span className="font-medium">{formContext.tourTitle}</span>
        </div>
      ) : null}

      {formContext.productTitle ? (
        <div className="mt-6 rounded-xl border border-sky/20 bg-sky/5 px-4 py-3 text-sm text-charcoal">
          Заказ продукта: <span className="font-medium">{formContext.productTitle}</span>
          {formContext.productPriceLabel ? (
            <span className="text-slate"> · {formContext.productPriceLabel}</span>
          ) : null}
        </div>
      ) : null}

      {formContext.serviceTitle ? (
        <div className="mt-6 rounded-xl border border-sky/20 bg-sky/5 px-4 py-3 text-sm text-charcoal">
          Запрос по сервису: <span className="font-medium">{formContext.serviceTitle}</span>
        </div>
      ) : null}

      {submitted ? (
        <InlineFeedback
          variant="success"
          title="Спасибо! Мы получили ваше сообщение."
          description="Наш менеджер свяжется с вами в ближайшее время."
          className="mt-8"
        />
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
          <label className="absolute -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true">
            Компания
            <input name="company" tabIndex={-1} autoComplete="off" />
          </label>
          {submitError ? (
            <InlineFeedback
              variant="error"
              title={submitError.title}
              description={submitError.description}
              steps={submitError.steps}
              action={submitError.action}
            />
          ) : null}
          <SmartInput
              type="text"
              id="name"
              label="Имя"
              name="name"
              required
              autoComplete="name"
              enterKeyHint="next"
              validate={requiredField("имя")}
              placeholder="Ваше имя"
            />
          <SmartInput
              type="email"
              id="email"
              label="Email"
              name="email"
              required
              autoComplete="email"
              inputMode="email"
              enterKeyHint="next"
              validate={validateEmail}
              placeholder="email@example.com"
            />
          <SmartInput
              type="text"
              id="tour"
              label="Интересующий тур"
              name="tour"
              readOnly={Boolean(formContext.tourTitle)}
              defaultValue={formContext.tourTitle ?? ""}
              className={cn(formContext.tourTitle && "read-only:bg-gray-50")}
              placeholder="Название тура (необязательно)"
              optional
            />
          <SmartTextarea
              id="message"
              label="Сообщение"
              name="message"
              rows={4}
              required
              value={message}
              onValueChange={setMessage}
              minLength={10}
              maxLength={2000}
              validate={(value) => value.trim().length < 10 ? "Расскажите немного подробнее — хотя бы 10 символов" : null}
              placeholder="Расскажите о ваших планах..."
            />
          <TurnstileField
            formId="contact"
            onToken={handleCaptchaToken}
            resetSignal={captchaResetSignal}
          />
          <Button
            type="submit"
            className="w-full sm:w-auto sm:px-10"
            loading={submitting}
            loadingLabel="Отправка…"
          >
            Отправить
          </Button>
        </form>
      )}
    </>
  );
}

export default function ContactsPageClient({
  contactPageIntro,
  whatsAppUrl,
  telegramUrl,
  instagramUrl,
  youtubeUrl,
  tiktokUrl,
  facebookUrl,
  xUrl,
  supportEmail,
  formEnabled = true,
  formContext = {},
}: ContactsPageClientProps) {
  const { t } = useLocaleCurrency();
  const whatsAppHref = whatsAppUrl?.trim() || SITE_WHATSAPP_URL;
  const telegramHref = telegramUrl?.trim() || undefined;
  const instagramHref = instagramUrl?.trim() || undefined;
  const additionalSocialLinks = [
    { label: "YouTube", href: youtubeUrl?.trim() },
    { label: "TikTok", href: tiktokUrl?.trim() },
    { label: "Facebook", href: facebookUrl?.trim() },
    { label: "X", href: xUrl?.trim() },
  ].filter((link): link is { label: string; href: string } => Boolean(link.href));
  const emailDisplay = supportEmail?.trim() || SITE_EMAIL.display;
  const emailHref = `mailto:${emailDisplay}`;
  const formIntro = contactPageIntro?.trim() || t("contacts.form.defaultIntro");

  return (
    <>
      <section data-scroll-rail-tone="light" className={pageBandSectionClass}>
        <div className={cn(siteContainerClass, "py-8 sm:py-10 md:py-12")}>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-sky">
            Команда «Пора в Аргентину»
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-3xl font-bold leading-tight tracking-tight text-charcoal sm:text-4xl">
            {t("contacts.hero.title")}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate sm:text-[1.05rem]">
            {t("contacts.hero.subtitle")}
          </p>
        </div>
      </section>

      <section className={cn(siteContainerClass, "py-12 md:py-14")}>
        {whatsAppHref ? (
          <div className="mb-10 flex flex-wrap gap-3">
            <a
              href={whatsAppHref}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "default" }), "inline-flex sm:px-8")}
            >
              {t("contacts.whatsapp.cta")}
            </a>
          </div>
        ) : null}

        <ContactTeamBlock />

        <div className="mt-10 grid gap-12 lg:grid-cols-2">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-card sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-charcoal">{t("contacts.form.title")}</h2>
            <p className="mt-3 text-slate">{formIntro}</p>
            {formEnabled ? (
              <ContactsForm formContext={formContext} />
            ) : (
              <InlineFeedback
                variant="info"
                title="Форма обращений временно закрыта"
                description="Напишите нам по email или в доступный мессенджер — контакты указаны рядом."
                className="mt-6"
              />
            )}
          </div>

          <div>
            <h2 className="font-heading text-2xl font-bold text-charcoal">{t("contacts.find.title")}</h2>

            <div className="mt-8 space-y-4">
              <div className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky/10 text-sky">
                  <MessageCircle className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-charcoal">{t("contacts.messengers.title")}</p>
                  <ul className="mt-2 space-y-1.5">
                    {SITE_PHONES.map((phone) => (
                      <li key={phone.tel}>
                        <a
                          href={phone.whatsapp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate transition-colors hover:text-sky"
                        >
                          WhatsApp: {phone.display}
                        </a>
                        <span className="ml-2 text-xs text-slate">{phone.label}</span>
                      </li>
                    ))}
                    {telegramHref ? (
                      <li>
                        <a
                          href={telegramHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate transition-colors hover:text-sky"
                        >
                          Telegram
                        </a>
                      </li>
                    ) : null}
                    {instagramHref ? (
                      <li>
                        <a
                          href={instagramHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate transition-colors hover:text-sky"
                        >
                          Instagram
                        </a>
                      </li>
                    ) : null}
                    {additionalSocialLinks.map((link) => (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate transition-colors hover:text-sky"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky/10 text-sky">
                  <Mail className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                </span>
                <div>
                  <p className="font-semibold text-charcoal">{t("contacts.email.title")}</p>
                  <a
                    href={emailHref}
                    className="mt-1 block text-slate transition-colors hover:text-sky"
                  >
                    {emailDisplay}
                  </a>
                  <p className="mt-0.5 text-sm text-slate">{t("contacts.email.note")}</p>
                </div>
              </div>

              <div className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky/10 text-sky">
                  <MapPin className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                </span>
                <div>
                  <p className="font-semibold text-charcoal">{t("contacts.office.title")}</p>
                  <p className="mt-1 text-slate">{SITE_OFFICE.display}</p>
                  <p className="mt-0.5 text-sm text-slate">{SITE_OFFICE.note}</p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <ContactOfficeMap />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
