"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Compass, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import {
  dismissTouristOnboarding,
  isTouristOnboardingDismissed,
  ONBOARDING_UPDATED_EVENT,
} from "@/lib/onboarding-storage";
import { TOURIST_ONBOARDING_STEPS } from "@/lib/onboarding-progress";
import { userHasAccountRole } from "@/types/user";
import { cn } from "@/lib/cn";

export default function TouristOnboardingModal() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!user || !userHasAccountRole(user, "tourist")) {
      setOpen(false);
      return;
    }

    function syncVisibility() {
      setOpen(!isTouristOnboardingDismissed());
    }

    syncVisibility();
    window.addEventListener(ONBOARDING_UPDATED_EVENT, syncVisibility);
    return () => window.removeEventListener(ONBOARDING_UPDATED_EVENT, syncVisibility);
  }, [user]);

  const step = TOURIST_ONBOARDING_STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === TOURIST_ONBOARDING_STEPS.length - 1;

  function handleDismiss() {
    dismissTouristOnboarding();
    setOpen(false);
  }

  function handleNext() {
    if (isLast) {
      handleDismiss();
      return;
    }
    setStepIndex((current) => current + 1);
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      handleDismiss();
    }
  }

  if (!step) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg p-0" showClose={false}>
        <DialogHeader className="relative pr-12">
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate transition-colors hover:bg-gray-100 hover:text-charcoal"
            aria-label="Закрыть подсказку"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky/15 text-sky">
              <Compass className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky">
                Шаг {stepIndex + 1} из {TOURIST_ONBOARDING_STEPS.length}
              </p>
              <DialogTitle className="mt-1 text-lg sm:text-xl">{step.title}</DialogTitle>
              <DialogDescription className="mt-1">{step.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-5 pb-2 sm:px-6">
          {step.hint ? (
            <p className="rounded-xl bg-sky/8 px-4 py-3 text-sm leading-relaxed text-charcoal">
              {step.hint}
            </p>
          ) : null}

          <div className="mt-4 flex justify-center gap-2">
            {TOURIST_ONBOARDING_STEPS.map((item, index) => (
              <span
                key={item.id}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  index === stepIndex ? "w-8 bg-sky" : "w-1.5 bg-gray-200"
                )}
                aria-hidden
              />
            ))}
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full gap-2 sm:w-auto">
            {!isFirst ? (
              <Button
                type="button"
                variant="outline"
                className="gap-1.5"
                onClick={() => setStepIndex((current) => current - 1)}
              >
                <ArrowLeft className="h-4 w-4" />
                Назад
              </Button>
            ) : (
              <Button type="button" variant="ghost" onClick={handleDismiss}>
                Пропустить
              </Button>
            )}
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {step.href && step.actionLabel ? (
              <Link href={step.href} className={buttonVariants({ variant: "outline" })}>
                {step.actionLabel}
              </Link>
            ) : null}
            <Button type="button" className="gap-1.5" onClick={handleNext}>
              {isLast ? "Понятно" : "Далее"}
              {!isLast ? <ArrowRight className="h-4 w-4" /> : null}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
