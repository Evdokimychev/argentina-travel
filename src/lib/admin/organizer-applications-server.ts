import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

type DbClient = SupabaseClient<Database>;

const PAGE_SIZE = 500;

export type OrganizerApplicationSummary = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  createdAt: string;
  reviewStatus: string | null;
};

function reviewStatusFromContext(context: Json | null): string | null {
  if (!context || typeof context !== "object" || Array.isArray(context)) return null;
  const status = (context as Record<string, unknown>).reviewStatus;
  return typeof status === "string" ? status : null;
}

function isPendingApplication(context: Json | null): boolean {
  const status = reviewStatusFromContext(context);
  return !status || status === "pending";
}

export async function fetchPendingOrganizerApplications(
  supabase: DbClient,
  limit = 100,
  options?: { throwOnError?: boolean }
): Promise<OrganizerApplicationSummary[]> {
  const { data, error } = await supabase
    .from("contact_submissions")
    .select("id, name, email, phone, message, context, created_at")
    .eq("kind", "organizer_application")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (options?.throwOnError) throw new Error(error.message);
    return [];
  }
  if (!data) return [];

  return data
    .filter((row) => isPendingApplication(row.context))
    .map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      message: row.message,
      createdAt: row.created_at,
      reviewStatus: reviewStatusFromContext(row.context),
    }));
}

export async function countPendingOrganizerApplications(supabase: DbClient): Promise<number> {
  let offset = 0;
  let total = 0;

  while (true) {
    const { data, error } = await supabase
      .from("contact_submissions")
      .select("context")
      .eq("kind", "organizer_application")
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error || !data?.length) break;

    total += data.filter((row) => isPendingApplication(row.context)).length;

    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return total;
}
