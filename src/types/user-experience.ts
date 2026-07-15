import type { AccountRole } from "@/types/user";

export type ActiveWorkspace = "travel" | "organizer" | "admin";
export type PrimaryIntent = "plan_trip" | "manage_offers" | "manage_platform";
export type OnboardingState = "not_started" | "in_progress" | "complete";

export type UserPendingAction = {
  type: "payment" | "message" | "trip_prep" | "booking" | "moderation" | "profile";
  priority: "high" | "medium" | "low";
  href: string;
};

export type UserExperienceContext = {
  authenticated: boolean;
  userId: string | null;
  roles: AccountRole[];
  activeWorkspace: ActiveWorkspace | null;
  primaryIntent: PrimaryIntent | null;
  onboardingState: OnboardingState;
  profileCompleteness: number;
  pendingActions: UserPendingAction[];
  notificationSummary: {
    pending: number;
    unread: number | null;
  };
  safePersonalizationContext: {
    profileCompletenessBucket: "empty" | "partial" | "complete";
    hasUpcomingTrip: boolean;
  };
};

export type UserExperienceHydration = Omit<UserExperienceContext, "userId">;
