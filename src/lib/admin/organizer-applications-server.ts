import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type DbClient = SupabaseClient<Database>;

type ProfileLite = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
};

function formatApplicantName(profile: ProfileLite | undefined): string {
  if (!profile) return "Пользователь";
  const full = `${profile.first_name} ${profile.last_name}`.trim();
  return full || profile.email || "Пользователь";
}

export type OrganizerApplicationSummary = {
  id: string;
  userId: string;
  companyName: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
  applicantName: string;
  applicantEmail: string | null;
  applicantPhone: string | null;
};

export async function fetchPendingOrganizerApplications(
  supabase: DbClient,
  limit = 100,
  options?: { throwOnError?: boolean }
): Promise<OrganizerApplicationSummary[]> {
  const { data, error } = await supabase
    .from("organizer_applications")
    .select("id, user_id, company_name, description, status, reviewed_at, review_note, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (options?.throwOnError) throw new Error(error.message);
    return [];
  }
  if (!data?.length) return [];

  const userIds = [...new Set(data.map((row) => row.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email, phone")
    .in("id", userIds);

  const profileMap = new Map((profiles ?? []).map((row) => [row.id, row as ProfileLite]));

  return data.map((row) => {
    const profile = profileMap.get(row.user_id);
    return {
      id: row.id,
      userId: row.user_id,
      companyName: row.company_name,
      description: row.description,
      status: row.status,
      reviewedAt: row.reviewed_at,
      reviewNote: row.review_note,
      createdAt: row.created_at,
      applicantName: formatApplicantName(profile),
      applicantEmail: profile?.email ?? null,
      applicantPhone: profile?.phone ?? null,
    };
  });
}

export async function fetchOrganizerApplicationById(
  supabase: DbClient,
  id: string
): Promise<OrganizerApplicationSummary | null> {
  const { data, error } = await supabase
    .from("organizer_applications")
    .select("id, user_id, company_name, description, status, reviewed_at, review_note, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email, phone")
    .eq("id", data.user_id)
    .maybeSingle();

  return {
    id: data.id,
    userId: data.user_id,
    companyName: data.company_name,
    description: data.description,
    status: data.status,
    reviewedAt: data.reviewed_at,
    reviewNote: data.review_note,
    createdAt: data.created_at,
    applicantName: formatApplicantName((profile as ProfileLite | null) ?? undefined),
    applicantEmail: profile?.email ?? null,
    applicantPhone: profile?.phone ?? null,
  };
}

export async function countPendingOrganizerApplications(supabase: DbClient): Promise<number> {
  const { count, error } = await supabase
    .from("organizer_applications")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  if (error) return 0;
  return count ?? 0;
}
