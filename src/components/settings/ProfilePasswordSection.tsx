"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SmartInput } from "@/components/ui/smart-input";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { changePasswordWithCurrentCredential } from "@/lib/auth-password-change";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import { cabinetPanelClass } from "@/lib/cabinet-ui";
import { siteFormError } from "@/lib/site-feedback/normalize-error";
import type { SiteFeedbackMessage } from "@/types/site-feedback";
import { validatePassword, validatePasswordConfirmation } from "@/lib/form-validation";

export default function ProfilePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SiteFeedbackMessage | null>(null);
  const [saved, setSaved] = useState(false);

  if (!isSupabaseAuthEnabled()) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const result = await changePasswordWithCurrentCredential(supabase, {
      currentPassword,
      newPassword,
      confirmPassword,
    });
    setLoading(false);

    if (!result.ok) {
      setError(siteFormError(result.message));
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSaved(true);
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className={cabinetPanelClass}>
      <h2 className="font-heading text-lg font-bold text-charcoal">Пароль</h2>
      <p className="mt-1 text-sm text-slate">
        Смените пароль для входа по email и по телефону (тот же пароль).
      </p>

      <div className="mt-5 space-y-4">
        <SmartInput
            id="current-password"
            label="Текущий пароль"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onValueChange={setCurrentPassword}
            onChange={() => {
              setSaved(false);
              setError(null);
            }}
            placeholder="Введите текущий пароль"
            hint="Нужен для безопасного подтверждения смены пароля."
            required
          />

        <SmartInput
            id="settings-new-password"
            label="Новый пароль"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onValueChange={setNewPassword}
            onChange={() => {
              setSaved(false);
              setError(null);
            }}
            placeholder="Не менее 8 символов"
            hint="Минимум 8 символов. Можно использовать фразу, которую легко запомнить."
            validate={validatePassword(8)}
            minLength={8}
            required
          />

        <SmartInput
            id="settings-confirm-password"
            label="Повторите новый пароль"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onValueChange={setConfirmPassword}
            onChange={() => {
              setSaved(false);
              setError(null);
            }}
            validate={validatePasswordConfirmation(newPassword)}
            minLength={8}
            required
          />
      </div>

      {error ? (
        <InlineFeedback
          variant="error"
          title={error.title}
          description={error.description}
          steps={error.steps}
          action={error.action}
          className="mt-4"
        />
      ) : null}

      {saved ? (
        <InlineFeedback
          variant="success"
          title="Пароль обновлён"
          description="Используйте новый пароль при следующем входе."
          className="mt-4"
        />
      ) : null}

      <Button type="submit" className="mt-5" loading={loading} loadingLabel="Сохраняем…">
        Сменить пароль
      </Button>
    </form>
  );
}
