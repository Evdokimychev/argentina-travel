"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import { useAuth } from "@/context/AuthContext";
import { createOrganizerTour } from "@/lib/organizer-tour-store";
import {
  dismissOrganizerOnboarding,
  isOrganizerOnboardingDismissed,
  ONBOARDING_UPDATED_EVENT,
} from "@/lib/onboarding-storage";
import {
  getOrganizerOnboardingSteps,
  isOrganizerOnboardingComplete,
} from "@/lib/onboarding-progress";
import { ORGANIZER_PROFILE_UPDATED_EVENT } from "@/lib/organizer-profile-store";
import { ORGANIZER_TOURS_UPDATED_EVENT } from "@/types/organizer-tour";
import { BOOKINGS_UPDATED_EVENT } from "@/types/tourist";
import type { OnboardingStep } from "@/types/onboarding";
import { cn } from "@/lib/cn";

interface OrganizerOnboardingWizardProps {
  welcome?: boolean;
  onWelcomeDismiss?: () => void;
}

export default function OrganizerOnboardingWizard({
  welcome = false,
  onWelcomeDismiss,
}: OrganizerOnboardingWizardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(true);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (!user) return;

    function refresh() {
      setDismissed(isOrganizerOnboardingDismissed());
      const nextSteps = getOrganizerOnboardingSteps(user!.id);
      setSteps(nextSteps);
      setComplete(isOrganizerOnboardingComplete(user!.id));
    }

    refresh();

    const events = [
      ONBOARDING_UPDATED_EVENT,
      ORGANIZER_PROFILE_UPDATED_EVENT,
      ORGANIZER_TOURS_UPDATED_EVENT,
      BOOKINGS_UPDATED_EVENT,
      "focus",
    ] as const;

    for (const eventName of events) {
      window.addEventListener(eventName, refresh);
    }

    return () => {
      for (const eventName of events) {
        window.removeEventListener(eventName, refresh);
      }
    };
  }, [user]);

  if (!user || steps.length === 0) return null;

  const shouldShow = welcome || (!dismissed && !complete);
  if (!shouldShow) return null;

  function handleDismiss() {
    dismissOrganizerOnboarding();
    setDismissed(true);
    onWelcomeDismiss?.();
  }

  function handleStepAction(step: OnboardingStep) {
    if (step.id === "first-tour" && !step.href) {
      const result = createOrganizerTour(user);
      if ("error" in result) return;
      router.push(`/organizer/tours/${result.draft.id}/edit`);
      onWelcomeDismiss?.();
      return;
    }

    if (step.href) {
      router.push(step.href);
      if (welcome) onWelcomeDismiss?.();
    }
  }

  function handleWelcomeCreateTour() {
    const result = createOrganizerTour(user);
    if ("error" in result) return;
    onWelcomeDismiss?.();
    router.push(`/organizer/tours/${result.draft.id}/edit`);
  }

  const currentStep = steps.find((step) => step.status === "current");

  return (
    <div
      className={cn(
        "relative rounded-2xl border border-sky/25 bg-gradient-to-br from-sky/10 via-white to-white",
        welcome ? "p-5 sm:p-6" : "p-4 sm:p-5"
      )}
    >
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-slate transition-colors hover:bg-gray-100 hover:text-charcoal"
        aria-label="Скрыть чек-лист"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pr-8">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky/15 text-sky">
          <Sparkles className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <OnboardingProgress
            steps={steps}
            title={welcome ? "Добро пожаловать в кабинет организатора" : "Первые шаги в кабинете"}
            subtitle={
              welcome
                ? "Пройдите чек-лист — от профиля до первой заявки. Каждый пункт можно выполнить в удобном темпе."
                : "Завершите настройку, чтобы тур появился в каталоге и начали поступать заявки."
            }
            compact={!welcome}
            onAction={handleStepAction}
          />

          {welcome && currentStep?.id === "first-tour" ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" className="gap-2" onClick={handleWelcomeCreateTour}>
                <Plus className="h-4 w-4" />
                Создать первый тур
              </Button>
              <Button type="button" variant="outline" onClick={handleDismiss}>
                Позже
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
