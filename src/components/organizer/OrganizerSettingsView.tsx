"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Pencil, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UserAvatar from "@/components/auth/UserAvatar";
import OrganizerBioExampleModal from "@/components/organizer/OrganizerBioExampleModal";
import OrganizerContactsTab from "@/components/organizer/OrganizerContactsTab";
import OrganizerCancellationTab from "@/components/organizer/OrganizerCancellationTab";
import { useAuth } from "@/context/AuthContext";
import { joinFullName, splitFullName } from "@/lib/full-name";
import { readOrganizerProfile, updateOrganizerProfile } from "@/lib/organizer-profile-store";
import { cn } from "@/lib/cn";
import {
  ORGANIZER_BIO_MAX,
  ORGANIZER_STATUS_MAX,
  type OrganizerProfile,
} from "@/types/organizer-profile";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const SETTINGS_TABS = [
  { id: "main", label: "Основное" },
  { id: "contacts", label: "Контакты и график" },
  { id: "cancellation", label: "Отмена бронирования" },
  { id: "guides", label: "Гиды" },
] as const;

type SettingsTabId = (typeof SETTINGS_TABS)[number]["id"];

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

function InfoBox({
  children,
  variant = "sky",
}: {
  children: React.ReactNode;
  variant?: "sky" | "amber";
}) {
  return (
    <div
      className={cn(
        "rounded-xl px-4 py-3 text-sm leading-relaxed",
        variant === "sky" ? "bg-sky/10 text-charcoal" : "bg-amber-50 text-charcoal"
      )}
    >
      {children}
    </div>
  );
}

function PlaceholderTab({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
      <p className="font-display text-lg font-bold text-charcoal">{title}</p>
      <p className="mt-2 text-sm text-slate">Раздел скоро появится</p>
    </div>
  );
}

export default function OrganizerSettingsView() {
  const { user, updateProfile, updateAvatar } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<SettingsTabId>("main");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [bio, setBio] = useState("");
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [bioExampleOpen, setBioExampleOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const { firstName: nextFirst, lastName: nextLast } = splitFullName(user.fullName);
    setFirstName(nextFirst);
    setLastName(nextLast);

    const profile = readOrganizerProfile(user.id);
    setMiddleName(profile.middleName);
    setBio(profile.bio);
    setStatusText(profile.statusText);
  }, [user]);

  if (!user) return null;

  function markDirty() {
    setSaved(false);
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);
    setSaved(false);

    const profilePatch: Partial<OrganizerProfile> = {
      middleName: middleName.trim(),
      bio: bio.slice(0, ORGANIZER_BIO_MAX),
      statusText: statusText.slice(0, ORGANIZER_STATUS_MAX),
    };

    const profileResult = updateOrganizerProfile(user.id, profilePatch);
    if ("error" in profileResult) {
      setLoading(false);
      setError(profileResult.error);
      return;
    }

    const profileResult2 = await updateProfile({
      fullName: joinFullName(firstName, lastName),
      phone: user.phone,
      email: user.email,
      country: user.country,
      dateOfBirth: user.dateOfBirth,
    });

    setLoading(false);

    if (!profileResult2.ok) {
      setError(profileResult2.error);
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
    <div className="space-y-4">
      <div className="rounded-2xl border border-brand/15 bg-brand-light/50 px-4 py-3 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:px-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-brand shadow-sm">
            <Send className="h-4 w-4" />
          </div>
          <p className="text-sm leading-relaxed text-charcoal">
            Настройте уведомления о новых заявках в мессенджер.{" "}
            <button type="button" className="font-semibold text-brand hover:underline">
              Подключить
            </button>
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex gap-1 overflow-x-auto border-b border-gray-200 px-3 scrollbar-hide sm:px-4">
          {SETTINGS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative shrink-0 px-3 py-3.5 text-sm font-medium transition-colors sm:px-4",
                activeTab === tab.id
                  ? "text-charcoal after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-brand sm:after:inset-x-3"
                  : "text-slate hover:text-charcoal"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "main" ? (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_240px] xl:items-start">
              <div className="space-y-6">
                <div>
                  <h1 className="font-display text-xl font-bold text-charcoal sm:text-2xl">
                    Автор тура
                  </h1>
                  <InfoBox variant="sky">
                    <p>
                      Профиль автора — это ваша визитная карточка для путешественников. Заполните
                      его полностью: это повышает доверие и помогает получать больше заявок.{" "}
                      <button
                        type="button"
                        className="font-semibold text-brand hover:underline"
                        onClick={() => setBioExampleOpen(true)}
                      >
                        Пример хорошего описания автора
                      </button>
                    </p>
                  </InfoBox>
                </div>

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
                        {avatarLoading ? "Загрузка…" : "Изменить"}
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
                        <FieldLabel htmlFor="organizer-first-name">Имя</FieldLabel>
                        <Input
                          id="organizer-first-name"
                          value={firstName}
                          onChange={(event) => {
                            setFirstName(event.target.value);
                            markDirty();
                          }}
                          required
                        />
                      </div>
                      <div>
                        <FieldLabel htmlFor="organizer-last-name">Фамилия</FieldLabel>
                        <Input
                          id="organizer-last-name"
                          value={lastName}
                          onChange={(event) => {
                            setLastName(event.target.value);
                            markDirty();
                          }}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <FieldLabel htmlFor="organizer-middle-name">
                        Отчество (необязательно)
                      </FieldLabel>
                      <Input
                        id="organizer-middle-name"
                        value={middleName}
                        onChange={(event) => {
                          setMiddleName(event.target.value);
                          markDirty();
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <FieldLabel htmlFor="organizer-bio">Расскажите о себе</FieldLabel>
                  <textarea
                    id="organizer-bio"
                    value={bio}
                    maxLength={ORGANIZER_BIO_MAX}
                    rows={10}
                    onChange={(event) => {
                      setBio(event.target.value);
                      markDirty();
                    }}
                    className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-charcoal placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    required
                  />
                  <div className="mt-1 flex items-start justify-between gap-3">
                    <p className="text-xs leading-relaxed text-slate">
                      Не указывайте контакты, ссылки и призывы писать в мессенджеры — это нарушает
                      правила площадки.
                    </p>
                    <span className="shrink-0 text-xs text-slate">
                      {bio.length} / {ORGANIZER_BIO_MAX}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 border-t border-gray-100 pt-6">
                  <h2 className="font-display text-base font-bold text-charcoal">
                    Статус на странице автора
                  </h2>
                  <InfoBox variant="amber">
                    <p>
                      Короткий статус привлекает внимание на вашей странице.{" "}
                      <button type="button" className="font-semibold text-brand hover:underline">
                        Пример статуса
                      </button>
                    </p>
                  </InfoBox>
                  <div>
                    <FieldLabel htmlFor="organizer-status">Введите текст статуса</FieldLabel>
                    <Input
                      id="organizer-status"
                      value={statusText}
                      maxLength={ORGANIZER_STATUS_MAX}
                      placeholder="Например: Жду вас на моём туре по Аргентине 🇦🇷"
                      onChange={(event) => {
                        setStatusText(event.target.value);
                        markDirty();
                      }}
                    />
                    <p className="mt-1 text-right text-xs text-slate">
                      {statusText.length} / {ORGANIZER_STATUS_MAX}
                    </p>
                  </div>
                </div>

                {error ? (
                  <div
                    role="alert"
                    className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700"
                  >
                    {error}
                  </div>
                ) : null}

                {saved ? (
                  <div className="rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800 xl:hidden">
                    Изменения сохранены
                  </div>
                ) : null}

                <div className="xl:hidden">
                  <Button type="submit" className="w-full" disabled={loading || avatarLoading}>
                    <Check className="h-4 w-4" />
                    {loading ? "Сохраняем…" : "Сохранить"}
                  </Button>
                </div>
              </div>

              <aside className="hidden xl:block">
                <div className="sticky top-[calc(var(--site-header-height,72px)+1rem)] rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h2 className="font-display text-base font-bold text-charcoal">
                    Настройки автора тура
                  </h2>
                  {saved ? (
                    <p className="mt-2 text-sm text-emerald-700">Изменения сохранены</p>
                  ) : null}
                  <Button
                    type="submit"
                    className="mt-4 w-full"
                    disabled={loading || avatarLoading}
                  >
                    <Check className="h-4 w-4" />
                    {loading ? "Сохраняем…" : "Сохранить"}
                  </Button>
                </div>
              </aside>
            </div>
          </form>
        ) : activeTab === "contacts" ? (
          <OrganizerContactsTab user={user} />
        ) : activeTab === "cancellation" ? (
          <OrganizerCancellationTab userId={user.id} />
        ) : (
          <div className="p-4 sm:p-6">
            <PlaceholderTab
              title={SETTINGS_TABS.find((tab) => tab.id === activeTab)?.label ?? "Раздел"}
            />
          </div>
        )}
      </div>

      <OrganizerBioExampleModal open={bioExampleOpen} onClose={() => setBioExampleOpen(false)} />
    </div>
  );
}
