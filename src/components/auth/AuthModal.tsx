"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, useHasOrganizerRole } from "@/context/AuthContext";
import type { AuthUserRole } from "@/types/auth";
import { DEMO_PASSWORD, normalizePhone } from "@/lib/auth-store";
import { formatInternationalPhone } from "@/lib/phone-countries";
import PhoneCountryInput from "@/components/auth/PhoneCountryInput";

type AuthMode = "phone" | "email";
type AuthStep = "sign-in" | "register";
type OrganizerTab = "sign-in" | "register";

function RoleBadges({ user }: { user: { roles: AuthUserRole[]; role: AuthUserRole } }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {user.roles.includes("tourist") ? (
        <span className="rounded-full bg-sky/10 px-2 py-0.5 text-[11px] font-medium text-sky">
          Турист
        </span>
      ) : null}
      {user.roles.includes("organizer") ? (
        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
          Организатор
        </span>
      ) : null}
      <span className="text-[11px] text-slate">· активна: {user.role === "tourist" ? "турист" : "организатор"}</span>
    </div>
  );
}

export default function AuthModal() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    authOpen,
    authIntent,
    closeAuth,
    loginByPhone,
    loginByEmail,
    loginForOrganizerUpgrade,
    register,
    addOrganizerRole,
    logout,
  } = useAuth();

  const hasOrganizerRole = useHasOrganizerRole(user);
  const isOrganizerFlow = authIntent === "organizer";

  const [role, setRole] = useState<AuthUserRole>("tourist");
  const [mode, setMode] = useState<AuthMode>("phone");
  const [step, setStep] = useState<AuthStep>("sign-in");
  const [organizerTab, setOrganizerTab] = useState<OrganizerTab>("sign-in");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loginCredential, setLoginCredential] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [duplicateRegistration, setDuplicateRegistration] = useState(false);

  useEffect(() => {
    if (!authOpen) return;

    setError(null);
    setLoading(false);
    setDuplicateRegistration(false);
    setStep("sign-in");
    setOrganizerTab("sign-in");
    setMode("phone");
    setRole(isOrganizerFlow ? "organizer" : "tourist");
    setPhone("");
    setEmail("");
    setLoginCredential("");
    setPassword("");
    setFullName("");
    setShowPassword(false);
    setTermsAccepted(true);
  }, [authOpen, isOrganizerFlow]);

  if (!authOpen) return null;

  async function handlePhoneContinue(targetRole = role) {
    if (!termsAccepted) {
      setError("Примите условия пользовательского соглашения");
      return;
    }

    const normalized = normalizePhone(phone);
    if (!normalized) {
      setError("Введите корректный номер телефона");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await loginByPhone(phone, targetRole);
    setLoading(false);

    if (result.ok) {
      closeAuth();
      return;
    }

    if (result.notFound) {
      setStep("register");
      setError(null);
      return;
    }

    if (result.roleNotConnected && isOrganizerFlow) {
      setOrganizerTab("sign-in");
      setLoginCredential(formatInternationalPhone(phone));
      setError("Аккаунт найден. Войдите по email и паролю, чтобы подключить роль организатора.");
      return;
    }

    setError(result.error);
  }

  async function handleEmailContinue(targetRole = role) {
    if (!termsAccepted) {
      setError("Примите условия пользовательского соглашения");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError("Укажите корректный email");
      return;
    }

    if (!password.trim()) {
      setError("Введите пароль");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await loginByEmail(email, password, targetRole);
    setLoading(false);

    if (result.ok) {
      closeAuth();
      return;
    }

    if (result.roleNotConnected && isOrganizerFlow) {
      const upgrade = await loginForOrganizerUpgrade(email, password);
      if (!upgrade.ok) {
        setError(upgrade.error);
        return;
      }
      setError(null);
      return;
    }

    setError(result.error);
  }

  async function handleOrganizerCredentialLogin() {
    if (!termsAccepted) {
      setError("Примите условия соглашения для организаторов");
      return;
    }

    const credential = loginCredential.trim();
    if (!credential) {
      setError("Введите email или телефон");
      return;
    }

    if (!password.trim()) {
      setError("Введите пароль");
      return;
    }

    setLoading(true);
    setError(null);

    if (credential.includes("@")) {
      const login = await loginByEmail(credential, password, "organizer");
      if (login.ok) {
        setLoading(false);
        closeAuth();
        return;
      }

      if (login.roleNotConnected) {
        const upgrade = await loginForOrganizerUpgrade(credential, password);
        setLoading(false);
        if (!upgrade.ok) {
          setError(upgrade.error);
          return;
        }
        setError(null);
        return;
      }

      setLoading(false);
      setError(login.error);
      return;
    }

    const normalized = normalizePhone(credential);
    if (!normalized) {
      setLoading(false);
      setError("Введите корректный email или телефон");
      return;
    }

    const result = await loginByPhone(credential, "organizer");
    setLoading(false);

    if (result.ok) {
      closeAuth();
      return;
    }

    if (result.roleNotConnected) {
      setError("Аккаунт найден. Для подключения роли организатора войдите по email и паролю.");
      return;
    }

    if (result.notFound) {
      setOrganizerTab("register");
      setPhone(credential);
      setError(null);
      return;
    }

    setError(result.error);
  }

  async function handleRegister() {
    if (!termsAccepted) {
      setError("Примите условия пользовательского соглашения");
      return;
    }

    setLoading(true);
    setError(null);
    setDuplicateRegistration(false);

    const result = await register({
      role: isOrganizerFlow ? "organizer" : role,
      fullName,
      phone,
      email,
      password: isOrganizerFlow ? password || DEMO_PASSWORD : DEMO_PASSWORD,
    });

    setLoading(false);

    if (result.ok) {
      closeAuth();
      return;
    }

    if (result.duplicatePhone || result.duplicateEmail) {
      setDuplicateRegistration(true);
      if (isOrganizerFlow) {
        setOrganizerTab("sign-in");
      } else {
        setStep("sign-in");
      }
    }

    setError(result.error);
  }

  async function handleConnectOrganizerRole() {
    setLoading(true);
    setError(null);

    const result = await addOrganizerRole();
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
  }

  function renderAuthenticatedView() {
    if (!user) return null;

    if (isOrganizerFlow && !hasOrganizerRole) {
      return (
        <div className="space-y-5 px-5 py-5 sm:px-6">
          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-sm font-semibold text-charcoal">{user.fullName}</p>
            <p className="mt-1 text-sm text-slate">{user.phone}</p>
            <p className="text-sm text-slate">{user.email}</p>
            <RoleBadges user={user} />
          </div>

          <div className="rounded-2xl border border-brand/20 bg-brand-light/40 p-4">
            <h3 className="font-display text-base font-bold text-charcoal">
              Подключить роль организатора
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate">
              Ваш аккаунт уже зарегистрирован как турист. Подключите роль организатора, чтобы
              размещать туры на платформе — отдельная регистрация не нужна.
            </p>
          </div>

          {error ? (
            <div role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <Button
            type="button"
            className="w-full rounded-xl"
            disabled={loading}
            onClick={handleConnectOrganizerRole}
          >
            {loading ? "Подключаем…" : "Подключить роль организатора"}
          </Button>

          <Button type="button" variant="outline" className="w-full" onClick={logout}>
            Выйти и войти другим аккаунтом
          </Button>
        </div>
      );
    }

    if (isOrganizerFlow && hasOrganizerRole) {
      return (
        <div className="space-y-5 px-5 py-5 sm:px-6">
          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-900">Роль организатора активна</p>
            <p className="mt-1 text-sm text-emerald-800">{user.fullName}</p>
            <RoleBadges user={user} />
          </div>
          <p className="text-sm text-slate">
            Вы можете размещать туры и управлять бронированиями в личном кабинете организатора.
          </p>
          <Button
            type="button"
            className="w-full rounded-xl"
            onClick={() => {
              closeAuth();
              router.push("/organizer");
            }}
          >
            Перейти к размещению туров
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={closeAuth}>
            Закрыть
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-5 px-5 py-5 sm:px-6">
        <div className="rounded-2xl bg-gray-50 p-4">
          <p className="text-sm font-semibold text-charcoal">{user.fullName}</p>
          <p className="mt-1 text-sm text-slate">{user.phone}</p>
          <p className="text-sm text-slate">{user.email}</p>
          <RoleBadges user={user} />
        </div>

        {!hasOrganizerRole ? (
          <button
            type="button"
            onClick={() => handleConnectOrganizerRole()}
            className="w-full rounded-xl border border-brand/20 bg-brand-light/30 px-4 py-3 text-left text-sm transition-colors hover:bg-brand-light/50"
          >
            <span className="font-semibold text-brand">Стать организатором</span>
            <span className="mt-0.5 block text-xs text-slate">
              Подключить роль автора туров к этому профилю
            </span>
          </button>
        ) : null}

        <Button type="button" variant="outline" className="w-full" onClick={logout}>
          Выйти
        </Button>
      </div>
    );
  }

  function renderOrganizerAuth() {
    return (
      <div className="space-y-5 px-5 py-5 sm:px-6">
        <div className="flex rounded-xl bg-gray-100 p-1">
          {(
            [
              { id: "register", label: "Регистрация" },
              { id: "sign-in", label: "Вход" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setOrganizerTab(tab.id);
                setError(null);
                setDuplicateRegistration(false);
              }}
              className={cn(
                "flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                organizerTab === tab.id
                  ? "bg-white text-charcoal shadow-sm"
                  : "text-slate hover:text-charcoal"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {organizerTab === "sign-in" ? (
          <>
            <div>
              <label htmlFor="organizer-credential" className="mb-2 block text-xs font-medium text-slate">
                Email или телефон
              </label>
              <Input
                id="organizer-credential"
                placeholder="email@example.com или +7 999 000 00 00"
                value={loginCredential}
                onChange={(event) => {
                  setLoginCredential(event.target.value);
                  setError(null);
                }}
              />
            </div>

            <div>
              <label htmlFor="organizer-password" className="mb-2 block text-xs font-medium text-slate">
                Пароль
              </label>
              <div className="relative">
                <Input
                  id="organizer-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Введите пароль"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError(null);
                  }}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((open) => !open)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate transition-colors hover:text-charcoal"
                  aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="mb-2 block text-xs font-medium text-slate">Номер телефона</label>
              <PhoneCountryInput
                value={phone}
                onChange={(international) => {
                  setPhone(international);
                  setError(null);
                }}
              />
            </div>

            <div>
              <label htmlFor="organizer-register-name" className="mb-2 block text-xs font-medium text-slate">
                Имя и фамилия
              </label>
              <Input
                id="organizer-register-name"
                placeholder="Иван Иванов"
                value={fullName}
                onChange={(event) => {
                  setFullName(event.target.value);
                  setError(null);
                }}
              />
            </div>

            <div>
              <label htmlFor="organizer-register-email" className="mb-2 block text-xs font-medium text-slate">
                Email
              </label>
              <Input
                id="organizer-register-email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError(null);
                }}
              />
            </div>

            <div>
              <label htmlFor="organizer-register-password" className="mb-2 block text-xs font-medium text-slate">
                Пароль
              </label>
              <Input
                id="organizer-register-password"
                type="password"
                placeholder="Придумайте пароль"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError(null);
                }}
              />
            </div>
          </>
        )}

        {duplicateRegistration ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
            Аккаунт с такими данными уже есть.{" "}
            {organizerTab === "register" ? (
              <button
                type="button"
                className="font-semibold text-brand hover:underline"
                onClick={() => {
                  setOrganizerTab("sign-in");
                  setDuplicateRegistration(false);
                  setError(null);
                }}
              >
                Войдите
              </button>
            ) : null}{" "}
            и подключите роль организатора к профилю.
          </div>
        ) : null}

        {error ? (
          <div role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
            className="mt-0.5 h-4 w-4 accent-brand"
          />
          <span className="text-xs leading-relaxed text-slate">
            Я принимаю условия{" "}
            <Link href="/contacts" className="font-medium text-brand hover:text-brand-dark">
              Публичной оферты
            </Link>{" "}
            и{" "}
            <Link href="/join" className="font-medium text-brand hover:text-brand-dark">
              Договора для организатора
            </Link>
          </span>
        </label>

        <Button
          type="button"
          className="w-full rounded-xl"
          disabled={loading}
          onClick={
            organizerTab === "sign-in"
              ? handleOrganizerCredentialLogin
              : () => handleRegister()
          }
        >
          {loading
            ? "Проверяем…"
            : organizerTab === "sign-in"
              ? "Войти"
              : "Зарегистрироваться"}
        </Button>

        {organizerTab === "sign-in" ? (
          <button
            type="button"
            onClick={() => {
              setOrganizerTab("register");
              setError(null);
            }}
            className="w-full text-sm font-medium text-slate transition-colors hover:text-charcoal"
          >
            Нет аккаунта? Зарегистрироваться
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setOrganizerTab("sign-in");
              setError(null);
              setDuplicateRegistration(false);
            }}
            className="w-full text-sm font-medium text-slate transition-colors hover:text-charcoal"
          >
            ← Уже есть аккаунт? Войти
          </button>
        )}
      </div>
    );
  }

  const modalTitle = isAuthenticated
    ? isOrganizerFlow
      ? hasOrganizerRole
        ? "Кабинет организатора"
        : "Подключение организатора"
      : "Личный кабинет"
    : isOrganizerFlow
      ? "Вход для организаторов"
      : step === "register"
        ? "Регистрация"
        : "Войдите или зарегистрируйтесь";

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-charcoal/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={closeAuth}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div>
            <h2 id="auth-modal-title" className="font-display text-xl font-bold text-charcoal">
              {modalTitle}
            </h2>
            {isOrganizerFlow && !isAuthenticated ? (
              <p className="mt-1 text-xs text-slate">
                Регистрация и вход представителя организатора
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={closeAuth}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 text-slate transition-colors hover:bg-gray-50 hover:text-charcoal"
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isAuthenticated && user ? (
          renderAuthenticatedView()
        ) : isOrganizerFlow ? (
          renderOrganizerAuth()
        ) : (
          <div className="space-y-5 px-5 py-5 sm:px-6">
            {step === "sign-in" ? (
              <>
                <div className="flex rounded-xl bg-gray-100 p-1">
                  {(
                    [
                      { id: "tourist", label: "Я турист" },
                      { id: "organizer", label: "Я автор тура" },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setRole(option.id);
                        setError(null);
                      }}
                      className={cn(
                        "flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        role === option.id
                          ? "bg-white text-charcoal shadow-sm"
                          : "text-slate hover:text-charcoal"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {mode === "phone" ? (
                  <div>
                    <label className="mb-2 block text-xs font-medium text-slate">Номер телефона</label>
                    <PhoneCountryInput
                      value={phone}
                      onChange={(international) => {
                        setPhone(international);
                        setError(null);
                      }}
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="auth-email" className="mb-2 block text-xs font-medium text-slate">
                        Email
                      </label>
                      <Input
                        id="auth-email"
                        type="email"
                        autoComplete="email"
                        placeholder="email@example.com"
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          setError(null);
                        }}
                      />
                    </div>
                    <div>
                      <label htmlFor="auth-password" className="mb-2 block text-xs font-medium text-slate">
                        Пароль
                      </label>
                      <Input
                        id="auth-password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="Введите пароль"
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          setError(null);
                        }}
                      />
                    </div>
                  </div>
                )}

                {error ? (
                  <div role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(event) => setTermsAccepted(event.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-brand"
                  />
                  <span className="text-xs leading-relaxed text-slate">
                    Я принимаю условия{" "}
                    <Link href="/contacts" className="font-medium text-brand hover:text-brand-dark">
                      Пользовательского соглашения
                    </Link>
                  </span>
                </label>

                <Button
                  type="button"
                  className="w-full rounded-xl"
                  disabled={loading}
                  onClick={mode === "phone" ? () => handlePhoneContinue() : () => handleEmailContinue()}
                >
                  {loading ? "Проверяем…" : "Продолжить"}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "phone" ? "email" : "phone");
                    setError(null);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-charcoal transition-colors hover:bg-gray-50"
                >
                  <Mail className="h-4 w-4 text-slate" aria-hidden />
                  {mode === "phone" ? "Войти по почте" : "Войти по телефону"}
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-slate">
                  Аккаунт с номером{" "}
                  <span className="font-medium text-charcoal">{formatInternationalPhone(phone)}</span>{" "}
                  не найден. Заполните данные для регистрации.
                </p>

                <div>
                  <label htmlFor="auth-name" className="mb-2 block text-xs font-medium text-slate">
                    Имя и фамилия
                  </label>
                  <Input
                    id="auth-name"
                    placeholder="Иван Иванов"
                    value={fullName}
                    onChange={(event) => {
                      setFullName(event.target.value);
                      setError(null);
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="auth-register-email" className="mb-2 block text-xs font-medium text-slate">
                    Email
                  </label>
                  <Input
                    id="auth-register-email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError(null);
                    }}
                  />
                </div>

                {duplicateRegistration ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                    Такой аккаунт уже существует.{" "}
                    <button
                      type="button"
                      className="font-semibold text-brand hover:underline"
                      onClick={() => {
                        setStep("sign-in");
                        setDuplicateRegistration(false);
                        setError(null);
                      }}
                    >
                      Войдите
                    </button>{" "}
                    вместо повторной регистрации.
                  </div>
                ) : null}

                {error ? (
                  <div role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(event) => setTermsAccepted(event.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-brand"
                  />
                  <span className="text-xs leading-relaxed text-slate">
                    Я принимаю условия пользовательского соглашения
                  </span>
                </label>

                <Button
                  type="button"
                  className="w-full rounded-xl"
                  disabled={loading}
                  onClick={handleRegister}
                >
                  {loading ? "Создаём аккаунт…" : "Зарегистрироваться"}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("sign-in");
                    setError(null);
                    setDuplicateRegistration(false);
                  }}
                  className="w-full text-sm font-medium text-slate transition-colors hover:text-charcoal"
                >
                  ← Назад ко входу
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
