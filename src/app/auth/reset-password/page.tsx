"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import { siteFormError } from "@/lib/site-feedback/normalize-error";
import type { SiteFeedbackMessage } from "@/types/site-feedback";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<SiteFeedbackMessage | null>(null);

  useEffect(() => {
    if (!isSupabaseAuthEnabled()) {
      setError(
        siteFormError(
          "Восстановление пароля работает только при подключённом Supabase Auth.",
          { title: "Демо-режим" }
        )
      );
      return;
    }

    const supabase = createSupabaseBrowserClient();
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true);
        return;
      }
      setError(
        siteFormError(
          "Ссылка устарела или уже использована. Запросите восстановление пароля ещё раз.",
          {
            title: "Не удалось открыть форму",
            action: { label: "На главную", href: "/?auth=sign-in" },
          }
        )
      );
    });
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError(siteFormError("Пароль должен содержать не менее 6 символов"));
      return;
    }

    if (password !== confirmPassword) {
      setError(siteFormError("Пароли не совпадают"));
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(siteFormError(updateError.message, { title: "Не удалось сохранить пароль" }));
      return;
    }

    setDone(true);
    window.setTimeout(() => router.push("/profile"), 1200);
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="font-heading text-2xl font-bold text-charcoal">Новый пароль</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate">
          Придумайте новый пароль для входа по email.
        </p>

        {done ? (
          <div className="mt-6 rounded-2xl bg-sky/10 px-4 py-3 text-sm text-sky-dark">
            Пароль обновлён. Перенаправляем в личный кабинет…
          </div>
        ) : ready ? (
          <form onSubmit={(event) => void handleSubmit(event)} className="mt-6 space-y-4">
            <div>
              <label htmlFor="new-password" className="mb-2 block text-xs font-medium text-slate">
                Новый пароль
              </label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Не менее 6 символов"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="mb-2 block text-xs font-medium text-slate">
                Повторите пароль
              </label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
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

            <Button type="submit" className="w-full rounded-xl" loading={loading} loadingLabel="Сохраняем…">
              Сохранить пароль
            </Button>
          </form>
        ) : error ? (
          <div className="mt-6">
            <InlineFeedback
              variant="error"
              title={error.title}
              description={error.description}
              steps={error.steps}
              action={error.action}
            />
          </div>
        ) : (
          <p className="mt-6 text-sm text-slate">Проверяем ссылку…</p>
        )}

        <p className="mt-6 text-center text-sm text-slate">
          <Link href="/" className="font-medium text-sky hover:underline">
            На главную
          </Link>
        </p>
      </div>
    </main>
  );
}
