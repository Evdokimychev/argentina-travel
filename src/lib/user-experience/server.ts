import "server-only";

import { cookies } from "next/headers";
import { createSupabaseServerClientIfConfigured } from "@/lib/supabase/server";
import { normalizeAccountRoles } from "@/types/user";
import type { AccountRole } from "@/types/user";
import type { UserExperienceContext, UserPendingAction } from "@/types/user-experience";
import {
  ACTIVE_WORKSPACE_COOKIE,
  resolveActiveWorkspace,
  WORKSPACE_META,
} from "@/lib/user-experience/workspaces";

const GUEST_CONTEXT: UserExperienceContext = {
  authenticated: false,
  userId: null,
  roles: [],
  activeWorkspace: null,
  primaryIntent: null,
  onboardingState: "not_started",
  profileCompleteness: 0,
  pendingActions: [],
  notificationSummary: { pending: 0, unread: null },
  safePersonalizationContext: {
    profileCompletenessBucket: "empty",
    hasUpcomingTrip: false,
  },
};

function profileCompleteness(profile: {
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  country: string;
  date_of_birth: string | null;
}): number {
  const fields = [
    profile.first_name,
    profile.last_name,
    profile.email,
    profile.phone,
    profile.avatar_url,
    profile.country,
    profile.date_of_birth,
  ];
  return Math.round((fields.filter((value) => Boolean(value?.trim())).length / fields.length) * 100);
}

function completenessBucket(value: number): "empty" | "partial" | "complete" {
  if (value <= 0) return "empty";
  if (value >= 85) return "complete";
  return "partial";
}

function bookingPendingActions(
  workspace: UserExperienceContext["activeWorkspace"],
  bookings: Array<{
    id: string;
    status: string;
    payment_status: string | null;
    start_date: string | null;
  }>,
  completeness: number,
): { actions: UserPendingAction[]; hasUpcomingTrip: boolean } {
  const now = Date.now();
  const actions: UserPendingAction[] = [];
  const hasUpcomingTrip = bookings.some(
    (booking) => booking.start_date && new Date(booking.start_date).getTime() > now,
  );

  if (workspace === "travel") {
    const payment = bookings.find(
      (booking) =>
        booking.status === "confirmed" &&
        booking.payment_status !== "paid" &&
        booking.payment_status !== "refunded",
    );
    if (payment) {
      actions.push({ type: "payment", priority: "high", href: `/profile/bookings/${payment.id}` });
    } else if (hasUpcomingTrip) {
      actions.push({ type: "trip_prep", priority: "medium", href: "/profile/trip-prep" });
    }
  }

  if (workspace === "organizer") {
    const pending = bookings.find((booking) =>
      ["pending", "requested", "awaiting_confirmation"].includes(booking.status),
    );
    if (pending) {
      actions.push({ type: "booking", priority: "high", href: `/organizer/bookings/${pending.id}` });
    }
  }

  if (completeness < 85) {
    actions.push({
      type: "profile",
      priority: actions.length ? "low" : "medium",
      href: workspace === "organizer" ? "/organizer/settings" : "/profile/settings",
    });
  }

  return { actions: actions.slice(0, 3), hasUpcomingTrip };
}

export async function resolveUserExperienceContext(): Promise<UserExperienceContext> {
  const supabase = await createSupabaseServerClientIfConfigured();
  if (!supabase) return GUEST_CONTEXT;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return GUEST_CONTEXT;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email, phone, avatar_url, country, date_of_birth, roles, active_role, is_blocked")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.is_blocked) return GUEST_CONTEXT;

  const roles = normalizeAccountRoles({
    role: profile.active_role as AccountRole,
    roles: profile.roles as AccountRole[],
  });
  const cookieStore = await cookies();
  const activeWorkspace = resolveActiveWorkspace(
    roles,
    cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value,
  );
  const completeness = profileCompleteness(profile);

  const bookingQuery = supabase
    .from("bookings")
    .select("id, status, payment_status, start_date")
    .order("updated_at", { ascending: false })
    .limit(20);
  const { data: bookings } =
    activeWorkspace === "organizer"
      ? await bookingQuery.eq("organizer_user_id", user.id)
      : await bookingQuery.eq("user_id", user.id);
  const pending = bookingPendingActions(activeWorkspace, bookings ?? [], completeness);

  return {
    authenticated: true,
    userId: user.id,
    roles,
    activeWorkspace,
    primaryIntent: activeWorkspace ? WORKSPACE_META[activeWorkspace].intent : null,
    onboardingState:
      completeness >= 85 ? "complete" : completeness > 0 ? "in_progress" : "not_started",
    profileCompleteness: completeness,
    pendingActions: pending.actions,
    notificationSummary: { pending: pending.actions.length, unread: null },
    safePersonalizationContext: {
      profileCompletenessBucket: completenessBucket(completeness),
      hasUpcomingTrip: pending.hasUpcomingTrip,
    },
  };
}

export function toUserExperienceHydration(context: UserExperienceContext) {
  return {
    authenticated: context.authenticated,
    roles: context.roles,
    activeWorkspace: context.activeWorkspace,
    primaryIntent: context.primaryIntent,
    onboardingState: context.onboardingState,
    profileCompleteness: context.profileCompleteness,
    pendingActions: context.pendingActions,
    notificationSummary: context.notificationSummary,
    safePersonalizationContext: context.safePersonalizationContext,
  };
}
