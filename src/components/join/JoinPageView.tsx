"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Map,
  Megaphone,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Users,
  Handshake,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ContactTeamStatus from "@/components/contacts/ContactTeamStatus";
import PhoneCountryInput from "@/components/auth/PhoneCountryInput";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { useSiteFeedback } from "@/context/SiteFeedbackContext";
import { normalizeSiteError } from "@/lib/site-feedback/normalize-error";
import type { SiteFeedbackMessage } from "@/types/site-feedback";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  SITE_EMAIL,
  SITE_PHONES,
  SITE_WHATSAPP_URL,
  SITE_WORKING_HOURS,
} from "@/data/site-contacts";
import {
  JOIN_AUDIENCE,
  JOIN_AUTHORS,
  JOIN_BENEFITS,
  JOIN_FAQ,
  JOIN_STEPS,
} from "@/data/join-page";
import { cn } from "@/lib/cn";
import { siteContainerClass, siteScrollAnchorClass } from "@/lib/site-container";
import { CARD_HOVER } from "@/styles/design-tokens";

function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-xs font-semibold uppercase tracking-[0.2em] text-brand", className)}>
      {children}
    </p>
  );
}

function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn("font-heading text-2xl font-bold text-charcoal sm:text-3xl", className)}>
      {children}
    </h2>
  );
}

const benefitIcons = {
  sales: Megaphone,
  security: ShieldCheck,
  experience: Handshake,
} as const;

export default function JoinPageView() {
  const { openAuth } = useAuth();
  const [openFaqId, setOpenFaqId] = useState<string | null>(JOIN_FAQ[0]?.id ?? null);
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<SiteFeedbackMessage | null>(null);
  const feedback = useSiteFeedback();

  async function handleContactSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          organizerApplication: true,
          message: "Заявка со страницы «Стать организатором»",
          pageUrl: typeof window !== "undefined" ? window.location.href : null,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Не удалось отправить заявку.");
      }

      setSubmitted(true);
      feedback.success({
        title: "Заявка отправлена",
        description: "Мы свяжемся с вами в ближайшее время.",
        action: { label: "Страница контактов", href: "/contacts" },
      });
    } catch (error) {
      const normalized = normalizeSiteError(error, {
        title: "Не удалось отправить заявку",
        steps: ["Проверьте имя и телефон", "Попробуйте ещё раз или напишите в WhatsApp"],
        action: { label: "Контакты", href: "/contacts" },
      });
      setSubmitError(normalized);
      feedback.showError(normalized);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-pampas">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-charcoal via-patagonia to-sky/90 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-25">
          <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-sun blur-3xl" />
          <div className="absolute -bottom-16 left-0 h-56 w-56 rounded-full bg-sky blur-3xl" />
        </div>
        <div
          className={cn(
            siteContainerClass,
            "relative grid gap-10 py-16 lg:grid-cols-2 lg:items-center lg:py-24"
          )}
        >
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-sun" aria-hidden />
              Если ты автор туров
            </p>
            <h1 className="mt-6 font-display text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              Зарабатывай на том, что любишь с{" "}
              <span className="text-sun">Пора в Аргентину</span>!
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
              Новый канал продаж для ваших туров по Аргентине. Добавляйте маршруты на карте,
              набирайте участников, дарите эмоции и зарабатывайте.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="rounded-full bg-sun text-charcoal hover:bg-sun-dark"
                onClick={() => openAuth("organizer")}
              >
                Присоединиться
                <ArrowRight className="h-4 w-4" />
              </Button>
              <a
                href="#how-it-works"
                className={buttonVariants({
                  variant: "outline",
                  size: "lg",
                  className:
                    "rounded-full border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white",
                })}
              >
                Как это работает
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="overflow-hidden rounded-3xl border border-white/15 shadow-elevated">
              <Image
                src="https://images.unsplash.com/photo-1526392060635-9d6019884377?w=900&q=80"
                alt="Гид с группой туристов в горах Аргентины"
                width={900}
                height={640}
                className="h-[280px] w-full object-cover sm:h-[360px]"
                priority
              />
            </div>
            <Card className="absolute -bottom-4 -left-2 border-0 px-4 py-3 shadow-elevated sm:-left-6">
              <p className="text-xs font-medium text-slate">Размещение туров</p>
              <p className="font-heading text-lg font-bold text-charcoal">Бесплатно</p>
            </Card>
          </div>
        </div>
      </section>

      {/* About */}
      <section className={cn(siteContainerClass, "py-16 sm:py-20")}>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
          <div>
            <SectionLabel>О нас</SectionLabel>
            <SectionTitle className="mt-3">О платформе «Пора в Аргентину»</SectionTitle>
          </div>
          <p className="text-base leading-relaxed text-slate sm:text-lg">
            «Пора в Аргентину» — сервис по поиску и бронированию авторских туров. Авторские туры —
            это крафтовые, отлично организованные приключения по уникальным маршрутам в дружеской
            компании. Приглашаем авторов зарегистрироваться, разместить свои туры и получать
            бронирования от наших пользователей.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-y border-gray-100 bg-white py-16 sm:py-20">
        <div className={siteContainerClass}>
          <div className="max-w-2xl">
            <SectionLabel>Почему мы?</SectionLabel>
            <SectionTitle className="mt-3">Преимущества работы с нами</SectionTitle>
            <p className="mt-4 text-slate">
              Размещение туров бесплатно; комиссия только за состоявшиеся бронирования
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {JOIN_BENEFITS.map((benefit) => {
              const Icon = benefitIcons[benefit.icon];
              return (
                <Card key={benefit.id} className={cn("border-gray-100 bg-pampas/40", CARD_HOVER)}>
                  <CardContent className="p-6 sm:p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky/10 text-sky">
                      <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                    </div>
                    <h3 className="mt-5 font-heading text-lg font-bold text-charcoal">
                      {benefit.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate">{benefit.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Audience */}
      <section className={cn(siteContainerClass, "py-16 sm:py-20")}>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <SectionLabel>Для кого?</SectionLabel>
            <SectionTitle className="mt-3">Кто может разместить тур</SectionTitle>
            <ul className="mt-8 space-y-3">
              {JOIN_AUDIENCE.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-card"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky/10 text-sky">
                    <Users className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="font-medium text-charcoal">{item.label}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/blog/argentinian-steak-guide"
              className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-sky hover:underline"
            >
              Что такое авторский тур? Читать
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <Card className="overflow-hidden border-0 bg-gradient-to-br from-brand to-brand-dark text-white shadow-elevated">
            <CardContent className="p-8 sm:p-10">
              <Map className="h-10 w-10 text-sun" aria-hidden />
              <p className="mt-6 font-heading text-2xl font-bold leading-snug sm:text-3xl">
                Редактор тура с маршрутом на карте, программой и настройками бронирования
              </p>
              <p className="mt-4 text-sm leading-relaxed text-white/85">
                Добавьте туры в числе первых и получите дополнительный рейтинг на площадке
              </p>
              <Button
                size="lg"
                className="mt-8 rounded-full bg-white text-brand hover:bg-brand-light"
                onClick={() => openAuth("organizer")}
              >
                Стать автором
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Authors */}
      <section className="border-t border-gray-100 bg-white py-16 sm:py-20">
        <div className={siteContainerClass}>
          <SectionLabel>Истории авторов</SectionLabel>
          <SectionTitle className="mt-3">Наши авторы</SectionTitle>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {JOIN_AUTHORS.map((author) => (
              <Card
                key={author.id}
                className={cn("overflow-hidden border-gray-100 bg-pampas/30 p-0", CARD_HOVER)}
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={author.image}
                    alt={author.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 25vw"
                  />
                </div>
                <CardContent className="p-5">
                  <h3 className="font-heading text-lg font-bold text-charcoal">{author.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate">{author.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section
        id="how-it-works"
        className={cn(siteContainerClass, siteScrollAnchorClass, "py-16 sm:py-20")}
      >
        <div className="text-center">
          <SectionLabel>Присоединиться</SectionLabel>
          <SectionTitle className="mt-3">Работать с нами просто</SectionTitle>
        </div>

        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {JOIN_STEPS.map((step, index) => (
            <li key={step.id}>
              <Card className="h-full border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <span className="font-heading text-4xl font-bold text-sky/25">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 font-heading text-lg font-bold text-charcoal">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate">{step.description}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>

        <div className="mt-10 text-center">
          <Button size="lg" className="rounded-full px-10" onClick={() => openAuth("organizer")}>
            Зарегистрироваться
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-gray-100 bg-white py-16 sm:py-20">
        <div className={cn(siteContainerClass, "max-w-3xl")}>
          <div className="text-center">
            <SectionLabel>Вопрос-ответ</SectionLabel>
            <SectionTitle className="mt-3">Часто задаваемые вопросы</SectionTitle>
          </div>

          <Card className="mt-10 divide-y divide-gray-100 overflow-hidden border-gray-200 bg-pampas/30 p-0">
            {JOIN_FAQ.map((item) => {
              const isOpen = openFaqId === item.id;
              return (
                <div key={item.id}>
                  <button
                    type="button"
                    onClick={() => setOpenFaqId(isOpen ? null : item.id)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/70"
                  >
                    <span className="font-medium text-charcoal">{item.question}</span>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 shrink-0 text-slate transition-transform",
                        isOpen && "rotate-180"
                      )}
                      aria-hidden
                    />
                  </button>
                  {isOpen ? (
                    <div className="px-5 pb-4 text-sm leading-relaxed text-slate">{item.answer}</div>
                  ) : null}
                </div>
              );
            })}
          </Card>

          <p className="mt-6 text-center text-sm text-slate">
            Подробнее — в{" "}
            <Link href="/legal/terms" className="font-medium text-sky hover:underline">
              пользовательском соглашении
            </Link>
          </p>
        </div>
      </section>

      {/* Contact */}
      <section className={cn(siteContainerClass, "pb-16 pt-4 sm:pb-20")}>
        <Card className="overflow-hidden border-0 shadow-elevated">
          <div className="grid lg:grid-cols-2">
            <div className="bg-gradient-to-br from-charcoal to-patagonia p-8 text-white sm:p-10 lg:p-12">
              <SectionLabel className="text-sun">Поддержка авторов</SectionLabel>
              <h2 className="mt-3 font-heading text-2xl font-bold sm:text-3xl">
                Остались вопросы? Свяжитесь с нами
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/85">
                WhatsApp, Telegram или почта — ответим в рабочие часы
              </p>

              <ul className="mt-6 space-y-2 text-sm">
                {SITE_PHONES.map((phoneItem) => (
                  <li key={phoneItem.tel}>
                    <a
                      href={phoneItem.whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-white hover:text-sun"
                    >
                      {phoneItem.display}
                    </a>
                    <span className="ml-2 text-white/60">{phoneItem.label}</span>
                  </li>
                ))}
              </ul>

              <a
                href={SITE_EMAIL.href}
                className="mt-3 inline-block text-sm font-medium text-sun hover:underline"
              >
                {SITE_EMAIL.display}
              </a>

              <p className="mt-4 text-xs text-white/70">{SITE_WORKING_HOURS}</p>

              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                <ContactTeamStatus tone="dark" />
              </div>

              <a
                href={SITE_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({
                  size: "lg",
                  className:
                    "mt-6 inline-flex rounded-full bg-sun text-charcoal hover:bg-sun-dark",
                })}
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                Написать в WhatsApp
              </a>
            </div>

            <div className="bg-white p-8 sm:p-10 lg:p-12">
              {submitted ? (
                <InlineFeedback
                  variant="success"
                  title="Спасибо за заявку!"
                  description="Мы свяжемся с вами в ближайшее время."
                  action={{ label: "Страница контактов", href: "/contacts" }}
                  className="my-8"
                />
              ) : (
                <>
                  <h3 className="font-heading text-lg font-bold text-charcoal">
                    Оставить заявку
                  </h3>
                  <p className="mt-1 text-sm text-slate">
                    Перезвоним или напишем, когда будем на связи
                  </p>
                  <form onSubmit={handleContactSubmit} className="mt-6 space-y-5">
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
                      <label htmlFor="join-name" className="block text-sm font-medium text-charcoal">
                        Имя
                      </label>
                      <Input
                        id="join-name"
                        name="name"
                        required
                        placeholder="Ваше имя"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <label htmlFor="join-phone" className="block text-sm font-medium text-charcoal">
                        Номер телефона
                      </label>
                      <PhoneCountryInput
                        id="join-phone"
                        value={phone}
                        onChange={setPhone}
                        className="mt-1.5"
                      />
                    </div>
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full rounded-full"
                      loading={submitting}
                      loadingLabel="Отправка…"
                    >
                      Отправить
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
