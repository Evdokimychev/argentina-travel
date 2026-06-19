"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  ChevronDown,
  Globe2,
  LayoutDashboard,
  Map,
  MapPin,
  Megaphone,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Users,
  Handshake,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { storeAuthNextPath } from "@/lib/auth-redirect";
import ContactTeamStatus from "@/components/contacts/ContactTeamStatus";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { useSiteFeedback } from "@/context/SiteFeedbackContext";
import { normalizeSiteError } from "@/lib/site-feedback/normalize-error";
import type { SiteFeedbackMessage } from "@/types/site-feedback";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
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
  JOIN_HERO_HIGHLIGHTS,
  JOIN_STEPS,
} from "@/data/join-page";
import { cn } from "@/lib/cn";
import { getPlaceCoverAlt, getPlaceCoverImage } from "@/lib/media-resolver";
import { siteContainerClass, siteScrollAnchorClass } from "@/lib/site-container";
import { CARD_HOVER } from "@/styles/design-tokens";
import { userHasAccountRole } from "@/types/user";

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

const heroHighlightIcons = {
  free: BadgePercent,
  map: Map,
  crm: LayoutDashboard,
  audience: Globe2,
} as const;

const joinHeroImage = getPlaceCoverImage("perito-moreno-glacier");
const joinHeroImageAlt = getPlaceCoverAlt("perito-moreno-glacier");

function HeroHighlightCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: keyof typeof heroHighlightIcons;
}) {
  const Icon = heroHighlightIcons[icon];

  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-sun">
          <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-white/70">{label}</p>
          <p className="mt-0.5 font-heading text-base font-bold leading-snug text-white">{value}</p>
          <p className="mt-1 text-xs leading-relaxed text-white/75">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function JoinPageView() {
  const { user, openAuth } = useAuth();
  const [openFaqId, setOpenFaqId] = useState<string | null>(JOIN_FAQ[0]?.id ?? null);
  function focusApplicationForm() {
    document.getElementById("join-application")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function handleStartApplication() {
    if (user && userHasAccountRole(user, "organizer")) {
      window.location.assign("/organizer");
      return;
    }
    if (user) {
      focusApplicationForm();
      return;
    }
    storeAuthNextPath("/join#join-application");
    openAuth("default");
  }
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<SiteFeedbackMessage | null>(null);
  const feedback = useSiteFeedback();

  async function handleApplicationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      storeAuthNextPath("/join#join-application");
      openAuth("default");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const companyName = String(formData.get("companyName") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    try {
      const response = await fetch("/api/organizer-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          description,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Не удалось отправить заявку.");
      }

      setSubmitted(true);
      feedback.success({
        title: "Заявка отправлена",
        description: "Мы проверим анкету и пришлём ответ на вашу почту.",
        action: { label: "Перейти в профиль", href: "/profile" },
      });
    } catch (error) {
      const normalized = normalizeSiteError(error, {
        title: "Не удалось отправить заявку",
        steps: ["Проверьте поля анкеты", "Попробуйте ещё раз или напишите в WhatsApp"],
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
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_15%_0%,rgba(255,255,255,0.14),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_100%_100%,rgba(56,189,248,0.22),transparent_60%)]" />
          <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:3.5rem_3.5rem]" />
          <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-sun/30 blur-3xl" />
          <div className="absolute -bottom-16 left-0 h-56 w-56 rounded-full bg-sky/30 blur-3xl" />
        </div>

        <div className={cn(siteContainerClass, "relative py-14 sm:py-16 lg:py-20")}>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-14 xl:gap-16">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-sun" aria-hidden />
                Для авторов туров
              </p>
              <h1 className="mt-6 max-w-2xl font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
                Зарабатывайте на том, что любите, с{" "}
                <span className="text-sun">Пора в Аргентину</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
                Новый канал продаж для авторских туров по Аргентине: публикуйте маршрут на карте,
                принимайте заявки в личном кабинете и находите туристов из России и СНГ — без
                абонплаты и скрытых сборов.
              </p>

              <dl className="mt-8 grid gap-3 sm:grid-cols-2">
                {JOIN_HERO_HIGHLIGHTS.map((item) => (
                  <HeroHighlightCard
                    key={item.id}
                    label={item.label}
                    value={item.value}
                    description={item.description}
                    icon={item.icon}
                  />
                ))}
              </dl>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="rounded-full bg-sun text-charcoal hover:bg-sun-dark"
                  onClick={handleStartApplication}
                >
                  {user && userHasAccountRole(user, "organizer")
                    ? "Открыть кабинет"
                    : user
                      ? "Подать заявку"
                      : "Войти и подать заявку"}
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

              <p className="mt-5 text-sm text-white/70">
                Анкета за пару минут · Размещение бесплатно · Комиссия только за состоявшиеся поездки
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
              <div className="relative overflow-hidden rounded-[1.75rem] border border-white/20 bg-white/5 shadow-elevated backdrop-blur-sm">
                <Image
                  src={joinHeroImage}
                  alt={joinHeroImageAlt}
                  width={960}
                  height={720}
                  className="aspect-[4/3] w-full object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 45vw"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/10 to-transparent"
                  aria-hidden
                />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                  <p className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-charcoal/45 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                    <MapPin className="h-3.5 w-3.5 text-sun" aria-hidden />
                    Патагония, Аргентина
                  </p>
                  <p className="hidden rounded-full border border-white/20 bg-charcoal/45 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md sm:inline-flex">
                    {JOIN_STEPS.length} шага до первой заявки
                  </p>
                </div>
              </div>

              <Card className="absolute -bottom-5 -left-3 max-w-[11rem] border-white/20 bg-white/95 px-4 py-3 shadow-elevated backdrop-blur-md sm:-left-5 sm:max-w-none">
                <p className="text-xs font-medium text-slate">Размещение туров</p>
                <p className="font-heading text-lg font-bold text-charcoal">Бесплатно</p>
              </Card>

              <Card className="absolute -right-2 top-6 hidden max-w-[12rem] border-white/20 bg-white/95 px-4 py-3 shadow-elevated backdrop-blur-md sm:block lg:-right-5">
                <p className="text-xs font-medium text-slate">Редактор тура</p>
                <p className="font-heading text-sm font-bold leading-snug text-charcoal">
                  Карта, программа, бронирование
                </p>
              </Card>
            </div>
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
                onClick={handleStartApplication}
              >
                Подать заявку
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
          <Button size="lg" className="rounded-full px-10" onClick={handleStartApplication}>
            Подать заявку
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

            <div id="join-application" className="bg-white p-8 sm:p-10 lg:p-12">
              {submitted ? (
                <InlineFeedback
                  variant="success"
                  title="Спасибо! Заявка принята"
                  description="После проверки анкеты мы пришлём результат на вашу почту и откроем доступ к кабинету организатора."
                  action={{ label: "Перейти в профиль", href: "/profile" }}
                  className="my-8"
                />
              ) : (
                <>
                  <h3 className="font-heading text-lg font-bold text-charcoal">
                    Анкета организатора
                  </h3>
                  <p className="mt-1 text-sm text-slate">
                    {user && userHasAccountRole(user, "organizer")
                      ? "Роль организатора уже подключена. Вы можете перейти в кабинет."
                      : user
                      ? "Расскажите о вашем проекте. Проверка обычно занимает 1–2 рабочих дня."
                      : "Войдите в аккаунт туриста, чтобы отправить анкету на проверку."}
                  </p>
                  <form onSubmit={handleApplicationSubmit} className="mt-6 space-y-5">
                    {submitError ? (
                      <InlineFeedback
                        variant="error"
                        title={submitError.title}
                        description={submitError.description}
                        steps={submitError.steps}
                        action={submitError.action}
                      />
                    ) : null}
                    <FormField id="join-company-name" label="Название проекта или компании" required>
                      <Input
                        name="companyName"
                        required
                        minLength={2}
                        placeholder="Например: Patagonia Trails"
                        disabled={!user || userHasAccountRole(user, "organizer") || submitting}
                      />
                    </FormField>
                    <FormField id="join-description" label="Опишите ваш опыт и форматы туров" required>
                      <Textarea
                        name="description"
                        required
                        minLength={30}
                        rows={5}
                        placeholder="Какие маршруты вы ведёте, какой у вас опыт и чем ваш формат полезен путешественникам."
                        disabled={!user || userHasAccountRole(user, "organizer") || submitting}
                      />
                    </FormField>
                    {user ? (
                      <p className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-slate">
                        Анкета будет отправлена от аккаунта{" "}
                        <span className="font-medium text-charcoal">{user.fullName}</span>. Контакты
                        для связи: {user.email || "email не указан"}.
                      </p>
                    ) : null}
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full rounded-full"
                      loading={submitting}
                      loadingLabel="Отправляем…"
                      disabled={!user || userHasAccountRole(user, "organizer")}
                    >
                      {user && userHasAccountRole(user, "organizer")
                        ? "У вас уже есть доступ"
                        : user
                          ? "Отправить анкету"
                          : "Войти для отправки"}
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
