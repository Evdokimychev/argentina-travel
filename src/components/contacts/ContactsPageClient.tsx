"use client";

import { Suspense, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Hero from "@/components/Hero";
import { getShopProductBySlug } from "@/data/shop-products";
import { getServiceBySlug } from "@/data/services-hub";
import { getTourBySlug } from "@/data/tours";
import {
  SITE_EMAIL,
  SITE_OFFICE,
  SITE_PHONES,
  SITE_WHATSAPP_URL,
  SITE_WORKING_HOURS,
} from "@/data/site-contacts";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";
import { getServicePageHeroImage } from "@/lib/media-resolver";
import ContactTeamStatus from "@/components/contacts/ContactTeamStatus";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { useSiteFeedback } from "@/context/SiteFeedbackContext";
import { normalizeSiteError } from "@/lib/site-feedback/normalize-error";
import type { SiteFeedbackMessage } from "@/types/site-feedback";
import { trackContactFormSubmit } from "@/lib/analytics/gtm-events";

const DEFAULT_FORM_INTRO = "Заполните форму, и мы свяжемся с вами в течение 24 часов";

type ContactsPageClientProps = {
  contactPageIntro?: string | null;
  whatsAppUrl?: string | null;
  supportEmail?: string;
};

function ContactsForm() {
  const searchParams = useSearchParams();
  const tourSlug = searchParams.get("tour");
  const productSlug = searchParams.get("product");
  const serviceSlug = searchParams.get("service");
  const tour = useMemo(
    () => (tourSlug ? getTourBySlug(tourSlug) : undefined),
    [tourSlug]
  );
  const product = useMemo(
    () => (productSlug ? getShopProductBySlug(productSlug) : undefined),
    [productSlug]
  );
  const service = useMemo(
    () => (serviceSlug ? getServiceBySlug(serviceSlug) : undefined),
    [serviceSlug]
  );
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<SiteFeedbackMessage | null>(null);
  const feedback = useSiteFeedback();
  const [message, setMessage] = useState(() => {
    if (tour) return `Интересует тур «${tour.title}». `;
    if (product) return `Хочу заказать «${product.title}» (${product.format}). `;
    if (service) return `Запрос по сервису: «${service.title}». `;
    return "";
  });

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
          tourSlug: tourSlug ?? undefined,
          productSlug: productSlug ?? undefined,
          serviceSlug: serviceSlug ?? undefined,
          context: {
            tour_title: tour?.title ?? (tourTitle || undefined),
            product_title: product?.title,
            service_title: service?.title,
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
        tourSlug: tourSlug ?? undefined,
        productSlug: productSlug ?? undefined,
        serviceSlug: serviceSlug ?? undefined,
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
          Вопрос по туру:{" "}
          <span className="font-medium">{tour.title}</span>
        </div>
      ) : null}

      {product ? (
        <div className="mt-6 rounded-xl border border-sky/20 bg-sky/5 px-4 py-3 text-sm text-charcoal">
          Заказ продукта:{" "}
          <span className="font-medium">{product.title}</span>
          <span className="text-slate"> · ${product.price} {product.currency}</span>
        </div>
      ) : null}

      {service ? (
        <div className="mt-6 rounded-xl border border-sky/20 bg-sky/5 px-4 py-3 text-sm text-charcoal">
          Запрос по сервису:{" "}
          <span className="font-medium">{service.title}</span>
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

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
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

        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-heading text-2xl font-bold text-charcoal">Напишите нам</h2>
            <p className="mt-3 text-slate">{formIntro}</p>

            <Suspense
              fallback={
                <div className="mt-8 h-40 animate-pulse rounded-2xl bg-gray-100" />
              }
            >
              <ContactsForm />
            </Suspense>
          </div>

          <div>
            <h2 className="font-heading text-2xl font-bold text-charcoal">Как нас найти</h2>

            <div className="mt-8 space-y-6">
              <div className="flex gap-4 rounded-2xl bg-white p-5 shadow-md">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky/10">
                  <svg
                    className="h-6 w-6 text-sky"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
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
                  <p className="mt-3 text-sm text-slate/70">{SITE_WORKING_HOURS}</p>
                  <ContactTeamStatus />
                </div>
              </div>

              <div className="flex gap-4 rounded-2xl bg-white p-5 shadow-md">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky/10">
                  <svg
                    className="h-6 w-6 text-sky"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
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

              <div className="flex gap-4 rounded-2xl bg-white p-5 shadow-md">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky/10">
                  <svg
                    className="h-6 w-6 text-sky"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-charcoal">Где мы находимся</p>
                  <p className="mt-1 text-slate">{SITE_OFFICE.display}</p>
                  <p className="mt-0.5 text-sm text-slate/70">{SITE_OFFICE.note}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex h-64 items-center justify-center overflow-hidden rounded-2xl bg-gray-200">
              <div className="text-center text-slate">
                <svg
                  className="mx-auto h-12 w-12 text-slate/40"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
                <p className="mt-2 text-sm">Буэнос-Айрес, Аргентина</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
