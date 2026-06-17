"use client";

import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";

const BENEFITS = [
  "Понравившиеся туры всегда под рукой",
  "Сравнивайте варианты в своём темпе",
  "Возвращайтесь к выбору, когда будете готовы",
];

export default function FavoriteAuthPromptModal() {
  const { favoritePromptOpen, closeFavoritePrompt, openAuthFromFavorite } = useAuth();

  return (
    <Dialog open={favoritePromptOpen} onOpenChange={(open) => !open && closeFavoritePrompt()}>
      <DialogContent
        bottomSheet
        showClose={false}
        className="max-w-md gap-0 overflow-hidden p-0 sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
          <DialogTitle className="font-heading text-lg font-bold text-charcoal">
            Вход или регистрация
          </DialogTitle>
          <button
            type="button"
            onClick={closeFavoritePrompt}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate transition-colors hover:bg-gray-100 hover:text-charcoal"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
          <div className="rounded-2xl bg-gray-50 px-4 py-4">
            <p className="font-heading text-base font-bold text-charcoal">
              Войдите — и сохраните тур
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate">
              После входа тур сразу окажется в вашем избранном
            </p>
            <ul className="mt-4 space-y-2.5">
              {BENEFITS.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-charcoal">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <Button
            type="button"
            className="h-12 w-full rounded-xl text-base font-semibold"
            onClick={() => openAuthFromFavorite("register")}
          >
            Зарегистрироваться
          </Button>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <div className="w-full border-t border-gray-200" />
            </div>
            <p className="relative mx-auto w-fit bg-white px-3 text-sm text-slate">
              Уже есть аккаунт?
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-12 w-full rounded-xl text-base font-semibold"
            onClick={() => openAuthFromFavorite("sign-in")}
          >
            Войти
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
