"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { Button } from "@/components/ui/button";
import { SmartInput } from "@/components/ui/smart-input";
import { validatePassword, validatePasswordConfirmation } from "@/lib/form-validation";

export default function UpdatePasswordView({ recoveryReady }: { recoveryReady: boolean }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Пароль должен содержать не менее 8 символов.");
    if (password !== confirmation) return setError("Пароли не совпадают.");

    setLoading(true);
    try {
      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null;
      if (!response.ok) throw new Error(payload?.error?.message || "Не удалось изменить пароль.");
      setDone(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не удалось изменить пароль.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-lg border border-border bg-white p-6 shadow-sm sm:p-8">
      <h1 className="font-heading text-2xl font-bold text-charcoal">Новый пароль</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate">Придумайте новый пароль для входа по email.</p>

      {done ? (
        <div className="mt-6 space-y-5">
          <div className="flex gap-3 rounded-lg bg-success/10 p-4 text-sm text-charcoal">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <div><strong className="block">Пароль изменён</strong><span className="mt-1 block text-slate">Теперь войдите в аккаунт с новым паролем.</span></div>
          </div>
          <Link href="/?auth=sign-in" className="flex h-11 items-center justify-center rounded-button bg-sky px-5 text-sm font-semibold text-white hover:bg-sky-dark">Войти</Link>
        </div>
      ) : recoveryReady ? (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <SmartInput id="new-password" label="Новый пароль" name="new-password" type="password" autoComplete="new-password" minLength={8} value={password} onValueChange={setPassword} validate={validatePassword(8)} hint="Не менее 8 символов" required />
          <SmartInput id="confirm-password" label="Повторите пароль" name="confirm-password" type="password" autoComplete="new-password" minLength={8} value={confirmation} onValueChange={setConfirmation} validate={validatePasswordConfirmation(password)} required />
          {error ? <InlineFeedback variant="error" title="Не удалось сохранить пароль" description={error} /> : null}
          <Button type="submit" className="w-full" loading={loading} loadingLabel="Сохраняем…">Сохранить пароль</Button>
        </form>
      ) : (
        <div className="mt-6"><InlineFeedback variant="error" title="Ссылка больше не действует" description="Запросите новое письмо для восстановления пароля." action={{ label: "Запросить письмо", href: "/?auth=sign-in&step=forgot-password" }} /></div>
      )}
      <p className="mt-6 text-center text-sm"><Link href="/" className="font-medium text-sky hover:underline">На главную</Link></p>
    </div>
  );
}
