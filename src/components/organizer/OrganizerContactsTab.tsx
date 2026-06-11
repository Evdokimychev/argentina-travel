"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Check,
  Clock,
  Globe,
  Link2,
  Mail,
  Phone,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AuthUser } from "@/types/auth";
import {
  ORGANIZER_TIMEZONES,
  createDefaultOrganizerContacts,
  type OrganizerContactsSettings,
} from "@/types/organizer-profile";
import { readOrganizerProfile, updateOrganizerProfile } from "@/lib/organizer-profile-store";
import { formatInternationalPhone } from "@/lib/phone-countries";
import { cn } from "@/lib/cn";

function FieldLabel({
  htmlFor,
  children,
  hint,
  required,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div className="mb-1.5">
      <label htmlFor={htmlFor} className="block text-xs font-medium text-charcoal">
        {children}
        {required ? <span className="text-brand"> *</span> : null}
      </label>
      {hint ? <p className="mt-0.5 text-xs leading-relaxed text-slate">{hint}</p> : null}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-heading text-base font-bold text-charcoal sm:text-lg">{children}</h2>
  );
}

function IconField({
  id,
  icon: Icon,
  value,
  onChange,
  type = "text",
  placeholder,
  readOnly,
}: {
  id: string;
  icon: typeof Phone;
  value: string;
  onChange?: (value: string) => void;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <div className="flex overflow-hidden rounded-xl border border-gray-200 bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
      <span className="flex w-11 shrink-0 items-center justify-center border-r border-gray-200 text-slate">
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <input
        id={id}
        type={type}
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        className={cn(
          "min-w-0 flex-1 px-3 py-2.5 text-sm text-charcoal outline-none placeholder:text-gray-400",
          readOnly && "cursor-default bg-gray-50/80 text-slate"
        )}
      />
    </div>
  );
}

function VkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.049.17.49-.085.744-.576.744z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function SocialIconField({
  id,
  label,
  icon,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  icon: "vk" | "telegram" | "link";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="flex overflow-hidden rounded-xl border border-gray-200 bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
        <span className="flex w-11 shrink-0 items-center justify-center border-r border-gray-200 text-slate">
          {icon === "vk" ? (
            <VkIcon className="h-4 w-4 text-[#0077FF]" />
          ) : icon === "telegram" ? (
            <TelegramIcon className="h-4 w-4 text-[#26A5E4]" />
          ) : (
            <Link2 className="h-4 w-4" strokeWidth={1.75} />
          )}
        </span>
        <input
          id={id}
          type="url"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 px-3 py-2.5 text-sm text-charcoal outline-none placeholder:text-gray-400"
        />
      </div>
    </div>
  );
}

function SaveSidebar({
  title,
  saved,
  loading,
  disabled,
}: {
  title: string;
  saved: boolean;
  loading: boolean;
  disabled?: boolean;
}) {
  return (
    <aside className="hidden xl:block">
      <div className="sticky top-[calc(var(--site-header-height,72px)+1rem)] rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="font-heading text-base font-bold text-charcoal">{title}</h2>
        {saved ? <p className="mt-2 text-sm text-emerald-700">Изменения сохранены</p> : null}
        <Button type="submit" className="mt-4 w-full" disabled={loading || disabled}>
          <Check className="h-4 w-4" />
          {loading ? "Сохраняем…" : "Сохранить"}
        </Button>
      </div>
    </aside>
  );
}

interface OrganizerContactsTabProps {
  user: AuthUser;
}

export default function OrganizerContactsTab({ user }: OrganizerContactsTabProps) {
  const [contacts, setContacts] = useState<OrganizerContactsSettings>(
    createDefaultOrganizerContacts()
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const profile = readOrganizerProfile(user.id);
    setContacts({
      ...profile.contacts,
      contactEmail: profile.contacts.contactEmail || user.email,
      documentsEmail: profile.contacts.documentsEmail || user.email,
    });
  }, [user]);

  function markDirty() {
    setSaved(false);
    setError(null);
  }

  function updateContacts(patch: Partial<OrganizerContactsSettings>) {
    setContacts((prev) => ({ ...prev, ...patch }));
    markDirty();
  }

  function updateReviewUrl(index: number, value: string) {
    setContacts((prev) => {
      const next = [...prev.reviewUrls];
      next[index] = value;
      return { ...prev, reviewUrls: next };
    });
    markDirty();
  }

  function addReviewUrl() {
    setContacts((prev) => ({ ...prev, reviewUrls: [...prev.reviewUrls, ""] }));
    markDirty();
  }

  function removeReviewUrl(index: number) {
    setContacts((prev) => ({
      ...prev,
      reviewUrls: prev.reviewUrls.filter((_, i) => i !== index),
    }));
    markDirty();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    const cleanedReviews = contacts.reviewUrls.map((url) => url.trim()).filter(Boolean);

    const result = updateOrganizerProfile(user.id, {
      contacts: {
        ...contacts,
        reviewUrls: cleanedReviews.length > 0 ? cleanedReviews : [""],
      },
    });

    setLoading(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    setContacts(result.profile.contacts);
    setSaved(true);
  }

  const phoneDisplay = formatInternationalPhone(user.phone) || user.phone;

  return (
    <form onSubmit={handleSubmit} className="p-4 sm:p-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_240px] xl:items-start">
        <div className="space-y-8">
          <section className="space-y-4">
            <SectionTitle>Контакты для связи</SectionTitle>
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm leading-relaxed text-charcoal">
              Контакты здесь не влияют на уведомления и авторизацию. Если нужно изменить номер
              аккаунта или email, перейдите в{" "}
              <Link href="/profile/settings" className="font-semibold text-brand hover:underline">
                настройки профиля
              </Link>
              .
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="organizer-contact-phone" required>
                  Номер телефона
                </FieldLabel>
                <IconField
                  id="organizer-contact-phone"
                  icon={Phone}
                  value={phoneDisplay}
                  readOnly
                />
              </div>
              <div>
                <FieldLabel htmlFor="organizer-contact-website">Сайт</FieldLabel>
                <IconField
                  id="organizer-contact-website"
                  icon={Globe}
                  value={contacts.website}
                  placeholder="https://"
                  onChange={(value) => updateContacts({ website: value })}
                />
              </div>
              <div>
                <FieldLabel
                  htmlFor="organizer-contact-email"
                  required
                  hint="Этот email используется для получения уведомлений и общения с менеджерами."
                >
                  Email для связи
                </FieldLabel>
                <IconField
                  id="organizer-contact-email"
                  icon={Mail}
                  type="email"
                  value={contacts.contactEmail}
                  onChange={(value) => updateContacts({ contactEmail: value })}
                />
              </div>
              <div>
                <FieldLabel
                  htmlFor="organizer-documents-email"
                  required
                  hint="На этот email будут приходить важные документы от партнёров (бухгалтерия, юридические). Лучше указать актуальный адрес."
                >
                  Email для документов
                </FieldLabel>
                <IconField
                  id="organizer-documents-email"
                  icon={Mail}
                  type="email"
                  value={contacts.documentsEmail}
                  onChange={(value) => updateContacts({ documentsEmail: value })}
                />
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="organizer-additional-contacts">
                Дополнительные контакты
              </FieldLabel>
              <textarea
                id="organizer-additional-contacts"
                value={contacts.additionalContacts}
                rows={3}
                onChange={(event) => updateContacts({ additionalContacts: event.target.value })}
                className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-charcoal placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                placeholder="WhatsApp, дополнительный телефон, мессенджеры…"
              />
            </div>
          </section>

          <section className="space-y-4 border-t border-gray-100 pt-8">
            <SectionTitle>Социальные сети</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <SocialIconField
                id="organizer-vk"
                label="URL профиля в VK"
                icon="vk"
                value={contacts.vkUrl}
                placeholder="https://vk.com/…"
                onChange={(value) => updateContacts({ vkUrl: value })}
              />
              <SocialIconField
                id="organizer-telegram"
                label="URL профиля в Telegram"
                icon="telegram"
                value={contacts.telegramUrl}
                placeholder="https://t.me/…"
                onChange={(value) => updateContacts({ telegramUrl: value })}
              />
              <div className="sm:col-span-2">
                <SocialIconField
                  id="organizer-other-social"
                  label="URL другой социальной сети"
                  icon="link"
                  value={contacts.otherSocialUrl}
                  placeholder="https://"
                  onChange={(value) => updateContacts({ otherSocialUrl: value })}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t border-gray-100 pt-8">
            <div>
              <SectionTitle>Отзывы</SectionTitle>
              <p className="mt-1 text-sm text-slate">
                Добавьте отзывы о вашей работе с других площадок.
              </p>
            </div>

            <div className="space-y-3">
              {contacts.reviewUrls.map((url, index) => (
                <div key={`review-${index}`} className="flex gap-2">
                  <div className="min-w-0 flex-1">
                    <FieldLabel htmlFor={`organizer-review-${index}`}>URL отзыва</FieldLabel>
                    <IconField
                      id={`organizer-review-${index}`}
                      icon={Link2}
                      value={url}
                      placeholder="https://"
                      onChange={(value) => updateReviewUrl(index, value)}
                    />
                  </div>
                  {contacts.reviewUrls.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeReviewUrl(index)}
                      className="mt-6 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-slate transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      aria-label="Удалить отзыв"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addReviewUrl}
              className="inline-flex items-center gap-2 rounded-xl border border-brand/20 bg-brand-light px-4 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-brand/10"
            >
              <Plus className="h-4 w-4" />
              Добавить отзыв
            </button>
          </section>

          <section className="space-y-4 border-t border-gray-100 pt-8">
            <SectionTitle>Время работы</SectionTitle>

            <div>
              <FieldLabel htmlFor="organizer-timezone">Часовой пояс</FieldLabel>
              <div className="flex overflow-hidden rounded-xl border border-gray-200 bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
                <span className="flex w-11 shrink-0 items-center justify-center border-r border-gray-200 text-slate">
                  <Clock className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <select
                  id="organizer-timezone"
                  value={contacts.timezone}
                  onChange={(event) => updateContacts({ timezone: event.target.value })}
                  className="min-w-0 flex-1 appearance-none bg-white py-2.5 pl-3 pr-10 text-sm text-charcoal outline-none"
                >
                  {ORGANIZER_TIMEZONES.map((zone) => (
                    <option key={zone.value} value={zone.value}>
                      {zone.label}
                    </option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none -ml-8 h-4 w-4 text-slate"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="organizer-weekday-start">Начало работы по будням</FieldLabel>
                <IconField
                  id="organizer-weekday-start"
                  icon={Clock}
                  type="time"
                  value={contacts.weekdayStart}
                  onChange={(value) => updateContacts({ weekdayStart: value })}
                />
              </div>
              <div>
                <FieldLabel htmlFor="organizer-weekday-end">Окончание работы по будням</FieldLabel>
                <IconField
                  id="organizer-weekday-end"
                  icon={Clock}
                  type="time"
                  value={contacts.weekdayEnd}
                  onChange={(value) => updateContacts({ weekdayEnd: value })}
                />
              </div>
              <div>
                <FieldLabel htmlFor="organizer-weekend-start">Время начала на выходных</FieldLabel>
                <IconField
                  id="organizer-weekend-start"
                  icon={Clock}
                  type="time"
                  value={contacts.weekendStart}
                  onChange={(value) => updateContacts({ weekendStart: value })}
                />
              </div>
              <div>
                <FieldLabel htmlFor="organizer-weekend-end">Время окончания на выходных</FieldLabel>
                <IconField
                  id="organizer-weekend-end"
                  icon={Clock}
                  type="time"
                  value={contacts.weekendEnd}
                  onChange={(value) => updateContacts({ weekendEnd: value })}
                />
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate">
              Оставьте поля пустыми, если не работаете в выходные.
            </p>
          </section>

          {error ? (
            <div role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {saved ? (
            <div className="rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800 xl:hidden">
              Изменения сохранены
            </div>
          ) : null}

          <div className="xl:hidden">
            <Button type="submit" className="w-full" disabled={loading}>
              <Check className="h-4 w-4" />
              {loading ? "Сохраняем…" : "Сохранить"}
            </Button>
          </div>
        </div>

        <SaveSidebar
          title="Контакты и график"
          saved={saved}
          loading={loading}
        />
      </div>
    </form>
  );
}
