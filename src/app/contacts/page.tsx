"use client";

import { Suspense, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Hero from "@/components/Hero";
import { getTourBySlug } from "@/data/tours";

function ContactsForm() {
  const searchParams = useSearchParams();
  const tourSlug = searchParams.get("tour");
  const tour = useMemo(
    () => (tourSlug ? getTourBySlug(tourSlug) : undefined),
    [tourSlug]
  );
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState(() =>
    tour ? `Интересует тур «${tour.title}». ` : ""
  );

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <>
      {tour ? (
        <div className="mt-6 rounded-xl border border-sky/20 bg-sky/5 px-4 py-3 text-sm text-charcoal">
          Вопрос по туру:{" "}
          <span className="font-medium">{tour.title}</span>
        </div>
      ) : null}

      {submitted ? (
        <div className="mt-8 rounded-2xl bg-patagonia/10 p-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-patagonia"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <p className="mt-4 font-semibold text-charcoal">
            Спасибо! Мы получили ваше сообщение.
          </p>
          <p className="mt-2 text-sm text-slate">
            Наш менеджер свяжется с вами в ближайшее время.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-charcoal">
              Имя
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-charcoal focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/20"
              placeholder="Ваше имя"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-charcoal">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-charcoal focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/20"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label htmlFor="tour" className="block text-sm font-medium text-charcoal">
              Интересующий тур
            </label>
            <input
              type="text"
              id="tour"
              name="tour"
              readOnly={Boolean(tour)}
              defaultValue={tour?.title ?? ""}
              className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-charcoal focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/20 read-only:bg-gray-50"
              placeholder="Название тура (необязательно)"
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-charcoal">
              Сообщение
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-charcoal focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/20"
              placeholder="Расскажите о ваших планах..."
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-patagonia py-3 font-semibold text-white transition-colors hover:bg-patagonia-light sm:w-auto sm:px-10"
          >
            Отправить
          </button>
        </form>
      )}
    </>
  );
}

export default function ContactsPage() {
  return (
    <>
      <Hero
        title="Контакты"
        subtitle="Свяжитесь с нами — поможем спланировать ваше путешествие"
        image="https://images.unsplash.com/photo-1483728642387-6bc3bd38dafc?w=1920&q=80"
        compact
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-bold text-charcoal">Напишите нам</h2>
            <p className="mt-3 text-slate">
              Заполните форму, и мы свяжемся с вами в течение 24 часов
            </p>

            <Suspense
              fallback={
                <div className="mt-8 h-40 animate-pulse rounded-2xl bg-gray-100" />
              }
            >
              <ContactsForm />
            </Suspense>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-charcoal">Как нас найти</h2>

            <div className="mt-8 space-y-6">
              {[
                {
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  ),
                  title: "Телефон",
                  content: "+7 (495) 123-45-67",
                  sub: "Пн–Пт, 10:00–19:00 (МСК)",
                },
                {
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  ),
                  title: "Email",
                  content: "info@argentina-travel.ru",
                  sub: "Ответим в течение 24 часов",
                },
                {
                  icon: (
                    <>
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
                    </>
                  ),
                  title: "Офис",
                  content: "Москва, ул. Путешествий, 1",
                  sub: "м. Парк культуры",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex gap-4 rounded-2xl bg-white p-5 shadow-md"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky/10">
                    <svg
                      className="h-6 w-6 text-sky"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      {item.icon}
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-charcoal">{item.title}</p>
                    <p className="mt-1 text-slate">{item.content}</p>
                    <p className="mt-0.5 text-sm text-slate/70">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex h-64 items-center justify-center overflow-hidden rounded-2xl bg-gray-200">
              <div className="text-center text-slate">
                <svg
                  className="mx-auto h-12 w-12 text-slate/40"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
                <p className="mt-2 text-sm">Карта офиса</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
