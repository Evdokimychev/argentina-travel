import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import MaintenanceCountdown from "@/components/maintenance/MaintenanceCountdown";
import type { MaintenancePageViewModel } from "@/lib/maintenance-page";
import { cn } from "@/lib/cn";

function ContactLink({
  href,
  children,
  external,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      className="text-white/90 transition hover:text-white"
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

export default function MaintenanceComingSoonView({
  model,
  preview = false,
}: {
  model: MaintenancePageViewModel;
  preview?: boolean;
}) {
  const mailtoNotify = `mailto:${encodeURIComponent(model.supportEmail)}?subject=${encodeURIComponent("Хочу узнать о запуске")}`;

  return (
    <div className="relative min-h-screen overflow-hidden bg-charcoal text-white">
      <div className="absolute inset-0">
        <Image
          src={model.backgroundImage}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/80 via-charcoal/70 to-charcoal/90" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-6 py-6 sm:px-10">
          <div>
            <p className="font-heading text-lg font-bold tracking-tight sm:text-xl">
              {model.siteName}
            </p>
            {model.tagline ? (
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">{model.tagline}</p>
            ) : null}
          </div>
          {preview ? (
            <span className="rounded-full border border-amber-300/40 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-100">
              Предпросмотр
            </span>
          ) : null}
        </header>

        <main className="flex flex-1 flex-col items-center justify-center px-6 pb-10 pt-4 text-center sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-200">
            {model.badgeLabel}
          </p>
          <h1 className="mt-5 max-w-3xl font-heading text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
            {model.headline}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
            {model.message}
          </p>

          {model.countdownEnabled && model.countdownTarget ? (
            <div className="mt-10 w-full max-w-3xl">
              <MaintenanceCountdown targetIso={model.countdownTarget} />
            </div>
          ) : null}

          <div className="mt-10 flex flex-col items-center gap-3">
            <p className="text-sm text-white/70">{model.notifyLabel}</p>
            <a
              href={mailtoNotify}
              className={cn(
                "inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-charcoal",
                "transition hover:bg-white/90"
              )}
            >
              <Mail className="h-4 w-4" aria-hidden />
              Написать на {model.supportEmail}
            </a>
          </div>
        </main>

        {model.showContacts ? (
          <footer className="border-t border-white/10 px-6 py-8 sm:px-10">
            <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="text-left">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
                  Связаться
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li>
                    <ContactLink href={`mailto:${model.supportEmail}`}>
                      {model.supportEmail}
                    </ContactLink>
                  </li>
                  {model.telegramUrl ? (
                    <li>
                      <ContactLink href={model.telegramUrl} external>
                        Telegram
                      </ContactLink>
                    </li>
                  ) : null}
                  {model.instagramUrl ? (
                    <li>
                      <ContactLink href={model.instagramUrl} external>
                        Instagram
                      </ContactLink>
                    </li>
                  ) : null}
                </ul>
              </div>

              <div className="text-left">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
                  Телефоны
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  {model.phones.map((phone) => (
                    <li key={phone.tel} className="flex items-start gap-2">
                      <Phone className="mt-0.5 h-4 w-4 shrink-0 text-white/50" aria-hidden />
                      <span>
                        <span className="text-white/60">{phone.label}: </span>
                        <ContactLink href={`tel:${phone.tel}`}>{phone.display}</ContactLink>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-left sm:col-span-2 lg:col-span-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
                  Офис
                </p>
                <p className="mt-3 flex items-start gap-2 text-sm text-white/85">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/50" aria-hidden />
                  {model.office}
                </p>
              </div>
            </div>
          </footer>
        ) : null}

        <div className="px-6 pb-6 text-center sm:px-10">
          <Link
            href="/admin"
            className="text-xs text-white/40 underline-offset-2 transition hover:text-white/70 hover:underline"
          >
            Вход для администраторов
          </Link>
        </div>
      </div>
    </div>
  );
}
