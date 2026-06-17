"use client";

import { ExternalLink, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SwitchRow, SwitchField } from "@/components/ui/switch";
import {
  DEFAULT_CUSTOM_BOOKING_HINT,
  DEFAULT_CUSTOM_BOOKING_LABEL,
  isValidCustomBookingUrl,
  ORGANIZER_CUSTOM_BOOKING_HINT_MAX,
  ORGANIZER_CUSTOM_BOOKING_LABEL_MAX,
  ORGANIZER_CUSTOM_BOOKING_URL_MAX,
} from "@/lib/tour-custom-booking-link";
import type { TourCustomBookingLink } from "@/types/tour-custom-booking-link";

interface TourCustomBookingLinkBlockProps {
  settings: TourCustomBookingLink;
  onChange: (settings: TourCustomBookingLink) => void;
}

export default function TourCustomBookingLinkBlock({
  settings,
  onChange,
}: TourCustomBookingLinkBlockProps) {
  const urlError =
    settings.enabled && settings.url.trim() && !isValidCustomBookingUrl(settings.url)
      ? "Укажите корректную ссылку (http:// или https://)"
      : null;

  return (
    <section className="space-y-4 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <div>
        <h2 className="font-heading text-xl font-bold text-charcoal sm:text-2xl">
          Внешняя ссылка на бронирование
        </h2>
        <p className="mt-1 text-sm text-slate">
          Направляйте туристов на свой сайт или платформу бронирования вместо формы на нашем сайте
        </p>
      </div>

      <p className="flex items-start gap-2 rounded-xl border border-sky/15 bg-sky/[0.06] px-3.5 py-2.5 text-sm leading-relaxed text-charcoal">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky" aria-hidden />
        Когда ссылка включена, кнопка «Забронировать» ведёт на указанный адрес. Цены и даты на нашей
        странице остаются для информации. В будущем опция может быть доступна на отдельных тарифах.
      </p>

      <SwitchRow
        checked={settings.enabled}
        onCheckedChange={(enabled) => onChange({ ...settings, enabled })}
        label="Использовать внешнюю ссылку вместо бронирования на сайте"
      />

      {settings.enabled ? (
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-brand-light/20 p-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-charcoal">
              URL страницы бронирования
            </label>
            <Input
              value={settings.url}
              onChange={(event) =>
                onChange({ ...settings, url: event.target.value.slice(0, ORGANIZER_CUSTOM_BOOKING_URL_MAX) })
              }
              placeholder="https://ваш-сайт.com/booking/tour"
            />
            {urlError ? (
              <p className="mt-1 text-xs text-red-600">{urlError}</p>
            ) : (
              <p className="mt-1 text-xs text-slate">
                Ссылка на ваш сайт, Booking.com, Calendly или другую платформу
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-charcoal">Текст кнопки</label>
            <Input
              value={settings.label}
              onChange={(event) =>
                onChange({
                  ...settings,
                  label: event.target.value.slice(0, ORGANIZER_CUSTOM_BOOKING_LABEL_MAX),
                })
              }
              placeholder={DEFAULT_CUSTOM_BOOKING_LABEL}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-charcoal">
              Подсказка для туриста (необязательно)
            </label>
            <textarea
              value={settings.hint ?? ""}
              rows={2}
              onChange={(event) =>
                onChange({
                  ...settings,
                  hint: event.target.value.slice(0, ORGANIZER_CUSTOM_BOOKING_HINT_MAX),
                })
              }
              placeholder={DEFAULT_CUSTOM_BOOKING_HINT}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
          </div>

          <SwitchRow
            checked={settings.openInNewTab}
            onCheckedChange={(openInNewTab) => onChange({ ...settings, openInNewTab })}
            label="Открывать ссылку в новой вкладке"
          />

          <SwitchField
            checked={settings.passContext}
            onCheckedChange={(passContext) => onChange({ ...settings, passContext })}
            label="Передавать в ссылке количество гостей и дату"
            description="Добавляет параметры guests и start_date, если турист их выбрал"
          />

          {settings.url.trim() && isValidCustomBookingUrl(settings.url) ? (
            <a
              href={settings.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
            >
              Проверить ссылку
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
