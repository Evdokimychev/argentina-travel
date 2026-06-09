"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  Globe,
  Handshake,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import PhoneCountryInput from "@/components/auth/PhoneCountryInput";
import {
  JOIN_AUDIENCE,
  JOIN_AUTHORS,
  JOIN_BENEFITS,
  JOIN_FAQ,
  JOIN_STEPS,
} from "@/data/join-page";

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
    <h2 className={cn("font-display text-2xl font-bold text-charcoal sm:text-3xl", className)}>
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

  function handleContactSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="bg-pampas">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-charcoal via-patagonia to-sky/80 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-sun blur-3xl" />
          <div className="absolute -bottom-16 left-0 h-56 w-56 rounded-full bg-brand blur-3xl" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24 lg:px-8">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-sun" />
              Если ты автор туров
            </p>
            <h1 className="mt-6 font-display text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              Зарабатывай на том, что любишь с{" "}
              <span className="text-sun">Пора в Аргентину</span>!
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
              Новый канал продаж для ваших туров по Аргентине. Добавляйте маршруты, набирайте
              участников, дарите эмоции и зарабатывайте.
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
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-8 text-sm font-semibold text-white transition-colors hover:bg-white/20"
              >
                Как это работает
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="overflow-hidden rounded-3xl border border-white/15 shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1526392060635-9d6019884377?w=900&q=80"
                alt="Гид с группой туристов в горах Аргентины"
                width={900}
                height={640}
                className="h-[280px] w-full object-cover sm:h-[360px]"
                priority
              />
            </div>
            <div className="absolute -bottom-4 -left-2 rounded-2xl bg-white px-4 py-3 shadow-xl sm:-left-6">
              <p className="text-xs font-medium text-slate">Размещение туров</p>
              <p className="font-display text-lg font-bold text-charcoal">Бесплатно</p>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
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
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <SectionLabel>Почему мы?</SectionLabel>
            <SectionTitle className="mt-3">Преимущества работы с нами</SectionTitle>
            <p className="mt-4 text-slate">
              Оплата только за оплаченные и совершённые бронирования, размещение туров бесплатно
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {JOIN_BENEFITS.map((benefit) => {
              const Icon = benefitIcons[benefit.icon];
              return (
                <article
                  key={benefit.id}
                  className="rounded-2xl border border-gray-100 bg-pampas/60 p-6 transition-shadow hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <Icon className="h-6 w-6" strokeWidth={1.75} />
                  </div>
                  <h3 className="mt-5 font-display text-lg font-bold text-charcoal">
                    {benefit.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate">{benefit.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Audience */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <SectionLabel>Для кого?</SectionLabel>
            <SectionTitle className="mt-3">Кто может разместить тур</SectionTitle>
            <ul className="mt-8 space-y-3">
              {JOIN_AUDIENCE.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky/10 text-sky">
                    <Users className="h-4 w-4" />
                  </span>
                  <span className="font-medium text-charcoal">{item.label}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/blog/argentinian-steak-guide"
              className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
            >
              Что такое авторский тур? Читать
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-brand-dark p-8 text-white shadow-xl sm:p-10">
            <BadgeCheck className="h-10 w-10 text-sun" />
            <p className="mt-6 font-display text-2xl font-bold leading-snug sm:text-3xl">
              Добавьте туры в числе первых и получите дополнительный рейтинг на площадке
            </p>
            <Button
              size="lg"
              className="mt-8 rounded-full bg-white text-brand hover:bg-brand-light"
              onClick={() => openAuth("organizer")}
            >
              Стать автором
            </Button>
          </div>
        </div>
      </section>

      {/* Authors */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionLabel>Истории авторов</SectionLabel>
          <SectionTitle className="mt-3">Наши авторы</SectionTitle>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {JOIN_AUTHORS.map((author) => (
              <article
                key={author.id}
                className="group overflow-hidden rounded-2xl border border-gray-100 bg-pampas/40 transition-transform hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={author.image}
                    alt={author.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 25vw"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold text-charcoal">{author.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate">{author.bio}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-28 px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <SectionLabel>Присоединиться</SectionLabel>
          <SectionTitle className="mt-3">Работать с нами просто</SectionTitle>
        </div>

        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {JOIN_STEPS.map((step, index) => (
            <li
              key={step.id}
              className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <span className="font-display text-4xl font-bold text-brand/20">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 font-display text-lg font-bold text-charcoal">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate">{step.description}</p>
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
      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <SectionLabel>Вопрос-ответ</SectionLabel>
            <SectionTitle className="mt-3">Часто задаваемые вопросы</SectionTitle>
          </div>

          <div className="mt-10 divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-pampas/30">
            {JOIN_FAQ.map((item) => {
              const isOpen = openFaqId === item.id;
              return (
                <div key={item.id}>
                  <button
                    type="button"
                    onClick={() => setOpenFaqId(isOpen ? null : item.id)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/60"
                  >
                    <span className="font-medium text-charcoal">{item.question}</span>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 shrink-0 text-slate transition-transform",
                        isOpen && "rotate-180"
                      )}
                    />
                  </button>
                  {isOpen ? (
                    <div className="px-5 pb-4 text-sm leading-relaxed text-slate">{item.answer}</div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-charcoal to-patagonia text-white shadow-2xl">
          <div className="grid lg:grid-cols-2">
            <div className="p-8 sm:p-10 lg:p-12">
              <SectionLabel className="text-sun">Поддержка авторов</SectionLabel>
              <h2 className="mt-3 font-display text-2xl font-bold sm:text-3xl">
                Остались вопросы? Свяжитесь с отделом по работе с авторами
              </h2>
              <p className="mt-4 flex items-center gap-2 text-white/80">
                <Globe className="h-4 w-4 shrink-0" />
                Или напишите на{" "}
                <a href="mailto:authors@argentina-travel.ru" className="font-medium text-sun hover:underline">
                  authors@argentina-travel.ru
                </a>
              </p>
            </div>

            <div className="bg-white p-8 text-charcoal sm:p-10 lg:p-12">
              {submitted ? (
                <div className="flex h-full flex-col items-center justify-center py-8 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-patagonia/10 text-patagonia">
                    <BadgeCheck className="h-7 w-7" />
                  </div>
                  <p className="mt-4 font-display text-xl font-bold">Спасибо за заявку!</p>
                  <p className="mt-2 text-sm text-slate">
                    Мы свяжемся с вами в ближайшее время.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="join-name" className="block text-sm font-medium text-charcoal">
                      Имя
                    </label>
                    <input
                      id="join-name"
                      name="name"
                      required
                      placeholder="Ваше имя"
                      className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
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
                  <Button type="submit" size="lg" className="w-full rounded-full">
                    Отправить
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
