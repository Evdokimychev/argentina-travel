"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, isValid, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SingleDatePicker from "@/components/ui/single-date-picker";
import { useAuth } from "@/context/AuthContext";
import { formatPhoneInput } from "@/lib/auth-store";
import { maxBirthDateIso, minBirthDateIso, participantAgeLabel } from "@/lib/participant-age";
import { PROFILE_COUNTRIES, getProfileCountryFlag } from "@/data/profile-countries";
import UserAvatar from "@/components/auth/UserAvatar";
import { cn } from "@/lib/cn";

import { ArrowRight, Pencil, Trash2 } from "lucide-react";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function joinFullName(firstName: string, lastName: string): string {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
}

function parseStoredDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

function formatStoredDate(date: Date | null): string | null {
  if (!date) return null;
  return format(date, "yyyy-MM-dd");
}

function phoneToInput(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("7")) {
    return formatPhoneInput(digits.slice(1));
  }
  return formatPhoneInput(digits);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.readAsDataURL(file);
  });
}

function CompactActionLink({
  children,
  onClick,
  disabled,
  variant = "default",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variant === "danger"
          ? "text-slate hover:text-red-600"
          : "text-brand hover:text-brand-dark"
      )}
    >
      {children}
    </button>
  );
}

function FieldLabel({
  htmlFor,
  children,
  hint,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-1.5">
      <label htmlFor={htmlFor} className="block text-xs font-medium text-charcoal">
        {children}
      </label>
      {hint ? <p className="mt-0.5 text-xs text-slate">{hint}</p> : null}
    </div>
  );
}

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { user, updateProfile, updateAvatar, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const { firstName: nextFirstName, lastName: nextLastName } = splitFullName(user.fullName);
    setFirstName(nextFirstName);
    setLastName(nextLastName);
    setDateOfBirth(parseStoredDate(user.dateOfBirth));
    setPhone(phoneToInput(user.phone));
    setEmail(user.email);
    setCountry(user.country);
  }, [user]);

  if (!user) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    const result = await updateProfile({
      fullName: joinFullName(firstName, lastName),
      phone,
      email,
      country,
      dateOfBirth: formatStoredDate(dateOfBirth),
    });
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSaved(true);
  }

  async function handleAvatarSelect(file: File | null) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Выберите файл изображения");
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      setError("Фото должно быть не больше 2 МБ");
      return;
    }

    setAvatarLoading(true);
    setError(null);
    setSaved(false);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const result = await updateAvatar(dataUrl);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
    } catch {
      setError("Не удалось загрузить фото");
    } finally {
      setAvatarLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleAvatarRemove() {
    setAvatarLoading(true);
    setError(null);
    setSaved(false);

    const result = await updateAvatar(null);
    setAvatarLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSaved(true);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <h2 className="font-display text-xl font-bold text-charcoal">Настройки аккаунта</h2>
        <p className="mt-1 text-sm text-slate">Контактные данные и фото профиля</p>

        <div className="mt-5 space-y-4">
              <div className="flex gap-4 border-b border-gray-100 pb-4">
                <div className="flex shrink-0 flex-col items-center">
                  <UserAvatar
                    name={user.fullName}
                    avatarUrl={user.avatarUrl}
                    className="h-24 w-24 text-2xl"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => handleAvatarSelect(event.target.files?.[0] ?? null)}
                  />
                  <div className="mt-3 flex flex-col items-center gap-1.5">
                    <CompactActionLink
                      disabled={avatarLoading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Pencil className="h-3 w-3" aria-hidden />
                      Изменить
                    </CompactActionLink>
                    {user.avatarUrl ? (
                      <CompactActionLink
                        disabled={avatarLoading}
                        variant="danger"
                        onClick={handleAvatarRemove}
                      >
                        <Trash2 className="h-3 w-3" aria-hidden />
                        Удалить
                      </CompactActionLink>
                    ) : null}
                  </div>
                </div>

                <div className="min-w-0 flex-1 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <FieldLabel htmlFor="profile-first-name">Имя</FieldLabel>
                      <Input
                        id="profile-first-name"
                        value={firstName}
                        onChange={(event) => {
                          setFirstName(event.target.value);
                          setSaved(false);
                        }}
                        required
                      />
                    </div>
                    <div>
                      <FieldLabel htmlFor="profile-last-name">Фамилия</FieldLabel>
                      <Input
                        id="profile-last-name"
                        value={lastName}
                        onChange={(event) => {
                          setLastName(event.target.value);
                          setSaved(false);
                        }}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <FieldLabel htmlFor="profile-dob">Дата рождения</FieldLabel>
                    <SingleDatePicker
                      id="profile-dob"
                      value={dateOfBirth}
                      onChange={(nextDate) => {
                        setDateOfBirth(nextDate);
                        setSaved(false);
                      }}
                      min={minBirthDateIso()}
                      max={maxBirthDateIso()}
                      birthDatePicker
                      placeholder="ДД.ММ.ГГГГ"
                    />
                    {participantAgeLabel(dateOfBirth) ? (
                      <p className="mt-1.5 text-xs text-slate">
                        Возраст: {participantAgeLabel(dateOfBirth)}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div>
                <FieldLabel htmlFor="profile-phone">Телефон</FieldLabel>
                <div className="flex overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <div className="flex items-center border-r border-gray-200 px-3 text-sm font-medium text-charcoal">
                    +7
                  </div>
                  <input
                    id="profile-phone"
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(event) => {
                      setPhone(formatPhoneInput(event.target.value));
                      setSaved(false);
                    }}
                    className="min-w-0 flex-1 px-4 py-2.5 text-sm text-charcoal outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <FieldLabel htmlFor="profile-email">Email</FieldLabel>
                <Input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setSaved(false);
                  }}
                  required
                />
              </div>

              <div>
                <FieldLabel
                  htmlFor="profile-country"
                  hint="Для подбора туров и связи с организатором"
                >
                  Страна проживания
                </FieldLabel>
                <div className="relative">
                  <span
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base"
                    aria-hidden
                  >
                    {getProfileCountryFlag(country)}
                  </span>
                  <select
                    id="profile-country"
                    value={country}
                    onChange={(event) => {
                      setCountry(event.target.value);
                      setSaved(false);
                    }}
                    className="flex h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-10 text-sm text-charcoal focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  >
                  {PROFILE_COUNTRIES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                  </select>
                  <svg
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

          {error ? (
            <div role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {saved ? (
            <div className="mt-4 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
              Изменения успешно сохранены!
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Button type="submit" disabled={loading || avatarLoading}>
              {loading ? "Сохраняем…" : "Сохранить изменения"}
            </Button>
            <button
              type="button"
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="text-sm font-medium text-slate transition-colors hover:text-charcoal"
            >
              Выйти из аккаунта
            </button>
          </div>
        </form>

          <aside className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="font-display text-lg font-bold text-charcoal">Авторам путешествий</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate">
              Организуйте собственный тур вместе с нами
            </p>
            <Link
              href="/join"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand transition-colors hover:text-brand-dark"
            >
              Стать автором
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </aside>
    </div>
  );
}
