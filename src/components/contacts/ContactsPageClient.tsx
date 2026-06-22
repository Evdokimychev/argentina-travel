"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import Hero from "@/components/Hero";
import ContactOfficeMap from "@/components/contacts/ContactOfficeMap";
import ContactTeamBlock from "@/components/contacts/ContactTeamBlock";
import { getShopProductBySlug } from "@/data/shop-products";
import { getServiceBySlug } from "@/data/services-hub";
import { getTourBySlug } from "@/data/tours";
import {
  SITE_EMAIL,
  SITE_OFFICE,
  SITE_PHONES,
  SITE_WHATSAPP_URL,
} from "@/data/site-contacts";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";
import { getServicePageHeroImage } from "@/lib/media-resolver";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { useSiteFeedback } from "@/context/SiteFeedbackContext";
import { normalizeSiteError } from "@/lib/site-feedback/normalize-error";
import type { SiteFeedbackMessage } from "@/types/site-feedback";
import { trackContactFormSubmit } from "@/lib/analytics/gtm-events";
import { siteContainerClass } from "@/lib/site-container";

const DEFAULT_FORM_INTRO = "Заполните форму, и мы свяжемся с вами в течение 24 часов";

type ContactFormContext = {
  tourSlug?: string;
  productSlug?: string;
  serviceSlug?: string;
  topic?: string;
};

type ContactsPageClientProps = {
  contactPageIntro?: string | null;
  whatsAppUrl?: string | null;
  supportEmail?: string;
  formContext?: ContactFormContext;
};

function buildInitialMessage(context: ContactFormContext): string {
  const tour = context.tourSlug ? getTourBySlug(context.tourSlug) : undefined;
  const product = context.productSlug ? getShopProductBySlug(context.productSlug) : undefined;
  const service = context.serviceSlug ? getServiceBySlug(context.serviceSlug) : undefined;

  if (tour) return `Интересует тур «${tour.title}». `;
  if (product) return `Хочу заказать «${product.title}» (${product.format}). `;
  if (service) return `Запрос по сервису: «${service.title}». `;
  if (context.topic) return `Вопрос по теме: ${context.topic}. `;
  return "";
}

function ContactsForm({ formContext = {} }: { formContext?: ContactFormContext }) {
  const tour = useMemo(
    () => (formContext.tourSlug ? getTourBySlug(formContext.tourSlug) : undefined),
    [formContext.tourSlug]
  );
  const product = useMemo(
    () => (formContext.productSlug ? getShopProductBySlug(formContext.productSlug) : undefined),
    [formContext.productSlug]
  );
  const service = useMemo(
    () => (formContext.serviceSlug ? getServiceBySlug(formContext.serviceSlug) : undefined),
    [formContext.serviceSlug]
  );
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<SiteFeedbackMessage | null>(null);
  const feedback = useSiteFeedback();
  const [message, setMessage] = useState(() => buildInitialMessage(formContext));

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
            tour_title: tour?.title ?? (tourTitle || undefined),
            product_title: product?.title,
            service_title: service?.title,
            topic: formContext.topic,
          },
          pageUrl: typeof window !== "undefined" ? window.location.href : null,
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
    }
  }

  return (
    <>
      {tour ? (
        <div className="mt-6 rounded-xl border border-sky/20 bg-sky/5 px-4 py-3 text-sm text-charcoal">
          Вопрос по туру: <span className="font-medium">{tour.title}</span>
        </div>
      ) : null}

      {product ? (
        <div className="mt-6 rounded-xl border border-sky/20 bg-sky/5 px-4 py-3 text-sm text-charcoal">
          Заказ продукта: <span className="font-medium">{product.title}</span>
          <span className="text-slate">
            {" "}
            · ${product.price} {product.currency}
          </span>
        </div>
      ) : null}

      {service ? (
        <div className="mt-6 rounded-xl border border-sky/20 bg-sky/5 px-4 py-3 text-sm text-charcoal">
          Запрос по сервису: <span className="font-medium">{service.title}</span>
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
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {submitError ? (
            <InlineFeedback
              variant="error"
              title={submitError.title}
              description={submitError.description}
              steps={submitError.steps}
              action={submitError.action}
            />
          ) : null}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-charcoal">
              Имя
            </label>
            <Input
              type="text"
              id="name"
              name="name"
              required
              className="mt-1"
              placeholder="Ваше имя"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-charcoal">
              Email
            </label>
            <Input
              type="email"
              id="email"
              name="email"
              required
              className="mt-1"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label htmlFor="tour" className="block text-sm font-medium text-charcoal">
              Интересующий тур
            </label>
            <Input
              type="text"
              id="tour"
              name="tour"
              readOnly={Boolean(tour)}
              defaultValue={tour?.title ?? ""}
              className={cn("mt-1", tour && "read-only:bg-gray-50")}
              placeholder="Название тура (необязательно)"
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-charcoal">
              Сообщение
            </label>
            <Textarea
              id="message"
              name="message"
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1"
              placeholder="Расскажите о ваших планах..."
            />
          </div>
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
  supportEmail,
  formContext = {},
}: ContactsPageClientProps) {
  const whatsAppHref = whatsAppUrl?.trim() || SITE_WHATSAPP_URL;
  const emailDisplay = supportEmail?.trim() || SITE_EMAIL.display;
  const emailHref = `mailto:${emailDisplay}`;
  const formIntro = contactPageIntro?.trim() || DEFAULT_FORM_INTRO;

  return (
    <>
      <Hero
        title="Контакты"
        subtitle="Оставьте сообщение или задайте вопрос — мы с радостью ответим"
        image={getServicePageHeroImage("contacts")}
        compact
      />

      <section className={cn(siteContainerClass, "py-12 md:py-14")}>
        {whatsAppHref ? (
          <div className="mb-10 flex flex-wrap gap-3">
            <a
              href={whatsAppHref}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "default" }), "inline-flex sm:px-8")}
            >
              Написать в WhatsApp
            </a>
          </div>
        ) : null}

        <ContactTeamBlock />

        <div className="mt-10 grid gap-12 lg:grid-cols-2">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-card sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-charcoal">Напишите нам</h2>
            <p className="mt-3 text-slate">{formIntro}</p>
            <ContactsForm formContext={formContext} />
          </div>

          <div>
            <h2 className="font-heading text-2xl font-bold text-charcoal">Как нас найти</h2>

            <div className="mt-8 space-y-4">
              <div className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky/10 text-sky">
                  <MessageCircle className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-charcoal">WhatsApp и Telegram</p>
                  <ul className="mt-2 space-y-1.5">
                    {SITE_PHONES.map((phone) => (
                      <li key={phone.tel}>
                        <a
                          href={phone.whatsapp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate transition-colors hover:text-sky"
                        >
                          {phone.display}
                        </a>
                        <span className="ml-2 text-xs text-slate/60">{phone.label}</span>
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
                  <p className="font-semibold text-charcoal">Email</p>
                  <a
                    href={emailHref}
                    className="mt-1 block text-slate transition-colors hover:text-sky"
                  >
                    {emailDisplay}
                  </a>
                  <p className="mt-0.5 text-sm text-slate/70">{SITE_EMAIL.note}</p>
                </div>
              </div>

              <div className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky/10 text-sky">
                  <MapPin className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                </span>
                <div>
                  <p className="font-semibold text-charcoal">Где мы находимся</p>
                  <p className="mt-1 text-slate">{SITE_OFFICE.display}</p>
                  <p className="mt-0.5 text-sm text-slate/70">{SITE_OFFICE.note}</p>
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
