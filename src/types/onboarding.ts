import type { LucideIcon } from "lucide-react";

export type OnboardingStepStatus = "pending" | "current" | "completed";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  href?: string;
  actionLabel?: string;
  status: OnboardingStepStatus;
  icon?: LucideIcon;
}

export interface TouristOnboardingStepContent {
  id: string;
  title: string;
  description: string;
  hint?: string;
  href?: string;
  actionLabel?: string;
}
