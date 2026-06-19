import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  LOCAL_EXPERTS_SEED,
  getExpertSeedBySlug,
} from "@/data/local-experts-seed";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import type {
  ExpertCatalogFilters,
  ExpertCategory,
  ExpertContactMode,
  ExpertStatus,
  LocalExpertView,
} from "@/types/local-experts";

type DbClient = SupabaseClient<Database>;

type ExpertRow = Database["public"]["Tables"]["local_experts"]["Row"];

function rowToView(row: ExpertRow): LocalExpertView {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    bio: row.bio,
    city: row.city,
    categories: row.categories as ExpertCategory[],
    languages: row.languages ?? [],
    avatarUrl: row.avatar_url,
    contactMode: row.contact_mode as ExpertContactMode,
    status: row.status as ExpertStatus,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function filterSeedExperts(
  experts: LocalExpertView[],
  filters?: ExpertCatalogFilters
): LocalExpertView[] {
  let result = experts.filter((expert) => expert.status === "published");

  if (filters?.city?.trim()) {
    const city = filters.city.trim().toLowerCase();
    result = result.filter((expert) => expert.city.toLowerCase().includes(city));
  }

  if (filters?.category) {
    result = result.filter((expert) => expert.categories.includes(filters.category!));
  }

  if (filters?.language?.trim()) {
    const lang = filters.language.trim().toLowerCase();
    result = result.filter((expert) =>
      expert.languages.some((item) => item.toLowerCase() === lang)
    );
  }

  if (filters?.q?.trim()) {
    const q = filters.q.trim().toLowerCase();
    result = result.filter(
      (expert) =>
        expert.name.toLowerCase().includes(q) ||
        expert.bio.toLowerCase().includes(q) ||
        expert.city.toLowerCase().includes(q)
    );
  }

  return result;
}

export function parseExpertCatalogFilters(
  searchParams: URLSearchParams
): ExpertCatalogFilters {
  const category = searchParams.get("category");
  const validCategories: ExpertCategory[] = [
    "guide",
    "relocation",
    "photo",
    "family",
    "nature",
    "food",
  ];

  return {
    city: searchParams.get("city") ?? undefined,
    category:
      category && validCategories.includes(category as ExpertCategory)
        ? (category as ExpertCategory)
        : undefined,
    language: searchParams.get("language") ?? undefined,
    q: searchParams.get("q") ?? undefined,
  };
}

export async function fetchPublishedExperts(
  supabase: DbClient | null,
  filters?: ExpertCatalogFilters
): Promise<LocalExpertView[]> {
  if (!supabase || !isSupabaseAuthEnabled()) {
    return filterSeedExperts(LOCAL_EXPERTS_SEED, filters);
  }

  let query = supabase
    .from("local_experts")
    .select("*")
    .eq("status", "published")
    .order("name", { ascending: true });

  if (filters?.city?.trim()) {
    query = query.ilike("city", `%${filters.city.trim()}%`);
  }

  if (filters?.category) {
    query = query.contains("categories", [filters.category]);
  }

  if (filters?.language?.trim()) {
    query = query.contains("languages", [filters.language.trim().toLowerCase()]);
  }

  const { data, error } = await query;
  if (error || !data?.length) {
    return filterSeedExperts(LOCAL_EXPERTS_SEED, filters);
  }

  let experts = data.map(rowToView);
  if (filters?.q?.trim()) {
    experts = filterSeedExperts(experts, { q: filters.q });
  }

  return experts;
}

export async function fetchExpertBySlug(
  supabase: DbClient | null,
  slug: string
): Promise<LocalExpertView | null> {
  const normalized = slug.trim();
  if (!normalized) return null;

  if (!supabase || !isSupabaseAuthEnabled()) {
    return getExpertSeedBySlug(normalized);
  }

  const { data, error } = await supabase
    .from("local_experts")
    .select("*")
    .eq("slug", normalized)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) {
    return getExpertSeedBySlug(normalized);
  }

  return rowToView(data);
}

export async function fetchExpertsForAdmin(
  supabase: DbClient,
  options?: { status?: ExpertStatus | "all"; limit?: number }
): Promise<LocalExpertView[]> {
  const limit = options?.limit ?? 200;
  let query = supabase
    .from("local_experts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(rowToView);
}

export async function fetchExpertByIdAdmin(
  supabase: DbClient,
  id: string
): Promise<LocalExpertView | null> {
  const { data, error } = await supabase
    .from("local_experts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return rowToView(data);
}

export function getUniqueExpertCities(experts: LocalExpertView[]): string[] {
  return [...new Set(experts.map((expert) => expert.city))].sort((a, b) =>
    a.localeCompare(b, "ru")
  );
}

export function getUniqueExpertLanguages(experts: LocalExpertView[]): string[] {
  return [...new Set(experts.flatMap((expert) => expert.languages))].sort();
}

export function expertHref(slug: string): string {
  return `/experts/${slug}`;
}
