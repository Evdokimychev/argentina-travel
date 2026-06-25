"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Phone, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { touchTargetIconClass } from "@/lib/responsive-ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth, useHasOrganizerRole } from "@/context/AuthContext";
import type { AuthUserRole } from "@/types/auth";
import { normalizePhone, resolvePasswordInput } from "@/lib/auth-store";
import { lookupPhoneAccount, resolveAuthGreeting } from "@/lib/auth-client";
import { formatInternationalPhone } from "@/lib/phone-countries";
import PhoneCountryInput from "@/components/auth/PhoneCountryInput";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { useSiteFeedback } from "@/context/SiteFeedbackContext";
import { normalizeSiteError, passwordResetSentMessage, siteFormError } from "@/lib/site-feedback/normalize-error";
import { clearAuthNextPath, readAuthNextPath } from "@/lib/auth-redirect";
import type { SiteFeedbackMessage } from "@/types/site-feedback";

type AuthMode = "phone" | "email";
type AuthStep = "sign-in" | "register" | "forgot-password";
type OrganizerTab = "sign-in" | "register";
type PhoneAuthStep = "phone" | "password";

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
    favoriteAuthStep,
    closeAuth,
    loginByPhone,
    loginByEmail,
    loginForOrganizerUpgrade,
    register,
    addOrganizerRole,
    requestPasswordReset,
    logout,
  } = useAuth();

  const hasOrganizerRole = useHasOrganizerRole(user);
  const isOrganizerFlow = authIntent === "organizer";
  const isFavoriteFlow = authIntent === "favorite";

  const [role, setRole] = useState<AuthUserRole>("tourist");
  const [mode, setMode] = useState<AuthMode>("email");
  const [phoneAuthStep, setPhoneAuthStep] = useState<PhoneAuthStep>("phone");
  const [step, setStep] = useState<AuthStep>("sign-in");
  const [organizerTab, setOrganizerTab] = useState<OrganizerTab>("sign-in");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loginCredential, setLoginCredential] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setErrorState] = useState<SiteFeedbackMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [duplicateRegistration, setDuplicateRegistration] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const feedback = useSiteFeedback();

  const setError = (value: string | SiteFeedbackMessage | null) => {
    if (value === null) {
      setErrorState(null);
      return;
    }
    setErrorState(typeof value === "string" ? siteFormError(value) : value);
  };

  function completeAuthSuccess(
    destination: "/profile" | "/organizer",
    sessionUser?: { fullName?: string | null } | null
  ) {
    if (isFavoriteFlow) {
      closeAuth();
      return;
    }

    const nextPath = readAuthNextPath();
    const finalDestination = nextPath ?? destination;

    const asOrganizer = finalDestination.startsWith("/organizer");
    feedback.success({
      title: resolveAuthGreeting(sessionUser?.fullName),
      description: asOrganizer
        ? "Кабинет организатора открыт — можно размещать туры и управлять бронированиями."
        : "Рады видеть вас снова на «Пора в Аргентину».",
    });
    clearAuthNextPath();
    closeAuth();
    router.push(finalDestination);
  }

  useEffect(() => {
    if (!authOpen) return;

    setError(null);
    setLoading(false);
    setDuplicateRegistration(false);
    setResetSent(false);
    setStep(isFavoriteFlow ? favoriteAuthStep : "sign-in");
    setOrganizerTab(isFavoriteFlow ? favoriteAuthStep : "sign-in");
    setMode("email");
    setPhoneAuthStep("phone");
    setRole(isOrganizerFlow ? "organizer" : "tourist");
    setPhone("");
    setEmail("");
    setLoginCredential("");
    setPassword("");
    setFullName("");
    setShowPassword(false);
    setTermsAccepted(false);
  }, [authOpen, isOrganizerFlow, isFavoriteFlow, favoriteAuthStep]);

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

    if (phoneAuthStep === "phone") {
      setLoading(true);
      setError(null);

      const lookup = await lookupPhoneAccount(phone);
      setLoading(false);

      if (lookup.status === "error") {
        setError(lookup.message);
        return;
      }

      if (lookup.status === "not_found") {
        setStep("register");
        setError(null);
        return;
      }

      setPhoneAuthStep("password");
      setPassword("");
      setShowPassword(false);
      return;
    }

    if (!password.trim()) {
      setError("Введите пароль");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await loginByPhone(phone, targetRole, password.trim());
    setLoading(false);

    if (result.ok) {
      completeAuthSuccess(
        targetRole === "organizer" || isOrganizerFlow ? "/organizer" : "/profile",
        result.user
      );
      return;
    }

    if (result.roleNotConnected && (isOrganizerFlow || targetRole === "organizer")) {
      setMode("email");
      setPhoneAuthStep("phone");
      setOrganizerTab("sign-in");
      setLoginCredential(formatInternationalPhone(phone));
      setError(normalizeSiteError("ROLE_NOT_CONNECTED"));
      return;
    }

    setError(normalizeSiteError(result.error));
  }

  async function handleOrganizerUpgradeFromCredentials(
    credentialEmail: string,
    credentialPassword: string
  ) {
    const upgrade = await loginForOrganizerUpgrade(credentialEmail, credentialPassword);
    if (!upgrade.ok) {
      setError(normalizeSiteError(upgrade.error));
      return;
    }
    completeAuthSuccess("/organizer", upgrade.user);
  }

  async function handleForgotPasswordSubmit() {
    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes("@")) {
      setError(siteFormError("Укажите email, который использовали при регистрации"));
      return;
    }

    setLoading(true);
    setError(null);
    setResetSent(false);

    const result = await requestPasswordReset(targetEmail);
    setLoading(false);

    if (!result.ok) {
      setError(normalizeSiteError(result.error));
      return;
    }

    setResetSent(true);
    setError(passwordResetSentMessage(targetEmail));
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
      completeAuthSuccess(
        targetRole === "organizer" || isOrganizerFlow ? "/organizer" : "/profile",
        result.user
      );
      return;
    }

    if (result.roleNotConnected && targetRole === "organizer") {
      await handleOrganizerUpgradeFromCredentials(email, password);
      return;
    }

    if (result.roleNotConnected && isOrganizerFlow) {
      await handleOrganizerUpgradeFromCredentials(email, password);
      return;
    }

    setError(normalizeSiteError(result.error));
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
        completeAuthSuccess(isOrganizerFlow ? "/organizer" : "/profile", login.user);
        return;
      }

      if (login.roleNotConnected) {
        setLoading(false);
        await handleOrganizerUpgradeFromCredentials(credential, password);
        return;
      }

      setLoading(false);
      setError(normalizeSiteError(login.error));
      return;
    }

    const normalized = normalizePhone(credential);
    if (!normalized) {
      setLoading(false);
      setError("Введите корректный email или телефон");
      return;
    }

    const result = await loginByPhone(credential, "organizer", password.trim() || undefined);
    setLoading(false);

    if (result.ok) {
      completeAuthSuccess("/organizer", result.user);
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

    setError(normalizeSiteError(result.error));
  }

  async function handleRegister() {
    if (!termsAccepted) {
      setError("Примите условия пользовательского соглашения");
      return;
    }

    const nextPassword = resolvePasswordInput(password);
    if (nextPassword.length < 6) {
      setError("Пароль должен содержать не менее 6 символов");
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
      password: nextPassword,
    });

    setLoading(false);

    if (result.ok) {
      completeAuthSuccess(isOrganizerFlow ? "/organizer" : "/profile", result.user);
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

    setError(normalizeSiteError(result.error));
  }

  async function handleConnectOrganizerRole() {
    setLoading(true);
    setError(null);

    const result = await addOrganizerRole();
    setLoading(false);

    if (!result.ok) {
      setError(normalizeSiteError(result.error));
      return;
    }

    feedback.success({
      title: "Роль организатора подключена",
      description: "Теперь можно размещать туры на платформе.",
      action: { label: "Кабинет организатора", href: "/organizer" },
    });
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
            <h3 className="font-heading text-base font-bold text-charcoal">
              Подключить роль организатора
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate">
              Ваш аккаунт уже зарегистрирован как турист. Подключите роль организатора, чтобы
              размещать туры на платформе — отдельная регистрация не нужна.
            </p>
          </div>

          {error ? (
            <InlineFeedback
              variant="error"
              title={error.title}
              description={error.description}
              steps={error.steps}
              action={error.action}
            />
          ) : null}

          <Button
            type="button"
            className="w-full rounded-xl"
            loading={loading}
            loadingLabel="Подключаем…"
            onClick={handleConnectOrganizerRole}
          >
            Подключить роль организатора
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
              <button
                type="button"
                onClick={() => {
                  setStep("forgot-password");
                  setEmail(loginCredential.includes("@") ? loginCredential : email);
                  setError(null);
                  setResetSent(false);
                }}
                className="mt-2 text-xs font-medium text-sky hover:underline"
              >
                Забыли пароль?
              </button>
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
          <InlineFeedback
            variant="error"
            title={error.title}
            description={error.description}
            steps={error.steps}
            action={error.action}
          />
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
          loading={loading}
          loadingLabel={organizerTab === "sign-in" ? "Проверяем…" : "Создаём аккаунт…"}
          onClick={
            organizerTab === "sign-in"
              ? handleOrganizerCredentialLogin
              : () => handleRegister()
          }
        >
          {organizerTab === "sign-in" ? "Войти" : "Зарегистрироваться"}
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
    : step === "forgot-password"
      ? "Восстановление пароля"
    : isOrganizerFlow
      ? "Вход для организаторов"
      : step === "register"
        ? "Регистрация"
        : "Войдите или зарегистрируйтесь";

  return (
    <Dialog open={authOpen} onOpenChange={(next) => !next && closeAuth()}>
      <DialogContent
        className="max-h-[92vh] max-w-md overflow-y-auto p-0 shadow-2xl"
        showClose={false}
        onPointerDownOutside={closeAuth}
        onEscapeKeyDown={closeAuth}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div>
            <DialogTitle>{modalTitle}</DialogTitle>
            {isOrganizerFlow && !isAuthenticated ? (
              <p className="mt-1 text-xs text-slate">
                Регистрация и вход представителя организатора
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={closeAuth}
            className={cn(touchTargetIconClass, "shrink-0 rounded-full border border-gray-200 text-slate transition-colors hover:bg-gray-50 hover:text-charcoal")}
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isAuthenticated && user ? (
          renderAuthenticatedView()
        ) : step === "forgot-password" ? (
          <div className="space-y-5 px-5 py-5 sm:px-6">
            <p className="text-sm leading-relaxed text-slate">
              Укажите email, который использовали при регистрации. Мы отправим ссылку для смены пароля.
            </p>
            <div>
              <label htmlFor="forgot-email" className="mb-2 block text-xs font-medium text-slate">
                Email
              </label>
              <Input
                id="forgot-email"
                type="email"
                autoComplete="email"
                placeholder="email@example.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError(null);
                  setResetSent(false);
                }}
              />
            </div>

            {error ? (
              <InlineFeedback
                variant={resetSent ? "success" : "error"}
                title={error.title}
                description={error.description}
                steps={error.steps}
                action={error.action}
              />
            ) : null}

            <Button
              type="button"
              className="w-full rounded-xl"
              loading={loading}
              loadingLabel="Отправляем…"
              onClick={() => void handleForgotPasswordSubmit()}
            >
              Отправить ссылку
            </Button>

            <button
              type="button"
              onClick={() => {
                setStep("sign-in");
                setError(null);
                setResetSent(false);
              }}
              className="w-full text-sm font-medium text-slate transition-colors hover:text-charcoal"
            >
              ← Назад ко входу
            </button>
          </div>
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
                  <div className="space-y-3">
                    <div>
                      <label className="mb-2 block text-xs font-medium text-slate">Номер телефона</label>
                      <PhoneCountryInput
                        value={phone}
                        onChange={(international) => {
                          setPhone(international);
                          setError(null);
                          if (phoneAuthStep === "password") {
                            setPhoneAuthStep("phone");
                            setPassword("");
                          }
                        }}
                      />
                    </div>
                    {phoneAuthStep === "password" ? (
                      <>
                        <div className="rounded-xl border border-sky/20 bg-sky/5 px-3 py-2.5 text-sm text-charcoal">
                          Аккаунт с этим номером найден. Введите пароль, который задавали при регистрации.
                        </div>
                        <div>
                          <label htmlFor="auth-phone-password" className="mb-2 block text-xs font-medium text-slate">
                            Пароль
                          </label>
                          <div className="relative">
                            <Input
                              id="auth-phone-password"
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
                          <button
                            type="button"
                            onClick={() => {
                              setMode("email");
                              setPhoneAuthStep("phone");
                              setPassword("");
                              setStep("forgot-password");
                              setError(null);
                              setResetSent(false);
                            }}
                            className="mt-2 text-xs font-medium text-sky hover:underline"
                          >
                            Забыли пароль? Восстановить по почте
                          </button>
                        </div>
                      </>
                    ) : null}
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
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <label htmlFor="auth-password" className="text-xs font-medium text-slate">
                          Пароль
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setStep("forgot-password");
                            setError(null);
                            setResetSent(false);
                          }}
                          className="text-xs font-medium text-sky hover:underline"
                        >
                          Забыли пароль?
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          id="auth-password"
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
                  </div>
                )}

                {error ? (
                  <InlineFeedback
                    variant="error"
                    title={error.title}
                    description={error.description}
                    steps={error.steps}
                    action={error.action}
                  />
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
                  loading={loading}
                  loadingLabel={mode === "phone" && phoneAuthStep === "phone" ? "Проверяем…" : "Входим…"}
                  onClick={mode === "phone" ? () => handlePhoneContinue() : () => handleEmailContinue()}
                >
                  {mode === "phone"
                    ? phoneAuthStep === "phone"
                      ? "Продолжить"
                      : "Войти"
                    : "Войти"}
                </Button>

                {mode === "phone" && phoneAuthStep === "password" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneAuthStep("phone");
                      setPassword("");
                      setError(null);
                    }}
                    className="w-full text-sm font-medium text-slate transition-colors hover:text-charcoal"
                  >
                    ← Изменить номер телефона
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => {
                    const nextMode = mode === "phone" ? "email" : "phone";
                    setMode(nextMode);
                    setPhoneAuthStep("phone");
                    setPassword("");
                    setError(null);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-charcoal transition-colors hover:bg-gray-50"
                >
                  {mode === "phone" ? (
                    <Mail className="h-4 w-4 text-slate" aria-hidden />
                  ) : (
                    <Phone className="h-4 w-4 text-slate" aria-hidden />
                  )}
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

                <div>
                  <label htmlFor="auth-register-password" className="mb-2 block text-xs font-medium text-slate">
                    Пароль
                  </label>
                  <div className="relative">
                    <Input
                      id="auth-register-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Не менее 6 символов"
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
                  <p className="mt-1.5 text-xs text-slate">
                    Пароль нужен для входа по почте и по телефону.
                  </p>
                </div>

                {duplicateRegistration ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                    Такой аккаунт уже существует.{" "}
                    <button
                      type="button"
                      className="font-semibold text-brand hover:underline"
                      onClick={() => {
                        setStep("sign-in");
                        setPhoneAuthStep("phone");
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
                  <InlineFeedback
                    variant="error"
                    title={error.title}
                    description={error.description}
                    steps={error.steps}
                    action={error.action}
                  />
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
                  loading={loading}
                  loadingLabel="Создаём аккаунт…"
                  onClick={handleRegister}
                >
                  Зарегистрироваться
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("sign-in");
                    setPhoneAuthStep("phone");
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
      </DialogContent>
    </Dialog>
  );
}
