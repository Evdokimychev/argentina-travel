"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import { useAuth } from "@/context/AuthContext";
import { createOrganizerTour, deleteOrganizerTour } from "@/lib/organizer-tour-store";
import { patchOrganizerTourDraftRemote } from "@/lib/organizer-tour-draft-api";
import { isRemoteToursMode } from "@/lib/tour-content-api";
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
  const [creatingTour, setCreatingTour] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

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

  async function createFirstTour() {
    if (creatingTour) return;
    setCreatingTour(true);
    setCreateError(null);

    const result = createOrganizerTour(user, "tour", { skipRemoteSync: true });
    if ("error" in result) {
      setCreateError(result.error);
      setCreatingTour(false);
      return;
    }

    try {
      if (isRemoteToursMode()) {
        await patchOrganizerTourDraftRemote({
          tourId: result.draft.id,
          draft: result.draft,
        });
      }
      onWelcomeDismiss?.();
      router.push(`/organizer/tours/${result.draft.id}/edit`);
    } catch (error) {
      deleteOrganizerTour(result.draft.id, user, { skipRemoteSync: true });
      setCreateError(
        error instanceof Error ? error.message : "Не удалось создать черновик. Попробуйте ещё раз."
      );
    } finally {
      setCreatingTour(false);
    }
  }

  function handleStepAction(step: OnboardingStep) {
    if (step.id === "first-tour" && !step.href) {
      void createFirstTour();
      return;
    }

    if (step.href) {
      router.push(step.href);
      if (welcome) onWelcomeDismiss?.();
    }
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
        className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full text-slate transition-colors hover:bg-gray-100 hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 sm:right-3 sm:top-3"
        aria-label="Скрыть чек-лист"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pr-11">
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
              <Button
                type="button"
                className="gap-2"
                onClick={() => void createFirstTour()}
                disabled={creatingTour}
              >
                <Plus className="h-4 w-4" />
                {creatingTour ? "Создаём…" : "Создать первый тур"}
              </Button>
              <Button type="button" variant="outline" onClick={handleDismiss}>
                Позже
              </Button>
            </div>
          ) : null}
          {createError ? (
            <p role="alert" className="mt-3 text-sm font-medium text-red-600">
              {createError}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
